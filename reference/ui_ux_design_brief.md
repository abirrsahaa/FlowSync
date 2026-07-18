# FlowSync — UI/UX Design Brief

> Hand this entire document to the AI (or design tool) responsible for the visual/interaction design. It is self-contained — assume the reader has never seen FlowSync before. Do not skip the "Process" section: it exists because a prior attempt at this UI was generic and got rejected.

---

## 0. Your mandate

Design the **state-of-the-art UI/UX for FlowSync** — not a functional wireframe, not a "clean SaaS dashboard," but an interface that makes the claim "**this redefines how people practice system design**" feel true the moment someone opens it.

The bar is: if you showed this to someone who has used Linear, Arc, Raycast, Vercel's dashboard, Warp, or Framer, they should react to FlowSync the same way — "this doesn't look like a tool built by a backend team," not "this looks like a bootstrapped CRUD app with a chat panel bolted on."

The single biggest risk is defaulting to **generic AI-SaaS visual language**: purple-to-blue gradients, a rounded-card dashboard grid, a floating chat bubble, sparkle icons next to the word "AI." That aesthetic is now the most common look in the world and reads as *derivative*, which is the opposite of what this product needs. FlowSync's differentiation is real and structural (below) — the UI's job is to make that structure *visible and felt*, not to decorate it.

---

## 1. What FlowSync actually is (read this before designing anything)

FlowSync is a **staged, AI-reviewed system design interview practice platform**. The core insight driving the whole product:

> System design interview prep has no feedback loop. LeetCode has test cases for algorithms. Candidates preparing for system design watch YouTube videos and draw on paper with no idea whether the design is actually good. **FlowSync is the test case for system design.**

A session walks the user through **six sequential stages**, mirroring the structure of a real interview, each with its own UI and its own AI reviewer persona:

