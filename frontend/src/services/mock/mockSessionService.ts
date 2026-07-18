import type { ChallengeOutcome, ReviewerVerdict } from '@/domain/review'
import type { SessionDocument, StageId, StageOutput } from '@/domain/session'
import type { SessionService } from '../interfaces/SessionService'

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export class MockSessionService implements SessionService {
  private sessions = new Map<string, SessionDocument>()

  async createSession(problemId: string, userId: string): Promise<SessionDocument> {
    await delay(150)
    const session: SessionDocument = {
      sessionId: crypto.randomUUID(),
      problemId,
      userId,
      startedAt: new Date(),
      stages: [],
    }
    this.sessions.set(session.sessionId, session)
    return session
  }

  async getSession(sessionId: string): Promise<SessionDocument | undefined> {
    await delay(80)
    return this.sessions.get(sessionId)
  }

  async listSessions(userId: string): Promise<SessionDocument[]> {
    await delay(120)
    return [...this.sessions.values()].filter((s) => s.userId === userId)
  }

  async submitStage(
    sessionId: string,
    stageId: StageId,
    userContent: Record<string, any>,
    verdict: ReviewerVerdict,
  ): Promise<StageOutput> {
    await delay(100)
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error(`Unknown session: ${sessionId}`)

    const stageOutput: StageOutput = {
      stageId,
      completedAt: new Date(),
      timeSpentSeconds: 0,
      userContent,
      reviewerVerdict: verdict,
    }

    const existingIndex = session.stages.findIndex((s) => s.stageId === stageId)
    if (existingIndex >= 0) {
      session.stages[existingIndex] = stageOutput
    } else {
      session.stages.push(stageOutput)
    }

    if (stageId === 'hld' && userContent.componentGraph) {
      session.finalCanvas = userContent.componentGraph
    }

    return stageOutput
  }

  async recordChallengeOutcome(
    sessionId: string,
    stageId: StageId,
    outcome: ChallengeOutcome,
  ): Promise<StageOutput> {
    await delay(100)
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error(`Unknown session: ${sessionId}`)

    const stage = session.stages.find((s) => s.stageId === stageId)
    if (!stage) throw new Error(`Stage ${stageId} not yet submitted in session ${sessionId}`)

    stage.challengeOutcome = outcome
    return stage
  }

  async completeSession(sessionId: string): Promise<SessionDocument> {
    await delay(100)
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error(`Unknown session: ${sessionId}`)
    session.completedAt = new Date()
    return session
  }
}
