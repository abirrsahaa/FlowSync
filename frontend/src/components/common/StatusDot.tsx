// Gate state as a small advisory status dot — never rendered as a pass/fail
// badge anywhere in the product (Section 5 / CLAUDE.md: gates never block).

import { cn } from '@/lib/utils'
import type { GateState } from '@/domain/review'

const GATE_DOT_CLASS: Record<GateState, string> = {
  OPEN: 'bg-gate-open',
  SOFT: 'bg-gate-soft',
  FLAGGED: 'bg-gate-flagged',
}

const GATE_LABEL: Record<GateState, string> = {
  OPEN: 'Open',
  SOFT: 'Soft',
  FLAGGED: 'Flagged',
}

export interface StatusDotProps {
  gateState?: GateState
  showLabel?: boolean
  pulse?: boolean
  className?: string
}

export function StatusDot({ gateState, showLabel = false, pulse = false, className }: StatusDotProps) {
  const dotClass = gateState ? GATE_DOT_CLASS[gateState] : 'border border-app-ink-muted bg-transparent'

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span
        className={cn('h-2 w-2 shrink-0 rounded-full', dotClass, pulse && gateState && 'animate-glow-pulse')}
        aria-hidden="true"
      />
      {showLabel && (
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-app-ink-muted">
          {gateState ? GATE_LABEL[gateState] : 'Not started'}
        </span>
      )}
    </span>
  )
}
