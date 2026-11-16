'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import useSWR from 'swr'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { RESOURCE_MAP } from '@/lib/admin/resources'
import { api, fetcher } from '@/lib/client/api'
import { emptyRecord } from '@/lib/fields'
import { FieldGroup } from './field-input'
import { Card, Notice } from './ui'
import { usePostAutosave } from './use-post-autosave'

export function ResourceEditor({ resource, id, canWrite }: { resource: string; id: string; canWrite: boolean }) {
  const config = RESOURCE_MAP[resource]
  const router = useRouter()
  const isNew = id === 'new'
  const { data, error } = useSWR<Record<string, unknown>>(isNew ? null : `/api/v1/admin/c/${resource}/${id}`, fetcher)
  const [draft, setDraft] = useState<Record<string, unknown> | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState<{ tone: 'error' | 'success'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const autosave = usePostAutosave(resource === 'posts' && !isNew && canWrite, id, draft, Number(data?.revision ?? 0))

  const value = draft ?? (isNew ? emptyRecord(config.fields) : data)
  if (error) return <Notice tone="error">{error.message}</Notice>
  if (!value) return <p className="text-sm text-muted-foreground">Loading…</p>

  const title = String(value[config.titleField] ?? '') || (isNew ? `New ${config.singular.toLowerCase()}` : config.singular)
  const publicPath = !isNew && config.publicPath ? config.publicPath(value) : null
  const fields = config.fields

  const save = async () => {
    setBusy(true)
    setMsg(null)
    setErrors({})
    const body = Object.fromEntries(fields.map((f) => [f.key, value[f.key]]))
    const r = await api<Record<string, unknown>>(isNew ? `/api/v1/admin/c/${resource}` : `/api/v1/admin/c/${resource}/${id}`, { method: isNew ? 'POST' : 'PATCH', json: body })
    setBusy(false)
    if (!r.ok) {
      setErrors(r.error.details ?? {})
      return setMsg({ tone: 'error', text: r.error.message })
    }
    setMsg({ tone: 'success', text: 'Saved' })
    setDraft(null)
    if (resource === 'posts' && !isNew) await autosave.discard()
    if (isNew) router.replace(`/admin/c/${resource}/${r.data._id}`)
  }

  const remove = async () => {
    if (!confirm(`Delete this ${config.singular.toLowerCase()}? This cannot be undone.`)) return
    setBusy(true)
    const r = await api(`/api/v1/admin/c/${resource}/${id}`, { method: 'DELETE' })
    setBusy(false)
    if (!r.ok) return setMsg({ tone: 'error', text: r.error.message })
    router.replace(`/admin/c/${resource}`)
  }

  return (
    <div className="flex flex-col gap-6">
      <Link href={`/admin/c/${resource}`} className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> {config.label}
      </Link>
      <div className="sticky top-14 z-10 -mx-4 flex flex-col gap-3 border-b border-border bg-muted/95 px-4 pb-4 backdrop-blur md:-mx-8 md:flex-row md:items-center md:justify-between md:px-8 lg:top-0 lg:pt-2">
        <h1 className="font-display text-2xl font-semibold text-balance">{title}</h1>
        <div className="flex flex-wrap items-center gap-2">
          {autosave.state !== 'idle' && (
            <span className="text-xs text-muted-foreground" aria-live="polite">
              {autosave.state === 'pending' && 'Unsaved changes'}
              {autosave.state === 'saving' && 'Autosaving…'}
              {autosave.state === 'saved' && `Draft autosaved${autosave.savedAt ? ` at ${new Date(autosave.savedAt).toLocaleTimeString()}` : ''}`}
              {autosave.state === 'error' && 'Autosave failed'}
            </span>
          )}
          {publicPath && (
            <a href={publicPath} target="_blank" rel="noreferrer" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
              <ExternalLink className="size-4" aria-hidden="true" /> View
            </a>
          )}
          {!isNew && canWrite && !['home-page', 'footprint-page', 'about-page', 'resource-centre-page', 'faq-page', 'contact-page', 'careers-page', 'case-studies-page', 'navigation'].includes(resource) && (
            <Button variant="outline" size="sm" className="text-destructive" disabled={busy} onClick={remove}>
              Delete
            </Button>
          )}
          {canWrite && (
            <Button size="sm" disabled={busy || (!draft && !isNew)} onClick={save}>
              {busy ? 'Saving…' : isNew ? 'Create' : 'Save changes'}
            </Button>
          )}
        </div>
      </div>
      {autosave.recoverable && (
        <div className="flex max-w-3xl flex-col gap-3 rounded-lg border border-border bg-card p-4 text-sm md:flex-row md:items-center md:justify-between">
          <p className="text-pretty">
            You have an autosaved draft from {new Date(autosave.recoverable.updatedAt).toLocaleString()}.
            {autosave.stale && ' The post has been saved since then, so restoring will overwrite newer changes.'}
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={autosave.discard}>
              Discard
            </Button>
            <Button size="sm" onClick={() => setDraft({ ...(data ?? {}), ...autosave.recoverable!.data })}>
              Restore draft
            </Button>
          </div>
        </div>
      )}
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
      <Card className="max-w-3xl">
        <fieldset disabled={!canWrite} className="contents">
          <FieldGroup fields={fields} value={value} errors={errors} onChange={setDraft} />
        </fieldset>
      </Card>
    </div>
  )
}
