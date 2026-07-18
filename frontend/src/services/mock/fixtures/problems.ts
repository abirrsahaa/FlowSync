// Section 25.4 — "Design YouTube" is the seed PUBLISHED problem, verbatim.
// The other three match the cards visible in
// ui-reference/Screenshot 2026-07-18 at 10.09.35 PM.png (Instagram, WhatsApp
// Clone, TinyURL) — same Problem shape, plausible-but-not-spec'd numbers.

import type { Problem } from '@/domain/problem'

export const designYouTube: Problem = {
  id: 'design-youtube',
  title: 'Design YouTube',
  difficulty: 'hard',
  concepts: ['cdn', 'streaming', 'distributed-storage', 'async-processing', 'search'],
  prompt:
    'Design a video-sharing platform where users can upload, process, and stream video to a global audience. Support search over video metadata, view counts, and comments.',
  constraints: {
    scale: '100M daily active users',
    regions: 'global',
    latencyTarget: '< 200ms video start time',
  },
  expectedScale: {
    dau: 100_000_000,
    readQps: 500_000,
    writeQps: 5_000,
    storageGbPerDay: 500_000,
  },
  checklistId: 'youtube-hld-v1',
  knownTradeoffs: [
    {
      topic: 'db-replica',
      atScale: '> 50k QPS',
      recommendation:
        'add read replicas; below this, a single primary with good indexing is operationally simpler',
    },
    {
      topic: 'cdn',
      atScale: 'any global user base, regardless of QPS',
      recommendation:
        'required for video delivery whenever users are described as worldwide/global, independent of scale numbers',
    },
    {
      topic: 'video-transcoding',
      atScale: 'any',
      recommendation: 'always async — never transcode synchronously on upload',
    },
  ],
  status: 'PUBLISHED',
}

export const designInstagram: Problem = {
  id: 'design-instagram',
  title: 'Design Instagram',
  difficulty: 'medium',
  concepts: ['cdn', 'caching', 'feed-generation', 'distributed-storage'],
  prompt:
    'Design a photo and video sharing platform with a personalized home feed, likes, and comments, serving a global audience.',
  constraints: {
    scale: '500M daily active users',
    regions: 'global',
    latencyTarget: '< 300ms feed load',
  },
  expectedScale: {
    dau: 500_000_000,
    readQps: 800_000,
    writeQps: 20_000,
    storageGbPerDay: 200_000,
  },
  checklistId: 'instagram-hld-v1',
  knownTradeoffs: [
    {
      topic: 'feed-generation',
      atScale: 'any',
      recommendation:
        'fan-out-on-write for typical users, fan-out-on-read for celebrity accounts (hybrid)',
    },
    {
      topic: 'cdn',
      atScale: 'any global user base',
      recommendation: 'required for media delivery given a worldwide user base',
    },
  ],
  status: 'PUBLISHED',
}

export const whatsappClone: Problem = {
  id: 'whatsapp-clone',
  title: 'WhatsApp Clone',
  difficulty: 'hard',
  concepts: ['websockets', 'encryption', 'message-queue', 'presence'],
  prompt:
    'Design a real-time, end-to-end encrypted messaging platform supporting 1:1 and group chats, delivery/read receipts, and online presence.',
  constraints: {
    scale: '1B daily active users',
    regions: 'global',
    latencyTarget: '< 100ms message delivery',
  },
  expectedScale: {
    dau: 1_000_000_000,
    readQps: 2_000_000,
    writeQps: 300_000,
    storageGbPerDay: 50_000,
  },
  checklistId: 'whatsapp-hld-v1',
  knownTradeoffs: [
    {
      topic: 'message-delivery',
      atScale: 'any',
      recommendation: 'persistent WS connections held server-side; queue undelivered messages per-user',
    },
    {
      topic: 'encryption',
      atScale: 'any',
      recommendation: 'end-to-end encryption means the server can only route ciphertext, never index content',
    },
  ],
  status: 'PUBLISHED',
}

export const tinyUrl: Problem = {
  id: 'tinyurl',
  title: 'TinyURL',
  difficulty: 'easy',
  concepts: ['hashing', 'caching', 'distributed-id-generation'],
  prompt:
    'Design a URL-shortening service that maps long URLs to short aliases, redirects on lookup, and supports optional custom aliases and expiration.',
  constraints: {
    scale: '10M daily active users',
    regions: 'single-region, read-heavy',
    latencyTarget: '< 50ms redirect',
  },
  expectedScale: {
    dau: 10_000_000,
    readQps: 40_000,
    writeQps: 400,
    storageGbPerDay: 50,
  },
  checklistId: 'tinyurl-hld-v1',
  knownTradeoffs: [
    {
      topic: 'id-generation',
      atScale: 'any',
      recommendation: 'base62 encoding of a distributed counter (e.g. Zookeeper-assigned ranges) over random-and-retry',
    },
    {
      topic: 'caching',
      atScale: 'any read-heavy workload',
      recommendation: 'cache hot redirects; read:write ratio makes a cache miss disproportionately expensive',
    },
  ],
  status: 'PUBLISHED',
}

export const problems: Problem[] = [designYouTube, designInstagram, whatsappClone, tinyUrl]
