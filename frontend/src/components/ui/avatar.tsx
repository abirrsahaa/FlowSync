import { forwardRef } from 'react'
import * as AvatarPrimitive from '@radix-ui/react-avatar'
import { cn } from '@/lib/utils'

export const Avatar = forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      'relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-sharp border border-app-border bg-app-surface-muted',
      className,
    )}
    {...props}
  />
))
Avatar.displayName = 'Avatar'

export const AvatarImage = forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image ref={ref} className={cn('h-full w-full object-cover', className)} {...props} />
))
AvatarImage.displayName = 'AvatarImage'

export const AvatarFallback = forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center font-mono text-[10px] font-semibold uppercase text-app-ink-muted',
      className,
    )}
    {...props}
  />
))
AvatarFallback.displayName = 'AvatarFallback'
