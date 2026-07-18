# Agentic FastAPI Reference — one FlowSync stage reviewer, done properly

A minimal but industry-patterned reference for **how to build FlowSync's stage
reviewer agents in Python + FastAPI**. It implements exactly one agent — the
Stage 1 (requirements) reviewer — with every pattern your six reviewers will
reuse. Small enough to read in one sitting; structured so each pattern is in
its own file.

Everything runs **offline in stub mode** (no API key needed). Flip to the real
Claude API by setting `ANTHROPIC_API_KEY`.

> **Studying this project?** Read [`MASTERY.md`](./MASTERY.md) — a full study
> protocol with diagrams, a Java→Python/FastAPI concept bridge, drills, and a
> build ladder.

## Run it

```bash
cd reference/agentic-fastapi
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

pytest -q                     # 7 tests: schema guardrails, pipeline, SSE endpoint
python -m evals.runner        # 3 golden cases incl. one injection attempt
uvicorn app.main:app --reload # serve on :8000
```

Then in another shell:

```bash
curl -N -X POST localhost:8000/reviews/requirements \
  -H 'content-type: application/json' \
  -d '{"functional":["Users can watch videos"],"non_functional":[],"optional":[]}'

curl localhost:8000/health
```

Watch tokens stream, then one final `verdict` event. To go real: copy
`.env.example` to `.env`, set `ANTHROPIC_API_KEY`, restart, and run
`python -m evals.runner --real` to grade the actual model.

## Reading order

1. `app/schemas.py` — the contracts. `ReviewerVerdict` is what the LLM is
   **forced** to emit. Note the `gate_must_match_score` validator: JSON Schema
   constrains shape; server-side Pydantic constrains semantics. Both are needed.
2. `app/llm/prompts.py` — the prompt registry. Versioned; the eval harness
   gates changes.
3. `app/llm/client.py` — `LLMClient` protocol + two adapters: `AnthropicLLM`
   (streaming + forced tool use) and `StubLLM` (deterministic, offline).
4. `app/guardrails.py` — untrusted-input wrapping + verdict validation.
5. `app/agents/base.py` — `BaseReviewer`: the pipeline and the bounded
   corrective-repair loop.
6. `app/agents/requirements.py` — the persona: a prompt key + a deterministic
   pre-check. A new stage reviewer is ~30 lines of this file.
7. `app/main.py` — FastAPI wiring; SSE via plain `StreamingResponse`.
8. `evals/runner.py` — golden-case runner with rule-based grading and a CI
   exit code.

## Pattern map — this reference → FlowSync

| Here | Pattern | FlowSync equivalent |
|---|---|---|
| `LLMClient` protocol, two adapters | Ports & Adapters | Same domain logic behind gRPC in Java, SSE in Python |
| `BaseReviewer.review()` | Template Method | Roadmap Phase 4: shared pipeline, per-persona `buildPrompt` |
| `Persona` dataclass | Strategy | Six stage reviewers = six configs, not six classes |
| `requirements_precheck` | Chain of Responsibility (link 1) | Estimation reviewer's math validator before the LLM |
| `emit_verdict` tool + `validate_verdict` | Schema-enforced structured output | Section 24.2 — never regex-parse prose |
| `wrap_untrusted` + system-prompt labeling + injection eval case | Prompt-injection defense | Section 24.4, all four mitigation layers |
| `gate_must_match_score` validator | Sanity-bound backstop | Arbitration: no score change without citations |
| Retry loop in `review()` (max 2, verdict-only, error fed back) | Loop engineering | Bounded agentic loop with observable iterations |
| `evals/` runner + cases | Eval harness | Phase 3 / Section 24.1 — exit code is the CI gate (E2E-08) |
| `case-003-injection.json` | Adversarial eval | Section 24.4's adversarial suite (FD-09) |
| SSE `token` → final `verdict` events | Streaming wire shape | Section 14 `ReviewEvent` (`text_token`, `verdict_json`, `is_final`) |
| Structured `llm_call` log (model, latency, tokens) | LLM observability seed | Section 24.11 metrics: tokens, cost, per-prompt-version scores |
| Stub vs real via env | Deterministic offline dev | Lets evals/tests run in CI without API spend |

## Deliberate simplifications (and what production adds)

- **No rate limiting** — FlowSync enforces this with the Redis Lua token
  bucket (Section 13, Pattern 5) at the gateway, not inside the agent.
- **No auth** — FlowSync validates one FlowSync-issued JWT everywhere
  (Section 25.2); add it as FastAPI middleware when you wire this in.
- **In-memory only** — no persistence; FlowSync writes `StageOutput` to
  Postgres and publishes to `stage.reviews`.
- **Rule-based grading only** — FlowSync adds LLM-as-judge as a second,
  pluggable grading strategy for semantic expectations.
- **Single-turn** — the challenge/arbitration flow is the natural next agent:
  same `BaseReviewer`, different persona, plus ground-truth injection of the
  user's Stage 2 numbers into the prompt.

## Exercises, in order

1. **Add the estimation reviewer.** New `Persona` + prompt + pre-check (the
   math validator: reject impossible QPS/storage arithmetic). No changes to
   `base.py` — if you need any, the abstraction is wrong.
2. **Break a prompt, watch the gate.** Edit the system prompt to be laxer,
   re-run `python -m evals.runner`, watch it fail. This is FD-15.
3. **Build the arbitration endpoint.** Input: verdict + user justification +
   estimation numbers. Ground-truth-inject the numbers, require citations in
   the output schema (a score change with empty `citations` must fail
   validation, the way `gate_must_match_score` does).
4. **Port the contract.** Express `ReviewerVerdict`/`ReviewEvent` in
   `flowsync.proto` (Section 14) and serve gRPC via `grpcio` instead of, or
   alongside, SSE.
