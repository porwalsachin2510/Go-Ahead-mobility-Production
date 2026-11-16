'use client'

import Link from 'next/link'
import { useState } from 'react'
import useSWR from 'swr'
import { Download } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { fetcher } from '@/lib/client/api'
import { LEAD_STATUSES, LEAD_STATUS_LABELS, LEAD_TYPE_LABELS, type LeadType } from '@/lib/leads'
import { formatDate, Input, Notice, Select, StatusBadge } from './ui'

type Lead = { _id: string; publicReference: string; type: LeadType; status: string; vertical: string; city?: string; contact?: { name?: string; company?: string; email?: string }; ownerId?: { name?: string } | null; createdAt: string }
type Res = { items: Lead[]; total: number; page: number; limit: number; counts: Record<string, number> }

export function LeadsTable({ initialStatus, canExport }: { initialStatus?: string; canExport: boolean }) {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState(initialStatus ?? '')
  const [vertical, setVertical] = useState('')
  const [owner, setOwner] = useState('')
  const [page, setPage] = useState(1)
  const params = new URLSearchParams({ page: String(page) })
  if (q) params.set('q', q)
  if (status) params.set('status', status)
  if (vertical) params.set('vertical', vertical)
  if (owner) params.set('owner', owner)
  const { data, error, isLoading } = useSWR<Res>(`/api/v1/admin/leads?${params}`, fetcher, { keepPreviousData: true })
  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1
  const exportParams = new URLSearchParams(params)
  exportParams.set('format', 'csv')

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => (setStatus(''), setPage(1))} className={pill(!status)}>
          All
        </button>
        {LEAD_STATUSES.map((s) => (
          <button key={s} type="button" onClick={() => (setStatus(s), setPage(1))} className={pill(status === s)}>
            {LEAD_STATUS_LABELS[s]} <span className="opacity-60">{data?.counts?.[s] ?? 0}</span>
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2 md:flex-row">
        <Input aria-label="Search leads" placeholder="Search reference, name, company, email, city" value={q} onChange={(e) => (setQ(e.target.value), setPage(1))} className="md:max-w-sm" />
        <Select aria-label="Vertical" value={vertical} onChange={(e) => (setVertical(e.target.value), setPage(1))} className="md:w-44">
          <option value="">All verticals</option>
          <option value="accommodation">Accommodation</option>
          <option value="transport">Transport</option>
          <option value="general">General</option>
        </Select>
        <Select aria-label="Owner" value={owner} onChange={(e) => (setOwner(e.target.value), setPage(1))} className="md:w-44">
          <option value="">Any owner</option>
          <option value="me">Assigned to me</option>
          <option value="none">Unassigned</option>
        </Select>
        {canExport && (
          <a href={`/api/v1/admin/leads?${exportParams}`} className={buttonVariants({ variant: 'outline', className: 'md:ml-auto' })}>
            <Download className="size-4" aria-hidden="true" /> Export CSV
          </a>
        )}
      </div>
      {error && <Notice tone="error">{error.message}</Notice>}
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-border bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Reference</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Owner</th>
              <th className="px-4 py-3 font-medium">Received</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && !data && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            )}
            {data?.items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No leads match these filters.
                </td>
              </tr>
            )}
            {data?.items.map((l) => (
              <tr key={l._id} className="hover:bg-muted/40">
                <td className="px-4 py-3">
                  <Link href={`/admin/leads/${l._id}`} className="font-mono text-xs font-medium text-primary">
                    {l.publicReference}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium">{l.contact?.company || l.contact?.name || '—'}</div>
                  <div className="text-xs text-muted-foreground">{l.contact?.name}</div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{LEAD_TYPE_LABELS[l.type] ?? l.type}</td>
                <td className="px-4 py-3">
                  <StatusBadge value={l.status} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">{l.ownerId?.name ?? 'Unassigned'}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(l.createdAt, true)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data && pages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {data.page} of {pages} · {data.total} leads
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function pill(active: boolean) {
  return `rounded-full border px-3 py-1 text-xs font-medium transition ${active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:border-primary/40'}`
}
