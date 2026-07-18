// Session 8 — Section 9's Challenge/Arbitration flow, reached by the
// "Challenge" link Sessions 6/7 already wired onto every CRITICAL/MAJOR
// finding. Design brief §2/§4: this is a duel — the AI's verdict and the
// user's justification, resolved by a third, citation-bound arbiter — not a
// support-ticket form. Gate state updates from the arbitrated score but,
// per Section 5/CLAUDE.md, never blocks navigation: StageTopNav stays live
// the whole time via the same AppShell wrapper every stage route uses.

import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Gavel, Loader2, Swords, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { MonoLabel } from '@/components/common/MonoLabel'
import { StatusDot } from '@/components/common/StatusDot'
import { StreamingText } from '@/components/common/StreamingText'
import { STAGE_LABEL, STAGE_ROUTE_SEGMENT } from '@/components/layout/StageTopNav'
import { deriveGateState } from '@/domain/review'
import type { Finding, ReviewerVerdict, Severity } from '@/domain/review'
import type { StageId } from '@/domain/session'
import type { EstimationNumbers } from '@/services/interfaces/ReviewStreamService'
import { useStageSession } from '../stages/shared/useStageSession'
import { useArbitration } from './useArbitration'

const SEVERITY_VARIANT: Record<Severity, 'red' | 'gold' | 'neutral' | 'green'> = {
  CRITICAL: 'red',
  MAJOR: 'gold',
  MINOR: 'neutral',
  SUGGESTION: 'green',
}

// Ground truth is always the user's own Stage 2 numbers (Section 9's anti-bias
// rule 1), regardless of which stage is under challenge. If Stage 2 was never
// submitted (a challenge route opened directly, no estimation StageOutput yet)
// fall back to the problem's expected scale — same fallback shape
// useStageSession already uses for a missing session.
function resolveEstimationNumbers(
  stages: ReturnType<typeof useStageSession>['stages'],
  problem: ReturnType<typeof useStageSession>['problem'],
): EstimationNumbers {
  const submitted = stages.find((s) => s.stageId === 'estimation')?.userContent
  if (submitted) {
    return {
      dau: submitted.dau,
      readQps: submitted.readQps,
      writeQps: submitted.writeQps,
      storageGbPerDay: submitted.storageGbPerDay,
    }
  }
  return (
    problem?.expectedScale ?? { dau: 0, readQps: 0, writeQps: 0, storageGbPerDay: 0 }
  )
}

interface ChallengeLocationState {
  stageId: StageId
  finding: Finding
  verdict: ReviewerVerdict
}

function isChallengeLocationState(state: unknown): state is ChallengeLocationState {
  return !!state && typeof state === 'object' && 'finding' in state && 'verdict' in state && 'stageId' in state
}

