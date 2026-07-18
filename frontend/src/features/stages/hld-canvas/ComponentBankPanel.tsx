// Left panel — Section 8's component bank. Exactly 7 typed node kinds,
// grouped into categories; dragging an item onto the canvas places a plain
// geo shape (real typed ShapeUtils are future work, see HldCanvasShell).

import type { DragEvent } from 'react'
import { MonoLabel } from '@/components/common/MonoLabel'
import { NODE_TYPE_CONFIG } from '@/lib/nodeTypeConfig'
import { BANK_CATEGORIES, DRAG_DATA_TYPE, type BankItem } from './nodeBank'

function BankEntry({ item }: { item: BankItem }) {
  const config = NODE_TYPE_CONFIG[item.type]
  const Icon = config.icon

  function handleDragStart(e: DragEvent<HTMLDivElement>) {
    e.dataTransfer.setData(DRAG_DATA_TYPE, item.type)
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="flex cursor-grab flex-col gap-1 rounded-sharp border border-app-border bg-app-surface px-2.5 py-2 transition-colors hover:border-app-navy active:cursor-grabbing"
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0 text-app-navy" aria-hidden="true" />
        <span className="text-sm font-medium text-app-ink">{config.shortLabel}</span>
      </div>
      {item.presets && (
        <p className="pl-6 text-[10px] leading-tight text-app-ink-muted">Presets: {item.presets.join(' · ')}</p>
      )}
    </div>
  )
}

export function ComponentBankPanel() {
  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto border-r border-app-border bg-app-surface-muted p-3">
      <div>
        <MonoLabel muted={false}>Component Bank</MonoLabel>
        <p className="mt-1 text-[11px] text-app-ink-muted">Drag onto the canvas to place.</p>
      </div>
      {BANK_CATEGORIES.map((category) => (
        <section key={category.label} className="flex flex-col gap-2">
          <MonoLabel className="text-[10px]">{category.label}</MonoLabel>
          <div className="flex flex-col gap-2">
            {category.items.map((item) => (
              <BankEntry key={item.type} item={item} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
