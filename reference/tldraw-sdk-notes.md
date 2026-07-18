# tldraw SDK research notes

This is a research reference, not a spec. It cross-checks the tldraw API calls `sytem_design.md` and `build_roadmap.md` assume against the current tldraw SDK docs (tldraw.dev/docs, fetched 2026-07-18), so CP01 (Section 21) can be implemented against real method names instead of guessed ones. It does not modify `sytem_design.md` — read it alongside Section 8, 19, 20, and 21 before starting Phase 1 of `build_roadmap.md`.

## API mapping: spec call-site → current tldraw API

| Spec reference | Current tldraw API | Status | Notes |
|---|---|---|---|
| `ShapeUtil` subclass (`sytem_design.md` Section 8/19, `build_roadmap.md` line 189) | `class MyShapeUtil extends ShapeUtil<T>` with `getDefaultProps()`, `getGeometry()`, `component()`, `getIndicatorPath()`, `onResize()`/`onRotate()` | **Confirmed** | Matches spec's expected lifecycle almost exactly. Spec's roadmap says `indicator` as a generic hook name; current API's selection-outline method is `getIndicatorPath()` returning a `Path2D`, not a JSX `indicator()` render — a naming detail to use verbatim during implementation, not a design change. |
| `store.listen()` outbound (Section 10, 19) | `store.listen(callback, { source: 'user' })` | **Confirmed** | Still the documented pattern for capturing local changes to ship over your own transport. |
| `store.mergeRemoteChanges()` inbound (Section 10, 19) | `store.mergeRemoteChanges(() => { ...apply remote changes... })` | **Confirmed** | Explicitly documented as the way to apply server-resolved changes without echoing them back through your own `store.listen()`. |
| `editor.setHintingShapes()` (Section 14) | `editor.setHintingShapes(shapeIds)` | **Confirmed** | Present in the current `Editor` API reference. |
| `instance_presence` records (Section 11, 19) | `InstancePresenceRecordType` records, listened to via `store.listen(cb, { source: 'user', scope: 'presence' })` | **Confirmed** | Listen for presence separately from document changes — matches Section 11's design of keeping presence off the document-change/Kafka path. |
| `editor.getCurrentPageShapes()` (Section 8, Adapter) | `editor.getCurrentPageShapes()` / `getCurrentPageShapesSorted()` | **Confirmed** | Unchanged. |
| `editor.toSvg()` (Section 8 line 560, Section 19 line 1865, Section 21/CP01 line 2070, `todo.md` line 36) | `editor.getSvgString(shapes, opts)` / `getSvgElement(shapes, opts)` for SVG; `editor.toImage(shapes, opts)` / `toImageDataUrl(shapes, opts)` for PNG | **Renamed — needs update** | `toSvg()` does not exist in the current `Editor` API reference (checked against v5.2.5 docs). See Discrepancies below. |

## Discrepancies found

### 1. `editor.toSvg()` no longer exists

The spec's snapshot pipeline (Section 8) calls `editor.toSvg()` to produce the PNG half of the reviewer's dual representation. The current tldraw `Editor` API has no `toSvg()` method — it was split into `getSvgString()`/`getSvgElement()` (SVG output) and `toImage()`/`toImageDataUrl()` (raster output, including PNG). Since Section 8's snapshot is explicitly a **PNG**, the correct current call is `editor.toImage(shapes, opts)` or `toImageDataUrl(shapes, opts)`, not the SVG methods.

Every spec/roadmap location that references `editor.toSvg()` and will need the corrected method name when implemented:
- `sytem_design.md` line 560 — snapshot pipeline (`editor.toSvg()` → PNG snapshot)
- `sytem_design.md` line 1865 — tldraw integration summary ("Snapshot: `editor.toSvg()` → PNG for reviewer")
- `sytem_design.md` line 2070 — CP01 deliverable ("Export as PNG via `editor.toSvg()`")
- `todo.md` line 36 — Phase 1 exit outcome ("`editor.toSvg()` wired for the PNG snapshot half...")
- `build_roadmap.md` line 189 — tech-stack call-out table, lists `editor.toSvg()` alongside `getCurrentPageShapes()` as a known SDK API to use

None of these are blocking today (repo is pre-code), but CP01 as literally written would fail on this call the moment someone types it.

### 2. Node-type count mismatch inside `sytem_design.md` itself

Section 8 (line 475) defines **7** `ShapeUtil` node types: `ServiceNode`, `DatabaseNode`, `QueueNode`, `LoadBalancerNode`, `CacheNode`, `CDNNode`, `APIGatewayNode`.

But two other places in the same document only list 5, silently dropping `CDNNode` and `APIGatewayNode`:
- Section 19's tldraw integration summary, line 1859: "Custom shapes: ShapeUtil per node type (5 types)"
- Section 21's CP01 task list, lines 2064–65: enumerates only `ServiceNode`, `DatabaseNode`, `QueueNode`, `LoadBalancerNode`, `CacheNode`

`build_roadmap.md`'s Phase 1 exit checklist and `todo.md`'s Phase 1 checklist both correctly say "all 7 `ShapeUtil` node types... matching Section 8's node-type table" — so Section 19 and CP01 (Section 21) in `sytem_design.md` are the outliers, not the other two documents. Worth catching now since CP01 is the first checkpoint anyone will actually execute, and as written it would under-scope Phase 1 by two shape types relative to Section 8 and the roadmap's own exit criteria.

## Sync architecture: why not `@tldraw/sync`

tldraw ships an official realtime sync solution — `@tldraw/sync` / `@tldraw/sync-core`, built around a server-authoritative `TLSocketRoom` per document, self-hostable via a Cloudflare Durable Objects + R2 template or any custom JS backend. It's a real, production-grade alternative to hand-rolling sync, and the docs explicitly support wiring `store.listen()`/`mergeRemoteChanges()` into a fully custom backend instead of using it.

