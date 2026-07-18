// Tracks which stages are submitted and their gate state for the current mock
// session. StageTopNav (Session 3) reads this to render the progress rail;
// gate state here is always advisory (Section 5's "never a hard blocker") —
// nothing in this store should ever be read as a permission to navigate.

import { create } from 'zustand'
import type { GateState } from '@/domain/review'
import type { StageId } from '@/domain/session'

export type StageStatus = 'not_started' | 'submitted'

export interface StageProgress {
  status: StageStatus
  score?: number
  gateState?: GateState
  challenged?: boolean
}

const STAGE_IDS: StageId[] = ['requirements', 'estimation', 'api', 'datamodel', 'hld', 'deepdive']

function initialStages(): Record<StageId, StageProgress> {
  return STAGE_IDS.reduce(
    (acc, id) => {
      acc[id] = { status: 'not_started' }
      return acc
    },
    {} as Record<StageId, StageProgress>,
  )
}

interface SessionProgressState {
  sessionId: string | null
  stages: Record<StageId, StageProgress>
  startSession: (sessionId: string) => void
  recordVerdict: (stageId: StageId, score: number, gateState: GateState) => void
  recordChallengeOutcome: (stageId: StageId, adjustedScore: number, gateState: GateState) => void
  reset: () => void
}

export const useSessionProgressStore = create<SessionProgressState>((set) => ({
  sessionId: null,
  stages: initialStages(),

  startSession: (sessionId) => set({ sessionId, stages: initialStages() }),

  recordVerdict: (stageId, score, gateState) =>
    set((state) => ({
      stages: {
        ...state.stages,
        [stageId]: { status: 'submitted', score, gateState, challenged: false },
      },
    })),

  recordChallengeOutcome: (stageId, adjustedScore, gateState) =>
    set((state) => ({
      stages: {
        ...state.stages,
        [stageId]: {
          ...state.stages[stageId],
          status: 'submitted',
          score: adjustedScore,
          gateState,
          challenged: true,
        },
      },
    })),

  reset: () => set({ sessionId: null, stages: initialStages() }),
}))
