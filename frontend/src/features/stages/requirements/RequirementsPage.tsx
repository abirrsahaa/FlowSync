// Stage 1 — Requirements Gathering. Section 5: three sections (functional /
// non-functional / optional), reviewed by a conversational AI for
// completeness and measurability. The inline "Ambiguity Detected" diff card
// (ui-reference 10.10.15 PM) runs as a local heuristic, independent of the
// submit-triggered AI review stream — see ambiguity.ts.

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { MonoLabel } from '@/components/common/MonoLabel'
import { useReviewStream } from '@/hooks/useReviewStream'
import type { Finding } from '@/domain/review'
import { ReviewStreamSidebar } from '../shared/ReviewStreamSidebar'
import { StagePageLayout } from '../shared/StagePageLayout'
import { useStageSession } from '../shared/useStageSession'
import { detectAmbiguities } from './ambiguity'

interface RequirementItem {
  id: string
  code: string
  title: string
  description: string
}

let itemCounter = 0
function makeItem(code: string, title: string, description: string): RequirementItem {
  itemCounter += 1
  return { id: `req-${itemCounter}`, code, title, description }
}

function seedFunctional(): RequirementItem[] {
  return [
    makeItem('F-01', 'Video Upload', 'Users must be able to upload video content in various formats (MP4, MKV, AVI) with automatic transcoding.'),
    makeItem('F-02', 'Metadata Search', 'Elasticsearch-backed retrieval for video titles and tags with sub-second latency targets.'),
    makeItem('F-03', 'View Counts', 'Real-time counter synchronization using a distributed service to maintain consistency.'),
  ]
}

function seedNonFunctional(): RequirementItem[] {
  return [
    makeItem('NF-01', 'Uptime', '99.9% uptime for the control plane and data plane across regional deployments.'),
    makeItem('NF-02', 'Availability', 'System must be highly available globally for all users at all times.'),
  ]
}

function seedOptional(): RequirementItem[] {
  return [
    makeItem('O-01', 'Recommendations', 'Personalized video recommendations based on watch history.'),
    makeItem('O-02', 'Moderation', 'Automated copyright and abuse moderation pipeline for uploaded content.'),
  ]
}

function parseSavedItems(prefix: string, saved: string[]): RequirementItem[] {
  return saved.map((entry, i) => {
    const sep = entry.indexOf(': ')
    const title = sep === -1 ? entry : entry.slice(0, sep)
    const description = sep === -1 ? '' : entry.slice(sep + 2)
    return makeItem(`${prefix}-${String(i + 1).padStart(2, '0')}`, title, description)
  })
}

function nextCode(prefix: string, maxSuffix: number) {
  return `${prefix}-${String(maxSuffix + 1).padStart(2, '0')}`
}

function highestSuffix(prefix: string, items: RequirementItem[]) {
  const codePattern = new RegExp(`^${prefix}-(\\d+)$`)
  return items.reduce((max, item) => {
    const match = codePattern.exec(item.code)
    const suffix = match ? Number(match[1]) : 0
    return Math.max(max, suffix)
  }, 0)
}

interface RequirementSectionProps {
  title: string
  prefix: string
  items: RequirementItem[]
  onChange: (items: RequirementItem[]) => void
  flaggedIds: Set<string>
}

function RequirementSection({ title, prefix, items, onChange, flaggedIds }: RequirementSectionProps) {
  function updateItem(id: string, patch: Partial<RequirementItem>) {
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }
  function removeItem(id: string) {
    onChange(items.filter((item) => item.id !== id))
  }
  function addItem() {
    onChange([...items, makeItem(nextCode(prefix, highestSuffix(prefix, items)), 'New Requirement', '')])
  }

  return (
    <section className="flex flex-col gap-3">
      <MonoLabel muted={false}>{title}</MonoLabel>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <Card key={item.id} className={cn(flaggedIds.has(item.id) && 'border-app-gold/60')}>
            <CardContent className="flex flex-col gap-2 py-3">
              <div className="flex items-center justify-between">
                <MonoLabel>{item.code}</MonoLabel>
                <div className="flex items-center gap-2">
                  {flaggedIds.has(item.id) && <Badge variant="gold">Ambiguity detected</Badge>}
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    aria-label={`Remove ${item.code}`}
                    className="text-app-ink-muted transition-colors hover:text-app-red"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <Input
                value={item.title}
                onChange={(e) => updateItem(item.id, { title: e.target.value })}
                className="font-semibold"
                aria-label={`${item.code} title`}
              />
              <Textarea
                value={item.description}
                onChange={(e) => updateItem(item.id, { description: e.target.value })}
                rows={3}
                aria-label={`${item.code} description`}
              />
            </CardContent>
          </Card>
        ))}
        <button
          type="button"
          onClick={addItem}
          className="flex min-h-[9rem] flex-col items-center justify-center gap-2 rounded-sharp border border-dashed border-app-border-strong text-app-ink-muted transition-colors hover:border-app-navy hover:text-app-navy"
        >
          <Plus className="h-5 w-5" />
          <span className="font-mono text-xs uppercase tracking-[0.1em]">New Requirement</span>
        </button>
      </div>
    </section>
  )
}

