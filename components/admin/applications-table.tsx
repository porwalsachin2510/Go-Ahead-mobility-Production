'use client'

import Link from 'next/link'
import { useState } from 'react'
import useSWR from 'swr'
import { Download } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { api, fetcher } from '@/lib/client/api'
import { APPLICATION_STATES, STATE_LABELS, type ApplicationState } from '@/lib/careers/labels'
import { formatDate, Input, Notice, Select } from './ui'

type Item = { id: string; reference: string; jobTitle: string; name: string; email: string; state: ApplicationState; rating: number; tags: string[]; screeningPassed: boolean; currentLocation: string; createdAt: string }
type Res = { items: Item[]; total: number; pages: number; counts: Record<string, number>; jobs: { id: string; title: string; status: string }[] }

const pill = (on: boolean) => `rounded-full border px-3 py-1 text-xs font-medium ${on ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted'}`

export function ApplicationsTable({ initialState, initialJobId, canManage }: { initialState?: string; initialJobId?: string; canManage: boolean }) {
  const [state, setState] = useState(initialState ?? '')
  const [jobId, setJobId] = useState(initialJobId ?? '')
  const [q, setQ] = useState('')
  const [flagged, setFlagged] = useState(false)
  const [minRating, setMinRating] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<string[]>([])
  const [bulkState, setBulkState] = useState('')
  const [notify, setNotify] = useState(false)
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)

  const params = new URLSearchParams({ page: String(page) })
  if (state) params.set('state', state)
  if (jobId) params.set('jobId', jobId)
  if (q) params.set('q', q)
  if (flagged) params.set('flagged', '1')
  if (minRating) params.set('minRating', minRating)
  const { data, error, isLoading, mutate } = useSWR<Res>(`/api/v1/admin/careers/applications?${params}`, fetcher, { keepPreviousData: true })
  const csv = new URLSearchParams(params)
  csv.set('format', 'csv')
  csv.delete('page')
  const total = data ? Object.values(data.counts).reduce((a, b) => a + b, 0) : 0
  const reset = () => (setPage(1), setSelected([]))

  async function applyBulk() {
    if (!bulkState || !selected.length) return
    const r = await api<{ changed: number; emailed: number }>('/api/v1/admin/careers/applications', { method: 'PATCH', json: { ids: selected, state: bulkState, notifyCandidate: notify } })
    if (r.ok) {
      setMsg({ tone: 'success', text: `Updated ${r.data.changed} application(s)${r.data.emailed ? `, emailed ${r.data.emailed}` : ''}.` })
      setSelected([])
      mutate()
    } else setMsg({ tone: 'error', text: r.error.message })
  }

  const items = data?.items ?? []
  const allChecked = items.length > 0 && items.every((i) => selected.includes(i.id))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => (setState(''), reset())} className={pill(!state)}>
          All ({total})
        </button>
        {APPLICATION_STATES.map((s) => (
          <button key={s} type="button" onClick={() => (setState(s), reset())} className={pill(state === s)}>
            {STATE_LABELS[s]} ({data?.counts[s] ?? 0})
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-56 flex-1 flex-col gap-1 text-xs font-medium">
          Search
          <Input value={q} onChange={(e) => (setQ(e.target.value), reset())} placeholder="Name, email, reference or tag" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium">
          Job
          <Select value={jobId} onChange={(e) => (setJobId(e.target.value), reset())}>
            <option value="">All jobs</option>
            {data?.jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
                {j.status !== 'published' ? ` (${j.status})` : ''}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium">
          Rating
          <Select value={minRating} onChange={(e) => (setMinRating(e.target.value), reset())}>
            <option value="">Any</option>
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{`${n}+ stars`}</option>)}
          </Select>
        </label>
        <label className="flex h-10 items-center gap-2 text-sm">
          <input type="checkbox" checked={flagged} onChange={(e) => (setFlagged(e.target.checked), reset())} className="size-4" />
          Knockout flagged only
        </label>
        <a href={`/api/v1/admin/careers/applications?${csv}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          <Download className="size-4" aria-hidden="true" /> Export CSV
        </a>
      </div>

      {canManage && selected.length ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted p-3 text-sm">
          <span className="font-medium">{selected.length} selected</span>
          <Select value={bulkState} onChange={(e) => setBulkState(e.target.value)} aria-label="Move selected to stage">
            <option value="">Move to stage…</option>
            {APPLICATION_STATES.map((s) => <option key={s} value={s}>{STATE_LABELS[s]}</option>)}
          </Select>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="size-4" />
            Email candidates
          </label>
          <Button size="sm" onClick={applyBulk} disabled={!bulkState}>
            Apply
          </Button>
        </div>
      ) : null}
      {msg ? <Notice tone={msg.tone}>{msg.text}</Notice> : null}
      {error ? <Notice tone="error">{error.message}</Notice> : null}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-left text-xs text-muted-foreground">
            <tr>
              {canManage ? (
                <th className="w-10 p-3">
                  <input type="checkbox" aria-label="Select all on this page" checked={allChecked} onChange={(e) => setSelected(e.target.checked ? items.map((i) => i.id) : [])} className="size-4" />
                </th>
              ) : null}
              <th className="p-3 font-medium">Candidate</th>
              <th className="p-3 font-medium">Job</th>
              <th className="p-3 font-medium">Stage</th>
              <th className="p-3 font-medium">Rating</th>
              <th className="p-3 font-medium">Applied</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && !data ? (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Loading…</td></tr>
            ) : items.length ? (
              items.map((a) => (
                <tr key={a.id} className="border-b border-border last:border-0">
                  {canManage ? (
                    <td className="p-3">
                      <input type="checkbox" aria-label={`Select ${a.name}`} checked={selected.includes(a.id)} onChange={(e) => setSelected((s) => (e.target.checked ? [...s, a.id] : s.filter((x) => x !== a.id)))} className="size-4" />
                    </td>
                  ) : null}
                  <td className="p-3">
                    <Link href={`/admin/careers/applications/${a.id}`} className="font-medium hover:underline">{a.name}</Link>
                    <div className="text-xs text-muted-foreground">{[a.reference, a.email, a.currentLocation].filter(Boolean).join(' · ')}</div>
                    {!a.screeningPassed || a.tags.length ? (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {!a.screeningPassed ? <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-xs text-destructive">Knockout</span> : null}
                        {a.tags.map((t) => <span key={t} className="rounded bg-muted px-1.5 py-0.5 text-xs">{t}</span>)}
                      </div>
                    ) : null}
                  </td>
                  <td className="p-3">{a.jobTitle}</td>
                  <td className="p-3">{STATE_LABELS[a.state] ?? a.state}</td>
                  <td className="p-3" aria-label={`${a.rating} of 5`}>{a.rating ? '★'.repeat(a.rating) : '—'}</td>
                  <td className="p-3 whitespace-nowrap">{formatDate(a.createdAt)}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No applications match these filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {data && data.pages > 1 ? (
        <div className="flex items-center justify-end gap-2 text-sm">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span>Page {page} of {data.pages}</span>
          <Button size="sm" variant="outline" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      ) : null}
    </div>
  )
}
