# FlowSync Frontend — Build Sessions

This breaks the UI-only frontend build into independent Claude Code sessions so you're not doing the whole thing in one sitting. Each session below is self-contained: open a fresh terminal session in this repo, paste the **kickoff prompt**, let it work, then verify with the listed checks before moving to the next one. Sessions are ordered — each depends on the ones before it.

Full context for *why* these decisions were made lives in:
- `sytem_design.md` (the spec — data contracts, Section 8 node/edge taxonomy, Section 20 types, Section 25.2 auth)
- `reference/ui_ux_design_brief.md` (the visual direction brief)
- `ui-reference/ui_improvements.md` (known gaps in the mockups to fix while building)
- `ui-reference/*.png` (the actual mockups)

None of that needs to be re-pasted into each prompt — Claude Code will read it from the repo. The prompts below just point at the right sections and restate the scoping decisions already made, so each session doesn't have to re-derive them.

**Scope reminder for every session**: pure frontend, no backend/Kafka/WS/Redis integration, no tldraw `ShapeUtil`/`Adapter`/OT business logic. Mock data only, behind interfaces (`services/interfaces/*`) so a real backend can be swapped in later without touching components. React + TypeScript + Tailwind + shadcn-style components (Radix, already installed) + Framer Motion. Gate colors (OPEN green / SOFT amber / FLAGGED red) are always advisory status dots, never a blocker or pass/fail badge.

---

## ✅ Session 1 — Project scaffold (done)

Vite + React 19 + TypeScript, Tailwind, Radix primitives, Framer Motion, `@tldraw/tldraw`, `react-router-dom`, `recharts`, `zustand`, `@fontsource` fonts all installed in `frontend/`. Path alias `@/*` → `frontend/src/*`. Design-token CSS variables for both themes (`app-*` light, `console-*` dark, `gate-*` states) are in `src/index.css` and wired into `tailwind.config.js`. `npm run build` and `npm run dev` both verified working. `src/App.tsx` is currently just a placeholder — Session 3 replaces it with the real router.

---

## Session 2 — Domain types + mock service layer

**Goal**: the interface-first foundation everything else depends on.

