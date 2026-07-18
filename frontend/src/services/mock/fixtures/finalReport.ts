// reference/ui_ux_design_brief.md §4 — the exact final-report example content.

import type { FinalReport } from '@/domain/report'

export const finalReportFixture: FinalReport = {
  sessionId: 'session-design-youtube-demo',
  userId: 'user-mock-1',
  problemId: 'design-youtube',
  generatedAt: new Date('2026-07-18T21:00:00Z'),
  overallScore: 7.2,
  stageScores: {
    requirements: 6,
    estimation: 8,
    api: 7,
    datamodel: 6,
    hld: 7,
    deepdive: 8,
  },
  timeAnalysis: {
    timeToFirstRequirementMinutes: 5,
    timeToHLDMinutes: 42,
    longestStageMinutes: 18,
    totalMinutes: 95,
  },
  strengths: [
    {
      timestamp: '14:32',
      observation: 'Correctly identified read-heavy workload and proposed caching before DB schema.',
    },
    {
      timestamp: '28:15',
      observation: 'Proactively mentioned async processing for video uploads without prompting.',
    },
  ],
  gaps: [
    {
      severity: 'HIGH',
      topic: 'Global Distribution',
      detail: "No global distribution strategy despite 'worldwide users' in requirements.",
    },
    {
      severity: 'MEDIUM',
      topic: 'Database Indexing',
      detail: 'Indexing strategy not discussed for search query patterns.',
    },
    {
      severity: 'LOW',
      topic: 'Bandwidth Estimation',
      detail: 'Never calculated bandwidth estimate.',
    },
  ],
  studyRecommendations: [
    'CDN & global distribution',
    'DB indexing for read-heavy workloads',
    'Back-of-envelope estimation practice',
  ],
  nextProblem: {
    problemId: 'design-instagram',
    reason: 'Tests CDN and global distribution, your highest gap area',
  },
  challengeSummary: {
    totalChallenges: 1,
    userWonCount: 0,
    aiWonCount: 0,
    nuancedCount: 1,
  },
}
