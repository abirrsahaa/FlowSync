// The 6 named-stage tabs + persistent gate-state rail (a StatusDot per tab,
// always visible regardless of gate state) + the Submit Solution action.
// Section 5: gates are advisory only — every tab below must stay clickable
// no matter what sessionProgressStore says, so this component never disables
// a NavLink based on gate state.

import { NavLink, useNavigate, useParams } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { StatusDot } from '@/components/common/StatusDot'
import { useSessionProgressStore } from '@/store/sessionProgressStore'
import type { StageId } from '@/domain/session'

const STAGE_ORDER: StageId[] = ['requirements', 'estimation', 'api', 'datamodel', 'hld', 'deepdive']

export const STAGE_ROUTE_SEGMENT: Record<StageId, string> = {
  requirements: 'requirements',
  estimation: 'estimation',
  api: 'api',
  datamodel: 'datamodel',
  hld: 'hld-canvas',
  deepdive: 'deep-dive',
}

export const STAGE_LABEL: Record<StageId, string> = {
  requirements: 'Requirements',
  estimation: 'Estimation',
  api: 'API',
  datamodel: 'Data Model',
  hld: 'HLD Canvas',
  deepdive: 'Deep Dive',
}

export function StageTopNav() {
  const { sessionId = 'mock-session' } = useParams()
  const stages = useSessionProgressStore((s) => s.stages)

  return (
    <nav className="flex items-center gap-0.5 whitespace-nowrap">
      {STAGE_ORDER.map((stageId) => (
        <NavLink
          key={stageId}
          to={`/session/${sessionId}/${STAGE_ROUTE_SEGMENT[stageId]}`}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-1.5 border-b-2 border-transparent px-3 py-2 font-mono text-xs uppercase tracking-[0.1em] text-app-ink-muted transition-colors hover:text-app-ink',
              isActive && 'border-app-navy text-app-ink',
            )
          }
        >
          <StatusDot gateState={stages[stageId]?.gateState} />
          {STAGE_LABEL[stageId]}
        </NavLink>
      ))}
    </nav>
  )
}

export function SubmitSolutionButton() {
  const { sessionId = 'mock-session' } = useParams()
  const navigate = useNavigate()

  return (
    <Button variant="primary" size="sm" onClick={() => navigate(`/session/${sessionId}/report`)}>
      Submit Solution
    </Button>
  )
}
