// Static avatar stack + "Live: N Architects" — mock data only, no real
// websocket/presence wiring (Section 11's Redis ZADD presence is a backend
// concern for a later session).

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MonoLabel } from '@/components/common/MonoLabel'
import { cn } from '@/lib/utils'

const MOCK_PRESENT_ARCHITECTS = [
  { id: 'p1', initials: 'AS' },
  { id: 'p2', initials: 'RK' },
  { id: 'p3', initials: 'MV' },
]

export interface PresenceBarProps {
  className?: string
}

export function PresenceBar({ className }: PresenceBarProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 border-t border-app-border bg-app-surface px-4 py-2',
        className,
      )}
    >
      <div className="flex -space-x-2">
        {MOCK_PRESENT_ARCHITECTS.map((p) => (
          <Avatar key={p.id} className="ring-2 ring-app-surface">
            <AvatarFallback>{p.initials}</AvatarFallback>
          </Avatar>
        ))}
      </div>
      <MonoLabel>Live: {MOCK_PRESENT_ARCHITECTS.length} Architects</MonoLabel>
    </div>
  )
}
