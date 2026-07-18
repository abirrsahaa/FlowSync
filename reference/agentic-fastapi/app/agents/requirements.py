from __future__ import annotations

from pydantic import BaseModel

from app.agents.base import BaseReviewer, Persona
from app.llm.client import LLMClient
from app.schemas import RequirementsSubmission


def requirements_precheck(submission: BaseModel) -> list[str]:
    """Deterministic checks that run BEFORE the LLM — Chain of Responsibility,
    link 1. FlowSync's estimation reviewer does the same with its math
    validator: cheap computation catches what is objectively checkable, the
    LLM only ever sees pre-validated input plus these findings as ground truth.
    """
    assert isinstance(submission, RequirementsSubmission)
    issues: list[str] = []

    if not submission.functional:
        issues.append("Candidate listed ZERO functional requirements.")
    elif len(submission.functional) < 3:
        issues.append(f"Functional scope is thin ({len(submission.functional)} item(s)).")

    if not submission.non_functional:
        issues.append("Candidate listed ZERO non-functional requirements.")
    elif not any(any(ch.isdigit() for ch in nfr) for nfr in submission.non_functional):
        issues.append("No non-functional requirement contains a number — measurability is absent.")

    return issues


REQUIREMENTS_PERSONA = Persona(
    prompt_key="requirements-reviewer",
    precheck=requirements_precheck,
)


def build_requirements_reviewer(llm: LLMClient) -> BaseReviewer:
    return BaseReviewer(llm=llm, persona=REQUIREMENTS_PERSONA)
