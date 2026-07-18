// Stage 5/6 counterpart to useReviewStream (Session 6). The HLD reviewer's
// Section 14 event shape differs from the text stages: findings arrive as
// discrete events interleaved with text tokens (not batched after isFinal),
// so 'finding' status is entered the moment the first one lands, while text
// is still streaming in — this is what lets a caller synchronize a canvas
// node glow with the finding's explanation landing in the panel, per the
// design brief's "one synchronized event" requirement. The Adapter that
// would build a real ComponentGraph from the tldraw store is deferred
// (Session 7 scope note) — callers pass a static/mock graph.

import { useCallback, useEffect, useRef, useState } from 'react'
import { useServices } from '@/services/ServiceProvider'
import { useSessionProgressStore } from '@/store/sessionProgressStore'
import type { Finding, ReviewerVerdict } from '@/domain/review'
import type { ComponentGraph } from '@/domain/canvas'
import type { StageContext } from '@/services/interfaces/ReviewStreamService'

export type HldReviewStatus = 'idle' | 'streaming' | 'finding' | 'final' | 'error'
export type HldStageId = 'hld' | 'deepdive'

export interface HldReviewSubmission {
  snapshotPng: string
  componentGraph: ComponentGraph
  checklistId: string
  focusAreas?: string[]
  stageContext?: StageContext
}

export interface UseHldReviewStreamResult {
  status: HldReviewStatus
  streamedText: string
  findings: Finding[]
  verdict: ReviewerVerdict | null
  error: string | null
  submit: (input: HldReviewSubmission) => void
  reset: () => void
}

export function useHldReviewStream(stageId: HldStageId, sessionId: string): UseHldReviewStreamResult {
  const { reviewStreamService, sessionService } = useServices()
  const recordVerdict = useSessionProgressStore((s) => s.recordVerdict)

  const [status, setStatus] = useState<HldReviewStatus>('idle')
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

  // Same rehydration as useReviewStream (Session 6): if this stage was
  // already submitted, jump straight to 'final' from the persisted
  // StageOutput instead of resetting to idle on every remount — otherwise
  // leaving and returning to the canvas (e.g. via the Challenge screen)
  // shows an idle audit panel next to a gate dot that still remembers the score.
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
    (input: HldReviewSubmission) => {
      const thisRun = ++runId.current
      setStatus('streaming')
      setStreamedText('')
      setFindings([])
      setVerdict(null)
      setError(null)

      ;(async () => {
        try {
          const stream = reviewStreamService.streamHLDReview({
            sessionId,
            stageId,
            snapshotPng: input.snapshotPng,
            componentGraph: input.componentGraph,
            checklistId: input.checklistId,
            focusAreas: input.focusAreas,
            stageContext: input.stageContext ?? {},
          })

          for await (const event of stream) {
            if (runId.current !== thisRun) return

            if (event.textToken) {
              setStreamedText((prev) => prev + event.textToken)
            }

            if (event.finding) {
              setStatus('finding')
              setFindings((prev) => [...prev, event.finding as Finding])
            }

            if (event.isFinal && event.verdict) {
              if (runId.current !== thisRun) return
              setVerdict(event.verdict)
              setStatus('final')
              recordVerdict(stageId, event.verdict.score, event.verdict.gateState)
              // Gate/score already landed in sessionProgressStore above — this
              // persistence call is best-effort and throws if the session was
              // opened by URL without going through the dashboard's
              // createSession (no in-memory SessionDocument to attach to).
              sessionService
                .submitStage(
                  sessionId,
                  stageId,
                  { componentGraph: input.componentGraph, checklistId: input.checklistId },
                  event.verdict,
                )
                .catch(() => {})
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
