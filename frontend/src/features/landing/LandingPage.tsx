// ui_improvements.md §0: the previous mockup marketed cloud infrastructure
// telemetry, not FlowSync. This rewrites the copy around the six-stage,
// AI-reviewed interview flow while keeping the dark mission-control visual
// language (dot-grid bg, monospace data, MarketingShell).

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, GitCompareArrows } from 'lucide-react'
import { MarketingShell } from '@/components/layout/MarketingShell'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MonoLabel } from '@/components/common/MonoLabel'
import { useServices } from '@/services/ServiceProvider'
import type { Problem } from '@/domain/problem'
import { LANDING_STAGES } from './stages'

const DIFFICULTY_VARIANT = {
  easy: 'green',
  medium: 'gold',
  hard: 'red',
} as const

export function LandingPage() {
  const { problemsService } = useServices()
  const navigate = useNavigate()
  const [problems, setProblems] = useState<Problem[]>([])

  useEffect(() => {
    let cancelled = false
    problemsService.listProblems().then((result) => {
      if (!cancelled) setProblems(result)
    })
    return () => {
      cancelled = true
    }
  }, [problemsService])

  return (
    <MarketingShell
      header={
        <nav className="flex items-center gap-6">
          <a
            href="#how-it-works"
            className="hidden font-mono text-xs uppercase tracking-[0.1em] text-console-ink-muted hover:text-console-ink sm:inline"
          >
            How it works
          </a>
          <a
            href="#problems"
            className="hidden font-mono text-xs uppercase tracking-[0.1em] text-console-ink-muted hover:text-console-ink sm:inline"
          >
            Problems
          </a>
          <Button variant="console" size="sm" onClick={() => navigate('/auth')}>
            Sign in
          </Button>
        </nav>
      }
    >
      {/* Hero */}
      <section className="mx-auto flex w-full max-w-5xl flex-col items-center px-6 pb-20 pt-24 text-center">
        <MonoLabel className="mb-6 text-console-mint">Six-stage · AI-reviewed · Interview practice</MonoLabel>
        <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-console-ink sm:text-5xl">
          System design prep has no feedback loop.
          <br />
          <span className="text-console-mint">FlowSync is the test case.</span>
        </h1>
        <p className="mt-6 max-w-xl text-balance text-sm leading-relaxed text-console-ink-muted sm:text-base">
          LeetCode has test cases for algorithms. System design candidates get YouTube videos and a
          whiteboard, with no idea whether the design is actually good. FlowSync walks you through six
          stages of a real interview — requirements, estimation, API design, data model, an HLD canvas,
          and a deep dive — and an AI reviewer scores every stage as you go.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button variant="console" size="lg" onClick={() => navigate('/auth')}>
            Start a session
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button variant="outline" size="lg" asChild className="border-console-border text-console-ink">
            <a href="#how-it-works">See how it works</a>
          </Button>
        </div>

        <dl className="mt-16 grid w-full max-w-2xl grid-cols-3 gap-px overflow-hidden rounded-sharp border border-console-border bg-console-border">
          <div className="bg-console-bg px-4 py-5">
            <dt className="font-mono text-[10px] uppercase tracking-[0.1em] text-console-ink-muted">Stages</dt>
            <dd className="mt-1 font-mono text-2xl font-semibold text-console-ink">6</dd>
          </div>
          <div className="bg-console-bg px-4 py-5">
            <dt className="font-mono text-[10px] uppercase tracking-[0.1em] text-console-ink-muted">
              Reviewer agents
            </dt>
            <dd className="mt-1 font-mono text-2xl font-semibold text-console-ink">8</dd>
          </div>
          <div className="bg-console-bg px-4 py-5">
            <dt className="font-mono text-[10px] uppercase tracking-[0.1em] text-console-ink-muted">
              Problems ready
            </dt>
            <dd className="mt-1 font-mono text-2xl font-semibold text-console-ink">{problems.length || '—'}</dd>
          </div>
        </dl>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-console-border px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <MonoLabel className="text-console-mint">How it works</MonoLabel>
          <h2 className="mt-2 text-2xl font-semibold text-console-ink">One session, six stages, scored end to end.</h2>
          <div className="mt-10 grid gap-px overflow-hidden rounded-sharp border border-console-border bg-console-border sm:grid-cols-2 lg:grid-cols-3">
            {LANDING_STAGES.map((stage) => (
              <div key={stage.order} className="bg-console-bg p-5">
                <span className="font-mono text-xs text-console-mint">{stage.order}</span>
                <h3 className="mt-2 font-mono text-sm font-semibold uppercase tracking-[0.06em] text-console-ink">
                  {stage.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-console-ink-muted">{stage.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Challenge mechanic */}
      <section className="border-t border-console-border px-6 py-20">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 rounded-sharp border border-console-border bg-console-surface p-8 sm:flex-row sm:items-center">
          <GitCompareArrows className="h-8 w-8 shrink-0 text-console-mint" aria-hidden="true" />
          <div>
            <MonoLabel className="text-console-mint">The verdict isn't final</MonoLabel>
            <h2 className="mt-2 text-xl font-semibold text-console-ink">You can challenge the AI — and win.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-console-ink-muted">
              Disagree with a finding? Write a justification. A separate arbitration agent rules using
              your own capacity-estimation numbers as ground truth, and it's bound by a mandatory-citation
              rule — it can never just say "the AI was right."
            </p>
          </div>
        </div>
      </section>

      {/* Problem library preview */}
      <section id="problems" className="border-t border-console-border px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <MonoLabel className="text-console-mint">Problem library</MonoLabel>
          <h2 className="mt-2 text-2xl font-semibold text-console-ink">Pick a problem, not a blank canvas.</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {problems.map((problem) => (
              <div key={problem.id} className="flex flex-col rounded-sharp border border-console-border bg-console-surface p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-console-ink">{problem.title}</h3>
                  <Badge variant={DIFFICULTY_VARIANT[problem.difficulty]}>{problem.difficulty}</Badge>
                </div>
                <p className="mt-2 line-clamp-3 flex-1 text-xs leading-relaxed text-console-ink-muted">
                  {problem.prompt}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {problem.concepts.slice(0, 3).map((concept) => (
                    <Badge key={concept} variant="neutral" className="border-console-border bg-transparent text-console-ink-muted">
                      {concept}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-console-border px-6 py-20 text-center">
        <h2 className="text-2xl font-semibold text-console-ink">Start your first session.</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-console-ink-muted">
          Sign in with Google — no password, no setup, straight into Design YouTube.
        </p>
        <Button variant="console" size="lg" className="mt-6" onClick={() => navigate('/auth')}>
          Start a session
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </section>

      <footer className="border-t border-console-border px-6 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.1em] text-console-ink-muted sm:flex-row">
          <span>FlowSync</span>
          <Link to="/auth" className="hover:text-console-ink">
            Sign in
          </Link>
        </div>
      </footer>
    </MarketingShell>
  )
}
