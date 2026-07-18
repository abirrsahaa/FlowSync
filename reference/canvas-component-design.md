# Canvas component design: authoring, linking, grouping

This is a design/research reference, not a spec change. It validates FlowSync's HLD canvas component model (`sytem_design.md` Section 8) against **Design YouTube** — Section 25.4's one official `PUBLISHED` seed fixture — and answers three implementation questions: how custom canvas components are authored, how they're linked, and how a grouping feature should work. Nothing here modifies `sytem_design.md`; two things below (a typed-edge prop, a `ComponentGraph.groups[]` field) are proposals, not canon, and one thing below (an 8th node type) is an open question for your own DERIVE, not a decision made on your behalf.

Read alongside `reference/tldraw-sdk-notes.md`, which has the verified low-level API details (e.g. `editor.toImage()`, not `editor.toSvg()`) this doc builds on top of.

## 1. YouTube mapped onto the existing 7+7 taxonomy

Section 8 defines 7 `ShapeUtil` node types (`ServiceNode`, `DatabaseNode`, `QueueNode`, `LoadBalancerNode`, `CacheNode`, `CDNNode`, `APIGatewayNode`) and 7 typed edges (`SYNC_CALL`, `ASYNC_PUBLISH`, `ASYNC_CONSUME`, `DB_READ`, `DB_WRITE`, `CACHE_READ`, `CACHE_WRITE`). Section 25.4's seed fixture gives YouTube a concrete 5-checkpoint checklist (`cp-1`…`cp-5`) to validate against — not an invented problem, the actual one Phase 1/5 will use.

### Component map

| Node | Type | Purpose |
|---|---|---|
| CDN | `CDNNode` | Video delivery, edge caching (`cp-1-1`, `cp-3-1`) |
| API Gateway | `APIGatewayNode` | Upload/metadata/auth entry point |
| Load Balancer | `LoadBalancerNode` | Routes to backend services |
| Upload Service | `ServiceNode` | Accepts uploads, kicks off processing |
| Transcoding Workers | `ServiceNode` | Consumes transcoding jobs, produces renditions |
| Metadata Service | `ServiceNode` | Video metadata CRUD |
| Search Service | `ServiceNode` | Query over video metadata (`cp-4`) |
| View-Count Aggregator | `ServiceNode` | Consumes view events, aggregates counts |
| Comments Service | `ServiceNode` | Comment CRUD, off the hot path (`cp-5-2`) |
| Metadata Cache | `CacheNode` | Hot video metadata (`cp-1-2`) |
| Video Metadata DB | `DatabaseNode` | Title/description/view-count store, read replicas (`cp-1-3`) |
| Search Index | `DatabaseNode` (`dbType: "elasticsearch"`) | Inverted index over metadata (`cp-4-1`) |
| Comments DB | `DatabaseNode` | Comment storage |
| Transcoding Queue | `QueueNode` | Upload → transcoding trigger (`cp-2-2`) |
| View Events Queue | `QueueNode` | Async, eventually-consistent view counts (`cp-5-1`) |

### Edge map

`Client → Gateway → LB → {Upload, Metadata, Search, Comments} Service` — all `SYNC_CALL`. `Upload Service → Transcoding Queue` (`ASYNC_PUBLISH`) → `Transcoding Queue → Transcoding Workers` (`ASYNC_CONSUME`). `Metadata Service ↔ Metadata Cache` (`CACHE_READ`/`CACHE_WRITE`), `Metadata Service ↔ Video Metadata DB` (`DB_READ`/`DB_WRITE`). `Playback path → View Events Queue` (`ASYNC_PUBLISH`) → `Queue → View-Count Aggregator` (`ASYNC_CONSUME`) → `Aggregator → Video Metadata DB` (`DB_WRITE`). `Search Service → Search Index` (`DB_READ`). `Comments Service ↔ Comments DB` (`DB_READ`/`DB_WRITE`).

Every one of these is an existing node/edge type. No new `ShapeUtil` was needed for ~90% of the diagram — real evidence the taxonomy generalizes.

### The one real gap: object storage

Section 25.4's checklist requires `cp-2-1`, **"Upload to object storage first"**, marked `required: true`. None of the 7 node types cleanly represents S3-style blob storage. `DatabaseNode`'s props (`dbType`, `replicationMode`, `storageEngine`, `indexStrategy`) all assume a queryable database — object storage has no index strategy or query-oriented replication mode, so `dbType: "S3"` is a real semantic stretch, not a clean fit.

This is an open decision, not resolved here:
- **(a)** Reuse `DatabaseNode` with `dbType: "object-store"`, leaving `indexStrategy` blank/N/A.
- **(b)** Add an 8th node type: `ObjectStorageNode { label, provider, storageClass, versioning }`.

Worth resolving during your own DERIVE for whichever checkpoint first needs it — CP01 or Phase 1's ShapeUtil set — rather than defaulting silently to (a).

### Minor observation: not every checklist item is graph-representable

`cp-3-2`, "Latency-aware routing (GeoDNS/anycast)" (optional), isn't a component or a connection — it's infrastructure-level routing behavior. Section 8's live checklist matcher marks checkpoints "present/absent" by analyzing the component graph (line ~519); an item like this can never be detected that way and will always fall through to the on-demand full LLM review. Not a bug, just a reminder that checklist authors (Section 24.5's draft-then-curate pipeline) should expect some checkpoints to only ever be satisfiable by full review, not the lightweight live checker.