**Kickoff prompt**:
> Read `sytem_design.md` Section 20 (the `SessionDocument`/`StageOutput`/`ComponentGraph`/`Finding`/`ReviewerVerdict`/`ChallengeOutcome`/`FinalReport`/`Problem` TypeScript interfaces) and Section 25.4 (the "Design YouTube" seed problem + checklist). In `frontend/src/`, create:
> - `domain/{problem,session,canvas,review,report,user}.ts` — pure TypeScript types mirroring those interfaces exactly (reconcile the `ComponentGraph` node/edge lowercase literal unions with Section 8's `ServiceNode`/`SYNC_CALL`-style names — see the "Node/edge taxonomy" note in the approved plan, keep the wire-format literals lowercase as Section 20 defines them, but add a `NODE_TYPE_CONFIG` style label mapping later in Session 3).
> - `services/interfaces/{AuthService,ProblemsService,SessionService,ReviewStreamService}.ts` — interfaces only.
> - `services/mock/fixtures/` — seed exactly the Design YouTube `Problem` + checklist JSON from Section 25.4, plus 3-4 more problem cards (Instagram, WhatsApp Clone, TinyURL) matching what's visible in `ui-reference/Screenshot 2026-07-18 at 10.09.35 PM.png`, plus the SPOF/read-replica finding + challenge + arbitration example and the final-report example from `reference/ui_ux_design_brief.md` Section 4.
> - `services/mock/{mockAuthService,mockProblemsService,mockSessionService,mockReviewStreamService}.ts` implementing the interfaces against the fixtures. `mockReviewStreamService` should simulate token-by-token streaming plus finding-arrival events via an async generator + `setTimeout`, not return everything at once.
> - `services/ServiceProvider.tsx` — a React context exposing the active (mock) implementations.
> - `store/sessionProgressStore.ts` — a small zustand store tracking which stages are submitted and their gate state for the current mock session.
>
> No UI components yet. Verify with `npx tsc -b --noEmit` and a throwaway console.log test that a mock service call resolves.

**Definition of done**: `tsc -b --noEmit` clean, mock services return the exact Design YouTube data from the spec.

---

## Session 3 — Shared UI kit + app shells + router

**Goal**: the chrome every screen hangs off of.

**Kickoff prompt**:
> Session 2's domain types and mock services exist in `frontend/src/domain` and `frontend/src/services`. Now build the shared UI layer:
> - `components/ui/` — restyle shadcn-pattern primitives (button, card, badge, tabs, dialog, tooltip, input, textarea, select, avatar, progress, separator, scroll-area, checkbox, radio-group, popover, dropdown-menu — Radix packages are already installed) to match the "precision instrument" look in `ui-reference/Screenshot 2026-07-18 at 10.09.35/10.10.15 PM.png`: sharp-ish corners, thin borders, monospace uppercase labels with letter-spacing, not shadcn's default rounded/soft look. Use the `app-*` / `console-*` / `gate-*` Tailwind tokens from `tailwind.config.js`, never hardcoded hex.
> - `components/common/` — `StatusDot` (gate state pill/dot, 3 colors, never pass/fail styling), `ScoreRing` (animated circular progress, see the report mockup), `MonoLabel`, `StreamingText` (renders text token-by-token from a stream), `AnimatedNumber` (count-up), `NodeTypeBadge`.
> - `components/layout/AppShell.tsx` — the light-theme shell (FlowSync wordmark, matches `ui-reference/Screenshot 2026-07-18 at 10.09.35 PM.png`'s top nav, NOT the "Architect's Studio" branding — see `ui-reference/ui_improvements.md` §1 for why there must be exactly one shell).
> - `components/layout/StageTopNav.tsx` — the 6 named-stage tab bar + persistent gate-state progress rail + Submit Solution button, reading from `sessionProgressStore`. Tabs must always be clickable regardless of gate state.
> - `components/layout/MarketingShell.tsx` — the dark console theme wrapper (apply the `.theme-console` class) for landing/auth.
> - `components/layout/PresenceBar.tsx` — static avatar stack + "Live: N Architects" text, driven by mock data, no real websocket.
> - `App.tsx` / `router.tsx` — wire up `react-router-dom` with placeholder routes for every screen in the plan (landing, auth, dashboard, 6 stage routes, hld-canvas, deep-dive, challenge, report, replay) each rendering a bare "Coming in Session N" stub inside the correct shell, so navigation between shells is provable before the real screens exist.
>
> Verify visually with `npm run dev` — click through every stub route, confirm the light/dark shells look distinct and correct, confirm nav never blocks.

**Definition of done**: every route resolves, correct shell per route, no console errors, `tsc -b --noEmit` clean.

---

## Session 4 — Landing + Auth screens

**Kickoff prompt**:
> Build the two dark-theme screens inside `features/landing/` and `features/auth/`, using `MarketingShell` from Session 3.
> - Landing: rewrite the copy per `ui-reference/ui_improvements.md` §0's finding — the current mockup (`ui-reference/Screenshot 2026-07-18 at 10.25.13 PM.png`) markets cloud infrastructure telemetry, not FlowSync. Keep the dark "mission control" visual language (monospace data, live-log energy, dot-grid background) but the hero must pitch the six-stage AI-reviewed interview flow and the "FlowSync is the test case for system design" insight from `reference/ui_ux_design_brief.md` §1. Include a how-it-works section (six stages), a problem-library preview (reuse Session 2's fixtures), and a clear sign-in CTA routed to `/auth`.
> - Auth: single "Continue with Google" screen per the approved decision — one card, dark theme, matches the visual system of `ui-reference/Screenshot 2026-07-18 at 10.25.54 PM.png` but with only ONE action (no password fields, no separate signup flow — see `sytem_design.md` §25.2, Google OAuth only). Clicking it should call the mock `AuthService` and route to `/dashboard`.
>
> Verify with `npm run dev`, clicking landing → auth → dashboard-stub.

---

## Session 5 — Dashboard / Problem Library

**Kickoff prompt**:
> Build `features/dashboard/` per `ui-reference/Screenshot 2026-07-18 at 10.09.35 PM.png`, inside `AppShell`: stats bar (designation, avg precision score, concepts mastered, streak), a Skill Proficiency radar chart using `recharts` (CDN/Storage/Database/Caching axes as shown), Problem Library cards driven by Session 2's `ProblemsService` fixtures (Design YouTube marked COMPLETED, others with difficulty/concept tags and a start action routing into the stage flow), and a Historical Logs list. Drop the decorative fake GPS-coordinate flavor text `ui-reference/ui_improvements.md` §4 flags as filler — replace with something that maps to real fields (session id, problem version) or cut it.
>
> Verify with `npm run dev`: dashboard renders with real mock data, "Start Blueprint"/"Review Submission" actions route correctly.

---

## Session 6 — Stages 1–4 (Requirements, Estimation, API Design, Data Model)

**Kickoff prompt**:
> Read `sytem_design.md` Section 5 (stage-by-stage input/reviewer description) and `reference/ui_ux_design_brief.md` §1 items 1-4 and the anti-goal about not templating all four stages identically. Build all four inside `StageTopNav`/`AppShell`:
> - `features/stages/requirements/` — functional/non-functional/optional requirement cards, matching `ui-reference/Screenshot 2026-07-18 at 10.10.15 PM.png` including the inline "Ambiguity Detected" diff-style suggestion card (Apply Fix / Ignore buttons) in the review-stream sidebar.
> - `features/stages/estimation/` — structured numeric form (DAU, read/write QPS, storage, bandwidth, memory/server) that VISIBLY shows the two-layer review: a "MATH: VERIFIED" badge appearing before/separately from LLM qualitative commentary — this is a trust signal per the design brief, don't hide it.
> - `features/stages/api-design/` — endpoint/schema/auth editor.
> - `features/stages/data-model/` — ERD-style table/index/partitioning editor.
>
> All four share a `useReviewStream` hook (in `hooks/`) wrapping Session 2's `mockReviewStreamService`, driving the review sidebar through its 5 states: idle, streaming text, finding-arrived, final, error/fallback. Submitting a stage updates `sessionProgressStore`'s gate state for that stage (never blocking navigation to other tabs).
>
> Verify with `npm run dev`: fill and submit each stage, watch the review sidebar actually stream, confirm gate dots update in the top nav.

---

## Session 7 — Stage 5 HLD Canvas + Stage 6 Deep Dive

**Goal**: the core/signature screen. Higher effort than the others.

**Kickoff prompt**:
> Read `sytem_design.md` Section 8 in full (three-panel layout, 7 node types + 7 edge types, checklist structure, snapshot pipeline) and `reference/ui_ux_design_brief.md` §2.1 (Excalidraw-feel canvas + Eraser.io-grade typed components) and §3's non-negotiable contracts. Also read `reference/canvas-component-design.md` and `reference/tldraw-sdk-notes.md` for current API names.
>
> Scope decision already made: mount the REAL `@tldraw/tldraw` `<Tldraw />` component as the canvas surface (real pan/zoom/draw/select), but do NOT build the custom `ShapeUtil` classes, the `ComponentGraph` Adapter, or any sync/business logic yet — those are explicitly deferred. Build in `features/stages/hld-canvas/`:
> - `ComponentBankPanel` — left panel, the 7 canonical node types (`ServiceNode`, `DatabaseNode`, `QueueNode`, `LoadBalancerNode`, `CacheNode`, `CDNNode`, `APIGatewayNode`) per Section 8's table, NOT the granular mockup list — collapse DNS/Worker/Cron Job/Web Server/App Server into `ServiceNode` presets and Relational/NoSQL/Graph into `DatabaseNode` presets (`ui-reference/ui_improvements.md` §1). Dragging a bank item onto the mounted `<Tldraw/>` canvas places a plain default/text shape for now — real typed shapes are future work.
> - `ChecklistPanel` — right panel, two-level tree (checkpoint → nested checkpoints), required/optional, present/absent/partial glyphs, seeded from Session 2's Design-YouTube checklist fixture.
> - `ReviewStreamPanel` ("Architecture Audit") — same 5-state streaming pattern as Session 6, plus the finding popover overlay on a node (mock/hardcoded target, since there's no real Adapter yet) matching `ui-reference/Screenshot 2026-07-18 at 10.14.10 PM.png`'s "CRITICAL ISSUE" card.
> - No Live Telemetry gauges panel (cut per the approved decision — not backed by any spec'd data pipeline).
> - Footer: `PresenceBar` from Session 3 ("Live: N Architects").
> - `features/stages/deep-dive/` reuses this shell with zoomed-in framing copy and an LLD-focused checklist (indexing, retries, circuit breakers, pagination, failure modes per Section 5's Stage 6 description).
>
> Verify with `npm run dev`: confirm the tldraw canvas genuinely pans/zooms/draws, confirm dragging a bank item places something on the canvas, confirm the checklist and review panel render and stream correctly.

---

## Session 8 — Challenge / Arbitration Duel screen

**Kickoff prompt**:
> Read `sytem_design.md` Section 9 in full (the challenge flow, the three anti-bias mechanisms) and `reference/ui_ux_design_brief.md` §1 "The mechanic that makes this interesting" and §2's "Challenge as a duel" and the anti-goal against a support-ticket-form treatment. Build `features/challenge/`:
> - Shows the original AI finding/verdict.
> - A justification textarea for the user's argument.
> - An "arbitrating…" transitional state (Framer Motion).
> - The final structured ruling laid out as a genuine two-sided comparison: `userCorrectOn[]` vs `aiCorrectOn[]`, each citing a specific number — use the exact SPOF/read-replica example from `reference/ui_ux_design_brief.md` §4 ("At 5,000 write QPS a single primary... industry practice recommends replicas above ~50k QPS, per your own Stage 2 estimate"). Show the adjusted score and that it updates the stage's gate state.
>
> Wire the "Challenge" action from Session 6/7's review panels to route here. Verify with `npm run dev`: trigger a challenge from a stage review panel, submit a justification, see the arbitrating state, see the final duel-style verdict render.

---

## Session 9 — Final Report + Session Replay

**Kickoff prompt**:
> Read `sytem_design.md` Section 20's `FinalReport` interface and `reference/ui_ux_design_brief.md` §4's exact example report content (7.2 overall, per-stage scores, gaps HIGH/MEDIUM/LOW, next problem = Design Instagram). Build:
> - `features/report/` — animated `ScoreRing` reveal (Framer Motion — treat this as the "verdict reveal" emotional beat the design brief calls out, not a generic dashboard number), verdict text, 6-stage station metrics cards with gate dots, strengths/gaps two-column list, study plan cards, next-challenge CTA — matches `ui-reference/Screenshot 2026-07-18 at 10.10.32/10.10.43 PM.png`.
> - `features/replay/` — a lightweight scrubber over the stage timeline (this is explicitly a stub-level feature per the design brief, not a full player — a slider + timestamped event list is enough).
>
> Verify with `npm run dev`: complete the full flow from dashboard through all 6 stages to the final report, confirm the report renders the mock `FinalReport` fixture correctly, confirm the replay scrubber is present and navigable.

---

## Session 10 — End-to-end verification pass

**Kickoff prompt**:
> Do a full pass over the FlowSync frontend in `frontend/`: `npm run dev` and click through the entire flow end to end (landing → auth → dashboard → start "Design YouTube" → all 6 stages → submit → challenge a finding → final report → replay). Confirm gate states never block navigation anywhere. Confirm the Stage 5 canvas genuinely pans/zooms/draws. Run `npx tsc -b --noEmit` and `npm run lint` (oxlint) and fix anything they flag. Resize the browser to tablet and mobile widths and check the three-panel canvas layout and dashboard grid don't break. Report anything that doesn't match the mockups or the plan in `sytem_design.md`/`reference/ui_ux_design_brief.md`.

---

## After each session

- Review the diff (`git status` / `git diff`).
- Commit with a message describing what that session built.
- Start the next session fresh — don't try to chain sessions in one context window.
