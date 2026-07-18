// Stage 2 — Capacity Estimation. Section 5: structured numeric form, reviewed
// by TWO layers — a math validator first (computational, instant), then LLM
// qualitative judgment. The design brief calls this out as a trust signal
// that must stay visible, not collapse into an implementation detail.

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calculator } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { MonoLabel } from '@/components/common/MonoLabel'
import { useReviewStream } from '@/hooks/useReviewStream'
import type { Finding } from '@/domain/review'
import { ReviewStreamSidebar } from '../shared/ReviewStreamSidebar'
import { StagePageLayout } from '../shared/StagePageLayout'
import { useStageSession } from '../shared/useStageSession'
import { runMathValidation, type EstimationValues, type MathValidationResult } from './mathValidator'

const ZERO_VALUES: EstimationValues = {
  dau: 0,
  readQps: 0,
  writeQps: 0,
  storageGbPerDay: 0,
  bandwidthGbps: 0,
  memoryPerServerGb: 0,
}

const FIELDS: { key: keyof EstimationValues; label: string; hint: string }[] = [
  { key: 'dau', label: 'Daily Active Users', hint: 'total unique users per day' },
  { key: 'readQps', label: 'Read QPS', hint: 'peak read queries/sec' },
  { key: 'writeQps', label: 'Write QPS', hint: 'peak write queries/sec' },
  { key: 'storageGbPerDay', label: 'Storage (GB/day)', hint: 'new data ingested per day' },
  { key: 'bandwidthGbps', label: 'Bandwidth (Gbps)', hint: 'derived from storage + read QPS' },
  { key: 'memoryPerServerGb', label: 'Memory / Server (GB)', hint: 'cache + working set sizing' },
]

export function EstimationPage() {
  const { sessionId, problem } = useStageSession()
  const navigate = useNavigate()
  const review = useReviewStream('estimation', sessionId)

  const [values, setValues] = useState<EstimationValues>(ZERO_VALUES)
  const [mathResult, setMathResult] = useState<MathValidationResult | null>(null)
  const seeded = useRef(false)

  useEffect(() => {
    if (seeded.current || !problem) return
    seeded.current = true
    setValues({
      dau: problem.expectedScale.dau,
      readQps: problem.expectedScale.readQps,
      writeQps: problem.expectedScale.writeQps,
      storageGbPerDay: problem.expectedScale.storageGbPerDay,
      bandwidthGbps: 0,
      memoryPerServerGb: 64,
    })
  }, [problem])

  function updateField(key: keyof EstimationValues, raw: string) {
    const parsed = Number(raw)
    setValues((prev) => ({ ...prev, [key]: Number.isFinite(parsed) ? parsed : 0 }))
  }

  function handleSubmit() {
    setMathResult(runMathValidation(values, problem))
    review.submit({ ...values })
  }

  function handleChallenge(finding: Finding) {
    navigate(`/session/${sessionId}/challenge`, {
      state: { stageId: 'estimation', finding, verdict: review.verdict },
    })
  }

  return (
    <StagePageLayout
      sidebar={
        <ReviewStreamSidebar
          reviewerName="Estimation Reviewer"
          reviewerTagline="Math validator, then LLM qualitative judgment"
          status={review.status}
          streamedText={review.streamedText}
          findings={review.findings}
          verdict={review.verdict}
          error={review.error}
          onSubmit={handleSubmit}
          onChallenge={handleChallenge}
          idleHint="Fill in your capacity estimate, then submit — a deterministic math check runs first, before the LLM ever sees your numbers."
          beforeStream={
            mathResult && (
              <Card
                className={cn(
                  'border',
                  mathResult.status === 'verified' ? 'border-app-green/50 bg-app-green/5' : 'border-app-gold/50 bg-app-gold/5',
                )}
              >
                <CardContent className="flex flex-col gap-2 py-3">
                  <div
                    className={cn(
                      'flex items-center gap-2',
                      mathResult.status === 'verified' ? 'text-app-green' : 'text-app-gold',
                    )}
                  >
                    <Calculator className="h-4 w-4" aria-hidden="true" />
                    <span className="font-mono text-xs font-semibold uppercase tracking-[0.14em]">
                      {mathResult.status === 'verified' ? 'MATH: VERIFIED' : 'MATH: FLAGGED'}
                    </span>
                  </div>
                  {mathResult.notes.map((note, i) => (
                    <p key={i} className="text-xs text-app-ink-muted">
                      {note}
                    </p>
                  ))}
                </CardContent>
              </Card>
            )
          }
        />
      }
    >
      <div>
        <h1 className="text-xl font-semibold text-app-ink">
          Capacity Estimation{problem ? `: ${problem.title}` : ''}
        </h1>
        <p className="mt-1 text-sm text-app-ink-muted">
          Derive scale from the problem constraints. Every number here is checked computationally before the AI opines.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FIELDS.map((field) => (
          <Card key={field.key}>
            <CardContent className="flex flex-col gap-1.5 py-3">
              <MonoLabel>{field.label}</MonoLabel>
              <Input
                type="number"
                min={0}
                value={values[field.key] || ''}
                onChange={(e) => updateField(field.key, e.target.value)}
                className="font-mono"
                aria-label={field.label}
              />
              <span className="text-[11px] text-app-ink-muted">{field.hint}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {problem && (
        <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-app-ink-muted">
          Problem constraints — scale: {problem.constraints.scale} · regions: {problem.constraints.regions} · latency:{' '}
          {problem.constraints.latencyTarget}
        </p>
      )}
    </StagePageLayout>
  )
}
