'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import { CheckCircle2, Copy, GitCompare, History, MessageSquare, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api, fetcher } from '@/lib/client/api'
import { Card, formatDate, Input, Notice, StatusBadge, Textarea } from './ui'

type TrailItem = {
  _id: string
  kind: string
  body: string
  fromState: string
  toState: string
  authorEmail: string
  createdAt: string
  anchorField?: string
  anchorQuote?: string
  resolved?: boolean
}
type Trail = { state: string; revision: number; transitions: { to: string; label: string }[]; items: TrailItem[] }
type Revisions = { current: number; items: { _id: string; version: number; changeSummary: string; createdAt: string }[] }
type DiffLine = { type: 'same' | 'add' | 'remove'; text: string }
type Comparison = { from: number; to: number | 'current'; fields: { field: string; added: number; removed: number; lines: DiffLine[] }[] }

const ANCHOR_FIELDS = [
  { value: '', label: 'Whole post' },
  { value: 'title', label: 'Title' },
  { value: 'subtitle', label: 'Subtitle' },
  { value: 'excerpt', label: 'Excerpt' },
  { value: 'content', label: 'Body' },
  { value: 'heroImage', label: 'Hero image' },
  { value: 'seo', label: 'SEO' },
  { value: 'cta', label: 'Call to action' },
]

const selectClass = 'h-9 rounded-md border border-input bg-background px-2 text-sm'

