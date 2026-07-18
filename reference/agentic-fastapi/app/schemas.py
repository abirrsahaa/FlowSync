from __future__ import annotations

from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field, model_validator


# ── Input contract ─────────────────────────────────────────────────────────
# Mirrors FlowSync Section 20's StageOutput.userContent for stage 1.

class RequirementsSubmission(BaseModel):
    functional: list[str] = Field(default_factory=list)
    non_functional: list[str] = Field(default_factory=list)
    optional: list[str] = Field(default_factory=list)


# ── Structured output contract ─────────────────────────────────────────────
# Mirrors FlowSync's Finding / ReviewerVerdict. This schema is what the LLM is
# FORCED to emit (Section 24.2: schema-enforced, never prose-parsed).

class Severity(str, Enum):
    CRITICAL = "CRITICAL"
    MAJOR = "MAJOR"
    MINOR = "MINOR"
    SUGGESTION = "SUGGESTION"


class Finding(BaseModel):
    severity: Severity
    point: str = Field(min_length=1)
    evidence: str = Field(min_length=1)  # must reference the specific requirement


class GateState(str, Enum):
    OPEN = "OPEN"        # score >= 7
    SOFT = "SOFT"        # score 4-6
    FLAGGED = "FLAGGED"  # score < 4


class ReviewerVerdict(BaseModel):
    score: int = Field(ge=0, le=10)
    gate_state: GateState
    findings: list[Finding] = Field(min_length=1)

    @model_validator(mode="after")
    def gate_must_match_score(self) -> "ReviewerVerdict":
        """Cross-field invariant — the 'sanity bound backstop'.

        JSON Schema can constrain shape; it cannot express this rule. The
        server-side validator is the guardrail that rejects semantically
        inconsistent verdicts even when the model emits well-formed JSON.
        (FlowSync analog: arbitration cannot change a score without citations.)
        """
        if self.score >= 7:
            expected = GateState.OPEN
        elif self.score >= 4:
            expected = GateState.SOFT
        else:
            expected = GateState.FLAGGED
        if self.gate_state != expected:
            raise ValueError(
                f"gate_state {self.gate_state.value} inconsistent with score {self.score}"
                f" (expected {expected.value})"
            )
        return self


# ── Wire events (SSE) ──────────────────────────────────────────────────────
# Mirrors FlowSync Section 14's ReviewEvent: tokens stream first, the
# structured verdict arrives once at the end with is_final=true.

class ReviewEvent(BaseModel):
    type: Literal["token", "verdict", "error"]
    text: str | None = None
    verdict: ReviewerVerdict | None = None
    is_final: bool = False
