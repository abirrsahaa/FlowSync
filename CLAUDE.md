# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository state

This repository currently contains **only planning/reference documents** — there is no implementation yet. No source code, build files, package manifests, or tests exist. There are no build, lint, or test commands to run because there is nothing to build. Four documents, each with a distinct role:

- `sytem_design.md` — **the spec.** The complete technical answer key: architecture, message shapes, data models, Section 21's checkpoint list (CP01–CP10), Section 24's principal-architect refinements (eval harness, structured output, injection defense, crypto-shredding, etc.), and Section 25's previously-missing contracts (REST API surface, Google OAuth login flow, Postgres DDL, and a complete "Design YouTube" seed problem — all needed before Phase 0 can actually be code-complete). The AI reviewer layer (Section 14/19) is Python/FastAPI, Kafka-consumer-driven — there is no gRPC anywhere in this system.
- `development_system.md` — **the process.** A seven-gate loop per unit of work (DERIVE → SPEC → BUILD → PROVE → BREAK → MEASURE → EXPLAIN) tracked in `ledger.md`, an "earn your infrastructure" ladder (no component is added until its absence has been observed to fail via a numbered drill FD-xx), and closed-book derivations in `derivations/` written *before* reading the relevant spec section.
- `build_roadmap.md` — **the calendar.** Maps the whole system onto a 30-day, 10-phase (Phase 0–9) schedule, with a master component hierarchy, tech-stack/knowledge call-outs, named design patterns with justification, and a scripted end-to-end proof per phase. Appendix C has the fallback-cut order if time runs short — never cut Phases 2, 3, or 5 (real-time sync backbone, eval harness, challenge/arbitration).
- `readiness_checklist.md` — **the pre-flight.** Machine-verified (not assumed) status of local tooling, accounts, and the one real bug found in the spec (Gradle vs Maven inconsistency, now resolved to Maven). Re-run its version/status checks before Day 1 if time has passed — tool state drifts.
- `CLAUDE.md` (this file) — orientation index for the above.

When implementation starts, follow `build_roadmap.md`'s phase order and `development_system.md`'s gate discipline together — don't hand the user a finished design for a unit whose DERIVE gate they haven't done themselves; the closed-book derivation is theirs to write, not something to skip past.

`sytem_design.md` is the complete technical spec for **FlowSync**, a staged multiplayer system-design interview practice platform (React + tldraw frontend, Java Spring WebFlux / Go realtime backends, Kafka, Redis, Python/FastAPI AI reviewer agents, on AWS EKS). Section 21 ("Build Checkpoints") lays out the intended build order as 10 checkpoints (CP01–CP10), from a local-only tldraw canvas through to full DevOps/observability. When asked to start implementing, treat that checkpoint sequence as the plan of record unless the user says otherwise, and check with the user before scaffolding a repo layout that doesn't match Section 16 ("Repository structure").

Treat `sytem_design.md` as the authoritative spec for any implementation work in this repo — read the relevant section before writing code rather than guessing at behavior, since exact message shapes, Redis key patterns, and topic names are all specified there.

## Product concept (why the architecture looks the way it does)

FlowSync walks a user through **six sequential stages** mirroring a real system design interview: Requirements → Estimation → API Design → Data Model → HLD Canvas (core stage) → Deep Dive. Each stage has its own UI and its own AI reviewer persona; after each stage a reviewer scores the work (0–10) and after the full session a final report agent synthesizes all stage outputs into an overall verdict, ranked weak areas, and a study plan.

Two decisions shape everything downstream:

- **Stage gates are never hard blockers.** Gate state (OPEN ≥7 / SOFT 4-6 / FLAGGED <4) is recorded and surfaced in the final report, but the user can always proceed. Any feature that would block forward progress is a bug against this design.
- **The HLD canvas (Stage 5) sends the AI reviewer two representations at once** — a PNG snapshot (`editor.toSvg()`) and a structured component graph (typed nodes/edges from the tldraw store). This is deliberate: it stops the reviewer from hallucinating component names, since it reasons against structure, not pixels (Section 8).

A third mechanic worth knowing before touching the reviewer/arbitration code: users can **challenge** an AI verdict (Section 9). An arbitration agent then rules using the user's own Stage 2 estimation numbers as injected ground truth, with a mandatory-citation rule so it can't default to "AI is right." This anti-bias design is three concrete prompt/context constraints, not a vibe — see Section 9 before modifying reviewer or arbitration prompts.