**Recommendation: don't adopt `@tldraw/sync` for FlowSync.** The realtime backbone `sytem_design.md` designs — Kafka `canvas.ops` keyed by `workspaceId` for strict per-workspace ordering, a Kafka Streams OT merge processor backed by RocksDB, Redis pub/sub fan-out, a Spring WebFlux server run side-by-side with a Go benchmarking twin (Section 17) — is Phase 2/3 of `build_roadmap.md`. `CLAUDE.md` explicitly calls out the real-time sync backbone as one of only two phases that must never be cut under time pressure, and `development_system.md`'s "earn your infrastructure" ladder treats building this pipeline from scratch as the point of the exercise, not incidental plumbing to route around. Swapping in `@tldraw/sync` would replace the exact system the project exists to practice building.

The correct integration point is exactly what Section 19 already specifies: use tldraw's lower-level `store.listen()` / `store.mergeRemoteChanges()` primitives as the client-side hooks into the custom Kafka/Redis backend — not tldraw's own transport.

## Backend integration flow: client tldraw store ↔ Java/Go realtime backend

This walks the exact call sequence for Section 10's op flow using verified current APIs, and flags one real gap in Section 20's wire format.

**Outbound (local edit → backend), per Section 10:**
1. `store.listen(callback, { source: 'user', scope: 'document' })` fires on every local change. The callback receives a `RecordsDiff<R>`: `added: Record<id, R>`, `updated: Record<id, [from: R, to: R]>` (tuples, not plain records), `removed: Record<id, R>` — confirmed against the current `Store` API reference.
2. Filter to records where `typeName === 'shape'` (the diff includes non-shape records too — bindings, page state, etc. — which Section 8's Adapter isn't scoped to handle).
3. The Adapter narrows each full `TLShape` record down to Section 20's `TLShapeRecord` wire shape (`id`, `type`, `x`, `y`, `props`), taking the `to` side of `updated` tuples.
4. Wrap into a `CanvasOp` (Section 20): `workspaceId`, `userId`, client-generated `opId` (the Redis `SETNX` dedup key, Section 13 Pattern 4), `clientSeq`, `vectorClock`, `changes`.
5. Send as a WS STOMP frame to the Spring WebFlux server (CP02).

**Backend (Section 10, 12, 13):** JWT-authenticated WS handshake → Redis `SETNX op:{opId} 1 NX EX 86400` dedup → Kafka produce to `canvas.ops` keyed by `workspaceId` (EOS producer) → Kafka Streams OT merge processor (RocksDB state) resolves the op and assigns `serverSeq` → publish to `canvas.ops.broadcast` → Redis pub/sub fan-out across server instances → WS broadcast to every session in the workspace except the sender.

**Inbound (backend → client):**
1. Client receives the resolved `CanvasOp` (now carrying `serverSeq`).
2. **Gap**: Section 20's `TLShapeRecord` (`id`, `type`, `x`, `y`, `props`) is explicitly called "minimal" (line 1908), but a real tldraw shape record requires 12 base fields — confirmed against the current `TLBaseShape` reference: `id`, `typeName: 'shape'`, `type`, `x`, `y`, `rotation`, `index` (fractional-index string controlling z-order), `parentId`, `isLocked`, `opacity`, `props`, `meta`. The wire format carries none of `rotation`, `index`, `parentId`, `isLocked`, `opacity`, `meta`. Section 20 doesn't specify how the client reconstructs a full record from the narrow wire shape, and this isn't automatic — it's an implementation decision CP02/CP03 needs to make explicitly, e.g.: for `updated`, merge wire fields onto the existing local record (looked up by `id`) rather than replacing it wholesale; for `added`, the *sender's* Adapter should probably carry `index`/`parentId` through on the wire too (both change on every drag-reorder and drop-into-frame), rather than have receivers invent them. Worth resolving during CP02's SPEC gate, not discovered mid-BUILD.
3. Apply via `store.mergeRemoteChanges(() => { store.put([...reconstructedRecords]); store.remove([...removedIds]) })` — confirmed current; this is what suppresses the local `store.listen()` from re-echoing the change back to the server.

**Presence (Section 11 — deliberately not on this path):** local cursor/selection changes go through a separate `store.listen(cb, { source: 'user', scope: 'presence' })`, throttled ~50ms, sent as a lightweight WS message straight to Redis `PUBLISH` — no Kafka, no OT processor, no dedup. `InstancePresenceRecordType` records apply the same way (`store.put`/`mergeRemoteChanges`) but travel a shorter, lossier path by design.

## Docs map (for future reference, not a full mirror)

- `/docs/shapes` — custom `ShapeUtil` types, prop schemas via `RecordProps`/`T` validators
- `/docs/editor` — `Editor` API surface; reactive/signals-based getters (`getCurrentPageShapes()` etc. auto-update, no manual subscription needed for React rendering)
- `/docs/persistence` — `getSnapshot()`/`loadSnapshot()`, `createTLStore()`, store listen/transaction basics
- `/docs/collaboration` — building a fully custom sync backend: local changes via `store.listen({ source: 'user' })`, remote changes via `mergeRemoteChanges()`, presence via separate `{ scope: 'presence' }` listener
- `/docs/sync` — tldraw's own hosted/self-hosted sync library (`@tldraw/sync-core`, `TLSocketRoom`) — reference only; not used by FlowSync, see rationale above
- Reference: `https://tldraw.dev/reference/editor/Editor` — authoritative current method list; check here before assuming any spec-referenced method name still exists
