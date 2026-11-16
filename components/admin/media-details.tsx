'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { RefreshCw, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api, fetcher } from '@/lib/client/api'
import { Card, Input, Notice } from './ui'

type Variant = { width: number; height: number; size: number }
type Usage = { collection: string; id: string; label: string; status?: string }
type Detail = {
  asset: { _id: string; url: string; originalName: string; mimeType: string; size: number; width?: number; height?: number; altText?: string; caption?: string; credit?: string; variants?: Variant[] }
  usage: Usage[]
}

const kb = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`)

export function MediaDetails({ id, onClose, onChanged }: { id: string; onClose: () => void; onChanged: () => void }) {
  const { data, error, mutate } = useSWR<Detail>(`/api/v1/admin/media/${id}`, fetcher)
  const [form, setForm] = useState<{ altText: string; caption: string; credit: string } | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ tone: 'error' | 'success'; text: string } | null>(null)
  const [confirmForce, setConfirmForce] = useState(false)

  const asset = data?.asset
  const values = form ?? { altText: asset?.altText ?? '', caption: asset?.caption ?? '', credit: asset?.credit ?? '' }
  const isImage = asset?.mimeType.startsWith('image/')

  async function run(kind: string, fn: () => Promise<void>) {
    setBusy(kind)
    setMsg(null)
    try {
      await fn()
    } catch (e) {
      setMsg({ tone: 'error', text: e instanceof Error ? e.message : 'Request failed.' })
    } finally {
      setBusy(null)
    }
  }

  const save = () =>
    run('save', async () => {
      const r = await api(`/api/v1/admin/media/${id}`, { method: 'PATCH', json: values })
      if (!r.ok) throw new Error(r.error?.message ?? 'Save failed.')
      setForm(null)
      await mutate()
      onChanged()
      setMsg({ tone: 'success', text: 'Details saved.' })
    })

  const regenerate = () =>
    run('regen', async () => {
      const r = await api(`/api/v1/admin/media/${id}`, { method: 'PATCH', json: { regenerate: true } })
      if (!r.ok) throw new Error(r.error?.message ?? 'Could not regenerate versions.')
      await mutate()
      setMsg({ tone: 'success', text: 'Responsive versions regenerated.' })
    })

  const remove = (force: boolean) =>
    run('delete', async () => {
      const r = await api(`/api/v1/admin/media/${id}${force ? '?force=true' : ''}`, { method: 'DELETE' })
      if (!r.ok) {
        if (r.error?.code === 'media_in_use') {
          setConfirmForce(true)
          await mutate()
        }
        throw new Error(r.error?.message ?? 'Delete failed.')
      }
      onChanged()
      onClose()
    })

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="media-details-title" className="fixed inset-0 z-50 flex justify-end bg-foreground/40" onClick={onClose}>
      <Card className="flex h-full w-full max-w-md flex-col gap-4 overflow-y-auto rounded-none p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <h2 id="media-details-title" className="text-pretty text-lg font-semibold">{asset?.originalName ?? 'File details'}</h2>
          <Button size="icon" variant="ghost" onClick={onClose} aria-label="Close details"><X className="size-4" aria-hidden /></Button>
        </div>
        {error && <Notice tone="error">{error.message}</Notice>}
        {!data && !error && <p className="text-sm text-muted-foreground">Loading…</p>}
        {asset && (
          <>
            {isImage && (
              <div className="overflow-hidden rounded-md bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${asset.url}?w=960`} alt={asset.altText || asset.originalName} className="w-full object-contain" />
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              {kb(asset.size)}
              {asset.width ? ` · ${asset.width}×${asset.height}px` : ''} · {asset.mimeType}
            </p>

            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5 text-sm font-medium">Alt text<Input value={values.altText} maxLength={200} onChange={(e) => setForm({ ...values, altText: e.target.value })} /></label>
              <label className="flex flex-col gap-1.5 text-sm font-medium">Caption<Input value={values.caption} maxLength={500} onChange={(e) => setForm({ ...values, caption: e.target.value })} /></label>
              <label className="flex flex-col gap-1.5 text-sm font-medium">Credit<Input value={values.credit} maxLength={200} onChange={(e) => setForm({ ...values, credit: e.target.value })} /></label>
              <Button onClick={save} disabled={!form || busy !== null}>{busy === 'save' ? 'Saving…' : 'Save details'}</Button>
            </div>

            {isImage && (
              <section className="flex flex-col gap-2" aria-labelledby="variants-h">
                <h3 id="variants-h" className="text-sm font-semibold">Responsive versions</h3>
                {asset.variants?.length ? (
                  <ul className="flex flex-col gap-1 text-sm">
                    {asset.variants.map((v) => (
                      <li key={v.width} className="flex justify-between gap-2"><span>{v.width}×{v.height} WebP</span><span className="text-muted-foreground">{kb(v.size)}</span></li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No smaller versions. The original is already small, or it was uploaded before versions existed.</p>
                )}
                <p className="text-xs text-muted-foreground">Request a size with <code className="font-mono">?w=960</code>; the closest stored version is served.</p>
                <Button variant="outline" size="sm" onClick={regenerate} disabled={busy !== null}><RefreshCw className="size-3.5" aria-hidden /> {busy === 'regen' ? 'Regenerating…' : 'Regenerate versions'}</Button>
              </section>
            )}

            <section className="flex flex-col gap-2" aria-labelledby="usage-h">
              <h3 id="usage-h" className="text-sm font-semibold">Where it is used ({data.usage.length})</h3>
              {data.usage.length === 0 ? (
                <p className="text-sm text-muted-foreground">Not referenced by any content. Safe to delete.</p>
              ) : (
                <ul className="flex flex-col gap-1 text-sm">
                  {data.usage.map((u) => (
                    <li key={`${u.collection}-${u.id}`} className="flex justify-between gap-2">
                      <span className="truncate">{u.label}</span>
                      <span className="shrink-0 text-muted-foreground">{u.collection}{u.status ? ` · ${u.status}` : ''}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}

            <div className="mt-auto flex flex-col gap-2 border-t border-border pt-4">
              {confirmForce ? (
                <>
                  <p className="text-sm">Deleting will break the references listed above.</p>
                  <div className="flex gap-2">
                    <Button variant="destructive" onClick={() => remove(true)} disabled={busy !== null}>{busy === 'delete' ? 'Deleting…' : 'Delete anyway'}</Button>
                    <Button variant="outline" onClick={() => setConfirmForce(false)}>Cancel</Button>
                  </div>
                </>
              ) : (
                <Button variant="outline" onClick={() => (data.usage.length ? setConfirmForce(true) : remove(false))} disabled={busy !== null}>
                  <Trash2 className="size-4" aria-hidden /> Delete file
                </Button>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
