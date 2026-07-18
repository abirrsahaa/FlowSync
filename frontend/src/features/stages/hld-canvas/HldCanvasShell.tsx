// Section 8's three-panel layout, shared by Stage 5 (HLD Canvas) and Stage 6
// (Deep Dive — same shell, different checklist/copy/reviewer persona per
// Section 5). Mounts a real @tldraw/tldraw <Tldraw/> surface (genuine pan/
// zoom/draw/select) but stays scoped to Session 7's decision: no custom
// ShapeUtils, no ComponentGraph Adapter, no sync/OT logic. Dragging a bank
// item places a plain geo shape; the review request's componentGraph is a
// static mock (mockComponentGraph.ts); the checklist's present/absent state
// is a static seed (checklistStatus.ts) — both stand in for the Adapter this
// session explicitly defers.

import { useCallback, useEffect, useRef, useState } from 'react'
import { Tldraw, createShapeId, toRichText } from 'tldraw'
import type { Editor, TLShapeId } from 'tldraw'
import 'tldraw/tldraw.css'
import { useNavigate } from 'react-router-dom'
import { Separator } from '@/components/ui/separator'
import { PresenceBar } from '@/components/layout/PresenceBar'
import { useStageSession } from '../shared/useStageSession'
import { useHldReviewStream } from '@/hooks/useHldReviewStream'
import type { Finding } from '@/domain/review'
import type { Checklist } from '@/domain/problem'
import { ComponentBankPanel } from './ComponentBankPanel'
import { ChecklistPanel } from './ChecklistPanel'
import { ArchitectureAuditPanel } from './ArchitectureAuditPanel'
import { NodeFindingPopover } from './NodeFindingPopover'
import { DRAG_DATA_TYPE, NODE_CANVAS_COLOR } from './nodeBank'
import { mockComponentGraph } from './mockComponentGraph'
import type { ChecklistItemStatus } from './checklistStatus'
import type { ComponentNodeType } from '@/domain/canvas'

// Fixed layout for the seeded demo nodes — same ids as mockComponentGraph's
// nodes and the review fixtures' Finding.nodeId, so a resolved finding can
// glow a shape that genuinely exists on the canvas (Session 7's "mock/
// hardcoded target" per the kickoff prompt, not a real Adapter lookup).
const SEED_LAYOUT: Array<{ id: string; type: ComponentNodeType; label: string; x: number; y: number }> = [
  { id: 'gateway-1', type: 'gateway', label: 'API Gateway', x: 80, y: 100 },
  { id: 'lb-1', type: 'loadbalancer', label: 'Load Balancer', x: 340, y: 100 },
  { id: 'metadata-service-1', type: 'service', label: 'Metadata Service', x: 600, y: 100 },
  { id: 'metadata-cache-1', type: 'cache', label: 'Metadata Cache', x: 600, y: 320 },
  { id: 'postgres-db-1', type: 'database', label: 'Video Metadata DB', x: 860, y: 100 },
  { id: 'transcoding-queue-1', type: 'queue', label: 'Transcoding Queue', x: 860, y: 320 },
]

const NODE_W = 160
const NODE_H = 70
const FINDING_HIGHLIGHT_MS = 5000
// Must match NodeFindingPopover's w-64 (256px) card, plus a generous height
// estimate for clamping — see the viewport-clamp note below.
const POPOVER_W = 256
const POPOVER_H = 140

function seedDemoNodes(editor: Editor) {
  if (editor.getCurrentPageShapes().length > 0) return
  for (const node of SEED_LAYOUT) {
    editor.createShape({
      id: createShapeId(node.id),
      type: 'geo',
      x: node.x,
      y: node.y,
      props: {
        geo: 'rectangle',
        w: NODE_W,
        h: NODE_H,
        color: NODE_CANVAS_COLOR[node.type],
        fill: 'solid',
        richText: toRichText(node.label),
      },
    })
  }
  editor.zoomToFit({ animation: { duration: 200 } })
}

export interface HldCanvasShellProps {
  stageId: 'hld' | 'deepdive'
  title: string
  description: string
  checklist: Checklist
  checklistStatusSeed: Record<string, ChecklistItemStatus>
  submitLabel: string
  idleHint: string
  focusAreas?: string[]
}

