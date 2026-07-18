import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useServices } from '@/services/ServiceProvider'
import { useSessionProgressStore } from '@/store/sessionProgressStore'
import type { Problem } from '@/domain/problem'
import type { HistoricalLogEntry, UserStats } from '@/domain/user'
import type { RecommendedProblem } from '@/services/interfaces/DashboardService'
import { StatsBar } from './StatsBar'
import { SkillProficiencyRadar } from './SkillProficiencyRadar'
import { HistoricalLogs } from './HistoricalLogs'
import { ProblemLibrary } from './ProblemLibrary'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function DashboardPage() {
  const { authService, problemsService, dashboardService, sessionService } = useServices()
  const startSession = useSessionProgressStore((s) => s.startSession)
  const navigate = useNavigate()

  const [userId, setUserId] = useState<string | null>(null)
  const [problems, setProblems] = useState<Problem[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [logs, setLogs] = useState<HistoricalLogEntry[]>([])
  const [recommended, setRecommended] = useState<RecommendedProblem | undefined>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        // No backend session guard exists yet — fall back to the mock user id
        // so the dashboard still renders if this route is reached directly.
        const currentUser = await authService.getCurrentUser()
        const resolvedUserId = currentUser?.id ?? 'user-mock-1'
        if (cancelled) return
        setUserId(resolvedUserId)

        const [problemList, userStats, historicalLogs, recommendedProblem] = await Promise.all([
          problemsService.listProblems(),
          dashboardService.getUserStats(resolvedUserId),
          dashboardService.getHistoricalLogs(resolvedUserId),
          dashboardService.getRecommendedProblem(resolvedUserId),
        ])
        if (cancelled) return

        setProblems(problemList)
        setStats(userStats)
        setLogs(historicalLogs)
        setRecommended(recommendedProblem)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load dashboard.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [authService, problemsService, dashboardService])

  async function handleStart(problemId: string) {
    try {
      const session = await sessionService.createSession(problemId, userId ?? 'user-mock-1')
      startSession(session.sessionId)
      navigate(`/session/${session.sessionId}/requirements`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start session.')
    }
  }

  function handleReview(sessionId: string) {
    navigate(`/session/${sessionId}/report`)
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <span className="font-mono text-xs uppercase tracking-[0.14em] text-app-red">{error}</span>
      </div>
    )
  }

  if (loading || !stats) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <span className="font-mono text-xs uppercase tracking-[0.14em] text-app-ink-muted">Loading dashboard…</span>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6">
      <StatsBar stats={stats} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Skill Proficiency Map</CardTitle>
            </CardHeader>
            <CardContent>
              <SkillProficiencyRadar data={stats.skillProficiency} />
              <div className="mt-2 flex flex-col gap-2">
                {stats.skillProficiency.map((skill) => (
                  <div key={skill.axis} className="flex items-center justify-between gap-3">
                    <span className="text-xs text-app-ink-muted">{skill.axis}</span>
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-app-surface-muted">
                      <div
                        className="h-full rounded-full bg-app-navy"
                        style={{ width: `${(skill.score / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <HistoricalLogs logs={logs} />
        </div>

        <ProblemLibrary
          problems={problems}
          historicalLogs={logs}
          recommendedProblem={recommended}
          onStart={handleStart}
          onReview={handleReview}
        />
      </div>
    </div>
  )
}
