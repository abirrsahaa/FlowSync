// The live checklist matcher (Section 8: "client sends component graph every
// 30s... lightweight checker marks checkpoints present/absent") reads the
// real tldraw store via the Adapter, which is deferred this session. These
// are static seed states matching reference/ui_ux_design_brief.md §4's exact
// worked example, standing in for that live analysis until the Adapter
// exists — see mockComponentGraph.ts for the same deferral on the graph side.

export type ChecklistItemStatus = 'present' | 'absent' | 'partial'

export const HLD_CHECKLIST_STATUS: Record<string, ChecklistItemStatus> = {
  'cp-1': 'present',
  'cp-1-1': 'present',
  'cp-1-2': 'present',
  'cp-1-3': 'absent',
  'cp-2': 'absent',
  'cp-2-1': 'present',
  'cp-2-2': 'absent',
  'cp-2-3': 'absent',
  'cp-3': 'partial',
  'cp-3-1': 'present',
  'cp-3-2': 'absent',
  'cp-4': 'absent',
  'cp-4-1': 'absent',
  'cp-5': 'present',
  'cp-5-1': 'present',
  'cp-5-2': 'present',
}

export const DEEPDIVE_CHECKLIST_STATUS: Record<string, ChecklistItemStatus> = {
  'dd-1': 'present',
  'dd-1-1': 'present',
  'dd-1-2': 'absent',
  'dd-2': 'partial',
  'dd-2-1': 'present',
  'dd-2-2': 'absent',
  'dd-2-3': 'absent',
  'dd-3': 'absent',
  'dd-3-1': 'absent',
  'dd-3-2': 'absent',
  'dd-4': 'partial',
  'dd-4-1': 'present',
  'dd-4-2': 'absent',
  'dd-4-3': 'absent',
}
