// Dashboard aggregates for the mock user. Historical log entries deliberately
// reuse finalReportFixture's sessionId/score/gap for Design YouTube instead of
// inventing parallel numbers, and carry a real problemVersion/sessionId instead
// of the decorative GPS-coordinate flavor text ui_improvements.md §4 flags —
// every field here maps to something the product model actually produces.

import type { HistoricalLogEntry, UserStats } from '@/domain/user'
import { finalReportFixture } from './finalReport'

export const userStatsFixture: UserStats = {
  userId: 'user-mock-1',
  designation: 'Senior II',
  rankLabel: 'L6 Rank',
  avgPrecisionScore: finalReportFixture.overallScore,
  conceptsMastered: 42,
  streakDays: 12,
  skillProficiency: [
    { axis: 'CDN', score: 8.1 },
    { axis: 'Storage', score: 7.4 },
    { axis: 'Database', score: 7.6 },
    { axis: 'Caching', score: 5.2 },
  ],
}

export const historicalLogsFixture: HistoricalLogEntry[] = [
  {
    sessionId: finalReportFixture.sessionId,
    problemId: finalReportFixture.problemId,
    problemTitle: 'Design YouTube',
    problemVersion: 1,
    score: finalReportFixture.overallScore,
    topGap: finalReportFixture.gaps[0]?.topic ?? 'None flagged',
    completedAt: new Date('2026-07-18T21:00:00Z'),
  },
  {
    sessionId: 'session-tinyurl-demo',
    problemId: 'tinyurl',
    problemTitle: 'TinyURL',
    problemVersion: 1,
    score: 5.8,
    topGap: 'Collision Handling',
    completedAt: new Date('2026-07-17T15:00:00Z'),
  },
]
