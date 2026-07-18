import type { HistoricalLogEntry, UserStats } from '@/domain/user'

export interface RecommendedProblem {
  problemId: string
  reason: string
}

export interface DashboardService {
  getUserStats(userId: string): Promise<UserStats>
  getHistoricalLogs(userId: string): Promise<HistoricalLogEntry[]>
  getRecommendedProblem(userId: string): Promise<RecommendedProblem | undefined>
}
