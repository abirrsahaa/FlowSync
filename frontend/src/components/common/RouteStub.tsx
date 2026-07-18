// Placeholder body for routes whose real screen ships in a later build
// session — proves navigation/shell wiring works before the real UI exists.

import { cn } from '@/lib/utils'

export interface RouteStubProps {
  sessionNumber: number
  name: string
  variant?: 'app' | 'console'
}

export function RouteStub({ sessionNumber, name, variant = 'app' }: RouteStubProps) {
  const isConsole = variant === 'console'
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <span
        className={cn(
          'font-mono text-xs uppercase tracking-[0.2em]',
          isConsole ? 'text-console-mint' : 'text-app-ink-muted',
        )}
      >
        Coming in Session {sessionNumber}
      </span>
      <h1 className={cn('text-2xl font-semibold', isConsole ? 'text-console-ink' : 'text-app-navy')}>
        {name}
      </h1>
    </div>
  )
}
