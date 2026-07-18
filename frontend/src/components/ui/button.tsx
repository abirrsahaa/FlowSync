import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sharp font-mono text-xs font-medium uppercase tracking-[0.12em] transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-navy',
  {
    variants: {
      variant: {
        primary: 'bg-app-navy text-white hover:bg-app-navy-hover',
        outline:
          'border border-app-border-strong bg-app-surface text-app-ink hover:bg-app-surface-muted',
        ghost: 'text-app-ink-muted hover:bg-app-surface-muted hover:text-app-ink',
        destructive: 'border border-app-red text-app-red hover:bg-app-red hover:text-white',
        console:
          'border border-console-mint text-console-mint hover:bg-console-mint hover:text-console-bg hover:shadow-console-glow',
      },
      size: {
        sm: 'h-8 px-3 text-[11px]',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-sm',
        icon: 'h-9 w-9 shrink-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />
    )
  },
)
Button.displayName = 'Button'
