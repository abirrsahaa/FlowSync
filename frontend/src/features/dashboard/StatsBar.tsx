import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { MonoLabel } from '@/components/common/MonoLabel'
import { AnimatedNumber } from '@/components/common/AnimatedNumber'
import type { UserStats } from '@/domain/user'

export interface StatsBarProps {
  stats: UserStats
}

function StatTile({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex-1 px-6 py-5">
      <MonoLabel className="block">{label}</MonoLabel>
      <div className="mt-1.5 flex items-baseline gap-2">{children}</div>
    </div>
  )
}

export function StatsBar({ stats }: StatsBarProps) {
  return (
    <div className="grid grid-cols-1 divide-y divide-app-border rounded-sharp border border-app-border bg-app-surface sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
      <StatTile label="Current Designation">
        <span className="text-xl font-semibold text-app-ink">{stats.designation}</span>
        <Badge variant="navy">{stats.rankLabel}</Badge>
      </StatTile>
      <StatTile label="Avg Precision Score">
        <span className="font-mono text-xl font-semibold text-app-ink">
          <AnimatedNumber value={stats.avgPrecisionScore} decimals={1} />
        </span>
        <span className="font-mono text-xs text-app-ink-muted">/ 10.0</span>
      </StatTile>
      <StatTile label="Concepts Mastered">
        <span className="font-mono text-xl font-semibold text-app-ink">
          <AnimatedNumber value={stats.conceptsMastered} />
        </span>
        <span className="font-mono text-xs text-app-ink-muted">core modules</span>
      </StatTile>
      <StatTile label="System Uptime (Streak)">
        <span className="font-mono text-xl font-semibold text-app-gold">
          <AnimatedNumber value={stats.streakDays} suffix="d" />
        </span>
        <span className="font-mono text-xs text-app-ink-muted">continuous</span>
      </StatTile>
    </div>
  )
}
