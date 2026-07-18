// Stage 4 — Data Model / Flow. Section 5: ERD-style UI — table/collection
// design, index strategy, storage technology, partitioning strategy.
// Reviewed for N+1 risk, hot partitions, consistency model.

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { MonoLabel } from '@/components/common/MonoLabel'
import { useReviewStream } from '@/hooks/useReviewStream'
import type { Finding } from '@/domain/review'
import { AddTile } from '../shared/AddTile'
import { ReviewStreamSidebar } from '../shared/ReviewStreamSidebar'
import { StagePageLayout } from '../shared/StagePageLayout'
import { useStageSession } from '../shared/useStageSession'

interface ColumnDraft {
  id: string
  name: string
  type: string
}

interface TableDraft {
  id: string
  name: string
  storageEngine: string
  columns: ColumnDraft[]
  indexesText: string
  partitioningStrategy: string
}

const STORAGE_ENGINES = ['PostgreSQL', 'MySQL', 'DynamoDB', 'Cassandra', 'MongoDB', 'Elasticsearch', 'Redis']

let tableCounter = 0
let columnCounter = 0

function makeColumn(name: string, type: string): ColumnDraft {
  columnCounter += 1
  return { id: `col-${columnCounter}`, name, type }
}

function makeTable(
  name: string,
  storageEngine: string,
  columns: ColumnDraft[],
  indexesText: string,
  partitioningStrategy: string,
): TableDraft {
  tableCounter += 1
  return { id: `tbl-${tableCounter}`, name, storageEngine, columns, indexesText, partitioningStrategy }
}

function seedTables(): TableDraft[] {
  return [
    makeTable(
      'videos',
      'PostgreSQL',
      [
        makeColumn('id', 'uuid'),
        makeColumn('user_id', 'uuid'),
        makeColumn('title', 'text'),
        makeColumn('description', 'text'),
        makeColumn('status', 'enum'),
        makeColumn('storage_url', 'text'),
        makeColumn('created_at', 'timestamp'),
      ],
      'idx_videos_user_id (user_id)',
      'Partitioned by upload month for cold-storage tiering.',
    ),
    makeTable(
      'users',
      'PostgreSQL',
      [makeColumn('id', 'uuid'), makeColumn('email', 'text'), makeColumn('display_name', 'text'), makeColumn('created_at', 'timestamp')],
      'idx_users_email (email) UNIQUE',
      'Not partitioned — fits comfortably on a single primary at this scale.',
    ),
    makeTable(
      'comments',
      'Cassandra',
      [makeColumn('id', 'uuid'), makeColumn('video_id', 'uuid'), makeColumn('user_id', 'uuid'), makeColumn('body', 'text'), makeColumn('created_at', 'timestamp')],
      'idx_comments_video_id (video_id)',
      'Partitioned by video_id for locality of comment reads.',
    ),
    makeTable(
      'view_counts',
      'Redis',
      [makeColumn('video_id', 'uuid'), makeColumn('count', 'integer')],
      '',
      'Sharded by video_id hash across the Redis cluster.',
    ),
  ]
}

