import { useEffect, useRef, useState } from 'react'

export interface AnimatedNumberProps {
  value: number
  durationMs?: number
  decimals?: number
  className?: string
  suffix?: string
}

export function AnimatedNumber({ value, durationMs = 900, decimals = 0, className, suffix = '' }: AnimatedNumberProps) {
  const [display, setDisplay] = useState(0)
  const frameRef = useRef<number>(0)

  useEffect(() => {
    const start = performance.now()
    const from = 0

    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(1, elapsed / durationMs)
      const eased = 1 - (1 - progress) ** 3 // ease-out-cubic
      setDisplay(from + (value - from) * eased)
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick)
      }
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [value, durationMs])

  return (
    <span className={className}>
      {display.toFixed(decimals)}
      {suffix}
    </span>
  )
}
