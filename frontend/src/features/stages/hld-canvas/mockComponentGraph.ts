// The tldraw-store -> ComponentGraph Adapter is explicitly deferred this
// session (Session 7 kickoff: "do NOT build ... the ComponentGraph Adapter").
// HLDReviewRequest still needs a componentGraph payload, so this is a static
// stand-in modeled on reference/canvas-component-design.md's YouTube mapping
// — not derived from whatever the user actually drew. Replace with a real
// Adapter reading editor.getCurrentPageShapes() once the typed ShapeUtils
// (Phase 1) exist.

import type { ComponentGraph } from '@/domain/canvas'

export const mockComponentGraph: ComponentGraph = {
  nodes: [
    { id: 'gateway-1', type: 'gateway', label: 'API Gateway', properties: { technology: 'Kong', expectedRps: 500000 } },
    { id: 'lb-1', type: 'loadbalancer', label: 'Load Balancer', properties: { technology: 'Envoy' } },
    { id: 'metadata-service-1', type: 'service', label: 'Metadata Service', properties: { technology: 'App Server' } },
    { id: 'metadata-cache-1', type: 'cache', label: 'Metadata Cache', properties: { technology: 'Redis' } },
    { id: 'postgres-db-1', type: 'database', label: 'Video Metadata DB', properties: { technology: 'Postgres' } },
    { id: 'transcoding-queue-1', type: 'queue', label: 'Transcoding Queue', properties: { technology: 'Kafka' } },
  ],
  edges: [
    { id: 'e1', source: 'gateway-1', target: 'lb-1', type: 'sync' },
    { id: 'e2', source: 'lb-1', target: 'metadata-service-1', type: 'sync' },
    { id: 'e3', source: 'metadata-service-1', target: 'metadata-cache-1', type: 'cache_read' },
    { id: 'e4', source: 'metadata-service-1', target: 'postgres-db-1', type: 'db_write' },
    { id: 'e5', source: 'metadata-service-1', target: 'transcoding-queue-1', type: 'async_publish' },
  ],
}
