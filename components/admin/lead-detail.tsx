'use client'

import Link from 'next/link'
import { useState } from 'react'
import useSWR from 'swr'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api, fetcher } from '@/lib/client/api'
import { LEAD_STATUSES, LEAD_STATUS_LABELS, LEAD_TYPE_LABELS, type LeadType } from '@/lib/leads'
import { Card, FieldShell, formatDate, Notice, Select, StatusBadge, Textarea } from './ui'

type Activity = { _id: string; actionType: string; summary: string; body?: string; createdAt: string }
type Data = { lead: Record<string, any>; activities: Activity[] }

const SKIP = new Set(['_id', '__v', 'contact', 'consent', 'attribution', 'ownerId', 'publicReference', 'type', 'status', 'createdAt', 'updatedAt', 'archived', 'priority', 'nextFollowUpAt', 'firstContactAt', 'idempotencyKey', 'teamKey', 'routingRuleId', 'lossReason'])

function humanize(k: string) {
  return k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase())
}

function display(v: unknown): string {
  if (v == null || v === '') return '—'
  if (Array.isArray(v)) return v.map(display).join(', ')
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  if (typeof v === 'object') return Object.entries(v as Record<string, unknown>).filter(([, x]) => x !== '' && x != null).map(([k, x]) => `${humanize(k)}: ${display(x)}`).join(' · ')
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) return formatDate(v)
  return String(v)
}

export function LeadDetail({ id, userId, canWrite }: { id: string; userId: string; canWrite: boolean }) {
  const { data, error, mutate } = useSWR<Data>(`/api/v1/admin/leads/${id}`, fetcher)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ tone: 'error' | 'success'; text: string } | null>(null)

  if (error) return <Notice tone="error">{error.message}</Notice>
  if (!data) return <p className="text-sm text-muted-foreground">Loading lead…</p>
  const { lead, activities } = data

  const update = async (patch: Record<string, unknown>, ok = 'Saved') => {
    setBusy(true)
    setMsg(null)
    const r = await api(`/api/v1/admin/leads/${id}`, { method: 'PATCH', json: patch })
    setBusy(false)
    if (!r.ok) return setMsg({ tone: 'error', text: r.error.message })
    setMsg({ tone: 'success', text: ok })
    mutate()
    return true
  }

  const details = Object.entries(lead).filter(([k, v]) => !SKIP.has(k) && v !== '' && v != null && !(Array.isArray(v) && v.length === 0))

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/leads" className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> All leads
      </Link>
      <div className="flex flex-col gap-2 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1">
          <p className="font-mono text-xs text-muted-foreground">{lead.publicReference}</p>
          <h1 className="font-display text-2xl font-semibold">{lead.contact?.company || lead.contact?.name}</h1>
          <p className="text-sm text-muted-foreground">
            {LEAD_TYPE_LABELS[lead.type as LeadType]} · received {formatDate(lead.createdAt, true)}
          </p>
        </div>
        <StatusBadge value={lead.status} />
      </div>
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card className="flex flex-col gap-3">
            <h2 className="font-semibold">Contact</h2>
            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              {Object.entries(lead.contact ?? {}).map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-muted-foreground">{humanize(k)}</dt>
                  <dd className="break-words">
                    {k === 'email' && v ? <a href={`mailto:${v}`} className="text-primary">{String(v)}</a> : k === 'phone' && v ? <a href={`tel:${v}`} className="text-primary">{String(v)}</a> : display(v)}
                  </dd>
                </div>
              ))}
            </dl>
          </Card>
          <Card className="flex flex-col gap-3">
            <h2 className="font-semibold">Requirement</h2>
            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              {details.map(([k, v]) => (
                <div key={k} className={typeof v === 'string' && v.length > 80 ? 'sm:col-span-2' : ''}>
                  <dt className="text-xs text-muted-foreground">{humanize(k)}</dt>
                  <dd className="whitespace-pre-wrap break-words leading-relaxed">{display(v)}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <Card className="flex flex-col gap-4">
            <h2 className="font-semibold">Activity</h2>
            {canWrite && (
              <form
                className="flex flex-col gap-2"
                onSubmit={async (e) => {
                  e.preventDefault()
                  if (note.trim() && (await update({ note }, 'Note added'))) setNote('')
                }}
              >
                <Textarea aria-label="Add a note" placeholder="Log a call, email or internal note…" value={note} onChange={(e) => setNote(e.target.value)} />
                <Button type="submit" size="sm" className="w-fit" disabled={busy || !note.trim()}>
                  Add note
                </Button>
              </form>
            )}
            <ol className="flex flex-col gap-3 border-l border-border pl-4">
              {activities.map((a) => (
                <li key={a._id} className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{a.summary}</span>
                  {a.body && <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{a.body}</p>}
                  <span className="text-xs text-muted-foreground">{formatDate(a.createdAt, true)}</span>
                </li>
              ))}
              {activities.length === 0 && <li className="text-sm text-muted-foreground">No activity yet.</li>}
            </ol>
          </Card>
        </div>
        <Card className="flex h-fit flex-col gap-4">
          <h2 className="font-semibold">Manage</h2>
          <FieldShell id="lead-status" label="Status">
            <Select id="lead-status" disabled={!canWrite || busy} value={lead.status} onChange={(e) => update({ status: e.target.value }, 'Status updated')}>
              {LEAD_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {LEAD_STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
          </FieldShell>
          <FieldShell id="lead-priority" label="Priority">
            <Select id="lead-priority" disabled={!canWrite || busy} value={lead.priority ?? 'normal'} onChange={(e) => update({ priority: e.target.value }, 'Priority updated')}>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
            </Select>
          </FieldShell>
          <div className="flex flex-col gap-1 text-sm">
            <span className="text-xs text-muted-foreground">Owner</span>
            <span>{lead.ownerId?.name ?? 'Unassigned'}</span>
            {canWrite && String(lead.ownerId?._id ?? lead.ownerId ?? '') !== userId && (
              <Button size="sm" variant="outline" className="mt-1 w-fit" disabled={busy} onClick={() => update({ ownerId: userId }, 'Assigned to you')}>
                Assign to me
              </Button>
            )}
          </div>
          <div className="flex flex-col gap-1 text-sm">
            <span className="text-xs text-muted-foreground">Source</span>
            <span className="break-words">{display(lead.attribution) || '—'}</span>
          </div>
          <div className="flex flex-col gap-1 text-sm">
            <span className="text-xs text-muted-foreground">Consent</span>
            <span className="break-words">{display(lead.consent)}</span>
          </div>
        </Card>
      </div>
    </div>
  )
}
