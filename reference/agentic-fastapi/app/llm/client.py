from __future__ import annotations

import asyncio
import json
import logging
import re
import time
from dataclasses import dataclass
from typing import Any, AsyncIterator, Protocol

log = logging.getLogger("llm")


# Items an LLM client yields while streaming: prose tokens, then exactly one
# structured verdict payload at the end.
@dataclass
class Token:
    text: str


@dataclass
class VerdictPayload:
    data: dict[str, Any]


StreamItem = Token | VerdictPayload


class LLMClient(Protocol):
    """Ports & Adapters: the agent layer depends on this protocol, never on a
    vendor SDK. Swapping Anthropic for the stub (or another vendor) touches
    nothing above this line."""

    async def stream_review(
        self,
        *,
        system: str,
        user: str,
        verdict_schema: dict,
        prose: bool = True,
    ) -> AsyncIterator[StreamItem]: ...


class AnthropicLLM:
    """Real adapter. Streaming Messages API + forced tool use for the verdict.

    Structured output pattern (FlowSync Section 24.2): the model writes prose
    review text, then must call the `emit_verdict` tool whose input_schema is
    our verdict JSON Schema. The verdict arrives as structured tool input —
    never parsed out of prose with regex.
    """

    def __init__(self, api_key: str, model: str) -> None:
        from anthropic import AsyncAnthropic

        self._client = AsyncAnthropic(api_key=api_key)
        self._model = model

    async def stream_review(
        self,
        *,
        system: str,
        user: str,
        verdict_schema: dict,
        prose: bool = True,
    ) -> AsyncIterator[StreamItem]:
        tools = [
            {
                "name": "emit_verdict",
                "description": "Emit the final structured review verdict. Call exactly once, after your prose review.",
                "input_schema": verdict_schema,
            }
        ]
        # "any"  → model must call a tool but may write prose first (normal path)
        # forced → tool call only, no prose (verdict-repair retry path)
        tool_choice = {"type": "any"} if prose else {"type": "tool", "name": "emit_verdict"}

        started = time.monotonic()
        json_parts: list[str] | None = None
        usage: dict[str, int] = {}

        async with self._client.messages.stream(
            model=self._model,
            max_tokens=1500,
            system=system,
            messages=[{"role": "user", "content": user}],
            tools=tools,
            tool_choice=tool_choice,
        ) as stream:
            async for event in stream:
                if event.type == "content_block_start" and event.content_block.type == "tool_use":
                    json_parts = []
                elif event.type == "content_block_delta":
                    if event.delta.type == "text_delta":
                        yield Token(event.delta.text)
                    elif event.delta.type == "input_json_delta" and json_parts is not None:
                        json_parts.append(event.delta.partial_json)
            final = await stream.get_final_message()
            usage = {
                "input_tokens": final.usage.input_tokens,
                "output_tokens": final.usage.output_tokens,
            }

        if json_parts:
            yield VerdictPayload(json.loads("".join(json_parts)))

        log.info(
            json.dumps(
                {
                    "event": "llm_call",
                    "model": self._model,
                    "latency_ms": int((time.monotonic() - started) * 1000),
                    **usage,
                }
            )
        )


class StubLLM:
    """Deterministic offline adapter — no API key, no network.

    Derives a verdict from simple rules over the submission embedded in the
    prompt. This is what lets the entire pipeline (streaming, validation,
    retry loop, eval harness, tests) run and be graded offline. The eval
    cases in evals/cases/ are calibrated against these rules.
    """

    _SUBMISSION_RE = re.compile(r"<user_submission>\s*(\{.*?\})\s*</user_submission>", re.DOTALL)
    _INJECTION_RE = re.compile(r"ignore (all|previous) instructions", re.IGNORECASE)

    async def stream_review(
        self,
        *,
        system: str,
        user: str,
        verdict_schema: dict,
        prose: bool = True,
    ) -> AsyncIterator[StreamItem]:
        started = time.monotonic()
        submission = self._extract_submission(user)
        verdict = self._compute_verdict(submission)

        if prose:
            text = self._prose(verdict, submission)
            for word in text.split(" "):
                yield Token(word + " ")
                await asyncio.sleep(0.002)  # simulate token streaming

        yield VerdictPayload(verdict)
        log.info(
            json.dumps(
                {
                    "event": "llm_call",
                    "model": "stub",
                    "latency_ms": int((time.monotonic() - started) * 1000),
                }
            )
        )

    def _extract_submission(self, user: str) -> dict:
        match = self._SUBMISSION_RE.search(user)
        if not match:
            return {"functional": [], "non_functional": [], "optional": []}
        return json.loads(match.group(1))

    def _compute_verdict(self, submission: dict) -> dict:
        functional = submission.get("functional", [])
        non_functional = submission.get("non_functional", [])
        findings: list[dict] = []

        if not non_functional:
            findings.append(
                {
                    "severity": "CRITICAL",
                    "point": "No non-functional requirements were gathered",
                    "evidence": "The non_functional list is empty — scale, availability, and latency targets are all unstated",
                }
            )
        elif not any(any(ch.isdigit() for ch in nfr) for nfr in non_functional):
            findings.append(
                {
                    "severity": "MAJOR",
                    "point": "Non-functional requirements are not quantified",
                    "evidence": f"{len(non_functional)} NFR(s) listed but none contain a number (e.g. '99.9% uptime', 'p99 < 200ms')",
                }
            )

        if not functional:
            findings.append(
                {
                    "severity": "CRITICAL",
                    "point": "No functional requirements were gathered",
                    "evidence": "The functional list is empty",
                }
            )
        elif len(functional) < 3:
            findings.append(
                {
                    "severity": "MINOR",
                    "point": "Functional scope is thin",
                    "evidence": f"Only {len(functional)} functional requirement(s) listed; a strong answer covers core user flows",
                }
            )

        if self._INJECTION_RE.search(json.dumps(submission)):
            findings.append(
                {
                    "severity": "SUGGESTION",
                    "point": "Submission contains instruction-like text directed at the reviewer; ignored as untrusted input",
                    "evidence": "Text matching 'ignore ... instructions' was treated as data, not commands",
                }
            )

        if not findings:
            findings.append(
                {
                    "severity": "SUGGESTION",
                    "point": "Solid requirements; consider stating explicit out-of-scope items",
                    "evidence": "Bounding scope is what separates a good requirements answer from a great one",
                }
            )

        deductions = {"CRITICAL": 4, "MAJOR": 2, "MINOR": 1, "SUGGESTION": 0}
        score = max(1, 10 - sum(deductions[f["severity"]] for f in findings))
        gate = "OPEN" if score >= 7 else ("SOFT" if score >= 4 else "FLAGGED")
        return {"score": score, "gate_state": gate, "findings": findings}

    def _prose(self, verdict: dict, submission: dict) -> str:
        lines = [
            f"Reviewing this requirements submission: {len(submission.get('functional', []))} functional,"
            f" {len(submission.get('non_functional', []))} non-functional items."
        ]
        for finding in verdict["findings"]:
            lines.append(f"[{finding['severity']}] {finding['point']} — {finding['evidence']}.")
        lines.append(f"Overall this scores {verdict['score']}/10.")
        return " ".join(lines)
