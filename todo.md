# FlowSync — Phase 1 Checklist

> Source of truth is `readiness_checklist.md`, `build_roadmap.md`, and `development_system.md` — this file is just an ordered, checkable extraction of them. Update it as you go; don't let it drift from the real docs.

## 1. Day 0 pre-flight (blocking, before any code)

- [ ] Docker Desktop daemon running (`docker info` succeeds) — CLI is installed but daemon isn't
- [ ] `git init` run in the repo root, before writing anything else
- [ ] Docker Desktop resources checked (≥6–8GB RAM / 4 CPUs) ahead of Phase 2 — doesn't block now
- [ ] Maven confirmed as build tool (already resolved — no action needed)

Needed this week, not blocking Day 1:
- [ ] JDK 21 pinned for this project (`brew install openjdk@21`, set `JAVA_HOME` locally — don't touch global `java`)
- [ ] Google OAuth Client ID/Secret registered in Google Cloud Console (approval can lag — start early)
- [ ] `ANTHROPIC_API_KEY` obtained and billing/usage limits confirmed
- [ ] `k6` installed (`brew install k6`)

## 2. Phase 0 exit outcomes (Days 1–2, Foundations & Contracts)

- [ ] Every domain type from Section 20 (`CanvasOp`, `StageOutput`, `SessionDocument`, `ComponentGraph`, `Finding`, `ReviewerVerdict`, `ChallengeOutcome`) exists as a JSON Schema, each with one passing and one deliberately-failing fixture
- [ ] The same contracts exist as Pydantic twins in `services/ai-reviewer/app/contracts.py`; FastAPI's `/docs` renders all of them
- [ ] `contracts/kafka-topics.yaml` defines every topic (name, key, partitions, retention) per Section 6/7
- [ ] `docker-compose.yml` boots Kafka (KRaft), Redis, Postgres, Kafdrop — full stack up in <60s
- [ ] Four service directories scaffolded with health-endpoint-only stubs; `curl .../health` returns 200 on each
- [ ] `ledger.md` seeded with one row per unit in the Master Component Hierarchy (Section 1)

**Genuine-outcome bar:** no business logic exists yet, and that's correct — the only proof needed is contract fixtures passing/failing and the compose stack healthchecking green. If you find yourself writing feature code before this is true, stop — this is the "contracts before code" discipline the roadmap calls out as the differentiator.

## 3. Phase 1 exit outcomes (Days 3–5, Canvas Core)

> Visual reference for this section: [Phase 1 Drawing Sheet](https://claude.ai/code/artifact/746bf2d7-4b5c-4861-9235-384818b8fed5) — UI wireframe, node/edge taxonomy, user flow, and gate ledger. Also see `reference/tldraw-sdk-notes.md` (verified current tldraw API names) and `reference/canvas-component-design.md` (edge-typing and grouping design, validated against the Section 25.4 YouTube seed problem).

**Scope — builds exactly Master Component Hierarchy units 1.3.1, 1.3.2, 1.3.4.** Explicitly NOT this phase: 1.3.3 (AI checklist panel, Phase 5), 1.3.5 (challenge UI, Phase 5), 1.5 (presence/cursors, Phase 2), any networking, auth, or AI review.

**Mission** (`build_roadmap.md` Phase 1): prove the typed component bank is real before anything talks to the network — everything downstream (hallucination grounding in the AI reviewer, checklist matching) depends on the canvas producing structured, typed data, not free-form drawing.

### Build checklist

- [ ] All 7 `ShapeUtil` node types implemented (`ServiceNode`, `DatabaseNode`, `QueueNode`, `LoadBalancerNode`, `CacheNode`, `CDNNode`, `APIGatewayNode`) with typed, validated props matching Section 8's node-type table — **confirmed 7, not 5**: Section 19 and CP01 (Section 21) of `sytem_design.md` both undercount this to 5, omitting `CDNNode`/`APIGatewayNode`; `build_roadmap.md`'s Phase 1 and `development_system.md`'s CP01 overlay both independently say 7. Build 7.
- [ ] All 7 typed edge kinds implemented via an edge-type selector (`SYNC_CALL`, `ASYNC_PUBLISH`, `ASYNC_CONSUME`, `DB_READ`, `DB_WRITE`, `CACHE_READ`, `CACHE_WRITE`) — see `reference/canvas-component-design.md` for a recommended implementation (typed `edgeType` prop on an overridden `ArrowShapeUtil`, not spec-mandated)
- [ ] Component bank panel: drag-and-drop places the correct shape via a Factory Method (no `if type == X` branching at the call site)
- [ ] Properties panel reads `editor.getSelectedShapes()` and edits props live
- [ ] The Adapter module: tldraw store → `ComponentGraph` JSON, validated against Phase 0's JSON Schema — the anti-corruption layer; the only place that changes if tldraw's internal format changes
- [ ] `editor.toImage()` (or `toImageDataUrl()`) wired for the PNG snapshot half of the dual-representation pipeline — **not** `editor.toSvg()`, which doesn't exist in current tldraw (renamed/split into `getSvgString()`/`getSvgElement()` for SVG and `toImage()`/`toImageDataUrl()` for raster; five places across the docs still say `toSvg()`, see `reference/tldraw-sdk-notes.md`)
- [ ] A scripted (not manual-click) E2E test: places one of every node type, connects them with typed edges reproducing Section 8's example (API Gateway → Service → DB/Cache), exports a PNG, extracts the `ComponentGraph`, validates against the schema — zero manual steps

### Design patterns this phase applies (`build_roadmap.md` Phase 1)

Strategy (7 `ShapeUtil` classes, polymorphically swapped) · Factory Method (drop handler resolves type tag → shape instance) · Value Object (immutable, validated props — gives undo/redo for free via tldraw's own stack) · Adapter/Anti-Corruption Layer (tldraw store → `ComponentGraph`; the one seam that absorbs tldraw format changes).

### Verification plan

- **Unit**: each `ShapeUtil`'s prop validator rejects a malformed prop set.
- **Integration**: the Adapter round-trips tldraw store → `ComponentGraph` → reconstructed shapes, asserting no data loss.
- **E2E**: the scripted deliverable above, runnable by a stranger for pass/fail — not a click-through demo.

### Gate loop (`development_system.md` §3/§8) — per unit 1.3.1 / 1.3.2 / 1.3.4, tracked in `ledger.md`

- [ ] **DERIVE** (closed-book, before reading Section 8): "Why a typed component bank instead of free-form drawing?" — answer must reach *hallucination grounding*. Write it in `derivations/` before opening the spec.
- [ ] **SPEC**: capability contract per unit, including failure behavior (what happens on a malformed prop set, an unrecognized node type).
- [ ] **BUILD**: the code.
- [ ] **PROVE** (CP01 overlay, `development_system.md` §8): script loads the canvas, places all 7 node types, exports PNG + graph JSON, validates the graph against Phase 0's schema.
- [ ] **BREAK**: run and record — malformed shape props, an unrecognized node type, and a zero-node canvas, all through the Adapter.
- [ ] **MEASURE**: no Grafana exists yet (that's Phase 7) and this phase isn't on the "earn your infrastructure" ladder (`development_system.md` §2) — a recorded local number (e.g. Adapter round-trip time on the 7-node fixture) is a reasonable reading of "gates can be cheap," not a spec-mandated dashboard.
- [ ] **EXPLAIN**: closed-book, 90 seconds, no notes.

## 4. What "genuine done" means after Phase 1 (the real bar, beyond checkboxes)

- [ ] **It's not done because it runs on your machine.** The PROVE gate requires a runnable script a stranger could execute and get pass/fail from — the E2E script above *is* that proof, not a demo you click through once.
- [ ] **Ledger gates, not vibes.** Each unit under 1.3.1/1.3.2/1.3.4 in the Master Component Hierarchy is only DONE when all seven `ledger.md` cells (DERIVE → SPEC → BUILD → PROVE → BREAK → MEASURE → EXPLAIN) link to a real artifact — not just BUILD. PROVE and EXPLAIN are not optional: the scripted E2E, plus a closed-book 90-second explanation you could give without looking at the code.
- [ ] **BREAK still applies even to "just a canvas."** Try malformed shape props, an unrecognized node type, and a zero-node canvas through the Adapter — record what actually happens.
- [ ] **The one-sentence test.** You should be able to say, unprompted: "the AI reviewer never guesses what a shape is — it gets exact typed structure, so hallucination is architecturally impossible, not just prompted away." If you can't say why the Adapter exists without checking the doc, Phase 1 isn't actually finished, whatever the UI looks like.
- [ ] **Don't let Phase 1 quietly expand.** Phase 1 builds exactly nodes 1.3.1, 1.3.2, 1.3.4 — component bank, canvas surface/ShapeUtils, snapshot builder. Presence/cursors (1.5), the checklist panel (1.3.3), and the challenge UI (1.3.5) belong to later phases (2 and 5).