## Architecture map (see doc sections for detail)

- **Section 6/7 — Full platform HLD / multi-agent backend**: client → API gateway (JWT, rate limit) → realtime server (Java Spring WebFlux, with a Go "mirror" service implementing the identical protocol) → Kafka → Redis → Postgres/S3/Elasticsearch. Six stage-reviewer agents plus arbitration plus final-report — all Python/FastAPI, all Kafka consumers (not an RPC service — see Section 14), streaming tokens via the same Redis pub/sub fanout canvas ops use, all publishing `StageOutput` back onto `stage.reviews`.
- **Section 10 — Canvas op flow**: tldraw local change → WS STOMP frame → Redis `SETNX` dedup → Kafka `canvas.ops` (keyed by `workspaceId` for strict per-workspace ordering) → Kafka Streams OT merge processor (RocksDB-backed) → `canvas.ops.broadcast` → Redis pub/sub fan-out to all server instances → WS broadcast to all sessions except sender. The server is the sole conflict-resolution authority; clients only apply what they're told (`store.mergeRemoteChanges()`).
- **Section 11 — Presence/cursors are intentionally NOT on Kafka.** Cursors go straight through Redis pub/sub (lossy, 50ms server-side throttle); presence uses Redis `ZADD` + heartbeat keys with `EX 15` + keyspace-notification-driven offline detection. Don't route high-frequency ephemeral data through Kafka.
- **Section 13 — Redis is used for six distinct patterns** (pub/sub broadcast, pub/sub cursors, ZADD presence, SETNX idempotency, Lua token-bucket rate limiting, keyspace-notification offline detection) — each with a different consistency/durability tradeoff. Know which pattern you're in before changing Redis usage.
- **Section 14 — AI review streaming**: reviewers are Kafka consumers (`stage.submissions`/`challenges`/`session.complete` via `aiokafka`), not an RPC service — an earlier draft's direct-gRPC-call framing was a real inconsistency with Section 7's diagram and has been resolved in favor of the consumer model. Findings use forced Anthropic tool-use validated against a Pydantic `Finding` schema (not a text-sniffed JSON tag) so `node_id` and its explanation arrive atomically; the client highlights the canvas node (`editor.setHintingShapes`) as each finding resolves. See Section 19's "Agent Harness" for the shared `BaseAgent` pipeline every one of the 8 agents (6 reviewers + arbitration + report) is a thin subclass of.
- **Section 17 — The Go service is a deliberate benchmarking twin of the Java realtime server**, not redundant infrastructure — same responsibilities, run side-by-side under identical k6 load to produce real p99/p99.9/GC comparison numbers for Grafana. Don't "consolidate" it away without understanding this is intentional.
- **Section 20 — `SessionDocument` / `StageOutput` / `ComponentGraph` / `FinalReport` TypeScript interfaces are the contract** between every stage reviewer and the final report agent. Get this data model right before writing reviewer or aggregator code — it's referenced as the thing to define first.
- **Section 16 — planned repo layout**: `services/java-realtime`, `services/go-service`, `services/ai-reviewer`, `services/session-aggregator`, `frontend/` (React + Vite + tldraw), `infra/` (Terraform modules per environment), `helm/`, `k6/`, `.github/workflows/`.

## Key non-obvious constraints to preserve

- Canvas ops are keyed by `workspaceId` in Kafka specifically so all ops for one workspace land on the same partition — this is what gives strict per-workspace ordering. Don't repartition or rekey without preserving that guarantee.
- Kafka producer uses EOS (`enable.idempotence=true`, per-instance `transactional.id`) — without it, crash-and-retry duplicates a canvas op (a node moves twice). The ~5ms latency cost is accepted deliberately for correctness.
- Redis `SETNX op:{opId} 1 NX EX 86400` is the client-retry dedup layer, separate from Kafka EOS — both exist for different failure modes (network retry vs. broker-side retry).
- Rate limiting must use a Lua `EVAL` script, not a GET-then-SET pair — the non-atomic version has a race under concurrent requests (Section 13, Pattern 5).
- The arbitration agent's anti-bias behavior depends on three concrete mechanisms, not prompt tone alone: ground-truth injection of the user's Stage 2 numbers, an explicit "rule for the user if consistent with their stated scale" instruction, and a mandatory-citation requirement on every ruling. All three must be present for the mechanic to work as designed.
