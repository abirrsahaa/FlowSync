from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import AsyncIterator, Callable

from pydantic import BaseModel, ValidationError

from app.guardrails import validate_verdict, verdict_json_schema, wrap_untrusted
from app.llm.client import LLMClient, Token, VerdictPayload
from app.llm.prompts import PROMPTS
from app.schemas import ReviewEvent

log = logging.getLogger("agents")


@dataclass(frozen=True)
class Persona:
    """Strategy pattern: what makes one reviewer different from another is
    config (prompt key + deterministic pre-check), not a new class."""

    prompt_key: str
    precheck: Callable[[BaseModel], list[str]]


class BaseReviewer:
    """Template Method: the pipeline every stage reviewer shares.

        precheck → build prompt (ground truth + untrusted wrap)
        → stream LLM (prose tokens pass through)
        → validate structured verdict
        → on failure: bounded corrective-repair loop
        → emit final verdict event

    The retry loop is the smallest honest agentic loop: attempt → validate →
    feed the validation error back → re-attempt (verdict only, no new prose)
    → give up cleanly after max_attempts. Unbounded loops are a bug; this one
    is capped at 2 and every iteration is logged.
    """

    def __init__(self, llm: LLMClient, persona: Persona, max_attempts: int = 2) -> None:
        self._llm = llm
        self._persona = persona
        self._max_attempts = max_attempts

    async def review(self, submission: BaseModel) -> AsyncIterator[ReviewEvent]:
        system = PROMPTS[self._persona.prompt_key]["system"]
        prompt_version = PROMPTS[self._persona.prompt_key]["version"]
        user = self._build_user_prompt(submission)

        for attempt in range(1, self._max_attempts + 1):
            payload: dict | None = None
            async for item in self._llm.stream_review(
                system=system,
                user=user,
                verdict_schema=verdict_json_schema(),
                prose=(attempt == 1),  # repair attempts re-emit the verdict only
            ):
                if isinstance(item, Token):
                    yield ReviewEvent(type="token", text=item.text)
                elif isinstance(item, VerdictPayload):
                    payload = item.data

            try:
                verdict = validate_verdict(payload or {})
            except ValidationError as exc:
                log.warning(
                    "verdict validation failed",
                    extra={"attempt": attempt, "prompt_version": prompt_version, "error": str(exc)},
                )
                user = self._build_repair_prompt(submission, exc)
                continue

            yield ReviewEvent(type="verdict", verdict=verdict, is_final=True)
            return

        # Fail safe, never silently: the client gets an explicit terminal error.
        yield ReviewEvent(type="error", text="verdict_validation_failed", is_final=True)

    def _build_user_prompt(self, submission: BaseModel) -> str:
        issues = self._persona.precheck(submission)
        precheck_block = "\n".join(f"- {issue}" for issue in issues) if issues else "- none"
        return (
            "Deterministic pre-checks computed before you saw this submission"
            " (treat as ground truth; address each relevant one in your findings):\n"
            f"{precheck_block}\n\n"
            "Evaluate this Stage 1 requirements submission for the problem \"Design YouTube\".\n\n"
            f"{wrap_untrusted(submission.model_dump())}"
        )

    def _build_repair_prompt(self, submission: BaseModel, error: ValidationError) -> str:
        return (
            f"{self._build_user_prompt(submission)}\n\n"
            "Your previous verdict failed schema validation:\n"
            f"{error}\n\n"
            "Call emit_verdict exactly once with a corrected verdict that satisfies the schema."
        )
