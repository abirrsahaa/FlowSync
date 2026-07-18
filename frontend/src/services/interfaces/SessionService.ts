// Owns SessionDocument persistence (mocked in-memory here, Postgres per
// Section 25.3 in the real backend). ReviewStreamService produces verdicts/
// outcomes; this service is where they get attached to a StageOutput and
// where the session's finalCanvas/completedAt get set.

import type { ChallengeOutcome, ReviewerVerdict } from '@/domain/review'
import type { SessionDocument, StageId, StageOutput } from '@/domain/session'

export interface SessionService {
  createSession(problemId: string, userId: string): Promise<SessionDocument>
  getSession(sessionId: string): Promise<SessionDocument | undefined>
  listSessions(userId: string): Promise<SessionDocument[]>

  submitStage(
    sessionId: string,
    stageId: StageId,
    userContent: Record<string, any>,
    verdict: ReviewerVerdict,
  ): Promise<StageOutput>

  recordChallengeOutcome(
    sessionId: string,
    stageId: StageId,
    outcome: ChallengeOutcome,
  ): Promise<StageOutput>

  completeSession(sessionId: string): Promise<SessionDocument>
}
