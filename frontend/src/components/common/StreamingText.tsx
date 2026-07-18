// Renders text arriving token-by-token from an async generator (or a plain
// string, rendered instantly) — the shared primitive behind every review
// stream panel's "streaming text" state (Section 14).

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

export interface StreamingTextProps {
  stream?: AsyncIterable<string>
  text?: string
  className?: string
  cursorClassName?: string
  onDone?: () => void
}

export function StreamingText({ stream, text, className, cursorClassName, onDone }: StreamingTextProps) {
  const [content, setContent] = useState('')
  const [done, setDone] = useState(!stream)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    if (!stream) {
      setContent(text ?? '')
      setDone(true)
      return
    }

    let cancelled = false
    setContent('')
    setDone(false)

    async function consume() {
      for await (const token of stream!) {
        if (cancelled) return
        setContent((prev) => prev + token)
      }
      if (!cancelled) {
        setDone(true)
        onDoneRef.current?.()
      }
    }

    consume()
    return () => {
      cancelled = true
    }
  }, [stream, text])

  return (
    <span className={cn('whitespace-pre-wrap', className)}>
      {content}
      {!done && (
        <span
          className={cn('ml-0.5 inline-block h-[1em] w-[2px] animate-pulse bg-current align-middle', cursorClassName)}
          aria-hidden="true"
        />
      )}
    </span>
  )
}
