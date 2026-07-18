import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface MonoLabelProps extends HTMLAttributes<HTMLSpanElement> {
  muted?: boolean
}

export function MonoLabel({ className, muted = true, ...props }: MonoLabelProps) {
  return (
    <span
      className={cn(
        'font-mono text-[11px] font-medium uppercase tracking-[0.14em]',
        muted ? 'text-app-ink-muted' : 'text-app-ink',
        className,
      )}
      {...props}
    />
  )
}
