'use client'

import { useRef, useState } from 'react'
import useSWR from 'swr'
import { Copy, FileText, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { fetcher } from '@/lib/client/api'
import { Card, formatDate, Input, Notice } from './ui'
import { MediaDetails } from './media-details'

type Asset = { _id: string; url: string; originalName: string; mimeType: string; size: number; altText?: string; createdAt: string }
type Resp = { items: Asset[]; total: number; page: number; limit: number }

const kb = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`)

export function MediaLibrary() {
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const { data, error, mutate, isLoading } = useSWR<Resp>(`/api/v1/admin/media?page=${page}${q ? `&q=${encodeURIComponent(q)}` : ''}`, fetcher)
  const fileRef = useRef<HTMLInputElement>(null)
  const [alt, setAlt] = useState('')
  const [busy, setBusy] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ tone: 'error' | 'success'; text: string } | null>(null)

  async function upload(e: React.FormEvent) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) return setMsg({ tone: 'error', text: 'Choose a file to upload.' })
    setBusy(true)
    setMsg(null)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('altText', alt)
    const res = await fetch('/api/v1/admin/media', { method: 'POST', body: fd, credentials: 'same-origin' })
    const json = await res.json().catch(() => null)
    setBusy(false)
    if (res.ok && json?.ok) {
      setAlt('')
      if (fileRef.current) fileRef.current.value = ''
      setMsg({ tone: 'success', text: `Uploaded ${file.name}.` })
      mutate()
    } else setMsg({ tone: 'error', text: json?.error?.message ?? 'Upload failed.' })
  }

  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <form onSubmit={upload} className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            File (images or PDF)
            <input ref={fileRef} type="file" accept="image/*,application/pdf" className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-secondary-foreground" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Alt text
            <Input value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Describe the image for accessibility" maxLength={200} />
          </label>
          <Button type="submit" disabled={busy}><Upload className="size-4" aria-hidden /> {busy ? 'Uploading…' : 'Upload'}</Button>
        </form>
        {msg && <div className="mt-3"><Notice tone={msg.tone}>{msg.text}</Notice></div>}
      </Card>

      <label className="max-w-xs">
        <span className="sr-only">Search media</span>
        <Input placeholder="Search by file name" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} />
      </label>

      {error && <Notice tone="error">{error.message}</Notice>}
      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {data?.items.length === 0 && <p className="text-sm text-muted-foreground">No files yet.</p>}

      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {data?.items.map((a) => (
          <li key={a._id}>
            <Card className="flex h-full flex-col gap-2 p-3">
              <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-md bg-muted">
                {a.mimeType.startsWith('image/') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`${a.url}?w=480`} alt={a.altText || a.originalName} className="size-full object-cover" loading="lazy" />
                ) : (
                  <FileText className="size-8 text-muted-foreground" aria-hidden />
                )}
              </div>
              <p className="truncate text-sm font-medium" title={a.originalName}>{a.originalName}</p>
              <p className="text-xs text-muted-foreground">{kb(a.size)} · {formatDate(a.createdAt)}</p>
              <div className="mt-auto flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => { navigator.clipboard.writeText(a.url); setMsg({ tone: 'success', text: 'URL copied to clipboard.' }) }}>
                  <Copy className="size-3.5" aria-hidden /> Copy
                </Button>
                <Button size="sm" variant="secondary" className="flex-1" onClick={() => setOpenId(a._id)}>Details</Button>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span>Page {page} of {pages}</span>
          <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}
      {openId && <MediaDetails id={openId} onClose={() => setOpenId(null)} onChanged={() => mutate()} />}
    </div>
  )
}
