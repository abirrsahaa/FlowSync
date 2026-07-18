import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { AnimatedNumber } from './AnimatedNumber'
import type { GateState } from '@/domain/review'

const GATE_STROKE: Record<GateState, string> = {
  OPEN: 'var(--gate-open)',
  SOFT: 'var(--gate-soft)',
  FLAGGED: 'var(--gate-flagged)',
}

export interface ScoreRingProps {
  score: number // 0-10
  gateState?: GateState
  size?: number
  strokeWidth?: number
  label?: string
  className?: string
}

export function ScoreRing({
  score,
  gateState,
  size = 128,
  strokeWidth = 8,
  label,
  className,
}: ScoreRingProps) {
  const [animatedPct, setAnimatedPct] = useState(0)
  const pct = Math.max(0, Math.min(100, (score / 10) * 100))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (animatedPct / 100) * circumference
  const stroke = gateState ? GATE_STROKE[gateState] : 'var(--app-navy)'

  useEffect(() => {
    const raf = requestAnimationFrame(() => setAnimatedPct(pct))
    return () => cancelAnimationFrame(raf)
  }, [pct])

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--app-border)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-3xl font-semibold text-app-ink">
          <AnimatedNumber value={score} decimals={1} durationMs={1100} />
        </span>
        {label && (
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-app-ink-muted">{label}</span>
        )}
      </div>
    </div>
  )
}
