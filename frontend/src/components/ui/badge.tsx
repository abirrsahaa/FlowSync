import { forwardRef } from 'react'
import type { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-sharp border px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.1em]',
  {
    variants: {
      variant: {
        neutral: 'border-app-border bg-app-surface-muted text-app-ink-muted',
        navy: 'border-app-navy bg-app-navy text-white',
        gold: 'border-app-gold/40 bg-app-gold/10 text-app-gold',
        green: 'border-app-green/40 bg-app-green/10 text-app-green',
        red: 'border-app-red/40 bg-app-red/10 text-app-red',
        outline: 'border-app-border-strong text-app-ink',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  },
)

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(({ className, variant, ...props }, ref) => (
  <span ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
))
Badge.displayName = 'Badge'
