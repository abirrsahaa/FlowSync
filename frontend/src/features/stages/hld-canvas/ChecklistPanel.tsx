// Right panel (top half) — Section 8's two-level checklist tree. Each
// checkpoint is independently required/optional and present/absent/partial.
// Optional+absent renders as a neutral open circle rather than a red X — an
// optional gap is advisory information, not a failure, same principle
// CLAUDE.md states for stage gates generally, applied consistently here.

import { cn } from '@/lib/utils'
import { MonoLabel } from '@/components/common/MonoLabel'
import type { Checklist, ChecklistItem } from '@/domain/problem'
import type { ChecklistItemStatus } from './checklistStatus'

function Glyph({ status, required }: { status: ChecklistItemStatus | undefined; required: boolean }) {
  if (status === 'present') {
    return <span className="h-3.5 w-3.5 shrink-0 rounded-full bg-app-green" aria-label="Present" />
  }
  if (status === 'partial') {
    return (
      <span
        className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-app-gold bg-transparent"
        aria-label="Partially addressed"
      />
    )
  }
  if (status === 'absent' && required) {
    return <span className="h-3.5 w-3.5 shrink-0 rounded-full bg-app-red" aria-label="Missing" />
  }
  return (
    <span
      className="h-3.5 w-3.5 shrink-0 rounded-full border border-app-border-strong bg-transparent"
      aria-label={required ? 'Not yet evaluated' : 'Optional, not addressed'}
    />
  )
}

interface ChecklistRowProps {
  item: ChecklistItem
  status: Record<string, ChecklistItemStatus>
  touchedIds: Set<string>
  depth: number
}

function ChecklistRow({ item, status, touchedIds, depth }: ChecklistRowProps) {
  const itemStatus = status[item.id]
  const touched = touchedIds.has(item.id)

  return (
    <div className="flex flex-col gap-1.5">
      <div
        className={cn(
          'flex items-start gap-2 rounded-sharp px-1.5 py-1 transition-colors',
          touched && 'bg-app-gold/10',
        )}
        style={{ paddingLeft: depth * 14 }}
      >
        <Glyph status={itemStatus} required={item.required} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className={cn('text-xs leading-snug text-app-ink', depth === 0 && 'font-semibold')}>
              {item.label}
            </span>
            {!item.required && (
              <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.08em] text-app-ink-muted">
                optional
              </span>
            )}
          </div>
        </div>
      </div>
      {item.nested && (
        <div className="flex flex-col gap-1.5">
          {item.nested.map((child) => (
            <ChecklistRow key={child.id} item={child} status={status} touchedIds={touchedIds} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export interface ChecklistPanelProps {
  checklist: Checklist
  status: Record<string, ChecklistItemStatus>
  touchedIds?: Set<string>
}

export function ChecklistPanel({ checklist, status, touchedIds = new Set() }: ChecklistPanelProps) {
  return (
    <div className="flex flex-col gap-2">
      <MonoLabel muted={false}>Integrity Checkpoints</MonoLabel>
      <div className="flex flex-col gap-3">
        {checklist.checkpoints.map((checkpoint) => (
          <ChecklistRow key={checkpoint.id} item={checkpoint} status={status} touchedIds={touchedIds} depth={0} />
        ))}
      </div>
    </div>
  )
}
