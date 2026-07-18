import type { HistoricalLogEntry, UserStats } from '@/domain/user'
import type { DashboardService, RecommendedProblem } from '../interfaces/DashboardService'
import { finalReportFixture, historicalLogsFixture, userStatsFixture } from './fixtures'

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export class MockDashboardService implements DashboardService {
  async getUserStats(_userId: string): Promise<UserStats> {
    await delay(120)
    return userStatsFixture
  }

  async getHistoricalLogs(_userId: string): Promise<HistoricalLogEntry[]> {
    await delay(120)
    return historicalLogsFixture
  }

  async getRecommendedProblem(_userId: string): Promise<RecommendedProblem | undefined> {
    await delay(80)
    return finalReportFixture.nextProblem
  }
}
