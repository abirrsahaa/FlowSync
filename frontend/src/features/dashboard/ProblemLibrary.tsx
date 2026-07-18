import { useMemo, useState } from 'react'
import { ListFilter, ArrowUpDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import type { Problem } from '@/domain/problem'
import type { HistoricalLogEntry } from '@/domain/user'
import type { RecommendedProblem } from '@/services/interfaces/DashboardService'
import { ProblemCard } from './ProblemCard'

type DifficultyFilter = 'all' | Problem['difficulty']
type SortKey = 'default' | 'title' | 'difficulty'

const DIFFICULTY_RANK: Record<Problem['difficulty'], number> = { easy: 0, medium: 1, hard: 2 }

export interface ProblemLibraryProps {
  problems: Problem[]
  historicalLogs: HistoricalLogEntry[]
  recommendedProblem?: RecommendedProblem
  onStart: (problemId: string) => void
  onReview: (sessionId: string) => void
}

export function ProblemLibrary({
  problems,
  historicalLogs,
  recommendedProblem,
  onStart,
  onReview,
}: ProblemLibraryProps) {
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('default')

  const latestLogByProblem = useMemo(() => {
    const map = new Map<string, HistoricalLogEntry>()
    for (const log of historicalLogs) {
      const existing = map.get(log.problemId)
      if (!existing || log.completedAt > existing.completedAt) map.set(log.problemId, log)
    }
    return map
  }, [historicalLogs])

  const visibleProblems = useMemo(() => {
    let list = problems
    if (difficultyFilter !== 'all') {
      list = list.filter((p) => p.difficulty === difficultyFilter)
    }
    if (sortKey === 'title') {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title))
    } else if (sortKey === 'difficulty') {
      list = [...list].sort((a, b) => DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty])
    }
    return list
  }, [problems, difficultyFilter, sortKey])

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-app-ink">Problem Library</h1>
          <p className="mt-1 text-sm text-app-ink-muted">Architectural scenarios for evaluation.</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <ListFilter className="h-3.5 w-3.5" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Difficulty</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={difficultyFilter}
                onValueChange={(v) => setDifficultyFilter(v as DifficultyFilter)}
              >
                <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="easy">Easy</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="medium">Medium</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="hard">Hard</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <ArrowUpDown className="h-3.5 w-3.5" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                <DropdownMenuRadioItem value="default">Library order</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="title">Title (A–Z)</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="difficulty">Difficulty</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {visibleProblems.map((problem) => {
          const log = latestLogByProblem.get(problem.id)
          return (
            <ProblemCard
              key={problem.id}
              problem={problem}
              completedScore={log?.score}
              isRecommended={recommendedProblem?.problemId === problem.id}
              recommendedReason={recommendedProblem?.reason}
              onStart={() => onStart(problem.id)}
              onReview={() => log && onReview(log.sessionId)}
            />
          )
        })}
        {visibleProblems.length === 0 && (
          <p className="col-span-full py-12 text-center text-sm text-app-ink-muted">
            No problems match this filter.
          </p>
        )}
      </div>
    </div>
  )
}
