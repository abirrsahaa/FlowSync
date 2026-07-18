// Section 5's "two reviewer layers" — a deterministic math-validation pass
// that runs before the LLM ever sees the numbers. Purely client-side and
// synchronous so the "MATH: VERIFIED" badge can render the instant Submit is
// clicked, ahead of (and separate from) the streamed LLM commentary.

import type { Problem } from '@/domain/problem'

export interface EstimationValues {
  dau: number
  readQps: number
  writeQps: number
  storageGbPerDay: number
  bandwidthGbps: number
  memoryPerServerGb: number
}

export interface MathValidationResult {
  status: 'verified' | 'warning'
  notes: string[]
}

function withinOrderOfMagnitude(value: number, target: number, factor = 10): boolean {
  if (target <= 0) return true
  return value >= target / factor && value <= target * factor
}

export function runMathValidation(values: EstimationValues, problem: Problem | null): MathValidationResult {
  const notes: string[] = []
  let status: MathValidationResult['status'] = 'verified'

  if (values.writeQps > values.readQps) {
    status = 'warning'
    notes.push('Write QPS exceeds read QPS — unusual for a read-heavy platform like this one.')
  }

  if (problem) {
    if (!withinOrderOfMagnitude(values.dau, problem.expectedScale.dau)) {
      status = 'warning'
      notes.push(
        `DAU is more than 10x off the expected scale for ${problem.title} (${problem.expectedScale.dau.toLocaleString()}).`,
      )
    }
    if (!withinOrderOfMagnitude(values.readQps, problem.expectedScale.readQps)) {
      status = 'warning'
      notes.push(
        `Read QPS diverges sharply from the expected ${problem.expectedScale.readQps.toLocaleString()} for this problem.`,
      )
    }
  }

  if (values.bandwidthGbps <= 0) {
    notes.push('Bandwidth was left at 0 — derive it from storage/day and read QPS before Stage 5.')
  }

  if (status === 'verified' && notes.length === 0) {
    notes.push('DAU-to-QPS derivation and storage/day figures check out against typical ratios for this scale.')
  }

  return { status, notes }
}
