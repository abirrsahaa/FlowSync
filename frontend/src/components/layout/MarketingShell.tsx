// Dark "mission control" console theme wrapper for landing/auth — applies
// .theme-console (index.css) so app-* tokens swap for console-* tokens.

import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export interface MarketingShellProps {
  children: ReactNode
  header?: ReactNode
}

export function MarketingShell({ children, header }: MarketingShellProps) {
  return (
    <div className="theme-console relative min-h-screen bg-console-bg text-console-ink">
      <div
        className="pointer-events-none fixed inset-0 bg-dot-grid opacity-60"
        aria-hidden="true"
      />
      <div className="relative flex min-h-screen flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-console-border px-6">
          <Link to="/" className="font-mono text-lg font-bold tracking-tight text-console-ink">
            FLOWSYNC
          </Link>
          {header}
        </header>
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </div>
  )
}