### Grouping example (used in §3 below)

- Frame **"Ingestion & Transcoding"** — Upload Service, Transcoding Queue, Transcoding Workers, object storage
- Frame **"Playback / Read Path"** — CDN, Metadata Service, Metadata Cache, Video Metadata DB
- Frame **"Engagement Pipeline"** — View Events Queue, View-Count Aggregator, Comments Service, Comments DB
- Frame **"Search"** — Search Service, Search Index

## 2. How components render — the authoring model

Yes: each node type is a `ShapeUtil` subclass you write. `component()` returns your own React/JSX — tldraw owns hit-testing, drag, resize, undo/redo, selection, and z-order; you own only the visual content and the typed `props`. This is the same generic pattern already verified in `reference/tldraw-sdk-notes.md`, shown here as a skeleton only — filling in the actual 7 (or 8) FlowSync node types is your BUILD-gate work, not reproduced here:

```typescript
class MyNodeShapeUtil extends ShapeUtil<MyNodeShape> {
  static override type = 'my-node-type'
  static override props: RecordProps<MyNodeShape> = { /* T.string, T.number, ... per Section 8's prop table */ }

  getDefaultProps() { /* initial prop values */ }
  getGeometry(shape) { return new Rectangle2d({ width: shape.props.w, height: shape.props.h, isFilled: true }) }
  component(shape) {
    return <HTMLContainer>{/* your own component, reads shape.props */}</HTMLContainer>
  }
  getIndicatorPath(shape) { /* selection outline */ }
  override onResize(shape, info) { return resizeBox(shape, info) }
}
```

Registered once via `<Tldraw shapeUtils={[ServiceNodeShapeUtil, DatabaseNodeShapeUtil, ...]} />`. The properties panel (Section 8's right/left panel) reads `editor.getSelectedShapes()` and writes back through `editor.updateShape()` — same store, no separate state model to keep in sync.

## 3. How components link — the edge model

tldraw's connection primitive is the `Binding` record: `{ id, typeName, type, fromId, toId, props, meta }`. The built-in `arrow` binding type connects an arrow's start/end `terminal` to a shape via `normalizedAnchor`; when the target shape moves, the arrow's `onAfterChangeToShape` hook fires and the arrow re-routes automatically. This is "zero custom code" for connection geometry, matching Section 19's promise for the rest of the canvas.

**Recommendation** (not yet in the spec): override the built-in `ArrowShapeUtil` — same `overrides.shapeUtils` mechanism used for node types — adding a typed `edgeType` prop matching Section 8's 7 edge kinds (`SYNC_CALL | ASYNC_PUBLISH | ASYNC_CONSUME | DB_READ | DB_WRITE | CACHE_READ | CACHE_WRITE`), validated the same way node props are. Drive the arrow's color/dash-style/label from `edgeType` inside the overridden `component()`. This keeps the binding/routing behavior for free while giving edges the same typed-contract rigor Section 20's `ComponentGraph.edges[].type` already expects — and it's the same Strategy pattern `build_roadmap.md` already applies to nodes, not a second pattern to maintain. A lighter-weight alternative (stash `edgeType` in the arrow's generic `meta` field instead of overriding the shape util) is possible but doesn't drive rendering automatically and would need manual sync between the property panel and the arrow's native `color`/`dash` props — more moving parts, not recommended.

Programmatic creation for reference: `editor.createBinding({ type: 'arrow', fromId: arrowShape.id, toId: targetShape.id, props: { terminal: 'end', normalizedAnchor: {x:0.5,y:0.5}, isPrecise:false, isExact:false, snap:'none' } })`.

## 4. Grouping feature design

tldraw has two distinct primitives — pick based on what "group" needs to mean:

| | **Group** | **Frame** |
|---|---|---|
| API | `editor.groupShapes()` / `ungroupShapes()` | `FrameShapeUtil` (built-in), drag shapes onto it |
| Visual boundary | None | Yes — clips children, colored border/background (`showColors`) |
| Label | None (empty props) | Yes — header shows a name |
| Membership | Structural (`parentId` → group shape id) | Structural (`parentId` → frame shape id) |
| Best for | Transient bulk-select/move convenience | Semantic "subsystem" grouping |

**Recommendation**: use **Frame** as the primary grouping mechanic. A labeled, bounded region ("Ingestion & Transcoding", "Search") is meaningful both to the user and to the AI reviewer — a bare Group is not, since it carries no label. This needs zero custom shape code: `FrameShapeUtil` is a built-in shape, just enable `showColors`. Native Group remains available for free as a secondary, lower-ceremony option (Ctrl+G) for quick temporary clustering that doesn't need a name.

**Schema gap this creates**: Section 20's `ComponentGraph` interface has no concept of grouping today — just flat `nodes[]`/`edges[]`. For the AI reviewer to reason about a group ("did they separate ingestion from playback"), the Adapter needs to surface it. Proposed extension (not yet in Section 20):

```typescript
interface ComponentGraph {
  nodes: [...]   // unchanged
  edges: [...]   // unchanged
  groups?: Array<{
    id: string
    label: string           // the Frame's name
    memberNodeIds: string[] // shapes whose parentId equals this Frame's shape id
  }>
}
```

The Adapter populates this by reading each `TLFrameShape`'s children via `parentId` matching, same mechanism it already uses to read node/edge records. This is a proposal for you to decide whether/when to formalize into Section 20 — not applied here.
