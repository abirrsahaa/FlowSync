# FlowSync — 30-Day Hierarchical Build Roadmap

> Third document in the set:
> - `sytem_design.md` — **the spec** (what to build, the answer key)
> - `development_system.md` — **the process** (how to build correctly: gates, ledger, drills, first-principles derivation)
> - `build_roadmap.md` (this file) — **the calendar** (what, in what order, with what tech/patterns/knowledge, in 30 days)
>
> You write every line of code. This document and its companions are the architecture and project-management layer — the thing a staff/principal engineer would hand a strong engineer as a spec + plan.

---

## 0. Reality Check — read this before Day 1

Section 21 of `sytem_design.md` estimated 13 weeks for this scope. Compressing to 30 days is done by **holding scope, cutting polish, not cutting depth on the differentiators.** Concretely:

- Every core mechanic (OT merge, 6 reviewer agents, challenge/arbitration, eval harness, replay, crypto-shredding deletion) is built to **real depth** — these are what make this a principal-level portfolio piece, not a CRUD app with a chatbot.
- DevOps and the Go-mirror comparison are built to **MVP depth in week 4**, with explicit stretch items (multi-region talking points, preview environments, infracost gating, 5th Grafana dashboard) marked clearly as post-Day-30 hardening, not core.
- This assumes **~4–6 focused hours/day**, every day, for 30 days. If your real availability is lower, don't shrink every phase proportionally — cut whole phases from the bottom of Appendix C's fallback list instead. A half-finished everything is worse than a finished 80%.

Each phase below follows the same template and produces a `ledger.md` row (per `development_system.md` Section 4) with all seven gates (DERIVE → SPEC → BUILD → PROVE → BREAK → MEASURE → EXPLAIN) filled before you move on.

---

## 1. Master Component Hierarchy

The full system, all phases, one tree — refer back here when a phase says "you are building node X.Y":

```
FlowSync
├── 1. Frontend (React + Vite + TypeScript)
│   ├── 1.1 Stage UI Router
│   ├── 1.2 Stage 1–4 structured forms (requirements/estimation/API/data model)
│   ├── 1.3 HLD Canvas (tldraw)
│   │   ├── 1.3.1 Component bank (left panel, draggable typed nodes)
│   │   ├── 1.3.2 Canvas surface + 7 custom ShapeUtils + typed edges
│   │   ├── 1.3.3 AI checklist panel (right panel, live updates)
│   │   ├── 1.3.4 Snapshot builder (toSvg + component graph extraction)
│   │   └── 1.3.5 Challenge UI (justification input, verdict diff view)
│   ├── 1.4 Deep Dive canvas (zoomed HLD reuse)
│   ├── 1.5 Presence + cursor rendering (tldraw instance_presence)
│   ├── 1.6 Session replay scrubber
│   ├── 1.7 Final report UI
│   └── 1.8 Transport client layer (WS/STOMP, SSE, reconnect/resync client)
├── 2. Realtime Backend
│   ├── 2.1 Java Spring WebFlux service
│   │   ├── 2.1.1 WS/STOMP handler + JWT handshake auth
│   │   ├── 2.1.2 Schema validation (Bean Validation)
│   │   ├── 2.1.3 Redis SETNX idempotency guard
│   │   ├── 2.1.4 Kafka producer (EOS: idempotence + transactional.id)
│   │   ├── 2.1.5 Broadcast consumer (Redis pub/sub → Reactor Sinks.many)
│   │   └── 2.1.6 Reconnect/resync endpoint (Section 24.7)
│   └── 2.2 Go mirror service
│       ├── 2.2.1 WS handler (gorilla/websocket)
│       ├── 2.2.2 Kafka consumer group (sarama, 1 goroutine/partition)
│       ├── 2.2.3 Redis client (go-redis)
│       └── 2.2.4 Broadcast fan-out (chan + sync.Map + select/default-drop)
├── 3. Streaming / Event Backbone
│   ├── 3.1 Kafka cluster
│   │   ├── Topics: canvas.ops, canvas.ops.broadcast, stage.submissions,
│   │   │           stage.reviews, challenges, session.complete, dlq.*
│   │   └── 3.1.1 Kafka Streams OT-merge topology (RocksDB state store,
│   │             interactive queries for resync)
│   └── 3.2 Redis cluster
│       ├── 3.2.1 Pub/Sub (ops fanout, cursor fanout)
│       ├── 3.2.2 Presence ZSET + heartbeat keys
│       ├── 3.2.3 Dedup SETNX (ops + stage submissions)
│       ├── 3.2.4 Rate limiter (Lua token bucket)
│       ├── 3.2.5 Live checklist state
│       └── 3.2.6 Keyspace notifications (offline detection)
├── 4. AI Agent Layer — Python/FastAPI, Kafka-consumer invoked (Section 14)
│   ├── 4.1 Agent Harness (shared package every agent below is a thin
│   │         subclass of: base_agent.py, structured_output.py,
│   │         model_router.py, prompt_registry.py, rate_limiter.py,
│   │         injection_guard.py, tracing.py, eval_hook.py — Section 19)
│   ├── 4.2 Eval harness (golden sets, CI gate, score dashboard) — built FIRST,
│   │         wired to 4.1 via eval_hook.py once the harness exists (Phase 4)
│   ├── 4.3 Stage reviewer agents ×6 (requirements/estimation/api/datamodel/hld/deepdive)
│   ├── 4.4 Arbitration agent (ground-truth injection, mandatory citation)
│   └── 4.5 Final report agent (large-context, prompt-cached)
├── 5. Persistence
│   ├── 5.1 Postgres (R2DBC): users, sessions, reports, progress_history, problems
│   └── 5.2 S3: exports, (optional) audio
├── 6. Session Aggregator (Kafka Streams app: StageOutput[] → SessionDocument)
├── 7. DevOps / Infra
│   ├── 7.1 Docker + Docker Compose (local prod-parity)
│   ├── 7.2 Terraform modules (networking, eks, msk, elasticache, rds, secrets)
│   ├── 7.3 Helm chart
│   ├── 7.4 GitHub Actions CI (path-filtered, matrix, Trivy/OWASP)
│   ├── 7.5 ArgoCD GitOps + PostSync smoke test
│   └── 7.6 KEDA autoscalers
├── 8. Observability
│   ├── 8.1 OTel instrumentation (Java agent, Go SDK, trace_id propagation)
│   ├── 8.2 Prometheus + custom metrics
│   ├── 8.3 Tempo tracing
│   ├── 8.4 Loki logging
│   └── 8.5 Grafana dashboards
└── 9. Cross-Cutting Concerns
    ├── 9.1 Idempotency (ops + stage submissions)
    ├── 9.2 Reconnect/resync protocol
    ├── 9.3 Crypto-shredding deletion (Section 24.10)
    ├── 9.4 Challenge abuse limits (Section 24.9)
    └── 9.5 Prompt-injection defenses (Section 24.4)
```

