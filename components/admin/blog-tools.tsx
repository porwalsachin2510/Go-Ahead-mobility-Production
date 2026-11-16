'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Download, Upload } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { api, fetcher } from '@/lib/client/api'
import { Card, Notice, Select } from './ui'

type Term = { _id: string; name: string; slug: string; posts: number }
type ImportResult = { created: number; updated: number; skipped: { item: string; reason: string }[] }

export function TermMerge() {
  const [kind, setKind] = useState<'category' | 'tag'>('category')
  const { data, mutate } = useSWR<{ items: Term[] }>(`/api/v1/admin/blog/taxonomy?kind=${kind}`, fetcher)
  const [sources, setSources] = useState<Set<string>>(new Set())
  const [target, setTarget] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ tone: 'error' | 'success'; text: string } | null>(null)
  const terms = data?.items ?? []

  async function merge() {
    const ids = [...sources].filter((id) => id !== target)
    const targetName = terms.find((t) => t._id === target)?.name
    if (!window.confirm(`Merge ${ids.length} ${kind === 'category' ? 'categories' : 'tags'} into "${targetName}"? The merged terms are deleted and their URLs redirect to the target.`)) return
    setBusy(true)
    setMsg(null)
    const r = await api<{ merged: number; postsUpdated: number; target: string }>('/api/v1/admin/blog/taxonomy', { method: 'POST', json: { kind, sourceIds: ids, targetId: target } })
    setBusy(false)
    if (!r.ok) return setMsg({ tone: 'error', text: r.error.message })
    setMsg({ tone: 'success', text: `Merged ${r.data.merged} into ${r.data.target}. ${r.data.postsUpdated} post(s) updated.` })
    setSources(new Set())
    setTarget('')
    mutate()
  }

  const toggle = (id: string) => setSources((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const canMerge = target && [...sources].some((id) => id !== target)

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">Merge categories and tags</h2>
          <p className="text-pretty text-sm text-muted-foreground">Move every post from the selected terms to a target term, then remove the duplicates.</p>
        </div>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Type
          <Select value={kind} onChange={(e) => { setKind(e.target.value as 'category' | 'tag'); setSources(new Set()); setTarget('') }}>
            <option value="category">Categories</option>
            <option value="tag">Tags</option>
          </Select>
        </label>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Terms to merge</legend>
        {!data && <p className="text-sm text-muted-foreground">Loading…</p>}
        {data && terms.length < 2 && <p className="text-sm text-muted-foreground">You need at least two terms to merge.</p>}
        <div className="grid max-h-72 gap-1 overflow-y-auto sm:grid-cols-2">
          {terms.map((t) => (
            <label key={t._id} className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted">
              <input type="checkbox" className="size-4 accent-primary" checked={sources.has(t._id)} disabled={t._id === target} onChange={() => toggle(t._id)} />
              <span className="flex-1 truncate">{t.name}</span>
              <span className="tabular-nums text-muted-foreground">{t.posts}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-48 flex-1 flex-col gap-1.5 text-sm font-medium">
          Merge into
          <Select value={target} onChange={(e) => { setTarget(e.target.value); setSources((s) => { const n = new Set(s); n.delete(e.target.value); return n }) }}>
            <option value="">Choose target…</option>
            {terms.map((t) => <option key={t._id} value={t._id}>{t.name} ({t.posts})</option>)}
          </Select>
        </label>
        <Button onClick={merge} disabled={!canMerge || busy}>{busy ? 'Merging…' : 'Merge'}</Button>
      </div>
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
    </Card>
  )
}

export function ImportExport() {
  const [overwrite, setOverwrite] = useState(false)
  const [createTerms, setCreateTerms] = useState(true)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function onFile(file: File | undefined) {
    if (!file) return
    setError(null)
    setResult(null)
    if (file.size > 5_000_000) return setError('The file is larger than 5 MB.')
    const format = /\.json$/i.test(file.name) ? 'json' : /\.(md|markdown)$/i.test(file.name) ? 'markdown' : null
    if (!format) return setError('Choose a .json, .md or .markdown file.')
    setBusy(true)
    const r = await api<ImportResult>('/api/v1/admin/blog/import', { method: 'POST', json: { format, content: await file.text(), overwrite, createTerms } })
    setBusy(false)
    if (!r.ok) return setError(r.error.message)
    setResult(r.data)
  }

  return (
    <Card className="flex flex-col gap-5 p-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">Import and export</h2>
        <p className="text-pretty text-sm text-muted-foreground">Export every post with front matter, or import posts from a JSON export or Markdown files. Imported posts are saved as drafts.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <a href="/api/v1/admin/blog/export?format=json" className={buttonVariants({ variant: 'outline' })}><Download className="size-4" aria-hidden="true" /> Export JSON</a>
        <a href="/api/v1/admin/blog/export?format=markdown" className={buttonVariants({ variant: 'outline' })}><Download className="size-4" aria-hidden="true" /> Export Markdown</a>
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-4">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-primary" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} /> Update posts whose slug already exists</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-primary" checked={createTerms} onChange={(e) => setCreateTerms(e.target.checked)} /> Create missing categories and tags</label>
        <label className="flex w-fit cursor-pointer items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus-within:ring-2 focus-within:ring-ring">
          <Upload className="size-4" aria-hidden />
          {busy ? 'Importing…' : 'Import file'}
          <input type="file" accept=".json,.md,.markdown,application/json,text/markdown" className="sr-only" disabled={busy} onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = '' }} />
        </label>
        <p className="text-xs text-muted-foreground">For several posts in one Markdown file, separate them with {'<!-- next post -->'}.</p>
      </div>

      {error && <Notice tone="error">{error}</Notice>}
      {result && (
        <div className="flex flex-col gap-2">
          <Notice tone="success">{result.created} created, {result.updated} updated, {result.skipped.length} skipped.</Notice>
          {result.skipped.length > 0 && (
            <ul className="flex max-h-48 flex-col gap-1 overflow-y-auto text-sm">
              {result.skipped.map((s, i) => <li key={i}><span className="font-medium">{s.item}</span>: <span className="text-muted-foreground">{s.reason}</span></li>)}
            </ul>
          )}
        </div>
      )}
    </Card>
  )
}
