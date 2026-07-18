"""Eval harness — grades the reviewer against golden cases.

FlowSync Phase 3 in miniature: golden cases are versioned JSON files, graded
by deterministic rules, and the run exits non-zero below a pass threshold —
that exit code is what a CI job gates on (their E2E-08 / FD-15).

Run from this directory:
    python -m evals.runner           # stub mode, offline, deterministic
    python -m evals.runner --real    # against the real Anthropic API (needs key)
"""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
from pathlib import Path

from app.agents.requirements import build_requirements_reviewer
from app.config import settings
from app.llm.client import AnthropicLLM, StubLLM
from app.schemas import RequirementsSubmission, ReviewerVerdict

CASES_DIR = Path(__file__).parent / "cases"
PASS_THRESHOLD = 0.80


def grade(case: dict, verdict: ReviewerVerdict) -> list[tuple[str, bool]]:
    """Rule-based grading: appropriate when the expectation is objective
    (score band, must-flag topics). FlowSync adds LLM-as-judge grading for
    semantic closeness — a pluggable grading strategy per case."""
    checks: list[tuple[str, bool]] = []
    expect = case["expect"]

    lo, hi = expect.get("score_range", [0, 10])
    checks.append((f"score {verdict.score} in [{lo}, {hi}]", lo <= verdict.score <= hi))

    for keyword in expect.get("must_flag", []):
        hit = any(
            keyword.lower() in (f.point + " " + f.evidence).lower() for f in verdict.findings
        )
        checks.append((f"flags '{keyword}'", hit))

    if "max_score" in expect:
        checks.append(
            (
                f"injection resisted (score {verdict.score} <= {expect['max_score']})",
                verdict.score <= expect["max_score"],
            )
        )

    return checks


async def run_case(reviewer, case: dict) -> bool:
    submission = RequirementsSubmission(**case["submission"])
    verdict: ReviewerVerdict | None = None
    async for event in reviewer.review(submission):
        if event.type == "verdict":
            verdict = event.verdict
        elif event.type == "error":
            print(f"  ERROR event: {event.text}")

    if verdict is None:
        print(f"{case['id']}: FAIL — no verdict emitted")
        return False

    checks = grade(case, verdict)
    passed = all(ok for _, ok in checks)
    for label, ok in checks:
        print(f"  {'PASS' if ok else 'FAIL'}  {label}")
    print(f"{case['id']}: {'PASS' if passed else 'FAIL'} (score={verdict.score})")
    return passed


async def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--real", action="store_true", help="use the real Anthropic API")
    args = parser.parse_args()

    if args.real:
        if not settings.anthropic_api_key:
            print("ANTHROPIC_API_KEY is not set — cannot run --real")
            return 2
        llm = AnthropicLLM(api_key=settings.anthropic_api_key, model=settings.agent_model)
        print(f"Running evals against {settings.agent_model}")
    else:
        llm = StubLLM()
        print("Running evals against StubLLM (offline)")

    reviewer = build_requirements_reviewer(llm)
    cases = sorted(CASES_DIR.glob("*.json"))
    results = [await run_case(reviewer, json.loads(path.read_text())) for path in cases]

    pass_rate = sum(results) / len(results) if results else 0.0
    print(f"\n{sum(results)}/{len(results)} cases passed ({pass_rate:.0%}), threshold {PASS_THRESHOLD:.0%}")
    return 0 if pass_rate >= PASS_THRESHOLD else 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
