// Shared by Stages 1-4 (Session 6). Wraps ReviewStreamService.streamStageReview
// and walks the review sidebar through Section 14's streaming states: idle ->
// streaming -> (finding, if the verdict carries any) -> final, or -> error.
// On reaching 'final' it also writes the gate state into sessionProgressStore
// and persists the stage via SessionService — callers just call submit().

import { useCallback, useRef, useState } from 'react'
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
              void sessionService.submitStage(sessionId, stageId, userContent, finalVerdict)
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