export function PostWorkflowPanel({ postId, canWrite }: { postId: string; canWrite: boolean }) {
  const router = useRouter()
  const { mutate: globalMutate } = useSWRConfig()
  const trailKey = `/api/v1/admin/blog/posts/${postId}/workflow`
  const revKey = `/api/v1/admin/blog/posts/${postId}/revisions`
  const { data: trail, error, mutate: refreshTrail } = useSWR<Trail>(trailKey, fetcher)
  const { data: revs, mutate: refreshRevs } = useSWR<Revisions>(revKey, fetcher)
  const [note, setNote] = useState('')
  const [publishAt, setPublishAt] = useState('')
  const [comment, setComment] = useState('')
  const [anchorField, setAnchorField] = useState('')
  const [anchorQuote, setAnchorQuote] = useState('')
  const [showResolved, setShowResolved] = useState(false)
  const [compareFrom, setCompareFrom] = useState('')
  const [compareTo, setCompareTo] = useState('current')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ tone: 'error' | 'success'; text: string } | null>(null)

  const compareKey = compareFrom ? `${revKey}/compare?from=${compareFrom}&to=${compareTo}` : null
  const { data: comparison, error: compareError, isLoading: comparing } = useSWR<Comparison>(compareKey, fetcher)

  const refreshAll = async () => {
    await Promise.all([refreshTrail(), refreshRevs(), globalMutate(`/api/v1/admin/c/posts/${postId}`)])
    router.refresh()
  }

  const transition = async (to: string) => {
    setBusy(true)
    setMsg(null)
    const r = await api(trailKey, {
      method: 'POST',
      json: { action: 'transition', to, note: note || undefined, publishAt: to === 'scheduled' && publishAt ? new Date(publishAt).toISOString() : undefined, expectedRevision: trail?.revision },
    })
    setBusy(false)
    if (!r.ok) {
      const detail = r.error.details && typeof r.error.details === 'object' ? Object.values(r.error.details).join(' ') : ''
      return setMsg({ tone: 'error', text: `${r.error.message}${detail ? ` ${detail}` : ''}` })
    }
    setNote('')
    setMsg({ tone: 'success', text: 'Workflow updated' })
    await refreshAll()
  }

  const addComment = async () => {
    if (!comment.trim()) return
    setBusy(true)
    const r = await api(trailKey, { method: 'POST', json: { action: 'comment', body: comment, anchorField: anchorField || undefined, anchorQuote: anchorQuote || undefined } })
    setBusy(false)
    if (!r.ok) return setMsg({ tone: 'error', text: r.error.message })
    setComment('')
    setAnchorQuote('')
    await refreshTrail()
  }

  const toggleResolved = async (item: TrailItem) => {
    setBusy(true)
    const r = await api(`/api/v1/admin/blog/posts/${postId}/comments/${item._id}`, { method: 'PATCH', json: { resolved: !item.resolved } })
    setBusy(false)
    if (!r.ok) return setMsg({ tone: 'error', text: r.error.message })
    await refreshTrail()
  }

  const restore = async (version: number) => {
    if (!confirm(`Restore version ${version}? Current content will be replaced (it stays in history).`)) return
    setBusy(true)
    const r = await api(revKey, { method: 'POST', json: { version } })
    setBusy(false)
    if (!r.ok) return setMsg({ tone: 'error', text: r.error.message })
    setMsg({ tone: 'success', text: `Restored version ${version}` })
    await refreshAll()
  }

  const duplicate = async () => {
    setBusy(true)
    const r = await api<{ _id: string }>(`/api/v1/admin/blog/posts/${postId}/duplicate`, { method: 'POST' })
    setBusy(false)
    if (!r.ok) return setMsg({ tone: 'error', text: r.error.message })
    router.push(`/admin/c/posts/${r.data._id}`)
  }

  if (error) return <Notice tone="error">{error.message}</Notice>
  if (!trail) return <p className="text-sm text-muted-foreground">Loading workflow…</p>
  const needsSchedule = trail.transitions.some((t) => t.to === 'scheduled')
  const openComments = trail.items.filter((i) => i.kind === 'comment' && !i.resolved).length
  const visibleItems = showResolved ? trail.items : trail.items.filter((i) => !(i.kind === 'comment' && i.resolved))

  return (
    <section aria-labelledby="workflow-heading" className="flex flex-col gap-4">
      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h2 id="workflow-heading" className="font-display text-lg font-semibold">
              Editorial workflow
            </h2>
            <StatusBadge value={trail.state} />
            <span className="text-xs text-muted-foreground">Revision {trail.revision}</span>
            {openComments > 0 && <span className="text-xs text-muted-foreground">{openComments} open comment{openComments === 1 ? '' : 's'}</span>}
          </div>
          {canWrite && (
            <Button type="button" variant="outline" size="sm" onClick={duplicate} disabled={busy}>
              <Copy className="size-4" /> Duplicate
            </Button>
          )}
        </div>
        {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
        {trail.transitions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No workflow actions are available to your role for this state.</p>
        ) : (
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium">
              Note for the trail (required when requesting changes)
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={4000} />
            </label>
            {needsSchedule && (
              <label className="flex max-w-xs flex-col gap-1 text-sm font-medium">
                Publish at (for scheduling)
                <Input type="datetime-local" value={publishAt} onChange={(e) => setPublishAt(e.target.value)} />
              </label>
            )}
            <div className="flex flex-wrap gap-2">
              {trail.transitions.map((t) => (
                <Button key={t.to} type="button" size="sm" variant={t.to === 'published' || t.to === 'approved' ? 'default' : 'outline'} disabled={busy} onClick={() => transition(t.to)}>
                  {t.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 font-display font-semibold">
              <MessageSquare className="size-4" /> Reviewer comments
            </h3>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} />
              Show resolved
            </label>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2 md:flex-row">
              <select className={selectClass} value={anchorField} onChange={(e) => setAnchorField(e.target.value)} aria-label="Comment applies to">
                {ANCHOR_FIELDS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
              <Input value={anchorQuote} onChange={(e) => setAnchorQuote(e.target.value)} placeholder="Quoted passage (optional)" aria-label="Quoted passage" maxLength={500} />
            </div>
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a review comment" aria-label="Review comment" rows={2} maxLength={4000} />
            <div className="flex justify-end">
              <Button type="button" size="sm" onClick={addComment} disabled={busy || !comment.trim()}>
                Post comment
              </Button>
            </div>
          </div>
          {visibleItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">No review activity yet.</p>
          ) : (
            <ul className="flex max-h-96 flex-col gap-3 overflow-y-auto text-sm">
              {visibleItems.map((i) => (
                <li key={i._id} className={`flex flex-col gap-1 border-l-2 pl-3 ${i.kind === 'comment' && !i.resolved ? 'border-primary' : 'border-border'} ${i.resolved ? 'opacity-60' : ''}`}>
                  <p className="text-xs text-muted-foreground">
                    {i.authorEmail || 'system'} · {formatDate(i.createdAt, true)}
                    {i.toState ? ` · ${i.fromState || '—'} → ${i.toState}` : ''}
                    {i.anchorField ? ` · on ${ANCHOR_FIELDS.find((f) => f.value === i.anchorField)?.label ?? i.anchorField}` : ''}
                  </p>
                  {i.anchorQuote && <blockquote className="border-l border-border pl-2 italic text-muted-foreground">{`"${i.anchorQuote}"`}</blockquote>}
                  {i.body && <p className="whitespace-pre-wrap break-words">{i.body}</p>}
                  {i.kind === 'comment' && (
                    <div>
                      <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => toggleResolved(i)} disabled={busy}>
                        <CheckCircle2 className="size-3.5" /> {i.resolved ? 'Reopen' : 'Resolve'}
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="flex flex-col gap-3">
          <h3 className="flex items-center gap-2 font-display font-semibold">
            <History className="size-4" /> Revision history
          </h3>
          {!revs || revs.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No revisions recorded.</p>
          ) : (
            <ul className="flex max-h-80 flex-col gap-2 overflow-y-auto text-sm">
              {revs.items.map((r) => (
                <li key={r._id} className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
                  <span className="min-w-0">
                    <span className="font-medium">v{r.version}</span> <span className="text-muted-foreground">{r.changeSummary} · {formatDate(r.createdAt, true)}</span>
                  </span>
                  <span className="flex shrink-0 gap-1">
                    <Button type="button" size="sm" variant="ghost" onClick={() => { setCompareFrom(String(r.version)); setCompareTo('current') }}>
                      <GitCompare className="size-4" /> <span className="sr-only md:not-sr-only">Compare</span>
                    </Button>
                    {canWrite && r.version !== revs.current && (
                      <Button type="button" size="sm" variant="ghost" onClick={() => restore(r.version)} disabled={busy}>
                        <RotateCcw className="size-4" /> <span className="sr-only md:not-sr-only">Restore</span>
                      </Button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {revs && revs.items.length > 0 && (
        <Card className="flex flex-col gap-3">
          <h3 className="flex items-center gap-2 font-display font-semibold">
            <GitCompare className="size-4" /> Compare revisions
          </h3>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <label className="flex items-center gap-2">
              From
              <select className={selectClass} value={compareFrom} onChange={(e) => setCompareFrom(e.target.value)}>
                <option value="">Select…</option>
                {revs.items.map((r) => (
                  <option key={r._id} value={r.version}>
                    v{r.version}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2">
              To
              <select className={selectClass} value={compareTo} onChange={(e) => setCompareTo(e.target.value)}>
                <option value="current">Current</option>
                {revs.items.map((r) => (
                  <option key={r._id} value={r.version}>
                    v{r.version}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {compareError && <Notice tone="error">{compareError.message}</Notice>}
          {comparing && <p className="text-sm text-muted-foreground">Comparing…</p>}
          {comparison && comparison.fields.length === 0 && <p className="text-sm text-muted-foreground">No differences between these versions.</p>}
          {comparison?.fields.map((f) => (
            <details key={f.field} open={f.field === 'content' || comparison.fields.length <= 2} className="rounded-md border border-border">
              <summary className="cursor-pointer px-3 py-2 text-sm font-medium">
                {f.field} <span className="text-xs text-muted-foreground">+{f.added} −{f.removed}</span>
              </summary>
              <pre className="max-h-96 overflow-auto border-t border-border font-mono text-xs leading-relaxed">
                {f.lines.map((l, idx) => (
                  <div key={idx} className={l.type === 'add' ? 'bg-primary/15 px-3' : l.type === 'remove' ? 'bg-destructive/15 px-3 line-through decoration-destructive/50' : 'px-3 text-muted-foreground'}>
                    <span aria-hidden="true" className="mr-2 select-none">
                      {l.type === 'add' ? '+' : l.type === 'remove' ? '−' : ' '}
                    </span>
                    <span className="sr-only">{l.type === 'add' ? 'Added: ' : l.type === 'remove' ? 'Removed: ' : ''}</span>
                    {l.text || ' '}
                  </div>
                ))}
              </pre>
            </details>
          ))}
        </Card>
      )}
    </section>
  )
}
