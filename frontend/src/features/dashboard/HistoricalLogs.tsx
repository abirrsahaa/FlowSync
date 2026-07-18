import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MonoLabel } from '@/components/common/MonoLabel'
import type { HistoricalLogEntry } from '@/domain/user'

export interface HistoricalLogsProps {
  logs: HistoricalLogEntry[]
}

function relativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime()
  const hours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)))
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'yesterday'
  return `${days} days ago`
}

export function HistoricalLogs({ logs }: HistoricalLogsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Historical Logs</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 p-0">
        {logs.length === 0 && (
          <p className="p-4 text-sm text-app-ink-muted">No sessions logged yet.</p>
        )}
        {logs.map((log) => (
          <Link
            key={log.sessionId}
            to={`/session/${log.sessionId}/report`}
            className="flex flex-col gap-1 border-b border-app-border p-4 transition-colors last:border-b-0 hover:bg-app-surface-muted"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-semibold text-app-ink">{log.problemTitle}</span>
              <span className="font-mono text-sm font-semibold text-app-navy">{log.score.toFixed(1)}/10</span>
            </div>
            <span className="text-xs text-app-ink-muted">Gap: {log.topGap}</span>
            <div className="mt-1 flex items-center justify-between">
              <MonoLabel className="text-[10px]">{relativeTime(log.completedAt)}</MonoLabel>
              <MonoLabel className="text-[10px]">
                {log.sessionId} · v{log.problemVersion}
              </MonoLabel>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