export function DataModelPage() {
  const { sessionId, problem, stages, loading } = useStageSession()
  const navigate = useNavigate()
  const review = useReviewStream('datamodel', sessionId)

  const [tables, setTables] = useState<TableDraft[]>(seedTables)

  useEffect(() => {
    if (loading) return
    const saved = stages.find((s) => s.stageId === 'datamodel')?.userContent as
      | {
          tables: Array<{
            name: string
            storageEngine: string
            columns: Array<{ name: string; type: string }>
            indexes: string[]
            partitioningStrategy: string
          }>
        }
      | undefined
    setTables(
      saved
        ? saved.tables.map((t) =>
            makeTable(
              t.name,
              t.storageEngine,
              t.columns.map((c) => makeColumn(c.name, c.type)),
              t.indexes.join('\n'),
              t.partitioningStrategy,
            ),
          )
        : seedTables(),
    )
  }, [sessionId, loading, stages])

  function updateTable(id: string, patch: Partial<TableDraft>) {
    setTables((items) => items.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  }
  function removeTable(id: string) {
    setTables((items) => items.filter((t) => t.id !== id))
  }
  function addTable() {
    setTables((items) => [...items, makeTable('new_table', 'PostgreSQL', [makeColumn('id', 'uuid')], '', '')])
  }

  function updateColumn(tableId: string, columnId: string, patch: Partial<ColumnDraft>) {
    setTables((items) =>
      items.map((t) =>
        t.id === tableId ? { ...t, columns: t.columns.map((c) => (c.id === columnId ? { ...c, ...patch } : c)) } : t,
      ),
    )
  }
  function removeColumn(tableId: string, columnId: string) {
    setTables((items) =>
      items.map((t) => (t.id === tableId ? { ...t, columns: t.columns.filter((c) => c.id !== columnId) } : t)),
    )
  }
  function addColumn(tableId: string) {
    setTables((items) =>
      items.map((t) => (t.id === tableId ? { ...t, columns: [...t.columns, makeColumn('column', 'text')] } : t)),
    )
  }

  function handleSubmit() {
    review.submit({
      tables: tables.map((t) => ({
        name: t.name,
        storageEngine: t.storageEngine,
        columns: t.columns.map((c) => ({ name: c.name, type: c.type })),
        indexes: t.indexesText.split('\n').map((s) => s.trim()).filter(Boolean),
        partitioningStrategy: t.partitioningStrategy,
      })),
    })
  }

  function handleChallenge(finding: Finding) {
    navigate(`/session/${sessionId}/challenge`, { state: { stageId: 'datamodel', finding, verdict: review.verdict } })
  }

  return (
    <StagePageLayout
      sidebar={
        <ReviewStreamSidebar
          reviewerName="Data Model Reviewer"
          reviewerTagline="N+1 risk, hot partitions, consistency model"
          status={review.status}
          streamedText={review.streamedText}
          findings={review.findings}
          verdict={review.verdict}
          error={review.error}
          onSubmit={handleSubmit}
          onChallenge={handleChallenge}
        />
      }
    >
      <div>
        <h1 className="text-xl font-semibold text-app-ink">Data Model{problem ? `: ${problem.title}` : ''}</h1>
        <p className="mt-1 text-sm text-app-ink-muted">
          Design tables/collections, indexes, storage technology, and partitioning strategy per store.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {tables.map((table) => (
          <Card key={table.id}>
            <CardContent className="flex flex-col gap-3 py-3">
              <div className="flex items-center gap-2">
                <Input
                  value={table.name}
                  onChange={(e) => updateTable(table.id, { name: e.target.value })}
                  className="flex-1 font-mono font-semibold"
                  aria-label="Table name"
                />
                <Select value={table.storageEngine} onValueChange={(v) => updateTable(table.id, { storageEngine: v })}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STORAGE_ENGINES.map((engine) => (
                      <SelectItem key={engine} value={engine}>
                        {engine}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button
                  type="button"
                  onClick={() => removeTable(table.id)}
                  aria-label="Remove table"
                  className="text-app-ink-muted transition-colors hover:text-app-red"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                <MonoLabel>Columns</MonoLabel>
                <div className="flex flex-col gap-1.5">
                  {table.columns.map((column) => (
                    <div key={column.id} className="flex items-center gap-2">
                      <Input
                        value={column.name}
                        onChange={(e) => updateColumn(table.id, column.id, { name: e.target.value })}
                        className="flex-1 font-mono text-xs"
                        aria-label="Column name"
                      />
                      <Input
                        value={column.type}
                        onChange={(e) => updateColumn(table.id, column.id, { type: e.target.value })}
                        className="w-32 font-mono text-xs"
                        aria-label="Column type"
                      />
                      <button
                        type="button"
                        onClick={() => removeColumn(table.id, column.id)}
                        aria-label="Remove column"
                        className="text-app-ink-muted transition-colors hover:text-app-red"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => addColumn(table.id)}
                  className="self-start font-mono text-[11px] uppercase tracking-[0.1em] text-app-navy hover:text-app-navy-hover"
                >
                  + Add column
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <MonoLabel>Indexes (one per line)</MonoLabel>
                  <Textarea
                    value={table.indexesText}
                    onChange={(e) => updateTable(table.id, { indexesText: e.target.value })}
                    rows={2}
                    className="font-mono text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <MonoLabel>Partitioning Strategy</MonoLabel>
                  <Textarea
                    value={table.partitioningStrategy}
                    onChange={(e) => updateTable(table.id, { partitioningStrategy: e.target.value })}
                    rows={2}
                    className="text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        <AddTile label="New Table" onClick={addTable} />
      </div>
    </StagePageLayout>
  )
}
