// Section 20 — StageOutput / SessionDocument, mirrored exactly.

import type { ComponentGraph } from './canvas'
import type { ChallengeOutcome, ReviewerVerdict } from './review'

export type StageId = 'requirements' | 'estimation' | 'api' | 'datamodel' | 'hld' | 'deepdive'

export interface StageOutput {
  stageId: StageId
  completedAt: Date
  timeSpentSeconds: number
  userContent: {
    // stage 1: { functional: string[], nonFunctional: string[], optional: string[] }
    // stage 2: { dau: number, readQps: number, writeQps: number, ... }
    // stage 3: { endpoints: Endpoint[], authStrategy: string, ... }
    // stage 4: { tables: Table[], indexes: Index[], storageChoices: ... }
    // stage 5: { componentGraph: ComponentGraph, checklistCompletion: ... }
    // stage 6: { focusComponent: string, lldDecisions: string[] }
    [key: string]: any
  }
  reviewerVerdict: ReviewerVerdict
  challengeOutcome?: ChallengeOutcome
}

export interface SessionDocument {
  sessionId: string
  problemId: string
  userId: string
  startedAt: Date
  completedAt?: Date
  stages: StageOutput[]
  finalCanvas?: ComponentGraph // from HLD stage
  multiplayerUsers?: string[] // if mock interview
  audioTranscript?: {
    // if voice recorded
    entries: Array<{ userId: string; timestamp: Date; text: string }>
  }
}
