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

export const checklists: Checklist[] = [youtubeChecklist]
