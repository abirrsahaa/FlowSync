// Section 20 (Problem) + Section 8/25.4 (Checklist — never formally interfaced
// in Section 20's TS block, only shown as JSON; typed here since ProblemsService
// needs a return shape for getChecklist).

export interface Problem {
  id: string
  title: string // "Design YouTube"
  difficulty: 'easy' | 'medium' | 'hard'
  concepts: string[] // ["cdn", "streaming", "distributed-storage"]
  prompt: string // full problem statement shown to user
  constraints: {
    scale: string // "100M daily active users"
    regions: string // "global"
    latencyTarget: string // "< 200ms video start time"
  }
  expectedScale: {
    // used by estimation reviewer as target
    dau: number
    readQps: number
    writeQps: number
    storageGbPerDay: number
  }
  checklistId: string // links to AI-generated checklist
  knownTradeoffs: Array<{
    // used by arbitration agent as reference
    topic: string
    atScale: string
    recommendation: string
  }>
  status: 'DRAFT' | 'PUBLISHED'
}

export interface ChecklistItem {
  id: string
  label: string
  required: boolean
  nested?: ChecklistItem[]
}

export interface Checklist {
  checklistId: string
  problemId: string
  version: number
  status: 'DRAFT' | 'PUBLISHED'
  checkpoints: ChecklistItem[]
}
