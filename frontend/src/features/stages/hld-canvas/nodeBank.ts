// Section 8's component bank — exactly 7 typed node kinds. ui_improvements.md
// §1 flagged an earlier mockup that listed DNS/Worker/Cron Job/Web Server/App
// Server and Relational/NoSQL/Graph as separate draggable items; the resolved
// decision (Session 7 kickoff) is that those collapse into presets of
// ServiceNode and DatabaseNode respectively, not separate bank entries — the
// `presets` field below is that decision, documented and shown in the panel
// rather than silently assumed.

import type { ComponentNodeType } from '@/domain/canvas'
import type { TLDefaultColorStyle } from 'tldraw'

export interface BankItem {
  type: ComponentNodeType
  presets?: string[]
}

export interface BankCategory {
  label: string
  items: BankItem[]
}

export const BANK_CATEGORIES: BankCategory[] = [
  {
    label: 'Networking',
    items: [{ type: 'gateway' }, { type: 'loadbalancer' }, { type: 'cdn' }],
  },
  {
    label: 'Services',
    items: [{ type: 'service', presets: ['Web Server', 'App Server', 'Worker', 'Cron Job', 'DNS'] }],
  },
  {
    label: 'Databases',
    items: [{ type: 'database', presets: ['Relational', 'NoSQL', 'Graph'] }],
  },
  {
    label: 'Messaging',
    items: [{ type: 'queue' }],
  },
  {
    label: 'Caching',
    items: [{ type: 'cache' }],
  },
]

// tldraw's default palette (confirmed against the installed tldraw 5.2.5
// TLDefaultColorStyle) — one distinct color per node type so the seven types
// stay visually distinguishable at a glance, per the design brief's §2.1
// "Eraser.io-grade" component requirement. Plain geo-shape color only for
// now; a real per-type icon set is future work once the typed ShapeUtils
// exist (deferred this session).
export const NODE_CANVAS_COLOR: Record<ComponentNodeType, TLDefaultColorStyle> = {
  gateway: 'violet',
  loadbalancer: 'green',
  cdn: 'light-blue',
  service: 'blue',
  database: 'grey',
  queue: 'orange',
  cache: 'yellow',
}

export const DRAG_DATA_TYPE = 'application/x-flowsync-node-type'
