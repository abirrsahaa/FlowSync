// Section 20 — FinalReport, mirrored exactly.

export interface FinalReport {
  sessionId: string
  userId: string
  problemId: string
  generatedAt: Date
  overallScore: number
  stageScores: Record<string, number>
  timeAnalysis: {
    timeToFirstRequirementMinutes: number
    timeToHLDMinutes: number
    longestStageMinutes: number
    totalMinutes: number
  }
  strengths: Array<{ timestamp?: string; observation: string }>
  gaps: Array<{ severity: 'HIGH' | 'MEDIUM' | 'LOW'; topic: string; detail: string }>
  studyRecommendations: string[]
  nextProblem: { problemId: string; reason: string }
  challengeSummary?: {
    // if user challenged AI
    totalChallenges: number
    userWonCount: number
    aiWonCount: number
    nuancedCount: number
  }
}
