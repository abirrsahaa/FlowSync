// Shared by Stages 1-4 (Session 6). Wraps ReviewStreamService.streamStageReview
// and walks the review sidebar through Section 14's streaming states: idle ->
// streaming -> (finding, if the verdict carries any) -> final, or -> error.
// On reaching 'final' it also writes the gate state into sessionProgressStore
// and persists the stage via SessionService — callers just call submit().

import { useCallback, useEffect, useRef, useState } from 'react'
import { useServices } from '@/services/ServiceProvider'
import { useSessionProgressStore } from '@/store/sessionProgressStore'
import type { Finding, ReviewerVerdict } from '@/domain/review'
import type { StageContext } from '@/services/interfaces/ReviewStreamService'
import type { StageId } from '@/domain/session'

export type ReviewStreamStatus = 'idle' | 'streaming' | 'finding' | 'final' | 'error'
export type TextStageId = Exclude<StageId, 'hld' | 'deepdive'>

const FINDING_REVEAL_DELAY_MS = 260

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

export interface UseReviewStreamResult {
  status: ReviewStreamStatus
  streamedText: string
  findings: Finding[]
  verdict: ReviewerVerdict | null
  error: string | null
  submit: (userContent: Record<string, any>, stageContext?: StageContext) => void
  reset: () => void
}

export function useReviewStream(stageId: TextStageId, sessionId: string): UseReviewStreamResult {
  const { reviewStreamService, sessionService } = useServices()
  const recordVerdict = useSessionProgressStore((s) => s.recordVerdict)

  const [status, setStatus] = useState<ReviewStreamStatus>('idle')
  const [streamedText, setStreamedText] = useState('')
  const [findings, setFindings] = useState<Finding[]>([])
  const [verdict, setVerdict] = useState<ReviewerVerdict | null>(null)
  const [error, setError] = useState<string | null>(null)
  const runId = useRef(0)

  const reset = useCallback(() => {
    runId.current += 1
    setStatus('idle')
    setStreamedText('')
    setFindings([])
    setVerdict(null)
    setError(null)
  }, [])

  // Switching stages or sessions must invalidate any in-flight stream and
  // clear the previous stage's verdict/findings before the new one renders.
  // If this stage was already submitted (e.g. the user left and came back —
  // via the Challenge screen or just other tabs), rehydrate straight into
  // 'final' from the persisted StageOutput instead of resetting to idle;
  // otherwise a correctly-retained gate dot sits next to a sidebar that's
  // forgotten it was ever reviewed.
  useEffect(() => {
    const thisRun = ++runId.current
    setStatus('idle')
    setStreamedText('')
    setFindings([])
    setVerdict(null)
    setError(null)

    let cancelled = false
    ;(async () => {
      const session = await sessionService.getSession(sessionId)
      if (cancelled || runId.current !== thisRun) return
      const existing = session?.stages.find((s) => s.stageId === stageId)
      if (existing) {
        setVerdict(existing.reviewerVerdict)
        setFindings(existing.reviewerVerdict.findings)
        setStatus('final')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [stageId, sessionId, sessionService])

  const submit = useCallback(
    (userContent: Record<string, any>, stageContext: StageContext = {}) => {
      const thisRun = ++runId.current
      setStatus('streaming')
      setStreamedText('')
      setFindings([])
      setVerdict(null)
      setError(null)

      ;(async () => {
        try {
          const stream = reviewStreamService.streamStageReview({ sessionId, stageId, userContent, stageContext })
          for await (const event of stream) {
            if (runId.current !== thisRun) return

            if (event.textToken) {
              setStreamedText((prev) => prev + event.textToken)
            }

            if (event.isFinal && event.verdict) {
              const finalVerdict = event.verdict

              if (finalVerdict.findings.length > 0) {
                setStatus('finding')
                for (const finding of finalVerdict.findings) {
                  if (runId.current !== thisRun) return
                  await delay(FINDING_REVEAL_DELAY_MS)
                  setFindings((prev) => [...prev, finding])
                }
                await delay(200)
              }

              if (runId.current !== thisRun) return
              setVerdict(finalVerdict)
              setStatus('final')
              recordVerdict(stageId, finalVerdict.score, finalVerdict.gateState)
              // Gate/score already landed in sessionProgressStore above — this
              // persistence call is best-effort and throws if the session was
              // opened by URL without going through the dashboard's
              // createSession (no in-memory SessionDocument to attach to).
              sessionService.submitStage(sessionId, stageId, userContent, finalVerdict).catch(() => {})
            }
          }
        } catch (err) {
          if (runId.current !== thisRun) return
          setError(err instanceof Error ? err.message : 'The review stream failed unexpectedly.')
          setStatus('error')
        }
      })()
    },
    [reviewStreamService, sessionService, sessionId, stageId, recordVerdict],
  )

  return { status, streamedText, findings, verdict, error, submit, reset }
}
