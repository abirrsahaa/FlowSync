// Mirrors sytem_design.md Section 5 / ui_ux_design_brief.md §1's six-stage
// description — used to drive the "how it works" section on the landing page.

export interface StageSummary {
  order: string
  name: string
  description: string
}

export const LANDING_STAGES: StageSummary[] = [
  {
    order: '01',
    name: 'Requirements',
    description:
      'State functional, non-functional, and optional requirements. The reviewer flags vague language — "highly available" gets caught, "99.9% uptime" doesn\'t.',
  },
  {
    order: '02',
    name: 'Estimation',
    description:
      'DAU, QPS, storage, bandwidth. A deterministic math validator checks the arithmetic first — only then does an LLM weigh in on judgment.',
  },
  {
    order: '03',
    name: 'API Design',
    description: 'Endpoints, schemas, auth. Reviewed for idempotency, pagination, versioning, and error codes.',
  },
  {
    order: '04',
    name: 'Data Model',
    description: 'ERD, indexes, partitioning. Reviewed for N+1 risk, hot partitions, and consistency model.',
  },
  {
    order: '05',
    name: 'HLD Canvas',
    description:
      'An infinite canvas with a typed component bank and a live checklist. Findings stream in and glow the exact node they concern.',
  },
  {
    order: '06',
    name: 'Deep Dive',
    description: 'Same canvas, zoomed into one component — indexing, retries, circuit breakers, failure modes.',
  },
]
