// Section 20 — Finding / ReviewerVerdict / ChallengeOutcome, mirrored exactly.
// These are the shapes every stage reviewer and the arbitration agent produce;
// the Python ai-reviewer service mirrors the same fields as Pydantic models.

export type Severity = 'CRITICAL' | 'MAJOR' | 'MINOR' | 'SUGGESTION'

export interface Finding {
  severity: Severity
  point: string // the finding text
  evidence: string // specific constraint or number it references
  nodeId?: string // for HLD stage — which component
  checkpointId?: string // for HLD stage — which checklist item
}

export type GateState = 'OPEN' | 'SOFT' | 'FLAGGED'

export interface ReviewerVerdict {
  score: number // 0-10
  gateState: GateState
  findings: Finding[]
  timeToReview: number // ms from submission to verdict
}

export interface ChallengeOutcome {
  userJustification: string
  userCorrectOn: string[] // what the user won
  aiCorrectOn: string[] // what the AI was right about
  nuancedVerdict: string // the comparative ruling
  adjustedScore: number // may differ from original reviewerVerdict.score
}

// Section 9 — gate state is never a hard blocker; it's the same OPEN/SOFT/FLAGGED
// threshold whether the score comes from the original verdict or an arbitrated one.
export function deriveGateState(score: number): GateState {
  if (score >= 7) return 'OPEN'
  if (score >= 4) return 'SOFT'
  return 'FLAGGED'
}
