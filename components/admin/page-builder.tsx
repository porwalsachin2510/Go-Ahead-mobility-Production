'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import useSWR from 'swr'
import { ArrowDown, ArrowLeft, ArrowUp, Eye, EyeOff, ExternalLink, Plus, Trash2 } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { BLOCKS, BLOCK_MAP, type Block } from '@/lib/blocks'
import { api, fetcher } from '@/lib/client/api'
import { emptyRecord, type FieldDef } from '@/lib/fields'
import { FieldGroup } from './field-input'
import { Card, FieldShell, formatDate, Input, Notice, Select, StatusBadge } from './ui'

type Draft = { title: string; blocks: Block[]; seo: Record<string, unknown> }
type PageDoc = { _id: string; path: string; state: string; isSystem?: boolean; revision?: number; publishedAt?: string; draft: Draft }
type Version = { versionNumber: number; kind: string; changeNote?: string; createdAt: string }
type Payload = { page: PageDoc; versions: Version[] }

const SEO_FIELD: FieldDef[] = [{ key: 'seo', label: 'Search & social', kind: 'seo' }]

const newId = () => Math.random().toString(36).slice(2, 10)

export function PageBuilder({ id, canWrite, canPublish }: { id: string; canWrite: boolean; canPublish: boolean }) {
  const router = useRouter()
  const { data, error, mutate } = useSWR<Payload>(`/api/v1/admin/pages/${id}`, fetcher)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [open, setOpen] = useState<string | null>(null)
  const [addType, setAddType] = useState(BLOCKS[0]?.type ?? '')
  const [msg, setMsg] = useState<{ tone: 'error' | 'success'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  if (error) return <Notice tone="error">{error.message}</Notice>
  if (!data) return <p className="text-sm text-muted-foreground">Loading…</p>

  const { page, versions } = data
  const value: Draft = draft ?? { title: page.draft?.title ?? '', blocks: page.draft?.blocks ?? [], seo: page.draft?.seo ?? {} }
  const dirty = draft !== null
  const update = (patch: Partial<Draft>) => setDraft({ ...value, ...patch })
  const setBlocks = (blocks: Block[]) => update({ blocks })

  function move(i: number, dir: -1 | 1) {
    const j = i + dir
    if (j < 0 || j >= value.blocks.length) return
    const next = [...value.blocks]
    ;[next[i], next[j]] = [next[j], next[i]]
    setBlocks(next)
  }

  function addBlock() {
    const def = BLOCK_MAP[addType]
    if (!def) return
    const block: Block = { id: newId(), type: def.type, data: emptyRecord(def.fields) }
    setBlocks([...value.blocks, block])
    setOpen(block.id)
  }

  async function save() {
    setBusy(true)
    setMsg(null)
    const r = await api<Payload>(`/api/v1/admin/pages/${id}`, { method: 'PUT', json: value })
    setBusy(false)
    if (r.ok) {
      setDraft(null)
      await mutate(r.data, { revalidate: false })
      setMsg({ tone: 'success', text: 'Draft saved.' })
    } else setMsg({ tone: 'error', text: r.error.message })
  }

  async function action(name: 'publish' | 'unpublish' | 'submit' | 'restore', version?: number) {
    if (dirty && name !== 'restore') {
      setMsg({ tone: 'error', text: 'Save your draft before changing the page status.' })
      return
    }
    if (name === 'restore' && !confirm(`Restore version ${version} into the draft?`)) return
    setBusy(true)
    setMsg(null)
    const r = await api<Payload>(`/api/v1/admin/pages/${id}`, { method: 'POST', json: { action: name, version } })
    setBusy(false)
    if (r.ok) {
      setDraft(null)
      await mutate(r.data, { revalidate: false })
      setMsg({ tone: 'success', text: name === 'publish' ? 'Published — the live page is updated.' : name === 'unpublish' ? 'Unpublished.' : name === 'submit' ? 'Submitted for review.' : `Version ${version} restored to draft.` })
    } else setMsg({ tone: 'error', text: r.error.message })
  }

  async function remove() {
    if (!confirm('Delete this page permanently?')) return
    const r = await api(`/api/v1/admin/pages/${id}`, { method: 'DELETE' })
    if (r.ok) router.push('/admin/pages')
    else setMsg({ tone: 'error', text: r.error.message })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-2">
          <Link href="/admin/pages" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" aria-hidden /> All pages
          </Link>
          <h1 className="font-serif text-2xl font-semibold text-balance">{value.title || 'Untitled page'}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="font-mono text-xs">{page.path}</span>
            <StatusBadge value={page.state} />
            {page.publishedAt && <span>Published {formatDate(page.publishedAt, true)}</span>}
            {dirty && <span className="font-medium text-accent">Unsaved changes</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {page.state === 'published' && (
            <a href={page.path} target="_blank" rel="noreferrer" className={buttonVariants({ variant: 'outline' })}>
              <ExternalLink className="size-4" aria-hidden="true" /> View live
            </a>
          )}
          {canWrite && <Button onClick={save} disabled={busy || !dirty}>{busy ? 'Working…' : 'Save draft'}</Button>}
          {canPublish && <Button variant="secondary" onClick={() => action('publish')} disabled={busy}>Publish</Button>}
          {canWrite && !canPublish && page.state !== 'in_review' && <Button variant="secondary" onClick={() => action('submit')} disabled={busy}>Submit for review</Button>}
          {canPublish && page.state === 'published' && <Button variant="outline" onClick={() => action('unpublish')} disabled={busy}>Unpublish</Button>}
        </div>
      </div>

      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-4">
          <Card>
            <FieldShell id="pg-title" label="Page title" required>
              <Input id="pg-title" value={value.title} disabled={!canWrite} onChange={(e) => update({ title: e.target.value })} />
            </FieldShell>
          </Card>

          <section aria-labelledby="blocks-heading" className="flex flex-col gap-3">
            <h2 id="blocks-heading" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Content blocks</h2>
            {value.blocks.length === 0 && <Card><p className="text-sm text-muted-foreground">No blocks yet. Add one below to start building this page.</p></Card>}
            {value.blocks.map((b, i) => {
              const def = BLOCK_MAP[b.type]
              const isOpen = open === b.id
              return (
                <Card key={b.id} className={b.hidden ? 'opacity-60' : undefined}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button type="button" className="flex min-w-0 flex-1 flex-col items-start text-left" onClick={() => setOpen(isOpen ? null : b.id)} aria-expanded={isOpen}>
                      <span className="font-medium">{def?.label ?? b.type}</span>
                      <span className="truncate text-xs text-muted-foreground">{String(b.data?.heading ?? b.data?.title ?? def?.description ?? '')}</span>
                    </button>
                    {canWrite && (
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"><ArrowUp className="size-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => move(i, 1)} disabled={i === value.blocks.length - 1} aria-label="Move down"><ArrowDown className="size-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setBlocks(value.blocks.map((x) => (x.id === b.id ? { ...x, hidden: !x.hidden } : x)))} aria-label={b.hidden ? 'Show block' : 'Hide block'}>
                          {b.hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => confirm('Remove this block?') && setBlocks(value.blocks.filter((x) => x.id !== b.id))} aria-label="Remove block"><Trash2 className="size-4" /></Button>
                      </div>
                    )}
                  </div>
                  {isOpen && def && (
                    <fieldset disabled={!canWrite} className="mt-4 border-t border-border pt-4">
                      <FieldGroup fields={def.fields} value={b.data ?? {}} onChange={(d) => setBlocks(value.blocks.map((x) => (x.id === b.id ? { ...x, data: d } : x)))} />
                    </fieldset>
                  )}
                  {isOpen && !def && <p className="mt-3 text-sm text-destructive">Unknown block type — it will be skipped when rendering.</p>}
                </Card>
              )
            })}
            {canWrite && (
              <Card className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <FieldShell id="add-block" label="Add a block" help={BLOCK_MAP[addType]?.description}>
                  <Select id="add-block" value={addType} onChange={(e) => setAddType(e.target.value)}>
                    {BLOCKS.map((b) => <option key={b.type} value={b.type}>{b.label}</option>)}
                  </Select>
                </FieldShell>
                <Button variant="outline" onClick={addBlock}><Plus className="size-4" aria-hidden /> Add</Button>
              </Card>
            )}
          </section>
        </div>

        <aside className="flex flex-col gap-4">
          <Card>
            <fieldset disabled={!canWrite}>
              <FieldGroup fields={SEO_FIELD} value={{ seo: value.seo }} onChange={(v) => update({ seo: (v.seo as Record<string, unknown>) ?? {} })} />
            </fieldset>
          </Card>
          <Card>
            <h2 className="mb-3 text-sm font-semibold">Version history</h2>
            {versions.length === 0 && <p className="text-sm text-muted-foreground">No saved versions yet.</p>}
            <ul className="flex flex-col gap-2">
              {versions.map((v) => (
                <li key={v.versionNumber} className="flex items-center justify-between gap-2 text-sm">
                  <span>
                    <span className="font-medium">v{v.versionNumber}</span> <span className="capitalize text-muted-foreground">{v.kind}</span>
                    <span className="block text-xs text-muted-foreground">{formatDate(v.createdAt, true)}</span>
                  </span>
                  {canWrite && <Button size="sm" variant="ghost" onClick={() => action('restore', v.versionNumber)} disabled={busy}>Restore</Button>}
                </li>
              ))}
            </ul>
          </Card>
          {canWrite && !page.isSystem && (
            <Button variant="outline" className="text-destructive" onClick={remove}><Trash2 className="size-4" aria-hidden /> Delete page</Button>
          )}
        </aside>
      </div>
    </div>
  )
}
