// Section 14 — AI Review Streaming Pipeline, adapted to a frontend-callable
// shape. In production these events arrive over Redis pub/sub → WS/SSE, keyed
// by sessionId; here each method is the client-side entry point that yields
// the same event sequence via an async generator instead of a subscription.
//
// Event field names are camelCase (TS-side) mirrors of Section 14's Pydantic
// snake_case models (text_token -> textToken, is_final -> isFinal, etc.) — same
// contract, TS naming convention.

import type { ComponentGraph } from '@/domain/canvas'
import type { Finding, ReviewerVerdict, ChallengeOutcome } from '@/domain/review'
import type { FinalReport } from '@/domain/report'
import type { SessionDocument, StageId, StageOutput } from '@/domain/session'

export interface StageContext {
  requirements?: StageOutput
  estimation?: StageOutput
  api?: StageOutput
  datamodel?: StageOutput
}

// ── Stage 1-4 conversational review (topic: stage.submissions) ─────────────

export interface StageReviewRequest {
  sessionId: string
  stageId: Exclude<StageId, 'hld' | 'deepdive'>
  userContent: Record<string, any>
  stageContext: StageContext
}

export interface ReviewStreamEvent {
  textToken?: string
  isFinal: boolean
  verdict?: ReviewerVerdict // populated only when isFinal === true
}

// ── Stage 5 HLD review (topic: stage.submissions, stage_id == "hld") ────────

export interface HLDReviewRequest {
  sessionId: string
  // Stage 6 (deepdive) reuses the HLD canvas shell (Session 7) and shares this
  // exact request shape, LLD-focused checklist and all — Section 14 only spells
  // out the stage_id == "hld" case explicitly, this extends it for that reuse.
  stageId: 'hld' | 'deepdive'
  snapshotPng: string // base64 PNG from editor.toSvg()/canvas export
  componentGraph: ComponentGraph
  checklistId: string
  focusAreas?: string[]
  stageContext: StageContext
}

export interface HLDAnnotationEvent {
  textToken?: string
  finding?: Finding // populated when the harness resolves a complete Finding
  isFinal: boolean
  // Not part of Section 14's literal HLDAnnotationEvent (text_token/finding/
  // is_final only) — added so the mock stream can carry the stage's final
  // gate-relevant score without a second round-trip. The real backend
  // persists this via Section 14 step 5 (Kafka + Postgres) instead of over
  // this event stream; the frontend mock has no separate fetch for it.
  verdict?: ReviewerVerdict
}

// ── Challenge / arbitration (topic: challenges) ─────────────────────────────

export interface EstimationNumbers {
  dau: number
  readQps: number
  writeQps: number
  storageGbPerDay: number
}

export interface ArbitrationRequest {
  sessionId: string
  stageId: StageId
  aiVerdict: ReviewerVerdict
  userJustification: string // untrusted — passed through injection_guard server-side (24.4)
  estimation: EstimationNumbers // ground truth from Stage 2 (Section 9's anti-bias rule 1)
  problemConstraints: Record<string, any>
}

export interface ArbitrationStreamEvent {
  textToken?: string
  isFinal: boolean
  ruling?: ChallengeOutcome // must carry non-empty citations if score changed (24.4)
}

// ── Final report (topic: session.complete) ─────────────────────────────────

export interface GenerateReportRequest {
  sessionDocument: SessionDocument
}

export interface ReportStreamEvent {
  textToken?: string
  isFinal: boolean
  report?: FinalReport
}

export interface ReviewStreamService {
  streamStageReview(request: StageReviewRequest): AsyncGenerator<ReviewStreamEvent>
  streamHLDReview(request: HLDReviewRequest): AsyncGenerator<HLDAnnotationEvent>
  streamArbitration(request: ArbitrationRequest): AsyncGenerator<ArbitrationStreamEvent>
  streamFinalReport(request: GenerateReportRequest): AsyncGenerator<ReportStreamEvent>
}
