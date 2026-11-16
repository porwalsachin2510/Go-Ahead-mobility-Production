'use client'

import Link from 'next/link'
import { useState } from 'react'
import useSWR from 'swr'
import { ArrowLeft, Download, Star } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { api, fetcher } from '@/lib/client/api'
import { APPLICATION_STATES, STATE_LABELS, type ApplicationState } from '@/lib/careers/labels'
import { Card, formatDate, Input, Notice, Select, Textarea } from './ui'

type Detail = {
  id: string
  reference: string
  jobId: string
  jobTitle: string
  name: string
  email: string
  phone: string
  state: ApplicationState
  rating: number
  tags: string[]
  screeningPassed: boolean
  currentLocation: string
  createdAt: string
  portfolioUrl: string
  linkedinUrl: string
  noticePeriod: string
  expectedSalary: string
  coverNote: string
  answers: { question: string; answer: string; knockout?: boolean }[]
  notes: string
  source: { referrer?: string; utmSource?: string; utmMedium?: string; utmCampaign?: string; landingPage?: string }
  timeline: { kind: string; text: string; byName: string; at: string }[]
  hasCv: boolean
  retentionAt: string
  otherApplications: { id: string; reference: string; jobTitle: string; state: ApplicationState; createdAt: string }[]
}