export function RequirementsPage() {
  const { sessionId, problem, stages, loading } = useStageSession()
  const navigate = useNavigate()
  const review = useReviewStream('requirements', sessionId)

  const [functional, setFunctional] = useState<RequirementItem[]>(seedFunctional)
  const [nonFunctional, setNonFunctional] = useState<RequirementItem[]>(seedNonFunctional)
  const [optional, setOptional] = useState<RequirementItem[]>(seedOptional)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (loading) return
    const saved = stages.find((s) => s.stageId === 'requirements')?.userContent as
      | { functional: string[]; nonFunctional: string[]; optional: string[] }
      | undefined
    setFunctional(saved ? parseSavedItems('F', saved.functional) : seedFunctional())
    setNonFunctional(saved ? parseSavedItems('NF', saved.nonFunctional) : seedNonFunctional())
    setOptional(saved ? parseSavedItems('O', saved.optional) : seedOptional())
    setDismissed(new Set())
  }, [sessionId, loading, stages])

  const ambiguities = useMemo(
    () => detectAmbiguities(nonFunctional).filter((hit) => !dismissed.has(hit.key)),
    [nonFunctional, dismissed],
  )
  const flaggedIds = useMemo(() => new Set(ambiguities.map((a) => a.itemId)), [ambiguities])

  function applyFix(hit: (typeof ambiguities)[number]) {
    setNonFunctional((items) =>
      items.map((item) =>
        item.id === hit.itemId ? { ...item, description: item.description.replace(hit.matched, hit.suggestion) } : item,
      ),
    )
  }

  function ignoreAmbiguity(key: string) {
    setDismissed((prev) => new Set(prev).add(key))
  }

  function handleSubmit() {
    review.submit({
      functional: functional.map((i) => `${i.title}: ${i.description}`),
      nonFunctional: nonFunctional.map((i) => `${i.title}: ${i.description}`),
      optional: optional.map((i) => `${i.title}: ${i.description}`),
    })
  }

  function handleChallenge(finding: Finding) {
    navigate(`/session/${sessionId}/challenge`, {
      state: { stageId: 'requirements', finding, verdict: review.verdict },
    })
  }

  return (
    <StagePageLayout
      sidebar={
        <ReviewStreamSidebar
          reviewerName="Requirements Reviewer"
          reviewerTagline="Checks completeness, specificity, measurability"
          status={review.status}
          streamedText={review.streamedText}
          findings={review.findings}
          verdict={review.verdict}
          error={review.error}
          onSubmit={handleSubmit}
          onChallenge={handleChallenge}
          beforeStream={
            ambiguities.length > 0 && (
              <div className="flex flex-col gap-3">
                {ambiguities.map((hit) => (
                  <Card key={hit.key} className="border-app-gold/50 bg-app-gold/5">
                    <CardContent className="flex flex-col gap-2 py-3">
                      <div className="flex items-center gap-2 text-app-gold">
                        <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                        <span className="font-mono text-xs font-semibold uppercase tracking-[0.1em]">
                          Ambiguity Detected
                        </span>
                      </div>
                      <p className="text-xs text-app-ink-muted">
                        <span className="font-semibold text-app-ink">{hit.code} finding:</span> the term{' '}
                        <mark className="bg-app-gold/30 px-1 text-app-ink">&quot;{hit.matched}&quot;</mark> is non-measurable
                        and too vague for architectural sign-off.
                      </p>
                      <div className="rounded-sharp border border-app-border bg-app-surface px-2 py-1.5">
                        <MonoLabel className="block">Suggested Revision</MonoLabel>
                        <span className="font-mono text-sm text-app-ink">&quot;{hit.suggestion}&quot;</span>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => applyFix(hit)}>
                          Apply Fix
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => ignoreAmbiguity(hit.key)}>
                          Ignore
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          }
        />
      }
    >
      <div>
        <h1 className="text-xl font-semibold text-app-ink">
          System Requirements{problem ? `: ${problem.title}` : ''}
        </h1>
        <p className="mt-1 text-sm text-app-ink-muted">
          Define specifications with architectural precision. All drafts are subject to real-time AI sanity checks.
        </p>
      </div>

      <RequirementSection
        title="Functional Requirements"
        prefix="F"
        items={functional}
        onChange={setFunctional}
        flaggedIds={new Set()}
      />
      <RequirementSection
        title="Non-Functional Requirements"
        prefix="NF"
        items={nonFunctional}
        onChange={setNonFunctional}
        flaggedIds={flaggedIds}
      />
      <RequirementSection
        title="Optional / Nice-to-have"
        prefix="O"
        items={optional}
        onChange={setOptional}
        flaggedIds={new Set()}
      />
    </StagePageLayout>
  )
}