---

## 2. Phase Template (used for every phase below)

Every phase has: **Mission → Component Hierarchy → Tech Stack & Knowledge → Design Patterns Applied → Build Order → End-to-End Deliverable → Verification Plan → Standout Factor → Exit Checklist.**

The "End-to-End Deliverable" is never "it runs on my machine when I click through it" — it's a script, a drill, or a dashboard reading that a stranger could verify.

---

## 3. Calendar Overview

```
Phase 0  Days 1–2    Foundations & Contracts
Phase 1  Days 3–5    Canvas Core
Phase 2  Days 6–11   Real-Time Sync Backbone           ← the crown jewel (6 days)
Phase 3  Days 12–13  Eval Harness (before any reviewer exists)
Phase 4  Days 14–17  Stage Reviewer Agents 1–4
Phase 5  Days 18–21  HLD Canvas AI Review + Challenge/Arbitration
Phase 6  Days 22–24  Session Aggregator + Final Report + Replay
Phase 7  Days 25–26  Go Mirror + Full Observability
Phase 8  Days 27–29  DevOps: Containerize → Cloud-Native
Phase 9  Day 30      Load Test, Chaos Drills, Demo Capture
```

---

## Phase 0 — Foundations & Contracts (Days 1–2)

### Mission
Freeze every interface — Kafka message contracts, schemas, topic manifest, Redis key namespace — before writing feature code, so the Java, Go, AI-reviewer, and frontend workstreams never discover an integration mismatch in week 3. This is contract-first development: the seam is designed before either side of it.

### Component Hierarchy
Builds tree nodes: 7.1 (Docker Compose only), plus contract artifacts that aren't in the tree because they're not runtime components — `contracts/schemas/*.json` (JSON Schema, consumed by Java/Go/frontend), `services/ai-reviewer/app/contracts.py` (the same shapes as Pydantic models — Section 14), `contracts/kafka-topics.yaml`, `contracts/redis-keys.md`.

### Tech Stack & Knowledge
| Area | What you need to know |
|---|---|
| Pydantic | `BaseModel`, validators, `model_dump_json()` — the AI-reviewer side of every contract (Section 14) |
| JSON Schema | Draft 2020-12 basics, enough to validate `CanvasOp`, `StageOutput`, `SessionDocument`, `ComponentGraph` (Section 20) — the Java/Go/frontend side of the same contracts |
| Docker Compose | multi-service compose files, healthchecks, named volumes |
| Kafka topic design | partition count tradeoffs, key-based ordering, retention config |
| 12-Factor App | config via env vars, no baked-in secrets even locally |

### Design Patterns Applied
- **Contract-First / Interface Segregation** — the JSON Schemas and their Pydantic-model twins are the only thing four independent workstreams (Java, Go, AI reviewer, frontend) depend on. Change the contract deliberately and in one place; never let two services silently drift on message shape. There is no codegen step linking the two representations — keeping them in sync by discipline (one PR touches both, or neither) is a deliberate simplicity tradeoff over introducing a shared-schema-codegen pipeline for a two-language contract.
- **Ports & Adapters (Hexagonal Architecture)** — your domain types (`ComponentGraph`, `StageOutput`) are plain data, transport-agnostic. WS, Kafka, and REST are all adapters around the same core; this is what lets Phase 7 add a Go adapter without touching domain logic.

### Build Order
1. Write JSON Schemas for `CanvasOp`, `StageOutput`, `SessionDocument`, `ComponentGraph`, `Finding`, `ReviewerVerdict`, `ChallengeOutcome` (Section 20 types → schemas).
2. Write the Pydantic twins of the Kafka message contracts from Section 14 (`StageReviewSubmission`, `ReviewStreamEvent`, `HLDReviewSubmission`, `HLDAnnotationEvent`, `ArbitrationSubmission`, `ArbitrationStreamEvent`, `GenerateReportSubmission`, `ReportStreamEvent`, `KafkaEnvelope`).
3. Write `kafka-topics.yaml`: topic name, key, partition count, retention, per Section 6/7.
4. `docker-compose.yml`: Kafka (KRaft mode, no Zookeeper needed), Redis, Postgres, Kafdrop.
5. Scaffold four service directories with a health endpoint only — no business logic yet. The `ai-reviewer` FastAPI app's `/docs` should already render the Pydantic contracts from step 2 at this point — that's a nice, immediate, visual proof the contracts exist and are well-formed.

### End-to-End Deliverable
`docker compose up` boots the full local stack in under 60 seconds; `curl` against each service's `/health` returns 200; a schema-validation script asserts one hand-written fixture per JSON Schema passes and one deliberately-broken fixture per schema fails.

