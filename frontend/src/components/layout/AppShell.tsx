// The single light-theme "precision instrument" shell — every app-surface
// screen (dashboard, stages, canvas, report, replay) mounts inside this.
// ui_improvements.md §1 flags a mockup that used a second "Architect's Studio"
// shell for the canvas screen; there must be exactly one — this is it.

import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { CircleUserRound, Settings, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

const DEFAULT_NAV_ITEMS = [
  { label: 'Problem Library', to: '/dashboard' },
  { label: 'Performance', to: null },
  { label: 'History', to: null },
] as const

function DefaultNav() {
  return (
    <nav className="hidden items-center gap-6 md:flex">
      {DEFAULT_NAV_ITEMS.map((item) =>
        item.to ? (
          <NavLink
            key={item.label}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'text-sm font-medium text-app-ink-muted transition-colors hover:text-app-ink',
                isActive && 'text-app-ink underline decoration-app-navy decoration-2 underline-offset-8',
              )
            }
          >
            {item.label}
          </NavLink>
        ) : (
          <span key={item.label} className="text-sm font-medium text-app-ink-muted/50">
            {item.label}
          </span>
        ),
      )}
    </nav>
  )
}

function IconButton({ children, label }: { children: ReactNode; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-sharp text-app-ink-muted transition-colors hover:bg-app-surface-muted hover:text-app-ink"
    >
      {children}
    </button>
  )
}

export interface AppShellProps {
  children: ReactNode
  navSlot?: ReactNode
  actions?: ReactNode
}

export function AppShell({ children, navSlot, actions }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-app-bg text-app-ink">
      <header className="flex h-16 shrink-0 items-center gap-4 border-b border-app-border bg-app-surface px-6">
        <Link
          to="/dashboard"
          className="shrink-0 font-mono text-lg font-bold tracking-tight text-app-navy"
        >
          FLOWSYNC
        </Link>
        <div className="min-w-0 flex-1 overflow-x-auto">{navSlot ?? <DefaultNav />}</div>
        <div className="flex shrink-0 items-center gap-1.5">
          <IconButton label="Presence">
            <Users className="h-4 w-4" />
          </IconButton>
          <IconButton label="Settings">
            <Settings className="h-4 w-4" />
          </IconButton>
          <IconButton label="Account">
            <CircleUserRound className="h-4 w-4" />
          </IconButton>
          {actions && <div className="ml-2 flex items-center gap-2">{actions}</div>}
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  )
}