export function ChallengePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { sessionId, problem, stages, loading } = useStageSession()
  const [justification, setJustification] = useState('')

  const challenge = isChallengeLocationState(location.state) ? location.state : null

  const estimation = useMemo(() => resolveEstimationNumbers(stages, problem), [stages, problem])
  const problemConstraints = useMemo(
    () => ({
      scale: problem?.constraints.scale,
      regions: problem?.constraints.regions,
      latencyTarget: problem?.constraints.latencyTarget,
      knownTradeoffs: problem?.knownTradeoffs ?? [],
    }),
    [problem],
  )

  const arbitration = useArbitration(
    sessionId,
    challenge?.stageId ?? 'requirements',
    challenge?.verdict ?? { score: 0, gateState: 'FLAGGED', findings: [], timeToReview: 0 },
    estimation,
    problemConstraints,
  )

  if (!challenge) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <Swords className="h-6 w-6 text-app-ink-muted" aria-hidden="true" />
        <p className="text-sm text-app-ink-muted">
          No active challenge. Open a stage's review sidebar and challenge a finding to arrive here.
        </p>
        <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    )
  }

  const { stageId, finding, verdict } = challenge
  const returnPath = `/session/${sessionId}/${STAGE_ROUTE_SEGMENT[stageId]}`
  const isBusy = arbitration.status === 'streaming'

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <MonoLabel muted={false} className="block">
            Challenge · {STAGE_LABEL[stageId]}
          </MonoLabel>
          <p className="mt-1 text-xs text-app-ink-muted">
            Argue your case. An arbitration agent rules using your own Stage 2 estimation numbers as ground truth —
            it must cite a specific constraint for every point it awards.
          </p>
        </div>
        <StatusDot gateState={verdict.gateState} showLabel />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Verdict Under Challenge</CardTitle>
          <Badge variant={SEVERITY_VARIANT[finding.severity]}>{finding.severity}</Badge>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <p className="text-sm text-app-ink">{finding.point}</p>
          <p className="font-mono text-[11px] text-app-ink-muted">{finding.evidence}</p>
          {finding.nodeId && <MonoLabel className="text-[9px]">Target node: {finding.nodeId}</MonoLabel>}
          <div className="mt-2 flex items-center gap-2 font-mono text-xs text-app-ink-muted">
            Original score: <span className="text-app-ink">{verdict.score}/10</span>
          </div>
        </CardContent>
      </Card>

      {arbitration.status === 'idle' && (
        <Card>
          <CardHeader>
            <CardTitle>Your Argument</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Textarea
              rows={5}
              placeholder="Justify your design decision against the numbers you already committed to in Stage 2..."
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              disabled={loading}
            />
          </CardContent>
          <CardFooter>
            <Button
              size="sm"
              disabled={loading || justification.trim().length === 0}
              onClick={() => arbitration.submit(justification.trim())}
            >
              Submit Challenge
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate(returnPath)}>
              Cancel
            </Button>
          </CardFooter>
        </Card>
      )}

      <AnimatePresence mode="wait">
        {isBusy && (
          <motion.div
            key="arbitrating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-8">
                <div className="flex items-center gap-4 font-mono text-xs uppercase tracking-[0.15em]">
                  <span className="text-app-ink-muted">AI Reviewer</span>
                  <motion.span
                    animate={{ rotate: [0, 12, -12, 0] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                    className="text-app-navy"
                  >
                    <Swords className="h-4 w-4" aria-hidden="true" />
                  </motion.span>
                  <span className="text-app-ink-muted">You</span>
                </div>
                <Badge variant="navy" className="gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                  Arbitrating
                </Badge>
                <StreamingText
                  text={arbitration.streamedText}
                  className="max-w-xl text-center text-sm leading-relaxed text-app-ink"
                />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {arbitration.status === 'error' && (
        <Card className="border-app-red/50">
          <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
            <XCircle className="h-5 w-5 text-app-red" aria-hidden="true" />
            <p className="text-xs text-app-ink-muted">{arbitration.error}</p>
            <Button size="sm" variant="outline" onClick={() => arbitration.submit(justification.trim())}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {arbitration.status === 'final' && arbitration.ruling && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col gap-4"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="border-app-gold/40">
              <CardHeader>
                <CardTitle>AI Correct On</CardTitle>
                <Gavel className="h-3.5 w-3.5 text-app-gold" aria-hidden="true" />
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {arbitration.ruling.aiCorrectOn.length === 0 && (
                  <p className="text-xs text-app-ink-muted">No points awarded to the AI.</p>
                )}
                {arbitration.ruling.aiCorrectOn.map((point, i) => (
                  <p key={i} className="font-mono text-[11px] leading-relaxed text-app-ink">
                    {point}
                  </p>
                ))}
              </CardContent>
            </Card>

            <Card className="border-app-green/40">
              <CardHeader>
                <CardTitle>You Were Correct On</CardTitle>
                <Swords className="h-3.5 w-3.5 text-app-green" aria-hidden="true" />
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {arbitration.ruling.userCorrectOn.length === 0 && (
                  <p className="text-xs text-app-ink-muted">No points awarded to you this time.</p>
                )}
                {arbitration.ruling.userCorrectOn.map((point, i) => (
                  <p key={i} className="font-mono text-[11px] leading-relaxed text-app-ink">
                    {point}
                  </p>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Nuanced Verdict</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-sm leading-relaxed text-app-ink">{arbitration.ruling.nuancedVerdict}</p>
              <div className="flex items-center justify-between gap-4 rounded-sharp border border-app-border bg-app-surface-muted px-4 py-3">
                <div className="flex items-center gap-3 font-mono text-sm">
                  <span className="text-app-ink-muted line-through">{verdict.score}/10</span>
                  <ArrowRight className="h-3.5 w-3.5 text-app-ink-muted" aria-hidden="true" />
                  <span
                    className={cn(
                      'text-lg font-semibold',
                      arbitration.ruling.adjustedScore >= verdict.score ? 'text-app-green' : 'text-app-red',
                    )}
                  >
                    {arbitration.ruling.adjustedScore}/10
                  </span>
                </div>
                <StatusDot gateState={deriveGateState(arbitration.ruling.adjustedScore)} showLabel pulse />
              </div>
            </CardContent>
            <CardFooter>
              <Button size="sm" onClick={() => navigate(returnPath)}>
                Return to {STAGE_LABEL[stageId]}
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
