'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { api, fetcher } from '@/lib/client/api'
import { Card, formatDate, Notice } from './ui'

type Item = { id: string; authorName: string; authorEmail: string; body: string; status: string; spamScore: number; isReply: boolean; createdAt: string; post: { title: string; slug: string } | null }
type Data = { items: Item[]; total: number; pages: number; counts: Record<string, number> }
type Action = 'approve' | 'reject' | 'spam' | 'delete'

const TABS = ['pending', 'approved', 'spam', 'rejected', 'all'] as const

export function CommentModeration() {
  const [status, setStatus] = useState<(typeof TABS)[number]>('pending')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [msg, setMsg] = useState<{ tone: 'error' | 'success'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const key = `/api/v1/admin/blog/comments?status=${status}&page=${page}`
  const { data, error, mutate } = useSWR<Data>(key, fetcher)

  async function act(ids: string[], action: Action) {
    if (action === 'delete' && !window.confirm(`Delete ${ids.length} comment(s) and their replies permanently?`)) return
    setBusy(true)
    setMsg(null)
    const r = await api<{ changed: number }>('/api/v1/admin/blog/comments', { method: 'PATCH', json: { ids, action } })
    setBusy(false)
    if (!r.ok) return setMsg({ tone: 'error', text: r.error.message })
    setSelected(new Set())
    setMsg({ tone: 'success', text: `${r.data.changed} comment(s) updated.` })
    mutate()
  }

  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const items = data?.items ?? []

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label="Comment status" className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Button key={t} role="tab" aria-selected={status === t} size="sm" variant={status === t ? 'default' : 'outline'} onClick={() => { setStatus(t); setPage(1); setSelected(new Set()) }}>
            <span className="capitalize">{t}</span>
            {t !== 'all' && data?.counts[t] ? <span className="ml-1 tabular-nums opacity-70">{data.counts[t]}</span> : null}
          </Button>
        ))}
      </div>

      {selected.size > 0 && (
        <Card className="flex flex-wrap items-center gap-2 p-3">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <Button size="sm" disabled={busy} onClick={() => act([...selected], 'approve')}>Approve</Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => act([...selected], 'reject')}>Reject</Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => act([...selected], 'spam')}>Mark spam</Button>
          <Button size="sm" variant="destructive" disabled={busy} onClick={() => act([...selected], 'delete')}>Delete</Button>
        </Card>
      )}

      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
      {error && <Notice tone="error">{error.message}</Notice>}
      {!data && !error && <p className="text-sm text-muted-foreground">Loading comments…</p>}
      {data && items.length === 0 && <Card className="p-8 text-center text-sm text-muted-foreground">No {status === 'all' ? '' : status} comments.</Card>}

      <ul className="flex flex-col gap-3">
        {items.map((c) => (
          <li key={c.id}>
            <Card className="flex gap-3 p-4">
              <input type="checkbox" className="mt-1 size-4 shrink-0 accent-primary" checked={selected.has(c.id)} onChange={() => toggle(c.id)} aria-label={`Select comment by ${c.authorName}`} />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span className="font-semibold">{c.authorName}</span>
                  <span className="text-muted-foreground">{c.authorEmail}</span>
                  <span className="text-muted-foreground">{formatDate(c.createdAt)}</span>
                  {c.isReply && <span className="rounded bg-muted px-1.5 py-0.5 text-xs">Reply</span>}
                  {c.spamScore > 0 && <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-xs text-destructive">Spam score {c.spamScore}</span>}
                  {status === 'all' && <span className="rounded bg-muted px-1.5 py-0.5 text-xs capitalize">{c.status}</span>}
                </div>
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{c.body}</p>
                {c.post && (
                  <a href={`/blog/${c.post.slug}`} target="_blank" rel="noreferrer" className="text-sm text-primary underline-offset-4 hover:underline">
                    On: {c.post.title}
                  </a>
                )}
                <div className="flex flex-wrap gap-2">
                  {c.status !== 'approved' && <Button size="sm" disabled={busy} onClick={() => act([c.id], 'approve')}>Approve</Button>}
                  {c.status !== 'rejected' && <Button size="sm" variant="outline" disabled={busy} onClick={() => act([c.id], 'reject')}>Reject</Button>}
                  {c.status !== 'spam' && <Button size="sm" variant="outline" disabled={busy} onClick={() => act([c.id], 'spam')}>Spam</Button>}
                  <Button size="sm" variant="ghost" disabled={busy} onClick={() => act([c.id], 'delete')}>Delete</Button>
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      {data && data.pages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-between gap-2">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {page} of {data.pages}</span>
          <Button size="sm" variant="outline" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </nav>
      )}
    </div>
  )
}
