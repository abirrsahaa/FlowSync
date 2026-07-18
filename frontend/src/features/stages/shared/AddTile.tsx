import { Plus } from 'lucide-react'

export interface AddTileProps {
  label: string
  onClick: () => void
}

export function AddTile({ label, onClick }: AddTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[9rem] flex-col items-center justify-center gap-2 rounded-sharp border border-dashed border-app-border-strong text-app-ink-muted transition-colors hover:border-app-navy hover:text-app-navy"
    >
      <Plus className="h-5 w-5" />
      <span className="font-mono text-xs uppercase tracking-[0.1em]">{label}</span>
    </button>
  )
}
