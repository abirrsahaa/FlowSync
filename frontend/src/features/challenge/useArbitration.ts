// Session 8 — Section 9's arbitration agent, wrapped the same way Session 6/7
// wrap the stage reviewers: an async-generator stream walked through explicit
// states so the "arbitrating..." transitional state is a real render, not a
// spinner slapped over a promise. On the final ruling, the adjusted score
// lands in sessionProgressStore/SessionService exactly like a first-pass
// verdict does — Section 9: "Gate state -> based on ARBITRATED final score."

import { useCallback, useRef, useState } from 'react'
import { useServices } from '@/services/ServiceProvider'
import { useSessionProgressStore } from '@/store/sessionProgressStore'
import { deriveGateState } from '@/domain/review'
import type { ChallengeOutcome, ReviewerVerdict } from '@/domain/review'
import type { StageId } from '@/domain/session'
import type { EstimationNumbers } from '@/services/interfaces/ReviewStreamService'

export type ArbitrationStatus = 'idle' | 'streaming' | 'final' | 'error'

export interface UseArbitrationResult {
  status: ArbitrationStatus
  streamedText: string
  ruling: ChallengeOutcome | null
  error: string | null
  submit: (justification: string) => void
  reset: () => void
}

export function useArbitration(
  sessionId: string,
  stageId: StageId,
  aiVerdict: ReviewerVerdict,
  estimation: EstimationNumbers,
  problemConstraints: Record<string, any>,
): UseArbitrationResult {
  const { reviewStreamService, sessionService } = useServices()
  const recordChallengeOutcome = useSessionProgressStore((s) => s.recordChallengeOutcome)

  const [status, setStatus] = useState<ArbitrationStatus>('idle')
  const [streamedText, setStreamedText] = useState('')
  const [ruling, setRuling] = useState<ChallengeOutcome | null>(null)
  const [error, setError] = useState<string | null>(null)
  const runId = useRef(0)

  const reset = useCallback(() => {
    runId.current += 1
    setStatus('idle')
    setStreamedText('')
    setRuling(null)
    setError(null)
  }, [])

  const submit = useCallback(
    (justification: string) => {
      const thisRun = ++runId.current
      setStatus('streaming')
      setStreamedText('')
      setRuling(null)
      setError(null)

      ;(async () => {
        try {
          const stream = reviewStreamService.streamArbitration({
            sessionId,
            stageId,
            aiVerdict,
            userJustification: justification,
            estimation,
            problemConstraints,
          })

          for await (const event of stream) {
            if (runId.current !== thisRun) return

            if (event.textToken) {
              setStreamedText((prev) => prev + event.textToken)
            }

            if (event.isFinal && event.ruling) {
              const finalRuling = event.ruling
              setRuling(finalRuling)
              setStatus('final')
              const gateState = deriveGateState(finalRuling.adjustedScore)
              recordChallengeOutcome(stageId, finalRuling.adjustedScore, gateState)
              // Best-effort, same pattern as useReviewStream/useHldReviewStream —
              // throws if the stage was never actually submitted via SessionService.
              sessionService.recordChallengeOutcome(sessionId, stageId, finalRuling).catch(() => {})
            }
          }
        } catch (err) {
          if (runId.current !== thisRun) return
          setError(err instanceof Error ? err.message : 'Arbitration failed unexpectedly.')
          setStatus('error')
        }
      })()
    },
    [reviewStreamService, sessionService, sessionId, stageId, aiVerdict, estimation, problemConstraints, recordChallengeOutcome],
  )

  return { status, streamedText, ruling, error, submit, reset }
}
