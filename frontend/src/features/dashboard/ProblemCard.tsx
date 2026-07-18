import { PlaySquare, Camera, MessageSquare, Link2 } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MonoLabel } from '@/components/common/MonoLabel'
import type { Problem } from '@/domain/problem'

const DIFFICULTY_VARIANT = {
  easy: 'green',
  medium: 'gold',
  hard: 'red',
} as const

const PROBLEM_ICON: Record<string, typeof PlaySquare> = {
  'design-youtube': PlaySquare,
  'design-instagram': Camera,
  'whatsapp-clone': MessageSquare,
  tinyurl: Link2,
}

function formatCompact(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(0)} Billion`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)} Million`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return `${n}`
}

export interface ProblemCardProps {
  problem: Problem
  completedScore?: number
  isRecommended?: boolean
  recommendedReason?: string
  onStart: () => void
  onReview: () => void
}

export function ProblemCard({
  problem,
  completedScore,
  isRecommended,
  recommendedReason,
  onStart,
  onReview,
}: ProblemCardProps) {
  const Icon = PROBLEM_ICON[problem.id] ?? PlaySquare
  const isCompleted = completedScore !== undefined
  const readWriteRatio = Math.round(problem.expectedScale.readQps / problem.expectedScale.writeQps)

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sharp border border-app-border bg-app-surface-muted">
            <Icon className="h-4 w-4 text-app-ink" strokeWidth={1.75} />
          </div>
          <div>
            <CardTitleText>{problem.title}</CardTitleText>
            <Badge variant={DIFFICULTY_VARIANT[problem.difficulty]} className="mt-1">
              {problem.difficulty}
            </Badge>
          </div>
        </div>
        {isCompleted && (
          <Badge variant="green" className="shrink-0 rotate-2 border-2">
            Completed
          </Badge>
        )}
        {!isCompleted && isRecommended && (
          <Badge variant="navy" className="shrink-0">
            Recommended
          </Badge>
        )}
      </CardHeader>

      <CardContent className="flex-1">
        {completedScore !== undefined && (
          <>
            <MonoLabel className="block">Technical Constraints</MonoLabel>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <div>
                <MonoLabel className="block text-[10px]">Ingest Rate</MonoLabel>
                <span className="font-mono text-sm text-app-ink">
                  {formatCompact(problem.expectedScale.storageGbPerDay)} GB/day
                </span>
              </div>
              <div>
                <MonoLabel className="block text-[10px]">Read:Write Ratio</MonoLabel>
                <span className="font-mono text-sm text-app-ink">{readWriteRatio}:1</span>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-sharp bg-app-surface-muted p-3">
              <span className="font-mono text-2xl font-semibold text-app-green">{completedScore.toFixed(1)}</span>
              <MonoLabel className="text-right text-[10px]">
                Overall
                <br />
                Precision Score
              </MonoLabel>
            </div>
          </>
        )}

        {!isCompleted && isRecommended && (
          <>
            <p className="text-sm italic leading-relaxed text-app-ink-muted">{recommendedReason}</p>
            <MonoLabel className="mt-3 block">Architectural Constraints</MonoLabel>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <div>
                <MonoLabel className="block text-[10px]">DAU</MonoLabel>
                <span className="font-mono text-sm text-app-ink">{formatCompact(problem.expectedScale.dau)}</span>
              </div>
              <div>
                <MonoLabel className="block text-[10px]">Storage</MonoLabel>
                <span className="font-mono text-sm text-app-ink">
                  {formatCompact(problem.expectedScale.storageGbPerDay)} GB/day
                </span>
              </div>
            </div>
          </>
        )}

        {!isCompleted && !isRecommended && (
          <>
            <MonoLabel className="block">Core Concepts</MonoLabel>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {problem.concepts.slice(0, 3).map((concept) => (
                <Badge key={concept} variant="neutral">
                  {concept}
                </Badge>
              ))}
            </div>
          </>
        )}
      </CardContent>

      <CardFooter>
        {isCompleted ? (
          <Button variant="primary" className="w-full" onClick={onReview}>
            Review Submission
          </Button>
        ) : isRecommended ? (
          <Button variant="primary" className="w-full" onClick={onStart}>
            Start Blueprint
          </Button>
        ) : (
          <Button variant="outline" className="w-full" onClick={onStart}>
            Access Specs
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

function CardTitleText({ children }: { children: string }) {
  return <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.1em] text-app-ink">{children}</h3>
}