### Verification Plan
- Contract test: fixture-validates-against-schema, both positive and negative cases (this is the only test type this phase needs — there's no business logic yet to unit test).
- Smoke script: `docker compose up -d && ./scripts/healthcheck-all.sh`.

### Standout Factor
Most side projects write feature code on day one and discover a shape mismatch between two services in week three, deep into unrelated debugging. Contracts frozen and validated before any feature code exists is the discipline that distinguishes someone who has actually shipped in a multi-service org.

### Exit Checklist
- [ ] every Pydantic contract model instantiates cleanly against a fixture, and FastAPI's `/docs` renders all of them
- [ ] every JSON Schema has a passing and failing fixture
- [ ] full compose stack up in <60s, all healthchecks green
- [ ] `ledger.md` seeded with every unit in the Master Component Hierarchy

---

## Phase 1 — Canvas Core (Days 3–5)

### Mission
Prove the typed component bank is real before anything talks to the network. Everything downstream — dedup hallucination in the AI reviewer, checklist matching, the whole differentiator — depends on the canvas producing structured, typed data, not free-form drawing.

### Component Hierarchy
Builds 1.3.1, 1.3.2, 1.3.4.

### Tech Stack & Knowledge
| Area | What you need to know |
|---|---|
| @tldraw/tldraw SDK | ShapeUtil lifecycle (`getDefaultProps`, `component`, `indicator`, resize/rotate hooks), the `Editor` API, `editor.getCurrentPageShapes()`, `editor.toSvg()` |
| React 18 + TypeScript | component composition, controlled forms for the properties panel |
| Drag-and-drop | pointer events or HTML5 DnD for the component bank → canvas interaction |
| Schema validation at the UI boundary | validating shape props client-side before they ever reach the wire (zod or tldraw's own T validators) |

### Design Patterns Applied
- **Strategy** — each of the 7 node types (`ServiceNode`, `DatabaseNode`, `QueueNode`, `LoadBalancerNode`, `CacheNode`, `CDNNode`, `APIGatewayNode`) is a `ShapeUtil` implementation, polymorphically swapped by tldraw's shape registry. Adding an 8th node type later means adding one class, touching nothing else.
- **Factory Method** — the component-bank drop handler constructs the correct shape instance from a type tag; the canvas never branches on "if type == X" at the call site.
- **Value Object** — node properties (`technology`, `expectedRps`, `slaTarget`) are immutable, validated at construction, never mutated in place — this is what makes the properties panel's "undo" work for free via tldraw's own undo stack instead of custom code.
- **Adapter (Anti-Corruption Layer)** — a single module translates tldraw's internal shape record format into the `ComponentGraph` domain JSON from Phase 0's schema. This is the one place that changes if tldraw's internal format changes; the AI reviewer, checklist matcher, and Kafka payload never see a raw tldraw shape.

### Build Order
1. Define the 7 `ShapeUtil` classes with typed props matching Section 8's node-type table.
2. Build the component bank panel; wire drag → Factory Method → shape placed on canvas.
3. Build the properties panel reading `editor.getSelectedShapes()`.
4. Implement the edge-type selector (7 typed edge kinds from Section 8).
5. Write the Adapter: tldraw store → `ComponentGraph` JSON, validated against Phase 0's schema.
6. Wire `editor.toSvg()` for the PNG snapshot half of the pipeline.

### End-to-End Deliverable
A scripted test (Playwright, or a store-manipulation script if you skip browser automation) places one of every node type, connects them with typed edges reproducing Section 8's example (API Gateway → Service → DB / Cache), exports a PNG, extracts the `ComponentGraph`, and validates it against Phase 0's schema — zero manual clicking required to prove it.

### Verification Plan
- Unit: each `ShapeUtil`'s prop validator rejects a malformed prop set.
- Integration: the Adapter round-trips tldraw store → `ComponentGraph` → reconstructed shapes, asserting no data loss.
- E2E: the scripted deliverable above.

### Standout Factor
Be able to explain, in one sentence, why this exists: "the AI reviewer never guesses what a shape is — it gets exact typed structure, so hallucination is architecturally impossible, not just prompted away."

### Exit Checklist
- [ ] all 7 node types + 7 edge types implemented and typed
- [ ] Adapter round-trip test passes
- [ ] scripted E2E deliverable passes in CI

---

## Phase 2 — Real-Time Sync Backbone (Days 6–11)

### Mission
This is the hardest, highest-signal part of the whole project — the piece most likely to get a real systems-design follow-up question. Build it via the earn-your-infrastructure ladder from `development_system.md` Section 2: never add Kafka, RocksDB, or EOS because the spec says so — add each only after watching its absence fail.

### Component Hierarchy
Builds 2.1 (all of it), 3.1 (all of it), 3.2.1, 3.2.3, 9.1, 9.2.

### Tech Stack & Knowledge
| Area | What you need to know |
|---|---|
| Spring WebFlux + Reactor | `@MessageMapping`, `Mono`/`Flux`, `Sinks.many().multicast()`, backpressure strategies (`onBackpressureBuffer`, `DROP`) |
| STOMP over WebSocket | frame format, subscription model, JWT-in-handshake auth |
| Kafka fundamentals | partitioning by key, consumer groups, exactly-once semantics (idempotent producer + `transactional.id`) |
| Kafka Streams | Processor API (not just the DSL), state stores, `StateStoreBuilder`, interactive queries |
| RocksDB | what a persistent KV state store actually gives you vs an in-memory `Map` |
| Operational Transformation vs CRDTs | why OT needs a single authority (the Streams processor) while CRDTs don't; vector clocks for causality tracking |
| Redis pub/sub | at-most-once delivery semantics, why that's acceptable here |

### Design Patterns Applied
- **Idempotent Receiver** — `SET op:{opId} 1 NX EX 86400` at the WS ingest boundary; a client retry can never produce a duplicate op downstream.
- **Event Sourcing** — `canvas.ops` is the append-only source of truth; canvas state is the fold over all events, not a row in a database (this is also what Phase 6's replay depends on).
- **CQRS** — the write path (ops → Kafka) is structurally separate from the read path (RocksDB materialized view, queried interactively for resync in Phase 2's last day). Don't let the write path ever read RocksDB directly; don't let resync ever go through the Kafka producer path.
- **Optimistic Concurrency Control via Vector Clocks** — each client tags ops with a vector clock; the OT processor uses this for causal ordering, not wall-clock time.
- **State Machine** — the client's connection lifecycle (`CONNECTING → CONNECTED → RECONNECTING → RESYNCING → CONNECTED`) is modeled explicitly, not as ad hoc booleans — this is what Section 24.7's resync protocol needs to be reliable.
- **Bulkhead** — partitioning by `workspaceId` isn't just an ordering trick, it's a bulkhead: one workspace's pathological op volume can't starve another workspace's partition-consumer fairness.
- **Publish-Subscribe** — Redis pub/sub for cross-instance broadcast fanout, decoupling "an op was resolved" from "which server instance holds which WS sessions."

### Build Order — the earn-it ladder, day by day
```
Day 6   Naive in-memory fanout (Map<wsId, List<Session>>), single instance.
        Run FD-02 (development_system.md): 2 instances behind a LB — cross-
        instance users are invisible. This failure EARNS Redis pub/sub.

Day 7   Redis pub/sub as the only op transport (no Kafka yet).
        Run FD-12: restart a subscriber mid-traffic — ops lost, no replay.
        This failure EARNS Kafka. Add canvas.ops topic + SETNX dedup
        (Redis SETNX earned by FD-01: inject 1000 duplicate ops, prove 0
        reach Kafka after the guard).

Day 8-9 Ops applied in arrival order, no authority. Run FD-03: two headless
        clients move the same node concurrently — states diverge
        permanently. This EARNS the Kafka Streams OT-merge processor with
        RocksDB state + workspaceId partitioning.
        Then: at-least-once producer. Run FD-04: kill the Streams pod
        mid-batch — op applied twice on restart. This EARNS EOS
        (idempotent producer + transactional.id).

Day 10  Unbounded per-session send buffer. Run FD-05: one artificially
        slow client — memory grows unbounded. This EARNS backpressure
        with a DROP policy (Sinks.many + onBackpressureBuffer + drop-slow-
        client), with dropped_count as a metric, not a silent failure.

Day 11  Reconnect/resync protocol (Section 24.7): client tracks
        lastServerSeq; on reconnect, server serves either a replay-from-seq
        or a full snapshot via RocksDB interactive query. Then: property-
        based OT convergence tests (Section 24.6) — randomized concurrent
        op permutations, assert identical final state regardless of order.
```

### End-to-End Deliverable
`E2E-02` (Convergence): two headless WS clients issue 500 randomized ops each with random jitter; both converge to an identical final-canvas-state hash. Plus every drill (FD-01, 02, 03, 04, 05, 12) has a recorded before/after observation in `drills/`.

### Verification Plan
- Unit: OT transform functions (position last-writer-wins, label character-level merge, delete-wins-over-move) tested in isolation with hand-constructed conflict cases.
- Integration: Testcontainers spinning real Kafka + Redis, asserting end-to-end op → broadcast latency and dedup behavior.
- Property-based: `E2E-02` / Section 24.6's convergence property, run with many random seeds, not just one happy-path sequence.
- Drills: FD-01, FD-02, FD-03, FD-04, FD-05, FD-12 all executed and recorded, not just described.

### Standout Factor
This is the section of the entire project most likely to get probed hardest in an interview follow-up ("what happens if two users edit the same node at the same time?"). By the end of this phase you have a tested, drilled, benchmarked answer — not a hand-wave — and a git history that shows you derived the need for each piece of infrastructure by watching it fail first.

### Exit Checklist
- [ ] all 6 drills run and recorded with before/after evidence
- [ ] EOS producer config verified (kill-and-restart test shows no duplicate)
- [ ] convergence property test passes across ≥100 random seeds
- [ ] reconnect/resync proven: kill a client mid-session, reconnect after N missed ops, assert final state matches a client that never disconnected

---

## Phase 3 — Eval Harness (Days 12–13)

### Mission
Build the instrument that grades the AI before the AI exists. Every reviewer agent built after this point is born with a regression suite; none of Phase 4/5's agent work is trustworthy without this landing first.

### Component Hierarchy
Builds 4.2 (the eval runner itself). A stub of 4.1's `prompt_registry.py` module is enough at this point — the full Agent Harness doesn't exist until Phase 4.

### Tech Stack & Knowledge
| Area | What you need to know |
|---|---|
| Eval methodology | rule-based grading (does this input necessarily produce this finding) vs LLM-as-judge grading (semantic closeness), and when each is appropriate |
| CI integration | GitHub Actions job that runs on prompt-file changes specifically (path filter, mirroring the doc's `detect-changes` pattern) |
| Basic eval statistics | pass rate, score distribution, regression threshold vs a stored baseline |

### Design Patterns Applied
- **Strategy** — grading strategy (rule-based vs LLM-judge) is pluggable per golden case, not hardcoded into the runner.
- **Template Method** — the eval runner's pipeline (`loadCase → invokeAgent → grade → aggregate → report`) is fixed; only the per-case grading strategy varies.
- **Repository** — golden cases live as versioned files in the repo (`eval/<stage>/case-NNN.json`), not in a database — they're code, reviewed in PRs like code.

### Build Order
1. Define the golden-case JSON shape (input + expected findings/score range, per `development_system.md` 24.1).
2. Write the eval runner: given a case and an agent endpoint, produce pass/fail + score delta.
3. Bootstrap 8–10 hand-written cases per stage (acknowledge this chicken-and-egg: no reviewer agent exists yet, so these are synthetic input/expected-output pairs derived directly from the spec's examples, not real sessions — replace with real-session-derived cases once Phase 4 ships).
4. Wire a GitHub Actions job: on any diff under `prompts/` or `eval/`, run the suite, fail the build below a baseline pass rate, post the score as a PR comment.
5. Emit `eval_score_by_prompt_version` as a metric (Section 24.11) even before Grafana exists in Phase 7 — write it to a flat file/log for now, backfill the dashboard later.

### End-to-End Deliverable
`E2E-08`: a prompt-change PR against a stub reviewer triggers the eval suite, posts a pass-rate comment, and fails the build when you deliberately worsen the stub prompt (`FD-15`).

### Verification Plan
- FD-15 drill: deliberately regress a prompt, confirm the CI gate fails; revert, confirm it passes.
- Confirm the eval runner itself has unit tests for its grading logic (a bug in the grader is worse than a bug in the thing being graded, since it hides regressions silently).

### Standout Factor
"I built the eval harness before the feature it grades" is a rare discipline and the single strongest "agentic engineering," not "prompt engineering," signal in the whole project — most portfolio AI projects have zero regression testing on their prompts.

### Exit Checklist
- [ ] golden-case format defined and versioned in repo
- [ ] ≥8 cases per stage bootstrapped
- [ ] CI gate blocks on regression (proven via FD-15)
- [ ] eval score is emitted as a trackable metric, even pre-Grafana

---

## Phase 4 — Stage Reviewer Agents 1–4 (Days 14–17)

### Mission
Build the Agent Harness itself, then the four conversational/structured-form-stage reviewers (requirements, estimation, API, data model) as thin subclasses on top of it, with schema-enforced output from day one — never ship the fragile text-parsing version except as a throwaway baseline measurement.

### Component Hierarchy
Builds 4.1 (Agent Harness — `base_agent.py`, `structured_output.py`, `model_router.py`, `rate_limiter.py`, `tracing.py` built out fully here; `injection_guard.py` and `eval_hook.py` land in Phase 5/were stubbed in Phase 3), 4.3 (4 of 6 reviewer agents), 9.5 (partial, hardened fully in Phase 5).

### Tech Stack & Knowledge
| Area | What you need to know |
|---|---|
| Claude API | Messages API, streaming responses, tool-use / structured-output for schema enforcement (load the `claude-api` skill/reference before writing prompts) |
| FastAPI + aiokafka | FastAPI `lifespan` hosting an aiokafka consumer as a background task — not a request/response endpoint for the review path (Section 14) |
| Pydantic | schema-enforced tool-use output, request/response validation, `model_dump_json()` for the Redis pub/sub payload |
| Prompt engineering per persona | Section 14's four stage prompts as a starting point, refined against Phase 3's eval scores, not vibes |

### Design Patterns Applied
- **Template Method** — `harness/base_agent.py`'s `BaseAgent` pipeline (`fetch_context → build_prompt → call_llm → validate_output → emit`) is shared by all four reviewers (and, later, arbitration and the report agent); each persona overrides only `build_prompt` and its output schema.
- **Chain of Responsibility** — the estimation reviewer specifically: request passes through a math-validation link first (rejects/flags impossible numbers computationally), then the LLM-qualitative-review link only sees pre-validated input. This is a textbook CoR, not a buzzword — it's literally two independent handlers in sequence, each free to short-circuit.
- **Decorator** — LLM calls are wrapped with `rate_limiter.py` and `tracing.py` decorators (and, from Phase 5 on, `model_router.py`) composed around a plain `call_llm` core, not hardcoded inline in every reviewer. Python's `@decorator` syntax is a literal, direct fit for this pattern — worth calling out explicitly, since it's one of the few places the language's own syntax names the pattern you're using.
- **Strategy** — persona behavior varies via a config object (system prompt + output schema + context-fetch function) passed into the shared pipeline, not four copy-pasted classes.

### Build Order
1. Implement `harness/base_agent.py`'s `BaseAgent` Template Method with a stub `EchoAgent` to prove the pipeline plumbing end to end (Kafka produce → aiokafka consume → Redis PUBLISH → gateway subscribes → SSE to a test client) before any real prompt exists.
2. Implement the requirements reviewer (simplest — pure conversational streaming) as a `BaseAgent` subclass.
3. Implement the estimation reviewer with the two-stage Chain of Responsibility (math validator, then LLM).
4. Implement API and data-model reviewers.
5. Confirm every reviewer's LLM call goes through the `rate_limiter.py` + `tracing.py` decorators via the shared `BaseAgent.call_llm`, not a per-reviewer reimplementation.
6. Retrofit Phase 3's golden cases into real fixtures for all four stages, now invoked directly via `harness/eval_hook.py` instead of synthetic input/output pairs; extend as needed.
7. Run `FD-10` (measure structured-output parse failure rate) as a one-time baseline against a deliberately-naive prose-parsing version, then confirm the schema-enforced (`structured_output.py`) version measures ~0%.
8. Apply `FD-11` / Section 24.8 idempotency: double-submit a stage, assert one LLM call, not two.

### End-to-End Deliverable
`E2E-01` (partial — stages 1–4 only): drive all four stages via the REST submit endpoint (Section 25.1) with a fixture design, assert each produces a `StageOutput` with a valid `ReviewerVerdict`, persisted and retrievable.

### Verification Plan
- Unit: prompt builders, math validator's numeric checks.
- Integration: Kafka consumer test (Testcontainers Kafka) — produce a `StageReviewSubmission`, assert a schema-valid `ReviewStreamEvent` appears on the `review:{sessionId}` Redis channel.
- Golden-set eval (Phase 3) passing above baseline for all four stages.
- FD-10 (structured output reliability), FD-11 (submission idempotency).

### Standout Factor
Four reviewers sharing one Template Method pipeline, but provably behaving differently per persona (different eval scores on the same class of input) demonstrates the difference between "four copy-pasted prompt files" and "an actual reviewer framework" — the thing a staff engineer glances for when reviewing AI-feature code.

### Exit Checklist
- [ ] all 4 reviewers pass their golden sets above baseline
- [ ] structured output failure rate measured near-zero (post FD-10 fix)
- [ ] stage-submission idempotency proven (FD-11)
- [ ] every reviewer's LLM call goes through the same decorator stack

---

## Phase 5 — HLD Canvas AI Review + Challenge/Arbitration (Days 18–21)

### Mission
Build the product's core differentiator: dual-representation HLD review, live checklist, and the challenge/arbitration mechanic with real anti-bias and anti-injection engineering, not just a prompt that says "don't be biased."

### Component Hierarchy
Builds 4.3 (remaining 2: hld, deepdive), 4.4 (arbitration agent), the harness's `injection_guard.py` and `eval_hook.py` modules, 1.3.3, 1.3.5, 9.4, 9.5 (hardened).

### Tech Stack & Knowledge
| Area | What you need to know |
|---|---|
| Grounding techniques | injecting structured context (Stage 2 numbers, problem constraints) into a system prompt as non-negotiable ground truth, distinct from stuffing everything into one blob |
| Streaming UI state | React state management for token-by-token findings with node-highlight side effects on partial stream events |
| Adversarial prompt testing | constructing injection strings that try to manipulate a self-scoring LLM call, and testing against them systematically |
| Kafka/Redis stream association | ensuring a `HLDAnnotationEvent`'s `finding` and its explanation tokens stay correctly associated across a Redis pub/sub stream consumed by a possibly-different gateway instance than the one that received the original request |

### Design Patterns Applied
- **Mediator** — the arbitration agent literally mediates between two conflicting "colleague" objects (the AI verdict and the user's justification), producing a merged, cited ruling. This is not a loose metaphor — model it as an actual Mediator: neither the reviewer verdict nor the user justification talk to each other directly; both pass through the arbitrator.
- **Specification** — each checklist checkpoint (Section 8) is a Specification object (`isSatisfiedBy(componentGraph)`), evaluated independently and composably — this is what lets the lightweight 30-second live checker and the full on-demand reviewer share the same checkpoint-matching logic instead of duplicating it.
- **Command** — a challenge submission is a Command object, published to the `challenges` topic, enabling replay and audit (and directly supporting Section 24.9's per-challenge logging for product analytics).
- **Anti-Corruption Layer** (reused from Phase 1) — the same tldraw→ComponentGraph adapter feeds both the reviewer and the checklist Specifications; no second translation layer to drift out of sync with the first.

### Build Order
1. Implement the draft-then-curate checklist pipeline (Section 24.5): LLM drafts, status `DRAFT`, human-approval flips to `PUBLISHED`, versioned `checklistId`.
2. Implement the Specification-based checkpoint matcher; wire it to the 30-second live-check path (cheap/fast model tier, per Section 24.3) and the on-demand full review (full model tier) — same Specifications, different callers.
3. Implement the HLD reviewer: dual input (snapshot + component graph + stageContext), schema-enforced findings (`node_id`, `checkpoint_id`, `severity`, `explanation` as one structured object — not a text-tag heuristic).
4. Wire node-highlighting: stream event with `node_id` set → `editor.setHintingShapes([node_id])` before explanation text finishes.
5. Implement the challenge UI + Command publishing.
6. Implement the arbitration agent (Mediator) with the three anti-bias mechanisms from Section 9: ground-truth injection, explicit ruling rule, mandatory citation — enforced by the output schema itself (a `finalScore` change requires a non-empty `citations` array, or the schema rejects it).
7. Harden against injection (Section 24.4): implement `harness/injection_guard.py` (delimited/labeled untrusted input), a schema-level guard, a server-side sanity-bound backstop, and a dedicated adversarial eval set wired through `harness/eval_hook.py`.
8. Add the challenge cap (Section 24.9): one challenge per stage per session, every attempt logged regardless of outcome.
9. Implement the deep-dive reviewer (Section 6's Stage 6, same canvas, LLD-focused persona reusing the Phase 4 pipeline).

### End-to-End Deliverable
`E2E-06` (review streaming + correct node highlighting on a fixture graph) and `E2E-04` (challenge → arbitration produces a structured ruling with ≥1 citation, score adjusted, outcome persisted) both green, plus the adversarial suite (`FD-09`) passing.

### Verification Plan
- Unit: Specification checkpoint matchers tested against hand-built graphs (present/absent/partial cases).
- Integration: arbitration output schema rejects any score-change lacking a citation (server-side backstop test).
- Golden-set eval extended with ≥3 injection-attempt cases (Section 24.4) — assert the ruling never moves score without a citation referencing the user's own Stage 2 numbers.
- `E2E-04`, `E2E-06`, `FD-09`.

### Standout Factor
The challenge/arbitration mechanic plus its adversarial test suite is the single strongest "I designed for AI safety, not just AI features" artifact in the project — almost no portfolio AI project has a deliberate adversarial test suite against its own scoring mechanism.

### Exit Checklist
- [ ] checklist pipeline enforces draft→human-approval→published
- [ ] HLD findings are schema-enforced, not text-parsed (measured 0% parse failure)
- [ ] arbitration ruling schema cannot express an uncited score change
- [ ] adversarial injection suite passes (FD-09)
- [ ] challenge cap enforced and every attempt logged

---

## Phase 6 — Session Aggregator + Final Report + Replay (Days 22–24)

### Mission
Close the loop from six independent `StageOutput`s to one coherent, replayable, deletable session record — including solving the real tension between "Kafka is our immutable event log" and "a user has the right to delete their data."

### Component Hierarchy
Builds 6, 4.5 (final report agent), 5.1, 9.3.

### Tech Stack & Knowledge
| Area | What you need to know |
|---|---|
| Kafka Streams aggregation | session windows or a keyed state store accumulating `StageOutput`s per `sessionId` until `session.complete` fires |
| Prompt caching | how Claude's prompt caching reduces cost/latency on the large (20k+ token) final-report call reusing shared context across retries |
| R2DBC | reactive Postgres access matching the WebFlux non-blocking style used elsewhere |
| Envelope encryption | per-session data key encrypting the replay payload, itself wrapped by a master key in a secrets manager — the mechanism behind crypto-shredding |

### Design Patterns Applied
- **Aggregator (Enterprise Integration Pattern)** — the session-document aggregator is a textbook Aggregator: correlates multiple messages (`StageOutput` ×6) by a correlation ID (`sessionId`) into one composite (`SessionDocument`), released on a completion condition (`session.complete`).
- **Event Sourcing Replay + Snapshot** — replay works naively first (fold all ops from offset 0); once proven, add periodic snapshots (e.g., every 500 ops) as an optimization so replay/scrubbing doesn't always start at zero — introduce the Snapshot pattern only after you've felt the naive version's replay latency, per the earn-it philosophy.
- **Repository** — `FinalReport` and `SessionDocument` persistence behind a repository interface, independent of whether the backing store is Postgres or something else later.
- **Envelope Encryption** — each session's replayable payload is encrypted with a per-session data key; the data key is wrapped by a master key and stored outside Kafka (Postgres/Secrets Manager). "Delete my data" = delete the data key record. Kafka's log stays physically intact (ordering/replay machinery untouched) but is permanently unreadable for that session — solving Section 24.10's tension directly instead of contradicting the event-sourcing design.

### Build Order
1. Implement the Kafka Streams aggregator: keyed state store per `sessionId`, accumulating `StageOutput`s, releasing a `SessionDocument` on `session.complete`.
2. Implement the final report agent: build the large-context prompt (Section 15's structure), use prompt caching for the shared system/context portion, call Claude, schema-validate the `FinalReport` output.
3. Implement Postgres persistence (R2DBC) behind a Repository for `SessionDocument`/`FinalReport`.
4. Implement naive replay: consume from offset 0, fold ops, stream reconstructed states over SSE to the client scrubber.
5. Add snapshotting once naive replay's latency is measured and felt (don't pre-optimize).
6. Implement envelope encryption: generate a per-session data key at session start, encrypt op payloads before they're persisted for replay purposes, store/wrap the key outside Kafka.
7. Implement the deletion flow: delete the data key, confirm replay of that session now fails to decrypt while every other session is unaffected.

### End-to-End Deliverable
`E2E-01` (full six-stage session → final report with all stage scores, gaps, study plan, next-problem rec) and `E2E-03` (replay determinism: reconstructed final state hash equals the live final state hash).

### Verification Plan
- `E2E-01`, `E2E-03`.
- Deletion test: encrypt a session, delete its data key, assert replay fails to decrypt for that session only — a second, untouched session replays normally.
- Aggregator correctness: feed `StageOutput`s out of order, assert the aggregator still releases a complete `SessionDocument` only once all six have arrived.

### Standout Factor
Solving GDPR-style deletion against an immutable Kafka log via crypto-shredding, rather than either ignoring the problem or contradicting your own event-sourcing design, is a senior-level answer most candidates have never even been asked to think through, let alone implemented and tested.

### Exit Checklist
- [ ] aggregator releases exactly one `SessionDocument` per session, order-independent
- [ ] final report schema-validated, includes all `FinalReport` fields from Section 20
- [ ] replay hash-matches live state (E2E-03)
- [ ] deletion proven: one session's data unrecoverable, others unaffected

---

## Phase 7 — Go Mirror + Full Observability (Days 25–26)

### Mission
Transliterate the Java realtime protocol into Go against the same Kafka/Redis contracts — do not redesign it, that would defeat the point of a controlled comparison — then instrument both services identically and produce the empirical Java-vs-Go story with your own numbers.

### Component Hierarchy
Builds 2.2 (all of it), 8 (all of it).

### Tech Stack & Knowledge
| Area | What you need to know |
|---|---|
| Go concurrency | goroutines, buffered channels, `select`/`default` for non-blocking drop, `sync.Map`, `errgroup`, `atomic` counters |
| sarama | consumer group internals, partition assignment, one goroutine per partition |
| OTel semantic conventions | consistent span/attribute naming so Java and Go traces are comparable in Tempo |
| PromQL | writing the queries behind each Grafana panel, not just clicking a UI |
| Grafana provisioning | dashboards as versioned JSON, not manually clicked together |

### Design Patterns Applied
- **Worker Pool** — a fixed pool of goroutines drains a buffered channel of incoming ops, mirroring Java's `flatMap(concurrency=32)` semantics explicitly rather than accidentally.
- **Fan-Out/Fan-In** — the Go broadcast registry (`sync.Map[wsId, []chan CanvasOp]`) fans a resolved op out to all local WS sessions; `errgroup` fans in shutdown signals cleanly.
- **Context Propagation** — Go's `context.Context` carries `trace_id` and deadlines through the whole pipeline, the direct analog of Reactor's context in the Java service — this is what makes one trace_id queryable across both languages in Tempo.
- **Sidecar** — the OTel Collector runs as a sidecar/daemonset receiving OTLP from both services and routing to Prometheus/Tempo/Loki.

### Build Order
1. Implement the Go WS handler + JWT validation, matching the Java handshake contract exactly.
2. Implement the sarama consumer group against the same `canvas.ops.broadcast` topic.
3. Implement the fan-out registry with the worker pool and drop-on-backpressure policy (mirroring FD-05's fix, this time in Go's idiom).
4. Instrument both services with OTel (Java agent — zero code change; Go SDK — explicit).
5. Stand up the OTel Collector, Prometheus, Tempo, Loki.
6. Build the 5 Grafana dashboards from Section 18, provisioned as JSON, not hand-clicked.
7. Run the k6 load test scenario (Section 18) against both services back to back.
8. Run `FD-13`: spike to 25k connections, capture the Java-GC-spike-vs-Go-flatline panel — this screenshot is the interview money-shot.

### End-to-End Deliverable
A single Grafana dashboard showing Java and Go side by side under identical k6 load — p50/p99/p99.9 broadcast latency, GC pause correlation, memory RSS — with `FD-13`'s spike test annotated on the timeline.

### Verification Plan
- `FD-13` executed against both services, results captured (not estimated from the reference doc's numbers — your own numbers, from your own cluster).
- One full trace followed end-to-end in Tempo by `trace_id`, from WS receive through Kafka through broadcast — screenshot as proof the propagation actually works.
- Dashboard JSON checked into the repo (provisioned, reproducible, not a one-off manual dashboard).

### Standout Factor
The quantified Java-vs-Go comparison, with numbers you personally produced on your own cluster under your own load test, is a fundamentally stronger artifact than reciting the reference doc's example numbers — be able to explain a surprise in your own data if there is one.

### Exit Checklist
- [ ] Go service passes the same drills Java passed in Phase 2 (FD-01 through FD-05 re-run against Go)
- [ ] one trace_id followed end-to-end across both services in Tempo
- [ ] all 5 dashboards live with real data
- [ ] FD-13 executed, GC-vs-flatline panel captured

---

## Phase 8 — DevOps: Containerize → Cloud-Native (Days 27–29)

### Mission
Get from Docker Compose to a real cloud deployment with GitOps, autoscaling, and a provable rollback story — at MVP depth. Multi-region, preview environments, and infracost gating are explicitly deferred (Appendix C) so the core CI→CD→autoscale→rollback loop is solid rather than broad-and-shallow.

### Component Hierarchy
Builds 7 (all of it).

### Tech Stack & Knowledge
| Area | What you need to know |
|---|---|
| Terraform | module composition, state management, `plan`/`apply`/`destroy` reproducibility |
| EKS | node groups, IRSA (OIDC federation for pod-level IAM), cluster networking basics |
| MSK / ElastiCache / RDS via Terraform | the AWS-managed equivalents of your local Kafka/Redis/Postgres |
| Helm | templating, values files per environment |
| GitHub Actions | path-based change detection (matrix build only what changed), Trivy/OWASP scanning gates |
| ArgoCD | the `Application` CRD, sync policies, PostSync hooks |
| KEDA | `ScaledObject` CRDs, at least one real trigger wired end to end |

### Design Patterns Applied
- **GitOps** — desired cluster state lives in git (Helm values); ArgoCD continuously reconciles the cluster to match, never a manual `kubectl apply`.
- **Immutable Infrastructure** — new image tag → new pod set → old pods drained, never patched in place.
- **Sidecar / Ambassador** — Vault sidecar injecting secrets as in-memory files, never environment variables.
- **Module Composition (DRY IaC)** — Terraform modules for networking/EKS/MSK/ElastiCache/RDS are parameterized once, instantiated per environment (dev/prod) rather than duplicated.

### Build Order
1. Multi-stage Dockerfiles for all four services (Java, Go, AI reviewer, aggregator) plus the frontend static build.
2. Terraform modules: networking (VPC/subnets), EKS, MSK, ElastiCache, RDS, Secrets Manager — minimal viable sizing, single environment first.
3. Helm chart covering all services; `values-dev.yaml`.
4. GitHub Actions: path-filtered `detect-changes` job, matrix test-and-build per changed service, Trivy scan gate.
5. ArgoCD `Application` watching the Helm chart repo; wire the imageTag-update-triggers-sync flow from Section 16.
6. PostSync smoke test hook: open a WS connection, send a canvas op, verify broadcast within 200ms, fail sync if not.
7. KEDA: wire at least the WebSocket-connection-count scaler for the realtime service end to end (the other two triggers — Kafka lag, queue depth — are stretch if time allows in this window).
8. IRSA: verify zero static credentials anywhere in the cluster by grepping deployed secrets.

### End-to-End Deliverable
`E2E-07`: `git push` → CI → ECR → ArgoCD sync → PostSync smoke test green. Then push a deliberately broken image and confirm ArgoCD auto-rolls-back. Plus `FD-14`: trigger a rolling deploy while k6 drives live WS load, and confirm zero lost ops via Phase 2's resync protocol plus the PodDisruptionBudget holding minimum replicas.

### Verification Plan
- `terraform destroy && terraform apply` reproducibility check — the infra must be fully recreatable from code.
- IRSA verification: no static credential found in any cluster secret.
- KEDA scale event observed live (pod count increasing under connection load, screenshot).
- `E2E-07`, `FD-14`.

### Standout Factor
`FD-14` ties together three separate subsystems built in three different phases — the PDB from this phase, the resync protocol from Phase 2, and ArgoCD's rollout mechanics — into one demonstrated capability: "I deployed a breaking change to a live real-time system with rolling pods and zero data loss." That sentence, backed by a drill you actually ran, is a complete production-engineering story end to end.

### Exit Checklist
- [ ] full `git push → running on EKS` loop proven (E2E-07)
- [ ] auto-rollback proven with a deliberately broken image
- [ ] FD-14 executed: rolling deploy under live load, zero ops lost
- [ ] IRSA verified, zero static credentials found

---

## Phase 9 — Load Testing, Chaos Drills, Demo Capture (Day 30)

### Mission
Close out the remaining drills, assemble a fully green ledger, and rehearse the explanations — the difference between having built this and being able to defend it in an interview.

### Build Order
1. Run remaining drills not yet covered: `FD-16` (Redis shard failover during presence load), `FD-17` (Kafka partition rebalance under op load, confirm lag recovery <30s).
2. Confirm `ledger.md` is fully green — every unit, all seven gates, every cell linked to a real artifact.
3. Record a 2–3 minute demo clip per phase (10 clips total) per `development_system.md`'s demo discipline — these concatenate into a full product walkthrough.
4. Write closed-book, 90-second `EXPLAIN` entries (no notes, no code open) for the five hardest concepts in the project:
   - The OT merge conflict-resolution design (Phase 2)
   - Why the eval harness exists and how the CI gate works (Phase 3)
   - The three concrete anti-bias mechanisms in arbitration (Phase 5)
   - Crypto-shredding for deletion against an immutable log (Phase 6)
   - The Java-vs-Go verdict, in your own numbers (Phase 7)
5. Do a final read of Appendix C below — know exactly what you'd cut if you had to ship two days earlier.

### End-to-End Deliverable
`ledger.md` fully green; 10 recorded demo clips; 5 rehearsed closed-book explanations that don't require looking at code or docs.

### Exit Checklist
- [ ] FD-16, FD-17 run and recorded
- [ ] every ledger row complete
- [ ] 10 demo clips recorded
- [ ] 5 explanations rehearsed cold, no notes

---

## Appendix A — Design Pattern Index (cross-referenced)

| Pattern | Phase | Where | Why this, not the obvious alternative |
|---|---|---|---|
| Contract-First / ISP | 0 | Pydantic models + JSON Schemas | Avoids the far more common mistake: hand-wiring message shapes per service and discovering drift mid-project |
| Ports & Adapters | 0, 1, 7 | domain types vs transport | Lets Go (Phase 7) plug into the same domain model without touching Java's internals |
| Strategy | 1, 3, 4 | ShapeUtil, grading strategy, reviewer persona | Swappable behavior without conditional branching at every call site |
| Factory Method | 1 | component bank drop handler | Centralizes "what type am I constructing" in one place |
| Value Object | 1 | node properties | Immutability gives undo/redo correctness for free via tldraw's own stack |
| Anti-Corruption Layer | 1, 5 | tldraw store → ComponentGraph | One seam absorbs tldraw's internal format changes; reviewer/checklist never see raw tldraw records |
| Idempotent Receiver | 2 | SETNX dedup | Client retries can never manifest as duplicate business events |
| Event Sourcing | 2, 6 | canvas.ops as source of truth | Replay (Phase 6) and audit become structural properties, not bolted-on features |
| CQRS | 2 | write via Kafka, read via RocksDB | Resync (interactive query) never contends with the write path |
| State Machine | 2 | WS connection lifecycle | Reconnect/resync becomes a defined transition, not ad hoc booleans |
| Bulkhead | 2 | workspaceId partitioning | One workspace's op storm can't starve another's fairness |
| Publish-Subscribe | 2 | Redis broadcast fanout | Decouples "op resolved" from "which instance owns which WS session" |
| Template Method | 3, 4 | eval runner, harness `BaseAgent` | Shared pipeline, varying only the per-case/per-persona step |
| Chain of Responsibility | 4 | estimation reviewer (math → LLM) | Each handler can short-circuit; LLM never sees pre-invalidated input |
| Decorator | 4 | `BaseAgent.call_llm` wrapping | Rate-limit/trace/model-tier concerns composed via Python's own `@decorator` syntax, not copy-pasted into every reviewer |
| Mediator | 5 | arbitration agent | AI verdict and user justification never interact except through the arbitrator |
| Specification | 5 | checklist checkpoints | Same matching logic shared by the 30s live-check and the full on-demand review |
| Command | 5 | challenge submission | Enables replay/audit; directly supports per-challenge logging |
| Aggregator (EIP) | 6 | session-document aggregator | Textbook correlation-by-ID with a release condition |
| Snapshot (Event Sourcing) | 6 | replay optimization | Added only after naive replay's latency was actually felt, not pre-optimized |
| Envelope Encryption | 6 | crypto-shredding | Solves deletion against an immutable log without rewriting the log |
| Worker Pool | 7 | Go op processing | Explicit analog of Java's flatMap(concurrency=32) |
| Fan-Out/Fan-In | 7 | Go broadcast registry | Same shape as Java's Sinks.many, different idiom |
| Context Propagation | 7 | Go trace_id/deadlines | Makes one trace_id queryable across both language stacks |
| GitOps | 8 | ArgoCD | Cluster state always derivable from git, never drifted by a manual kubectl |
| Immutable Infrastructure | 8 | rolling deploys | New image → new pods, never patch-in-place |

---

## Appendix B — Full Tech Stack Inventory

```
Frontend:      React 18, Vite, TypeScript, @tldraw/tldraw, SSE/WS clients
Realtime:      Java 21 (Virtual Threads, ZGC), Spring Boot 3.3, Spring WebFlux,
               Reactor, STOMP/SockJS, R2DBC   |   Go, gorilla/websocket, sarama,
               go-redis, zerolog, errgroup
Streaming:     Apache Kafka (KRaft), Kafka Streams (Processor API), RocksDB,
               Avro + Schema Registry (stretch)
Cache/Coord:   Redis 7 (cluster mode), Lua (EVAL scripts)
AI:            Python 3.12+, FastAPI, aiokafka, Pydantic, Claude API (Messages,
               streaming, tool-use structured output), pytest-asyncio + httpx,
               Whisper (stretch, voice transcription)
Persistence:   Postgres 16 (R2DBC), S3
DevOps:        Docker, Docker Compose, Terraform, Helm, GitHub Actions, ArgoCD,
               KEDA, Trivy, OWASP Dependency-Check
Observability: OpenTelemetry (Java agent + Go SDK), Prometheus, Grafana, Tempo, Loki
Load testing:  k6
```

---

## Appendix C — Fallback Plan If Behind Schedule

Cut from the bottom up. Never cut Phases 0–6 — they are the product. Cut order if the month runs short:

```
1st cut (cheapest, least loss to the core story):
  - Preview environments per PR, infracost gating, 5th Grafana dashboard,
    multi-region talking points (these were always framed as stretch/
    talking-points in sytem_design.md Section 22, never core deliverables)

2nd cut:
  - Phase 7 (Go mirror + full observability) — compress to: Go service
    exists and passes FD-01/02/03 only, one shared dashboard instead of
    five, skip the full k6 spike ceremony. The comparison narrative still
    stands, just with less quantified depth.

3rd cut:
  - Phase 8 depth — ship on a single EKS cluster with a hand-applied Helm
    chart and manual `kubectl apply` instead of full ArgoCD GitOps; keep
    CI (build/test/push) and containerization, drop the GitOps automation
    and KEDA. State this tradeoff explicitly rather than pretending it's
    there.

Never cut:
  - Phase 2 (real-time sync backbone) — this is the architecture's spine
  - Phase 3 (eval harness) — without it, Phase 4/5's agents are unverifiable
  - Phase 5 (challenge/arbitration + injection defense) — the product's
    actual differentiator and the strongest agentic-engineering artifact
  - Phase 6's crypto-shredding — cheap to build, disproportionately strong
    as a talking point relative to its cost
```

If truly squeezed, ship Phases 0–6 excellently and be honest in interviews that Phases 7–8 are "in progress, here's the plan" — a real, working core with a credible extension plan beats a shallow version of everything.

---

*FlowSync 30-Day Build Roadmap — end of document*
