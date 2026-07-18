// Stage 3 — API / Interface Design. Section 5: endpoint definition, request/
// response schema, auth strategy, REST vs gRPC — reviewed for idempotency,
// pagination, versioning, error codes.

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { MonoLabel } from '@/components/common/MonoLabel'
import { useReviewStream } from '@/hooks/useReviewStream'
import type { Finding } from '@/domain/review'
import { AddTile } from '../shared/AddTile'
import { ReviewStreamSidebar } from '../shared/ReviewStreamSidebar'
import { StagePageLayout } from '../shared/StagePageLayout'
import { useStageSession } from '../shared/useStageSession'

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface EndpointDraft {
  id: string
  method: Method
  path: string
  description: string
  requiresAuth: boolean
}

let endpointCounter = 0
function makeEndpoint(method: Method, path: string, description: string, requiresAuth: boolean): EndpointDraft {
  endpointCounter += 1
  return { id: `ep-${endpointCounter}`, method, path, description, requiresAuth }
}

function seedEndpoints(): EndpointDraft[] {
  return [
    makeEndpoint('POST', '/videos', 'Upload a new video for transcoding.', true),
    makeEndpoint('GET', '/videos/{id}', 'Fetch video metadata and playback manifest.', false),
    makeEndpoint('GET', '/search', 'Search videos by title, tags, and description.', false),
    makeEndpoint('POST', '/videos/{id}/comments', 'Add a comment to a video.', true),
  ]
}

const DEFAULT_AUTH_STRATEGY =
  'JWT bearer token issued after Google OAuth login; short-lived access token with refresh-token rotation.'

const METHODS: Method[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

const METHOD_TEXT_CLASS: Record<Method, string> = {
  GET: 'text-app-green',
  POST: 'text-app-navy',
  PUT: 'text-app-gold',
  PATCH: 'text-app-gold',
  DELETE: 'text-app-red',
}

export function ApiDesignPage() {
  const { sessionId, problem, stages, loading } = useStageSession()
  const navigate = useNavigate()
  const review = useReviewStream('api', sessionId)

  const [endpoints, setEndpoints] = useState<EndpointDraft[]>(seedEndpoints)
  const [protocol, setProtocol] = useState<'REST' | 'GRPC'>('REST')
  const [authStrategy, setAuthStrategy] = useState(DEFAULT_AUTH_STRATEGY)

  useEffect(() => {
    if (loading) return
    const saved = stages.find((s) => s.stageId === 'api')?.userContent as
      | {
          endpoints: Array<{ method: Method; path: string; description: string; requiresAuth: boolean }>
          authStrategy: string
          protocol: 'REST' | 'GRPC'
        }
      | undefined
    setEndpoints(
      saved ? saved.endpoints.map((e) => makeEndpoint(e.method, e.path, e.description, e.requiresAuth)) : seedEndpoints(),
    )
    setAuthStrategy(saved?.authStrategy ?? DEFAULT_AUTH_STRATEGY)
    setProtocol(saved?.protocol ?? 'REST')
  }, [sessionId, loading, stages])

  function updateEndpoint(id: string, patch: Partial<EndpointDraft>) {
    setEndpoints((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }
  function removeEndpoint(id: string) {
    setEndpoints((items) => items.filter((item) => item.id !== id))
  }
  function addEndpoint() {
    setEndpoints((items) => [...items, makeEndpoint('GET', '/new-endpoint', '', false)])
  }

  function handleSubmit() {
    review.submit({
      endpoints: endpoints.map((e) => ({
        method: e.method,
        path: e.path,
        description: e.description,
        requiresAuth: e.requiresAuth,
      })),
      authStrategy,
      protocol,
    })
  }

  function handleChallenge(finding: Finding) {
    navigate(`/session/${sessionId}/challenge`, { state: { stageId: 'api', finding, verdict: review.verdict } })
  }

  return (
    <StagePageLayout
      sidebar={
        <ReviewStreamSidebar
          reviewerName="API Design Reviewer"
          reviewerTagline="Idempotency, pagination, versioning, error codes"
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
        <h1 className="text-xl font-semibold text-app-ink">API / Interface Design{problem ? `: ${problem.title}` : ''}</h1>
        <p className="mt-1 text-sm text-app-ink-muted">
          Define the endpoint surface, auth strategy, and protocol choice as you'd present it in an interview.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <MonoLabel muted={false}>Endpoints</MonoLabel>
        <div className="flex flex-col gap-3">
          {endpoints.map((endpoint) => (
            <Card key={endpoint.id}>
              <CardContent className="flex flex-col gap-3 py-3">
                <div className="flex items-center gap-2">
                  <Select value={endpoint.method} onValueChange={(v) => updateEndpoint(endpoint.id, { method: v as Method })}>
                    <SelectTrigger className="w-28">
                      <span className={cn('font-mono text-xs font-semibold', METHOD_TEXT_CLASS[endpoint.method])}>
                        <SelectValue />
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {METHODS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={endpoint.path}
                    onChange={(e) => updateEndpoint(endpoint.id, { path: e.target.value })}
                    className="flex-1 font-mono"
                    aria-label="Endpoint path"
                  />
                  <button
                    type="button"
                    onClick={() => removeEndpoint(endpoint.id)}
                    aria-label="Remove endpoint"
                    className="text-app-ink-muted transition-colors hover:text-app-red"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <Textarea
                  value={endpoint.description}
                  onChange={(e) => updateEndpoint(endpoint.id, { description: e.target.value })}
                  rows={2}
                  placeholder="What this endpoint does"
                  aria-label="Endpoint description"
                />
                <label className="flex items-center gap-2 text-xs text-app-ink-muted">
                  <Checkbox
                    checked={endpoint.requiresAuth}
                    onCheckedChange={(checked) => updateEndpoint(endpoint.id, { requiresAuth: checked === true })}
                  />
                  Requires auth
                </label>
              </CardContent>
            </Card>
          ))}
          <AddTile label="New Endpoint" onClick={addEndpoint} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex flex-col gap-2 py-3">
            <MonoLabel>Auth Strategy</MonoLabel>
            <Textarea value={authStrategy} onChange={(e) => setAuthStrategy(e.target.value)} rows={4} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-2 py-3">
            <MonoLabel>Protocol</MonoLabel>
            <RadioGroup value={protocol} onValueChange={(v) => setProtocol(v as 'REST' | 'GRPC')} className="gap-3">
              {(['REST', 'GRPC'] as const).map((p) => (
                <label key={p} className="flex items-center gap-2 text-sm text-app-ink">
                  <RadioGroupItem value={p} />
                  {p === 'REST' ? 'REST' : 'gRPC'}
                </label>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
      </section>
    </StagePageLayout>
  )
}
