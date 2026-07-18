// Section 25.2 — FlowSync-issued JWT claims / the user record derived from
// Google OAuth (sub, email, name, picture). FlowSync never stores or forwards
// Google's own token past the initial /api/auth/google exchange.

export interface User {
  id: string // internal userId (UUID) — the JWT "sub", not Google's sub
  email: string
  name: string
  picture?: string
  roles: Array<'user' | 'interviewer'>
}

// Dashboard-only aggregates — not part of Section 20's wire contracts, derived
// from a user's session history the same way the real backend would compute
// them (an aggregation over SessionDocuments), not a separate stored entity.

export interface SkillProficiency {
  axis: string // e.g. "CDN", "Database" — matches concept tags on Problem
  score: number // 0-10
}

export interface UserStats {
  userId: string
  designation: string // "Senior II"
  rankLabel: string // "L6 Rank"
  avgPrecisionScore: number
  conceptsMastered: number
  streakDays: number
  skillProficiency: SkillProficiency[]
}

export interface HistoricalLogEntry {
  sessionId: string // links to a real SessionDocument/FinalReport
  problemId: string
  problemTitle: string
  problemVersion: number
  score: number
  topGap: string
  completedAt: Date
}
