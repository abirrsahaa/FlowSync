// Canned reviewer commentary + verdicts for the Design YouTube session,
// keyed by stage. Session 6's useReviewStream hook streams `commentary`
// token-by-token then resolves `verdict` — see mockReviewStreamService.

import type { Finding, ReviewerVerdict } from '@/domain/review'
import { deriveGateState } from '@/domain/review'

interface StageReviewFixture {
  commentary: string
  findings: Finding[]
}

const requirementsFindings: Finding[] = [
  {
    severity: 'MAJOR',
    point: 'Global distribution is not addressed despite the problem stating a worldwide user base.',
    evidence: "Constraints list 'global' regions but the requirements list no multi-region or edge strategy.",
  },
  {
    severity: 'SUGGESTION',
    point: 'Consider calling out abuse/moderation (copyright takedowns) as a non-functional requirement.',
    evidence: 'Common at YouTube scale, absent from the current list.',
  },
]

const estimationFindings: Finding[] = [
  {
    severity: 'MINOR',
    point: 'Bandwidth was not calculated from the storage/day and read QPS figures given.',
    evidence: '500,000 GB/day ingest and 500,000 read QPS imply a bandwidth figure that was left out.',
  },
]

const apiFindings: Finding[] = [
  {
    severity: 'MINOR',
    point: 'Upload endpoint does not specify a resumable/chunked strategy for large video files.',
    evidence: 'Video files at this scale routinely exceed single-request body limits.',
  },
]

const datamodelFindings: Finding[] = [
  {
    severity: 'MAJOR',
    point: 'No indexing strategy discussed for the metadata search query pattern.',
    evidence: 'Search over title/description/tags needs a dedicated index, not implied by the table list alone.',
  },
]

export const spofFinding: Finding = {
  severity: 'MAJOR',
  point: 'Single Postgres primary is a SPOF for the metadata store — consider a read replica.',
  evidence:
    '5,000 write QPS estimated in Stage 2; industry practice recommends replicas above ~50,000 QPS.',
  nodeId: 'postgres-db-1',
  checkpointId: 'cp-1-3',
}

const hldFindings: Finding[] = [
  spofFinding,
  {
    severity: 'CRITICAL',
    point: 'No CDN present for a read-heavy, globally distributed workload.',
    evidence: "Problem states 'global' regions and a < 200ms video-start latency target.",
    checkpointId: 'cp-1-1',
  },
]

export const stageReviewFixtures: Record<
  'requirements' | 'estimation' | 'api' | 'datamodel',
  StageReviewFixture
> = {
  requirements: {
    commentary:
      "Solid functional coverage of upload, transcode, and playback. You correctly separated optional requirements like recommendations from the core flow. The main gap: the problem explicitly describes a global audience, and I don't see a global-distribution requirement anywhere in your list.",
    findings: requirementsFindings,
  },
  estimation: {
    commentary:
      'MATH: VERIFIED — your DAU-to-QPS derivation checks out against a typical read:write ratio, and storage/day matches the expected scale for this problem. One thing worth adding: you stopped at storage and QPS without deriving a bandwidth number, which the reviewer for Stage 5 will want when checking your CDN/caching decisions.',
    findings: estimationFindings,
  },
  api: {
    commentary:
      'Endpoint set covers upload, playback, search, and comments cleanly, and the auth strategy is appropriately stated up front rather than left implicit. For a platform ingesting large video files, I would have expected a resumable/chunked upload endpoint rather than a single POST with a body.',
    findings: apiFindings,
  },
  datamodel: {
    commentary:
      'Table design is normalized sensibly for videos, users, and comments, and your choice of storage engine per table is well justified. The search query pattern you described — by title, tags, and description — is not served well by the indexes you defined here.',
    findings: datamodelFindings,
  },
}

export function buildVerdict(findings: Finding[], score: number, timeToReview: number): ReviewerVerdict {
  return { score, gateState: deriveGateState(score), findings, timeToReview }
}

export const hldReviewFixture = {
  commentary:
    "Your component graph covers the API gateway, user service, and metadata store cleanly, and the async queue for transcoding matches the checklist's required async-processing checkpoint. Two issues stand out against your own Stage 2 numbers and the problem's global-audience constraint.",
  findings: hldFindings,
  verdict: buildVerdict(hldFindings, 6, 4200),
}

// Stage 6 — Deep Dive. Same canvas shell (Session 7), an LLD-focused persona:
// indexing, retries/circuit breakers, pagination, failure modes (Section 5).
// nodeId targets reuse the same seeded demo nodes the HLD canvas places, so
// the finding-arrival glow (editor.setHintingShapes) has a real shape to hit.
const deepDiveFindings: Finding[] = [
  {
    severity: 'CRITICAL',
    point: 'Metadata Service has no circuit breaker around its DB calls — a slow Postgres primary will cascade into request-thread exhaustion.',
    evidence: 'At 500,000 read QPS, one degraded dependency without a breaker takes the whole read path down with it.',
    nodeId: 'metadata-service-1',
    checkpointId: 'dd-2-2',
  },
  {
    severity: 'MAJOR',
    point: 'Write path to Postgres is not idempotent under retry — a retried view-count write could double-count.',
    evidence: 'Retries are necessary at this scale but only safe if the write carries a dedup key.',
    nodeId: 'postgres-db-1',
    checkpointId: 'dd-4-2',
  },
  {
    severity: 'MINOR',
    point: 'Search/list endpoints were not discussed with cursor-based pagination — offset pagination degrades badly on a large result set.',
    evidence: "Section 3's API design should carry this forward, but it's worth re-confirming at the LLD level.",
    checkpointId: 'dd-3-1',
  },
]

export const deepDiveReviewFixture = {
  commentary:
    "Zooming into the metadata service and its data path. The retry policy toward Postgres is a good start, but two failure-mode gaps stand out at this level of detail — the kind of thing that only shows up once you stop drawing boxes and start reasoning about what happens when a dependency gets slow.",
  findings: deepDiveFindings,
  verdict: buildVerdict(deepDiveFindings, 6, 4600),
}