export function HldCanvasShell({
  stageId,
  title,
  description,
  checklist,
  checklistStatusSeed,
  submitLabel,
  idleHint,
  focusAreas,
}: HldCanvasShellProps) {
  const { sessionId, problem } = useStageSession()
  const navigate = useNavigate()
  const review = useHldReviewStream(stageId, sessionId)

  const [editor, setEditor] = useState<Editor | null>(null)
  const [activeFinding, setActiveFinding] = useState<Finding | null>(null)
  const [activeScreenPos, setActiveScreenPos] = useState<{ x: number; y: number } | null>(null)
  const [touchedCheckpointIds, setTouchedCheckpointIds] = useState<Set<string>>(new Set())
  const canvasWrapperRef = useRef<HTMLDivElement>(null)

  const handleMount = useCallback((editorInstance: Editor) => {
    setEditor(editorInstance)
    seedDemoNodes(editorInstance)
  }, [])

  // tldraw has its own internal dragover/drop handling (asset drop support)
  // that calls stopPropagation during the bubble phase, so a normal React
  // onDrop/onDragOver on an ancestor never fires — confirmed by testing drag
  // placement in a real browser, not just inferred. Attaching in the CAPTURE
  // phase runs before tldraw's own bubble-phase listeners get a chance, so we
  // can claim the event first and stop it from reaching tldraw at all.
  useEffect(() => {
    const wrapper = canvasWrapperRef.current
    if (!wrapper || !editor) return

    function onDragOver(e: DragEvent) {
      if (!e.dataTransfer?.types.includes(DRAG_DATA_TYPE)) return
      e.preventDefault()
      e.stopPropagation()
      e.dataTransfer.dropEffect = 'copy'
    }

    function onDrop(e: DragEvent) {
      const nodeType = e.dataTransfer?.getData(DRAG_DATA_TYPE) as ComponentNodeType | undefined
      if (!nodeType || !NODE_CANVAS_COLOR[nodeType] || !editor) return
      e.preventDefault()
      e.stopPropagation()

      const point = editor.screenToPage({ x: e.clientX, y: e.clientY })
      const id = createShapeId()
      editor.createShape({
        id,
        type: 'geo',
        x: point.x - NODE_W / 2,
        y: point.y - NODE_H / 2,
        props: {
          geo: 'rectangle',
          w: NODE_W,
          h: NODE_H,
          color: NODE_CANVAS_COLOR[nodeType],
          fill: 'solid',
          richText: toRichText(nodeType),
        },
      })
      editor.select(id)
    }

    wrapper.addEventListener('dragover', onDragOver, true)
    wrapper.addEventListener('drop', onDrop, true)
    return () => {
      wrapper.removeEventListener('dragover', onDragOver, true)
      wrapper.removeEventListener('drop', onDrop, true)
    }
  }, [editor])

  // Section 14 / design brief: the node glow and its explanation land as one
  // synchronized event — react to the newest finding the moment it arrives.
  useEffect(() => {
    if (review.findings.length === 0 || !editor) return
    const latest = review.findings[review.findings.length - 1]

    if (latest.checkpointId) {
      setTouchedCheckpointIds((prev) => new Set(prev).add(latest.checkpointId as string))
    }

    if (latest.nodeId) {
      const shapeId = createShapeId(latest.nodeId) as TLShapeId
      const shape = editor.getShape(shapeId)
      if (shape) {
        editor.setHintingShapes([shapeId])
        const viewport = editor.getViewportScreenBounds()
        const zoom = editor.getZoomLevel()
        const nodeTopLeft = editor.pageToScreen({ x: shape.x, y: shape.y })
        const nodeCenterX = nodeTopLeft.x + (NODE_W * zoom) / 2

        // Anchor above the node, horizontally centered on it, so the card
        // never covers the very node it's pointing at; clamp both axes to
        // the canvas viewport so it never spills under the checklist/audit
        // sidebar for a node near the right edge (e.g. Postgres DB in the
        // seeded layout). Fall back to below the node if there's no room
        // above (top row of the seeded layout has room; safe either way).
        const preferredY = nodeTopLeft.y - POPOVER_H - 12
        const y = preferredY < 8 ? nodeTopLeft.y + NODE_H * zoom + 12 : preferredY
        const x = Math.max(8, Math.min(nodeCenterX - POPOVER_W / 2, viewport.width - POPOVER_W - 8))

        setActiveScreenPos({ x, y: Math.max(8, Math.min(y, viewport.height - POPOVER_H - 8)) })
        setActiveFinding(latest)

        const timer = setTimeout(() => {
          editor.setHintingShapes([])
          setActiveFinding(null)
          setActiveScreenPos(null)
        }, FINDING_HIGHLIGHT_MS)
        return () => clearTimeout(timer)
      }
    }
    return undefined
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [review.findings, editor])

  function handleSubmit() {
    if (!editor) return
    ;(async () => {
      const shapes = editor.getCurrentPageShapes()
      let snapshotPng = ''
      if (shapes.length > 0) {
        const result = await editor.toImageDataUrl(shapes, { background: true })
        snapshotPng = result.url
      }
      review.submit({
        snapshotPng,
        componentGraph: mockComponentGraph,
        checklistId: checklist.checklistId,
        focusAreas,
        stageContext: {},
      })
    })()
  }

  function handleChallenge(finding: Finding) {
    navigate(`/session/${sessionId}/challenge`, {
      state: { stageId, finding, verdict: review.verdict },
    })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-app-border px-6 py-3">
        <h1 className="text-xl font-semibold text-app-ink">
          {title}
          {problem ? `: ${problem.title}` : ''}
        </h1>
        <p className="mt-1 text-sm text-app-ink-muted">{description}</p>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[200px_1fr_360px]">
        <ComponentBankPanel />

        <div ref={canvasWrapperRef} className="relative min-h-0">
          <Tldraw onMount={handleMount} />
          <NodeFindingPopover finding={activeFinding} screenPosition={activeScreenPos} />
        </div>

        <aside className="flex min-h-0 flex-col gap-5 overflow-y-auto border-l border-app-border bg-app-surface p-4">
          <ChecklistPanel checklist={checklist} status={checklistStatusSeed} touchedIds={touchedCheckpointIds} />
          <Separator />
          <ArchitectureAuditPanel
            submitLabel={submitLabel}
            idleHint={idleHint}
            status={review.status}
            streamedText={review.streamedText}
            findings={review.findings}
            verdict={review.verdict}
            error={review.error}
            onSubmit={handleSubmit}
            onChallenge={handleChallenge}
          />
        </aside>
      </div>

      <PresenceBar />
    </div>
  )
}
