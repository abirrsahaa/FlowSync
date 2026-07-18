// Stage 5 — HLD Canvas, the core/signature stage (Section 8).
import { youtubeChecklist } from '@/services/mock/fixtures/checklists'
import { HldCanvasShell } from './HldCanvasShell'
import { HLD_CHECKLIST_STATUS } from './checklistStatus'

export function HldCanvasPage() {
  return (
    <HldCanvasShell
      stageId="hld"
      title="High-Level Design"
      description="Compose your architecture from the component bank, then run the Architecture Audit against your own Stage 2 numbers."
      checklist={youtubeChecklist}
      checklistStatusSeed={HLD_CHECKLIST_STATUS}
      submitLabel="Validate My HLD"
      idleHint="Place components on the canvas, then validate to run the AI reviewer against your checklist and Stage 2 estimate."
    />
  )
}
