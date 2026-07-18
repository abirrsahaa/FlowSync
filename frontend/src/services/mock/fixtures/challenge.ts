// reference/ui_ux_design_brief.md §4 — the exact SPOF/read-replica challenge
// + arbitration example, used to mock the Challenge/Arbitration duel screen
// (Session 8) and to seed the HLD stage's ChallengeOutcome for the final report.

import type { ChallengeOutcome } from '@/domain/review'

export const userJustificationExample =
  'At my estimated 5,000 write QPS a single primary with good indexing is operationally simpler; replicas add replication-lag complexity I don\'t need yet.'

export const spofChallengeOutcome: ChallengeOutcome = {
  userJustification: userJustificationExample,
  userCorrectOn: [
    'At 5,000 write QPS, single-primary is operationally valid — industry practice recommends replicas above ~50,000 QPS, per your own Stage 2 estimate.',
  ],
  aiCorrectOn: [
    "CDN is relevant even at MVP scale if users are global — the problem states users worldwide, not regional, independent of QPS.",
  ],
  nuancedVerdict:
    'Single DB: user correct given their own Stage 2 estimation numbers. CDN: AI correct given the problem\'s global-user constraint. Final score adjusted upward to reflect the valid DB pushback.',
  adjustedScore: 7,
}
