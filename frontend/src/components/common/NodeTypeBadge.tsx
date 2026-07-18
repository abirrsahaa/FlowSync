import { cn } from '@/lib/utils'
import { NODE_TYPE_CONFIG } from '@/lib/nodeTypeConfig'
import type { ComponentNodeType } from '@/domain/canvas'

export interface NodeTypeBadgeProps {
  type: ComponentNodeType
  short?: boolean
  className?: string
}

export function NodeTypeBadge({ type, short = false, className }: NodeTypeBadgeProps) {
  const config = NODE_TYPE_CONFIG[type]
  const Icon = config.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-sharp border border-app-border bg-app-surface-muted px-2 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-app-ink',
        className,
      )}
    >
      <Icon className="h-3 w-3" strokeWidth={2} />
      {short ? config.shortLabel : config.label}
    </span>
  )
}