export function ApplicationDetail({ id, canManage }: { id: string; canManage: boolean }) {
  const { data, error, mutate } = useSWR<Detail>(`/api/v1/admin/careers/applications/${id}`, fetcher)
  const [note, setNote] = useState('')
  const [notify, setNotify] = useState(false)
  const [tagDraft, setTagDraft] = useState('')
  const [notes, setNotes] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  async function patch(body: Record<string, unknown>, ok = 'Saved') {
    setBusy(true)
    const r = await api<Detail>(`/api/v1/admin/careers/applications/${id}`, { method: 'PATCH', json: body })
    setBusy(false)
    if (r.ok) {
      mutate(r.data, { revalidate: false })
      setMsg({ tone: 'success', text: ok })
    } else setMsg({ tone: 'error', text: r.error.message })
    return r.ok
  }

  if (error) return <Notice tone="error">{error.message}</Notice>
  if (!data) return <p className="text-sm text-muted-foreground">Loading…</p>

  const facts = [
    ['Email', data.email],
    ['Phone', data.phone],
    ['Location', data.currentLocation],
    ['Notice period', data.noticePeriod],
    ['Expected salary', data.expectedSalary],
    ['Applied', formatDate(data.createdAt, true)],
    ['Data retained until', formatDate(data.retentionAt)],
  ].filter(([, v]) => v)
  const source = [data.source.utmSource && `utm: ${[data.source.utmSource, data.source.utmMedium, data.source.utmCampaign].filter(Boolean).join(' / ')}`, data.source.referrer && `referrer: ${data.source.referrer}`].filter(Boolean)

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/careers/applications" className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> All applications
      </Link>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">{data.name}</h1>
          <p className="text-sm text-muted-foreground">
            {data.reference} · {data.jobTitle} · {STATE_LABELS[data.state]}
          </p>
          {!data.screeningPassed ? <p className="text-sm font-medium text-destructive">Flagged by a knockout screening answer</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {data.hasCv ? (
            <a href={`/api/v1/admin/careers/applications/${id}/cv`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              <Download className="size-4" aria-hidden="true" /> Download CV
            </a>
          ) : null}
          {data.linkedinUrl ? <a href={data.linkedinUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: 'outline', size: 'sm' })}>LinkedIn</a> : null}
          {data.portfolioUrl ? <a href={data.portfolioUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: 'outline', size: 'sm' })}>Portfolio</a> : null}
        </div>
      </header>
      {msg ? <Notice tone={msg.tone}>{msg.text}</Notice> : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-6">
          <Card className="p-5">
            <dl className="grid gap-4 sm:grid-cols-2">
              {facts.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="text-sm font-medium break-words">{v}</dd>
                </div>
              ))}
              {source.length ? (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-muted-foreground">Source</dt>
                  <dd className="text-sm break-words">{source.join(' · ')}</dd>
                </div>
              ) : null}
            </dl>
          </Card>

          {data.answers.length ? (
            <Card className="flex flex-col gap-3 p-5">
              <h2 className="font-semibold">Screening answers</h2>
              <dl className="flex flex-col gap-3">
                {data.answers.map((a, i) => (
                  <div key={i}>
                    <dt className="text-sm text-muted-foreground">{a.question}</dt>
                    <dd className={`text-sm font-medium ${a.knockout ? 'text-destructive' : ''}`}>{a.answer || '—'}{a.knockout ? ' (knockout)' : ''}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          ) : null}

          {data.coverNote ? (
            <Card className="flex flex-col gap-2 p-5">
              <h2 className="font-semibold">Cover note</h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{data.coverNote}</p>
            </Card>
          ) : null}

          <Card className="flex flex-col gap-3 p-5">
            <h2 className="font-semibold">Activity</h2>
            {canManage ? (
              <form
                className="flex flex-col gap-2"
                onSubmit={async (e) => {
                  e.preventDefault()
                  if (note.trim() && (await patch({ note }, 'Note added'))) setNote('')
                }}
              >
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Add an interview note or comment" aria-label="New note" />
                <Button type="submit" size="sm" className="w-fit" disabled={busy || !note.trim()}>Add note</Button>
              </form>
            ) : null}
            <ol className="flex flex-col gap-3 border-l border-border pl-4">
              {data.timeline.map((t, i) => (
                <li key={i} className="text-sm">
                  <p className="whitespace-pre-wrap">{t.text}</p>
                  <p className="text-xs text-muted-foreground">{t.byName} · {formatDate(t.at, true)}</p>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <aside className="flex flex-col gap-4">
          <Card className="flex flex-col gap-3 p-5">
            <h2 className="font-semibold">Stage</h2>
            <Select value={data.state} disabled={!canManage || busy} onChange={(e) => patch({ state: e.target.value, notifyCandidate: notify }, 'Stage updated')} aria-label="Application stage">
              {APPLICATION_STATES.map((s) => <option key={s} value={s}>{STATE_LABELS[s]}</option>)}
            </Select>
            {canManage ? (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="size-4" />
                Email the candidate on stage change
              </label>
            ) : null}
          </Card>

          <Card className="flex flex-col gap-3 p-5">
            <h2 className="font-semibold">Rating</h2>
            <div className="flex gap-1" role="radiogroup" aria-label="Candidate rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={data.rating === n}
                  aria-label={`${n} star${n > 1 ? 's' : ''}`}
                  disabled={!canManage || busy}
                  onClick={() => patch({ rating: data.rating === n ? 0 : n }, 'Rating saved')}
                  className="rounded p-1 hover:bg-muted disabled:opacity-60"
                >
                  <Star className={`size-5 ${n <= data.rating ? 'fill-primary text-primary' : 'text-muted-foreground'}`} aria-hidden />
                </button>
              ))}
            </div>
          </Card>

          <Card className="flex flex-col gap-3 p-5">
            <h2 className="font-semibold">Tags</h2>
            <div className="flex flex-wrap gap-1">
              {data.tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs">
                  {t}
                  {canManage ? (
                    <button
                      type="button"
                      aria-label={`Remove ${t}`}
                      onClick={() => patch({ tags: data.tags.filter((x) => x !== t) }, 'Tags saved')}
                      className="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    >
                      ×
                    </button>
                  ) : null}
                </span>
              ))}
              {!data.tags.length ? <span className="text-sm text-muted-foreground">No tags</span> : null}
            </div>
            {canManage ? (
              <form
                className="flex gap-2"
                onSubmit={async (e) => {
                  e.preventDefault()
                  const t = tagDraft.trim()
                  if (t && (await patch({ tags: [...data.tags, t] }, 'Tags saved'))) setTagDraft('')
                }}
              >
                <Input value={tagDraft} onChange={(e) => setTagDraft(e.target.value)} placeholder="Add tag" aria-label="New tag" maxLength={40} />
                <Button type="submit" size="sm" variant="outline">Add</Button>
              </form>
            ) : null}
          </Card>

          <Card className="flex flex-col gap-3 p-5">
            <h2 className="font-semibold">Private notes</h2>
            <Textarea value={notes ?? data.notes} onChange={(e) => setNotes(e.target.value)} rows={5} disabled={!canManage} aria-label="Private notes" />
            {canManage && notes !== null && notes !== data.notes ? (
              <Button size="sm" className="w-fit" disabled={busy} onClick={async () => (await patch({ notes }, 'Notes saved')) && setNotes(null)}>
                Save notes
              </Button>
            ) : null}
          </Card>

          {data.otherApplications.length ? (
            <Card className="flex flex-col gap-2 p-5">
              <h2 className="font-semibold">Other applications</h2>
              <ul className="flex flex-col gap-2 text-sm">
                {data.otherApplications.map((o) => (
                  <li key={o.id}>
                    <Link href={`/admin/careers/applications/${o.id}`} className="hover:underline">{o.jobTitle}</Link>
                    <div className="text-xs text-muted-foreground">{o.reference} · {STATE_LABELS[o.state]} · {formatDate(o.createdAt)}</div>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </aside>
      </div>
    </div>
  )
}