1. **Requirements Gathering** — functional / non-functional / optional requirements, freeform-but-structured input, reviewed by a conversational AI for completeness and measurability ("highly available" gets flagged; "99.9% uptime" doesn't).
2. **Capacity Estimation** — structured numeric form (DAU, QPS, storage, bandwidth, memory/server). Reviewed by a **math validator first** (catches impossible numbers computationally) and only then an LLM for qualitative judgment. This two-layer review is a distinctive, designable moment — the UI should visibly show "checked by math" before "checked by AI opinion."
3. **API Design** — endpoint/schema/auth editor, reviewed for idempotency, pagination, versioning, error codes.
4. **Data Model** — ERD-style schema + index + partitioning design, reviewed for N+1 risk, hot partitions, consistency model.
5. **HLD Canvas (the core stage)** — an infinite tldraw canvas with a **left-panel component bank** of seven typed node kinds (Service, Database, Queue, Load Balancer, Cache, CDN, API Gateway) and seven typed edge kinds (sync call, async publish/consume, DB read/write, cache read/write). A **right-panel live checklist** updates as the user draws. The user clicks "Validate my HLD" and a reviewer agent streams back findings token-by-token, each one causing the exact canvas node it's about to a **glow/highlight** the instant that finding resolves. This is the product's signature interaction — see §3.
6. **Deep Dive** — same canvas, zoomed into one component, reviewed by a different low-level-design-focused persona (indexing, retries, circuit breakers, pagination, failure modes).

After all six stages: a **final report** — score per stage, overall verdict, timestamped strengths/gaps, a study plan, and a recommended next problem targeting the user's weakest area.

**Every stage gate is advisory, never a hard blocker.** Score ≥7 = OPEN (green), 4–6 = SOFT (yellow warning), <4 = FLAGGED (red note in the report) — but the user can *always* click through. This is a deliberate product decision: a real interview doesn't stop and restart because you forgot the CDN, it marks it and moves on. **A gate that visually reads as "blocked" or "you failed, try again" is a bug against this design** — treat gate states as *information*, styled with the confidence of a flight-status indicator, never as a locked door or a red X modal.

### The mechanic that makes this interesting, not clinical: the Challenge

The AI reviewer's verdict is not final. The user can **challenge** it — write a justification for their choice — and a separate **arbitration agent** rules using the user's own Stage 2 capacity numbers as injected ground truth (a single DB is fine at 10k QPS even if the reviewer flagged it, because industry practice puts the replica threshold at ~50k QPS). The arbitration agent is bound by a mandatory-citation rule: it can never just say "the AI was right." This is a real *argument the user can win*, with a structured verdict on who was correct on which specific point. Design this as a genuine confrontation moment — not a "dispute ticket" form. This, more than anything else, is what separates FlowSync from "an AI grades your homework": the user gets to argue with the grader and the grader has to show its work.

### Who's using this

Mid-to-senior software engineers prepping for FAANG/big-tech-caliber system design interviews, doing this **20–30 times over 4–6 weeks**. They are time-pressured, already fluent in the technical vocabulary (don't over-explain domain terms in copy), currently stuck using paper/whiteboard/YouTube, and secretly a little bored and anxious about prep. The product should feel less like enterprise software and more like **a serious training instrument** — closer in spirit to a flight simulator or a chess analysis engine than to a project-management SaaS tool.

---

## 2. The creative brief: what "redefines system design" should actually mean here

Don't interpret "make it interesting" as "add animations to a dashboard." Interpret it as: **the interface should make system design feel like the high-stakes, satisfying, structured discipline it actually is** — the same way a good IDE makes code feel tractable, or the way chess.com's analysis board makes a chess game feel legible and dramatic after the fact.

Concretely, look for opportunities in:

- **The verdict reveal.** Six stages of building tension toward a score is a genuine emotional beat — treat it with the same design weight product teams give a "level complete" or "PR merged" moment. Not confetti-emoji AI-SaaS energy — more like the quiet confidence of a terminal test suite going green, or a chess engine's evaluation bar swinging.
- **The canvas as command center.** Stage 5 is the core stage and should feel like the most premium surface in the product — this is the moment competitors (Miro, Excalidraw, generic whiteboards) have nothing structurally equivalent to. The typed component bank, the live-updating checklist, and the node-glow-on-finding mechanic are unique to FlowSync; the visual design should make a first-time user go "oh, this isn't a whiteboard" within the first five seconds.
- **The challenge as a duel.** Two structured arguments — the AI's findings vs. the user's justification — resolved by a third, citation-bound arbiter. Lean into this as an actual confrontation UI, not a "leave a comment" box.
- **Progress across sessions as a legible skill trajectory**, not a generic analytics dashboard. Twenty sessions in, the user should be able to look at one screen and feel *concretely* better than they were three weeks ago — score trend, which weak areas closed, which are still open.
- **The two-layer estimation review** (math check, then LLM opinion) — a rare moment where the product can visibly show "this isn't just an LLM guessing," which is a trust signal worth designing for explicitly.

### Reference bar (state of the art in 2026 product design)

Look to: **Linear** (restraint, information density without clutter, keyboard-first feel), **Arc / Dia browser** (confident use of space, non-default chrome), **Vercel dashboard** (dark-mode-native, monospace data, deploy-log energy), **Warp terminal** (terminal-as-premium-surface), **Raycast** (command-palette speed, minimal chrome), **Framer** (motion used to explain state changes, not decorate), **chess.com's analysis board / game review** (structured verdict + eval line, closest emotional analog to the challenge/verdict mechanic), **Figma's multiplayer cursors and comment threads** (the bar for the secondary multiplayer mode), **Excalidraw** and **Eraser.io** (canvas-specific references — see §2.1, these two are not interchangeable and both matter for different layers of Stage 5).

Avoid: generic gradient-mesh AI landing pages, sparkle/wand iconography, floating rounded chat bubbles, stock illustration people, anything that could be a Bootstrap admin template with a dark mode toggle.

Typography, color, and motion are yours to propose — this brief intentionally does not hand you a locked design system, because the previous attempt's problem was not a missing token file, it was a lack of a distinct point of view.

### 2.1 The canvas has two layers, and they should look like two different products' worth of craft

This is a specific, non-negotiable instruction for Stage 5 (and 6): **preserve Excalidraw's interaction feel for the canvas itself, and inject Eraser.io-level visual craft for the typed system-design components.** These are not competing directions — they apply to two different things sitting on the same surface.

**Excalidraw layer — the canvas's base feel.** tldraw (what FlowSync's canvas is actually built on) shares direct lineage with Excalidraw, so this is a natural fit, not a stretch. Preserve: the low-friction, nothing-between-you-and-the-idea feel of an infinite canvas — minimal floating toolbar, instant pan/zoom, fast keyboard shortcuts for tool switching, a light touch of hand-drawn warmth (Excalidraw's signature rough.js-style sketchy rendering) available for **freeform annotation** — arrows, sticky notes, margin scribbles, circling something to make a point mid-explanation. This is what keeps the canvas feeling like *thinking on a whiteboard* rather than *filling out a form that happens to be spatial*. Collaborative cursors (secondary multiplayer mode) should carry the same lightweight, name-tagged, slightly playful energy Excalidraw and Figma both use.

**Eraser.io layer — the seven typed component shapes.** Where Excalidraw is intentionally loose, Eraser.io is exactly the opposite, and that's what the *typed* nodes need: clean, precise, technical vector iconography per node type — not a hand-drawn rectangle with a label inside it. Each of the seven node types (`ServiceNode`, `DatabaseNode`, `QueueNode`, `LoadBalancerNode`, `CacheNode`, `CDNNode`, `APIGatewayNode`) should read instantly and unambiguously via a distinct icon + color language, the way Eraser.io's component library makes a database look unmistakably like a database and a queue unmistakably like a queue, at any zoom level. Typed edges should get the same treatment: smart/orthogonal auto-routing, clean arrowheads that encode direction and type (sync vs. async, read vs. write) at a glance, alignment and snapping guides when placing components — the polish of an actual architecture diagram, not a loose sketch connecting two shapes.

**The line between them is also a real technical boundary, not just a style choice.** The Adapter that turns the tldraw store into the `ComponentGraph` JSON (Section 8/16 of the spec — "why component bank eliminates hallucination") only understands the seven typed `ShapeUtil`s. If freehand Excalidraw-style scribbles are allowed on the canvas — and they should be, for annotation — the design must make it visually unambiguous which marks are typed components (feeding the AI reviewer's structured understanding) and which are loose ink (annotation only, invisible to the Adapter and the reviewer). Don't let a hand-drawn arrow or a sticky note look like it could be mistaken for a typed edge or node — that ambiguity would quietly reintroduce the hallucination risk the typed component bank exists to eliminate. A clear visual register shift between "this is structure" and "this is a margin note" is itself a design requirement.

---

## 3. Non-negotiable interaction contracts (design *around* these, not against them)

These are architectural facts from the system spec, not stylistic suggestions. Any design must accommodate them exactly:

- **Stage 5's three-panel layout is fixed in concept** (component bank ↔ canvas ↔ checklist), but panel treatment, collapse behavior, and visual weighting are yours to design. The canvas is tldraw-based — assume real infinite-canvas physics (pan/zoom/select), not a static image.
- **Seven node types, seven edge types**, each with typed properties (e.g. a `CacheNode` has technology, eviction policy, TTL, cluster mode). Nodes are dragged from the bank onto the canvas; a properties panel edits the selected node's typed fields live. Design the node visual language so all seven types are instantly distinguishable at a glance and at multiple zoom levels — this is a taxonomy problem as much as a visual one. See §2.1: this is where Eraser.io-level component craft applies, on top of an Excalidraw-feeling canvas underneath.
- **Freehand/annotation marks must stay visually distinct from typed shapes.** Only the seven `ShapeUtil`s are read by the Adapter that produces the `ComponentGraph` the AI reviewer reasons against (Section 8's "why component bank eliminates hallucination"). Any freeform drawing affordance is annotation-only and must never be visually confusable with a typed node or edge.
- **The checklist is nested and stateful**: each checkpoint is required/optional and present/absent/partial, and updates live as the user draws (client pushes the component graph every 30s, not on every edit). Checklist items resolve into whichever node caused them to pass — that link should be visually traceable, not just implied.
- **Review streams token-by-token** (SSE for text stages, the same mechanism conceptually for HLD). For Stage 5 specifically, each resolved finding fires a **node highlight** on the canvas (`editor.setHintingShapes`) at the same moment its explanation text lands in the review panel — design this as one synchronized event, not two separate things that happen to be near each other in time.
- **Challenge flow**: AI verdict → user writes justification → arbitration agent returns a structured comparative verdict (`userCorrectOn: [...]`, citing specific numbers from the user's own Stage 2 estimation) → the stage gate updates. All of this needs UI: the original verdict, the compose-a-challenge moment, a "waiting for arbitration" state, and the final structured ruling shown side-by-side against the original.
- **Gate indicators**: green/yellow/red per stage, visible in a persistent stage-progress rail throughout the session (so the user always knows where they stand across all six stages, not just the current one) — never a modal that blocks navigation.
- **Two reviewer layers on Stage 2**: a deterministic math-validation pass runs before the LLM ever sees the numbers. Surface this distinction — it's a credibility feature, not an implementation detail to hide.
- **Multiplayer (secondary, design but don't over-invest)**: a second user can join as "Interviewer" with a private panel and live cursors on the shared canvas (Figma-style presence), voice via WebRTC. Both roles get separate post-session reports.
- **Final report**: per-stage scores, an overall verdict, timestamped strengths and gaps (each tagged HIGH/MEDIUM/LOW), a study plan, and a recommended next problem with a stated reason. Session replay exists (the full canvas + review timeline can be scrubbed back through) — worth a lightweight design pass, not a full feature.
- **Problem selection**: problems have difficulty, concepts (e.g. `cdn`, `streaming`, `distributed-storage`), a scale constraint, and a per-problem checklist. Users pick from a library, not a blank start.

---

## 4. Concrete content to design against (use this, not lorem ipsum)

Use the **"Design YouTube"** problem as the running example in every mockup — real numbers make the estimation and checklist screens legible in a way placeholder text can't:

```
Title: Design YouTube · Difficulty: Hard
Prompt: Design a video-sharing platform where users can upload, process,
and stream video to a global audience. Support search over video
metadata, view counts, and comments.
Constraints: 100M DAU · global regions · <200ms video start time
Expected scale: 500,000 read QPS · 5,000 write QPS · 500,000 GB/day storage
Concepts: cdn, streaming, distributed-storage, async-processing, search
```

Checklist (nested, mix of required/optional — use this exact structure for the Stage 5 checklist panel mock):

```
✓ Handle high read traffic (required)
    ✓ CDN for video delivery (required)
    ✓ Cache layer for metadata (required)
    ○ Read replicas on DB (optional)
✗ Async video processing (required)
    ✓ Upload to object storage first (required)
    ✗ Message queue triggers transcoding (required)
    ○ Multiple resolution outputs / adaptive bitrate (optional)
◐ Global distribution (required, partial)
    ✓ Multi-region origin or edge caching (required)
    ✗ Latency-aware routing / GeoDNS (optional)
✗ Search over metadata (optional)
✓ Write path for views/comments (required)
```

Example HLD reviewer finding, for mocking the node-glow moment and the challenge flow:

```
Finding: "Single Postgres primary is a SPOF for the metadata store —
consider a read replica." · Severity: MEDIUM · targets node: [Postgres DB]

User challenge: "At my estimated 5,000 write QPS a single primary with
good indexing is operationally simpler; replicas add replication-lag
complexity I don't need yet."

Arbitration verdict: userCorrectOn: ["At 5k QPS, single-primary is
operationally valid — industry practice recommends replicas above
~50k QPS, per your own Stage 2 estimate."]
```

Example final report shape, for the report/dashboard mock:

```
Overall: 7.2/10
Stage scores: Requirements 6 · Estimation 8 · API 7 · Data Model 6 ·
HLD 7 · Deep Dive 8
Strengths: "14:32 — correctly identified read-heavy workload and
proposed caching before DB schema." / "28:15 — proactively mentioned
async processing for video uploads without prompting."
Gaps: HIGH — "No global distribution strategy despite 'worldwide
users' in requirements." · MEDIUM — "Indexing strategy not discussed
for search query patterns." · LOW — "Never calculated bandwidth
estimate."
Study plan: CDN & global distribution · DB indexing for read-heavy
workloads · back-of-envelope estimation practice
Next problem: Design Instagram — "tests CDN and global distribution,
your highest gap area"
```

---

## 5. Required process — do this in order, don't skip to final screens

A previous pass at this UI went straight to full execution on a single visual direction and it didn't land. Don't repeat that. Work in three explicit phases and **check in with the user at the end of each phase before continuing**:

**Phase A — Direction.** Propose **2–3 genuinely distinct art directions** (not palette swaps of the same layout). For each, give it a name, a one-paragraph point of view, and enough detail (color, type, a key motion idea, how the canvas and the verdict-reveal moment would feel) that they're distinguishable in the abstract before any pixels exist. Example axes to differentiate on: a "mission control / flight instrument" direction (dense, dark, monospace-forward, everything reads as live telemetry) vs. an "architect's studio" direction (blueprint-inspired, warmer, drafting-table metaphor, precision-over-density) vs. a "competitive analysis engine" direction (chess.com-adjacent, eval-bar language, built around the duel framing of the challenge mechanic). These are illustrative, not prescriptive — propose your own if you find a sharper angle.

**Phase B — One flow, high fidelity.** Once a direction is picked, build out **one complete flow in full fidelity** — problem selection → Stage 1 → Stage 2 (showing the math-then-LLM two-layer review) → Stage 5 in full (all three panels, a live checklist update, a streaming finding causing a node glow, a challenge in progress) → final report. This is the checkpoint where the direction gets validated against real interaction complexity, before it's spent across all six stages.

**Phase C — Full system.** Only after B is approved: the remaining stages (3, 4, 6), the stage-progress rail, gate states in all three colors, the multiplayer/interviewer view, session replay, the problem library, and a design-token/component spec (color, type scale, spacing, elevation, the seven node-type visual language, motion timing/easing) so the direction is implementable consistently by engineering, not just present in the mockups you hand back.

---

## 6. Deliverable format

- Phase A: written direction descriptions plus enough visual detail (mood-board level — key screens sketched at low fidelity, or described precisely enough to picture) to choose between them. Don't fully build all three.
- Phase B/C: high-fidelity screens (static is fine, but call out motion/transition behavior in notes — e.g. "finding resolves → 200ms glow-in on the target node, easing X, synchronized with the last token of its explanation landing in the review panel").
- Cover both **dark and light mode** if the chosen direction supports both, or make an explicit, justified call to be dark-mode-only (legitimate for a "premium instrument" direction, but state it as a decision, not an oversight).
- Show **empty, loading/streaming, and error states** for at least the Stage 5 review flow and the challenge flow — these are core to the product's identity (the streaming reveal *is* the product), not edge cases to skip.
- If producing code (React + Tailwind or similar) rather than static mockups, treat the tldraw canvas panel as a real interactive surface, not a screenshot — component bank drag-to-place and node selection should actually work in the prototype.

---

## 7. Explicit anti-goals

- Do not ship a "clean modern dashboard" that could be relabeled and sold as a project-management tool.
- Do not make the stage gate colors read as pass/fail grading — they're advisory telemetry, not a report card.
- Do not treat the challenge mechanic as a support-ticket form.
- Do not make Stages 1–4 feel like a generic multi-step form wizard with a progress bar — each has a distinct reviewer persona and a distinct kind of judgment happening (completeness, math validity, REST conventions, schema soundness); the UI should differentiate them, not template them identically.
- Do not bury the two-layer (math-then-LLM) estimation review as an implementation detail invisible to the user — it's a trust feature.
- Do not let the canvas read as an *undifferentiated* generic whiteboard where typed components look like anything a user could have scribbled themselves — the point of §2.1's Excalidraw/Eraser.io split is that the canvas keeps Excalidraw's inviting, low-friction feel while the typed component bank and live checklist visibly outclass a plain whiteboard in precision. Undesigned = generic Miro clone. Correctly designed = an Excalidraw-smooth surface with Eraser.io-grade components on it. Aim for the latter, not a retreat to "just don't look like Excalidraw."
