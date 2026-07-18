// Stage 6 — Deep Dive. Reuses the HLD canvas shell (Session 7) zoomed into
// one component's low-level detail, with an LLD-focused checklist/persona
// per Section 5's Stage 6 description (indexing, retries/circuit breakers,
// pagination, failure modes) rather than Stage 5's HLD checklist.
import { youtubeDeepDiveChecklist } from '@/services/mock/fixtures/checklists'
import { HldCanvasShell } from '../hld-canvas/HldCanvasShell'
import { DEEPDIVE_CHECKLIST_STATUS } from '../hld-canvas/checklistStatus'

const FOCUS_AREAS = ['indexing', 'resilience', 'pagination', 'failure-modes']

export function DeepDivePage() {
  return (
    <HldCanvasShell
      stageId="deepdive"
      title="Deep Dive"
      description="Zoom into one component's low-level design — indexing, retries and circuit breakers, pagination, and failure modes."
      checklist={youtubeDeepDiveChecklist}
      checklistStatusSeed={DEEPDIVE_CHECKLIST_STATUS}
      submitLabel="Run Deep Dive Audit"
      idleHint="Refine the low-level details on the same canvas, then audit against indexing, resilience, pagination, and failure-mode checkpoints."
      focusAreas={FOCUS_AREAS}
    />
  )
}
