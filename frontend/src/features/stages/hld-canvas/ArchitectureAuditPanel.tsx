// Right panel (bottom half) — Section 8's "Architecture Audit" reviewer
// stream, matching the ui-reference canvas mockup's naming. Same 5-state
// pattern as Session 6's ReviewStreamSidebar (idle/streaming/finding/final/
// error), adapted to useHldReviewStream's per-event finding arrival instead
// of a single batch after isFinal — findings render into the list the
// instant they land, synchronized with HldCanvasShell's node-glow trigger.

import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, RotateCcw, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { MonoLabel } from '@/components/common/MonoLabel'
import { StatusDot } from '@/components/common/StatusDot'
import { StreamingText } from '@/components/common/StreamingText'
import type { Finding, ReviewerVerdict, Severity } from '@/domain/review'
import type { HldReviewStatus } from '@/hooks/useHldReviewStream'

const SEVERITY_VARIANT: Record<Severity, 'red' | 'gold' | 'neutral' | 'green'> = {
  CRITICAL: 'red',
  MAJOR: 'gold',
  MINOR: 'neutral',
  SUGGESTION: 'green',
}

export interface ArchitectureAuditPanelProps {
  submitLabel: string
  idleHint: string
  status: HldReviewStatus
  streamedText: string
  findings: Finding[]
  verdict: ReviewerVerdict | null
  error: string | null
  onSubmit: () => void
  onChallenge: (finding: Finding) => void
}

export function ArchitectureAuditPanel({
  submitLabel,
  idleHint,
  status,
  streamedText,
  findings,
  verdict,
  error,
  onSubmit,
  onChallenge,
}: ArchitectureAuditPanelProps) {
  const isBusy = status === 'streaming' || status === 'finding'
  const showStream = status === 'streaming' || status === 'finding' || status === 'final'
  const showFindings = (status === 'finding' || status === 'final') && findings.length > 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <MonoLabel className="block" muted={false}>
            AI Reviewer
          </MonoLabel>
          <h2 className="text-sm font-semibold text-app-ink">Architecture Audit</h2>
        </div>
        {isBusy && (
          <Badge variant="navy" className="shrink-0 gap-1">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" aria-hidden="true" />
            LIVE
          </Badge>
        )}
      </div>

      {status === 'idle' && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-xs text-app-ink-muted">{idleHint}</p>
            <Button size="sm" onClick={onSubmit}>
              {submitLabel}
            </Button>
          </CardContent>
        </Card>
      )}

      {showStream && (
        <Card>
          <CardHeader>
            <CardTitle>Audit Stream</CardTitle>
            {isBusy && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-app-ink-muted" aria-hidden="true" />}
          </CardHeader>
          <CardContent>
            <StreamingText text={streamedText} className="text-sm leading-relaxed text-app-ink" />
          </CardContent>
        </Card>
      )}

      <AnimatePresence initial={false}>
        {showFindings &&
          findings.map((finding, index) => (
            <motion.div
              key={`${finding.point}-${index}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Card className={cn(finding.severity === 'CRITICAL' && 'border-app-red/50')}>
                <CardContent className="flex flex-col gap-2 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={SEVERITY_VARIANT[finding.severity]}>{finding.severity}</Badge>
                    {(finding.severity === 'CRITICAL' || finding.severity === 'MAJOR') && (
                      <button
                        type="button"
                        onClick={() => onChallenge(finding)}
                        className="font-mono text-[10px] uppercase tracking-[0.1em] text-app-navy underline underline-offset-2 hover:text-app-navy-hover"
                      >
                        Challenge
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-app-ink">{finding.point}</p>
                  <p className="font-mono text-[11px] text-app-ink-muted">{finding.evidence}</p>
                  {finding.nodeId && (
                    <MonoLabel className="text-[9px]">Target node: {finding.nodeId}</MonoLabel>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
      </AnimatePresence>

      {status === 'final' && verdict && (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }}>
          <Card>
            <CardContent className="flex items-center justify-between gap-3 py-4">
              <StatusDot gateState={verdict.gateState} showLabel pulse />
              <div className="text-right">
                <div className="font-mono text-2xl font-semibold text-app-ink">
                  {verdict.score}
                  <span className="text-sm text-app-ink-muted">/10</span>
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-app-ink-muted">
                  {verdict.timeToReview}ms
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" onClick={onSubmit}>
                <RotateCcw className="h-3.5 w-3.5" />
                Re-run Audit
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      )}

      {status === 'error' && (
        <Card className="border-app-red/50">
          <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
            <XCircle className="h-5 w-5 text-app-red" aria-hidden="true" />
            <p className="text-xs text-app-ink-muted">{error}</p>
            <Button size="sm" variant="outline" onClick={onSubmit}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
