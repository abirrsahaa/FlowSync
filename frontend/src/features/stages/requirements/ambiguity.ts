// Client-side "live feedback loop" ambiguity detector for non-functional
// requirements — mirrors the mockup's inline "Ambiguity Detected" diff card
// without needing an AI round-trip. Deliberately simple: a fixed dictionary
// of non-measurable terms mapped to a measurable suggestion.

export interface AmbiguousItem {
  id: string
  code: string
  description: string
}

export interface AmbiguityHit {
  key: string // unique per (item, term) — used as both React key and dismiss key
  itemId: string
  code: string
  matched: string
  suggestion: string
}

interface VagueTermRule {
  pattern: RegExp
  suggestion: string
}

const VAGUE_TERMS: VagueTermRule[] = [
  { pattern: /highly available/i, suggestion: '99.9% uptime' },
  { pattern: /\bfast\b/i, suggestion: 'p99 latency under 200ms' },
  { pattern: /\bscalable\b/i, suggestion: 'handles 10x current peak QPS without degradation' },
  { pattern: /real[- ]?time/i, suggestion: 'updates propagate within 2 seconds' },
  { pattern: /\brobust\b/i, suggestion: 'error rate under 0.01%' },
  { pattern: /user[- ]friendly/i, suggestion: 'core task completable in under 3 clicks' },
]

export function detectAmbiguities(items: AmbiguousItem[]): AmbiguityHit[] {
  const hits: AmbiguityHit[] = []

  for (const item of items) {
    for (const rule of VAGUE_TERMS) {
      const match = item.description.match(rule.pattern)
      if (match) {
        hits.push({
          key: `${item.id}:${match[0].toLowerCase()}`,
          itemId: item.id,
          code: item.code,
          matched: match[0],
          suggestion: rule.suggestion,
        })
        break // one flagged term per item keeps the sidebar from flooding
      }
    }
  }

  return hits
}
