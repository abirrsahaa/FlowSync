// Section 8 — presentation-layer mapping from the ComponentGraph wire-format
// node type literals (domain/canvas.ts) to the display name/icon shown in the
// ComponentBankPanel and on-canvas badges. The wire literals never change to
// match these display names — see the note in domain/canvas.ts.

import {
  Server,
  Database,
  ListOrdered,
  Scale,
  Zap,
  Globe,
  Router,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ComponentNodeType } from '@/domain/canvas'

export interface NodeTypeConfig {
  label: string
  shortLabel: string
  icon: LucideIcon
}

export const NODE_TYPE_CONFIG: Record<ComponentNodeType, NodeTypeConfig> = {
  service: { label: 'Service Node', shortLabel: 'Service', icon: Server },
  database: { label: 'Database Node', shortLabel: 'Database', icon: Database },
  queue: { label: 'Queue Node', shortLabel: 'Queue', icon: ListOrdered },
  loadbalancer: { label: 'Load Balancer Node', shortLabel: 'Load Balancer', icon: Scale },
  cache: { label: 'Cache Node', shortLabel: 'Cache', icon: Zap },
  cdn: { label: 'CDN Node', shortLabel: 'CDN', icon: Globe },
  gateway: { label: 'API Gateway Node', shortLabel: 'API Gateway', icon: Router },
}
