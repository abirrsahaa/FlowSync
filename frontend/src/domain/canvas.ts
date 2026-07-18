// Section 20 (CanvasOp/TLShapeRecord/ComponentGraph) + Section 8 (node/edge taxonomy).
//
// ComponentGraph's node.type / edge.type unions below are the WIRE format —
// Section 20 defines them as lowercase literals ('service', 'sync', ...) and
// that is what the OT pipeline and reviewer harness actually carry end to end.
// Section 8's component bank names the same concepts with typed-shape/display
// names (ServiceNode, SYNC_CALL, ...) — that's a presentation-layer mapping,
// not a second wire format. Session 3 adds a NODE_TYPE_CONFIG lookup keyed by
// these lowercase literals to render the Section 8 display names/icons; don't
// change these literals to match Section 8's casing.

export interface TLShapeRecord {
  id: string
  type: string // one of the 7 node types, Section 8
  x: number
  y: number
  props: Record<string, any> // the node type's typed properties, Section 8
}

export interface CanvasOp {
  type: 'CANVAS_CHANGE'
  workspaceId: string
  userId: string
  opId: string // client-generated UUID; the SETNX dedup key (Section 13, Pattern 4)
  clientSeq: number
  serverSeq?: number // absent client→server; assigned by the OT merge processor (Section 12)
  vectorClock: Record<string, number> // userId -> that user's last-seen clientSeq
  changes: {
    added: TLShapeRecord[]
    updated: TLShapeRecord[]
    removed: string[] // shapeIds
  }
}

export type ComponentNodeType =
  | 'service'
  | 'database'
  | 'queue'
  | 'cache'
  | 'loadbalancer'
  | 'cdn'
  | 'gateway'

export type ComponentEdgeType =
  | 'sync'
  | 'async_publish'
  | 'async_consume'
  | 'db_read'
  | 'db_write'
  | 'cache_read'
  | 'cache_write'

export interface ComponentGraph {
  nodes: Array<{
    id: string
    type: ComponentNodeType
    label: string
    properties: {
      technology?: string
      expectedRps?: number
      slaTarget?: string
      notes?: string
      [key: string]: any
    }
  }>
  edges: Array<{
    id: string
    source: string
    target: string
    type: ComponentEdgeType
    label?: string
  }>
}
