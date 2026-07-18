from __future__ import annotations

import json

from app.schemas import ReviewerVerdict


def wrap_untrusted(payload: dict) -> str:
    """Delimit and label user-controlled text before it enters a prompt.

    FlowSync Section 24.4, mitigation 1: free-form user input flowing into a
    scoring LLM call is an injection vector. Explicit delimiters plus the
    system prompt's "untrusted data" instruction are the first layer; the
    schema-enforced output and the validator below are the second and third.
    """
    return "<user_submission>\n" + json.dumps(payload, indent=2) + "\n</user_submission>"


def verdict_json_schema() -> dict:
    """The JSON Schema handed to the model as the emit_verdict tool's input_schema.

    Note: derived from the same Pydantic model used server-side, so contract
    drift between "what we ask for" and "what we accept" is impossible.
    """
    return ReviewerVerdict.model_json_schema()


def validate_verdict(data: dict) -> ReviewerVerdict:
    """Server-side enforcement of the output contract.

    Raises pydantic.ValidationError on any violation — shape errors (missing
    fields, bad enums) AND semantic ones (gate/score inconsistency). The
    caller (BaseReviewer) turns a ValidationError into a bounded retry with
    corrective feedback, never a crash and never a silently accepted verdict.
    """
    return ReviewerVerdict.model_validate(data)
