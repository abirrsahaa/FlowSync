from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.responses import StreamingResponse

from app.agents.requirements import build_requirements_reviewer
from app.config import settings
from app.llm.client import AnthropicLLM, LLMClient, StubLLM
from app.schemas import RequirementsSubmission, ReviewEvent

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(message)s")


def make_llm() -> LLMClient:
    if settings.use_stub:
        return StubLLM()
    return AnthropicLLM(api_key=settings.anthropic_api_key or "", model=settings.agent_model)


app = FastAPI(title="Agentic FastAPI Reference — FlowSync Stage Reviewer")
requirements_reviewer = build_requirements_reviewer(make_llm())


def _sse(event: ReviewEvent) -> str:
    return f"data: {event.model_dump_json()}\n\n"


@app.get("/")
def index() -> dict:
    return {
        "service": "Agentic FastAPI Reference — FlowSync Stage Reviewer",
        "endpoints": {
            "GET /health": "liveness + which LLM backend is active",
            "POST /reviews/requirements": "SSE stream — see README for the curl example",
            "GET /docs": "interactive OpenAPI UI",
        },
    }


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "llm": "stub" if settings.use_stub else settings.agent_model}


@app.post("/reviews/requirements")
async def review_requirements(submission: RequirementsSubmission) -> StreamingResponse:
    """Stage 1 review as a Server-Sent Events stream.

    Wire shape mirrors FlowSync Section 14: token events stream first, one
    final event carries the schema-validated verdict. A browser client reads
    this with EventSource/fetch-stream; no WebSocket needed for one-way AI
    output.
    """

    async def generate():
        async for event in requirements_reviewer.review(submission):
            yield _sse(event)

    return StreamingResponse(generate(), media_type="text/event-stream")
