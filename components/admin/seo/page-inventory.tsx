'use client'

import { useMemo, useState } from 'react'
import { SeoEditor } from '@/components/admin/seo/seo-editor'
import { Card, formatDate, Input, Select } from '@/components/admin/ui'
import { Button } from '@/components/ui/button'

export type InventoryRow = {
  key: string
  path: string
  label: string
  pageType: string
  status: string
  indexable: boolean
  noindexReason: string
  canonical: string
  title: string
  titleSource: string
  description: string
  descriptionSource: string
  schemaTypes: string[]
  wordCount: number
  updatedAt: string | null
  editable: boolean
  focusKeyword?: string
}

type SortKey = 'path' | 'pageType' | 'title' | 'updatedAt' | 'wordCount'

export function PageInventory({ rows, siteUrl, initialQuery }: { rows: InventoryRow[]; siteUrl: string; initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery)
  const [type, setType] = useState('all')
  const [index, setIndex] = useState('all')
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'path', dir: 1 })
  const [editing, setEditing] = useState<InventoryRow | null>(null)

  const types = useMemo(() => [...new Set(rows.map((r) => r.pageType))].sort(), [rows])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows
      .filter((r) => (type === 'all' || r.pageType === type) && (index === 'all' || (index === 'yes' ? r.indexable : !r.indexable)))
      .filter((r) => !q || r.path.toLowerCase().includes(q) || r.title.toLowerCase().includes(q) || r.label.toLowerCase().includes(q) || (r.focusKeyword ?? '').toLowerCase().includes(q))
      .sort((a, b) => {
        const av = a[sort.key] ?? ''
        const bv = b[sort.key] ?? ''
        return (av > bv ? 1 : av < bv ? -1 : 0) * sort.dir
      })
  }, [rows, query, type, index, sort])

  const header = (key: SortKey, label: string) => (
    <th className="px-3 py-2 font-medium" aria-sort={sort.key === key ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>
      <button type="button" className="hover:text-foreground" onClick={() => setSort((s) => ({ key, dir: s.key === key ? ((s.dir * -1) as 1 | -1) : 1 }))}>
        {label}
      </button>
    </th>
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="inv-q" className="text-sm text-muted-foreground">Search URL, title or keyword</label>
          <Input id="inv-q" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="/services/…" />
        </div>
        <div className="flex gap-2">
          <Select aria-label="Page type" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="all">All types</option>
            {types.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
          <Select aria-label="Indexability" value={index} onChange={(e) => setIndex(e.target.value)}>
            <option value="all">Any indexing</option>
            <option value="yes">Indexable</option>
            <option value="no">Noindex</option>
          </Select>
        </div>
      </div>
      <p className="text-sm text-muted-foreground" aria-live="polite">{filtered.length} of {rows.length} URLs</p>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-border text-muted-foreground">
            <tr>
              {header('path', 'URL')}
              {header('pageType', 'Type')}
              <th className="px-3 py-2 font-medium">Index</th>
              {header('title', 'Title / description')}
              <th className="px-3 py-2 font-medium">Schema</th>
              {header('wordCount', 'Words')}
              {header('updatedAt', 'Updated')}
              <th className="px-3 py-2 font-medium"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.key} className="border-b border-border align-top last:border-0">
                <td className="max-w-56 px-3 py-2">
                  <a href={r.path} target="_blank" rel="noreferrer" className="break-all font-mono text-xs underline">{r.path}</a>
                  {r.canonical !== r.path && <p className="mt-1 break-all text-xs text-muted-foreground">canonical: {r.canonical}</p>}
                </td>
                <td className="px-3 py-2">{r.pageType}</td>
                <td className="px-3 py-2">{r.indexable ? 'Yes' : <span title={r.noindexReason} className="text-destructive">No</span>}</td>
                <td className="max-w-md px-3 py-2">
                  <p className="font-medium">{r.title}</p>
                  <p className={r.description ? 'text-muted-foreground' : 'text-destructive'}>{r.description || 'No description'}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    title: {r.titleSource} · description: {r.descriptionSource}
                    {r.focusKeyword ? ` · keyword: ${r.focusKeyword}` : ''}
                  </p>
                </td>
                <td className="px-3 py-2 text-xs">{r.schemaTypes.join(', ') || '—'}</td>
                <td className="px-3 py-2">{r.wordCount}</td>
                <td className="px-3 py-2 text-xs">{r.updatedAt ? formatDate(r.updatedAt) : '—'}</td>
                <td className="px-3 py-2">
                  {r.editable ? <Button size="sm" variant="outline" onClick={() => setEditing(r)}>Edit</Button> : <span className="text-xs text-muted-foreground">Code route</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {editing && <SeoEditor key={editing.key} entityKey={editing.key} path={editing.path} siteUrl={siteUrl} onClose={() => setEditing(null)} />}
    </div>
  )
}
