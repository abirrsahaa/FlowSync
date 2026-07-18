// Resolves the current :sessionId route param to its Problem, so each stage
// page can show problem-specific context (title, expected scale) without
// duplicating the fetch. Falls back to the seed problem if the session was
// never created via the dashboard (e.g. a stage route opened directly).

import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useServices } from '@/services/ServiceProvider'
import type { Problem } from '@/domain/problem'
import type { StageOutput } from '@/domain/session'

const FALLBACK_PROBLEM_ID = 'design-youtube'

export interface StageSession {
  sessionId: string
  problem: Problem | null
  stages: StageOutput[]
  loading: boolean
}

export function useStageSession(): StageSession {
  const { sessionId = 'mock-session' } = useParams()
  const { sessionService, problemsService } = useServices()
  const [problem, setProblem] = useState<Problem | null>(null)
  const [stages, setStages] = useState<StageOutput[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      const session = await sessionService.getSession(sessionId)
      const problemId = session?.problemId ?? FALLBACK_PROBLEM_ID
      const resolved = await problemsService.getProblem(problemId)
      if (cancelled) return
      setProblem(resolved ?? null)
      setStages(session?.stages ?? [])
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [sessionId, sessionService, problemsService])

  return { sessionId, problem, stages, loading }
}
