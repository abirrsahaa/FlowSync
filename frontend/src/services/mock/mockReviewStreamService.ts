// Simulates Section 14's token-by-token streaming (real path: LLM stream ->
// harness -> Redis pub/sub -> WS -> browser) with setTimeout-paced yields
// instead of a subscription, so useReviewStream (Session 6+) can be written
// against the real async-iteration shape from day one.

import { deriveGateState } from '@/domain/review'
import type {
  ArbitrationRequest,
  ArbitrationStreamEvent,
  GenerateReportRequest,
  HLDAnnotationEvent,
  HLDReviewRequest,
  ReportStreamEvent,
  ReviewStreamEvent,
  ReviewStreamService,
  StageReviewRequest,
} from '../interfaces/ReviewStreamService'
import {
  deepDiveReviewFixture,
  finalReportFixture,
  hldReviewFixture,
  spofChallengeOutcome,
  stageReviewFixtures,
} from './fixtures'

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function tokenize(text: string): string[] {
  return text.split(/(\s+)/).filter((chunk) => chunk.length > 0)
}

const TOKEN_DELAY_MS = 20

// Fixed per-stage scores kept in sync with fixtures/finalReport.ts's
// stageScores, so a full mock run reports a consistent overall score.
const stageScores: Record<string, number> = {
  requirements: 6,
  estimation: 8,
  api: 7,
  datamodel: 6,
}

export class MockReviewStreamService implements ReviewStreamService {
  async *streamStageReview(request: StageReviewRequest): AsyncGenerator<ReviewStreamEvent> {
    const fixture = stageReviewFixtures[request.stageId]
    for (const token of tokenize(fixture.commentary)) {
      await delay(TOKEN_DELAY_MS)
      yield { textToken: token, isFinal: false }
    }

    const score = stageScores[request.stageId] ?? 6
    await delay(150)
    yield {
      isFinal: true,
      verdict: {
        score,
        gateState: deriveGateState(score),
        findings: fixture.findings,
        timeToReview: tokenize(fixture.commentary).length * TOKEN_DELAY_MS + 150,
      },
    }
  }

  async *streamHLDReview(request: HLDReviewRequest): AsyncGenerator<HLDAnnotationEvent> {
    const fixture = request.stageId === 'deepdive' ? deepDiveReviewFixture : hldReviewFixture
    const tokens = tokenize(fixture.commentary)
    const findingAfterToken = Math.floor(tokens.length / 2)

    for (let i = 0; i < tokens.length; i++) {
      await delay(TOKEN_DELAY_MS)
      yield { textToken: tokens[i], isFinal: false }

      if (i === findingAfterToken) {
        for (const finding of fixture.findings) {
          await delay(200)
          yield { finding, isFinal: false }
        }
      }
    }

    await delay(150)
    yield { isFinal: true, verdict: fixture.verdict }
  }

  async *streamArbitration(request: ArbitrationRequest): AsyncGenerator<ArbitrationStreamEvent> {
    const commentary = `Reviewing your justification against your Stage 2 estimate of ${request.estimation.writeQps.toLocaleString()} write QPS. ${spofChallengeOutcome.nuancedVerdict}`

    for (const token of tokenize(commentary)) {
      await delay(TOKEN_DELAY_MS)
      yield { textToken: token, isFinal: false }
    }

    await delay(200)
    yield { isFinal: true, ruling: spofChallengeOutcome }
  }

  async *streamFinalReport(_request: GenerateReportRequest): AsyncGenerator<ReportStreamEvent> {
    const commentary = `Session complete. Overall score: ${finalReportFixture.overallScore}/10. Generating full breakdown.`

    for (const token of tokenize(commentary)) {
      await delay(TOKEN_DELAY_MS)
      yield { textToken: token, isFinal: false }
    }

    await delay(200)
    yield { isFinal: true, report: finalReportFixture }
  }
}
