// The node-glow's companion overlay — Section 14: as each finding resolves,
// editor.setHintingShapes glows the node AND its explanation should be
// visually tied to that exact node, not just implied by list position
// (ui_improvements.md §1 confirms this should sit alongside the glow, not
// replace it). Positioned by the caller from editor.pageToScreen(), which is
// why this component takes raw screen coordinates rather than a shape id.

import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import type { Finding, Severity } from '@/domain/review'

const SEVERITY_VARIANT: Record<Severity, 'red' | 'gold' | 'neutral' | 'green'> = {
  CRITICAL: 'red',
  MAJOR: 'gold',
  MINOR: 'neutral',
  SUGGESTION: 'green',
}

export interface NodeFindingPopoverProps {
  finding: Finding | null
  screenPosition: { x: number; y: number } | null
}

export function NodeFindingPopover({ finding, screenPosition }: NodeFindingPopoverProps) {
  return (
    <AnimatePresence>
      {finding && screenPosition && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="pointer-events-none absolute z-20 w-64 rounded-sharp border-2 border-app-red bg-app-surface p-3 shadow-lg"
          style={{ left: screenPosition.x, top: screenPosition.y }}
        >
          <div className="mb-2 flex items-center gap-2">
            <Badge variant={SEVERITY_VARIANT[finding.severity]}>{finding.severity} ISSUE</Badge>
          </div>
          <p className="text-xs font-medium leading-snug text-app-ink">{finding.point}</p>
          <p className="mt-1.5 font-mono text-[10px] leading-snug text-app-ink-muted">{finding.evidence}</p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
