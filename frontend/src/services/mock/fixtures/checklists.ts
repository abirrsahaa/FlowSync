// Section 25.4 — the youtube-hld-v1 checklist, verbatim.

import type { Checklist } from '@/domain/problem'

export const youtubeChecklist: Checklist = {
  checklistId: 'youtube-hld-v1',
  problemId: 'design-youtube',
  version: 1,
  status: 'PUBLISHED',
  checkpoints: [
    {
      id: 'cp-1',
      label: 'Handle high read traffic',
      required: true,
      nested: [
        { id: 'cp-1-1', label: 'CDN for video delivery', required: true },
        { id: 'cp-1-2', label: 'Cache layer for metadata', required: true },
        { id: 'cp-1-3', label: 'Read replicas on DB', required: false },
      ],
    },
    {
      id: 'cp-2',
      label: 'Async video processing',
      required: true,
      nested: [
        { id: 'cp-2-1', label: 'Upload to object storage first', required: true },
        { id: 'cp-2-2', label: 'Message queue triggers transcoding', required: true },
        { id: 'cp-2-3', label: 'Multiple resolution outputs (adaptive bitrate)', required: false },
      ],
    },
    {
      id: 'cp-3',
      label: 'Global distribution',
      required: true,
      nested: [
        { id: 'cp-3-1', label: 'Multi-region origin or edge caching', required: true },
        { id: 'cp-3-2', label: 'Latency-aware routing (GeoDNS/anycast)', required: false },
      ],
    },
    {
      id: 'cp-4',
      label: 'Search over metadata',
      required: false,
      nested: [
        { id: 'cp-4-1', label: 'Dedicated search index (not primary DB LIKE queries)', required: true },
      ],
    },
    {
      id: 'cp-5',
      label: 'Write path for views/comments',
      required: true,
      nested: [
        {
          id: 'cp-5-1',
          label: 'View counts are eventually consistent, not synchronously written per view',
          required: true,
        },
        { id: 'cp-5-2', label: 'Comments are not on the video-serving hot path', required: false },
      ],
    },
  ],
}

// Section 5's Stage 6 description (indexing / retries / circuit breakers /
// pagination / failure modes) — Stage 6 reuses the HLD canvas shell (Session
// 7) with its own LLD-focused checklist rather than the Stage 5 one above.
export const youtubeDeepDiveChecklist: Checklist = {
  checklistId: 'youtube-deepdive-v1',
  problemId: 'design-youtube',
  version: 1,
  status: 'PUBLISHED',
  checkpoints: [
    {
      id: 'dd-1',
      label: 'Indexing strategy',
      required: true,
      nested: [
        { id: 'dd-1-1', label: 'Index chosen per actual query pattern (title/tag search)', required: true },
        { id: 'dd-1-2', label: 'Composite/covering index considered for hot queries', required: false },
      ],
    },
    {
      id: 'dd-2',
      label: 'Resilience patterns',
      required: true,
      nested: [
        { id: 'dd-2-1', label: 'Retry with backoff on downstream calls', required: true },
        { id: 'dd-2-2', label: 'Circuit breaker on unstable dependencies', required: true },
        { id: 'dd-2-3', label: 'Bulkhead / timeout budget per dependency', required: false },
      ],
    },
    {
      id: 'dd-3',
      label: 'Pagination design',
      required: true,
      nested: [
        { id: 'dd-3-1', label: 'Cursor-based pagination for feed/list endpoints', required: true },
        { id: 'dd-3-2', label: 'Stable sort key so pages do not shift under writes', required: false },
      ],
    },
    {
      id: 'dd-4',
      label: 'Failure modes',
      required: true,
      nested: [
        { id: 'dd-4-1', label: 'Partial-failure / degraded-mode behavior defined', required: true },
        { id: 'dd-4-2', label: 'Idempotency on retried writes', required: true },
        { id: 'dd-4-3', label: 'Dead-letter handling for the transcoding queue', required: false },
      ],
    },
  ],
}

export const checklists: Checklist[] = [youtubeChecklist, youtubeDeepDiveChecklist]
