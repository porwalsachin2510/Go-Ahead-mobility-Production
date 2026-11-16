'use client'

import Link from 'next/link'
import { useState } from 'react'
import useSWR from 'swr'
import { Plus } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { RESOURCE_MAP, type Column } from '@/lib/admin/resources'
import { fetcher } from '@/lib/client/api'
import { formatDate, Input, Notice, PageHeader, Select, StatusBadge } from './ui'

type Res = { items: Record<string, unknown>[]; total: number; page: number; limit: number }

function cell(col: Column, v: unknown) {
  if (col.format === 'date') return formatDate(v)
  if (col.format === 'status') return <StatusBadge value={String(v ?? '')} />
  if (col.format === 'bool') return v ? 'Yes' : 'No'
  if (col.format === 'tags') return Array.isArray(v) ? v.join(', ') : '—'
  if (v && typeof v === 'object') return '—'
  return v == null || v === '' ? '—' : String(v)
}

export function ResourceList({ resource, canWrite }: { resource: string; canWrite: boolean }) {
  const config = RESOURCE_MAP[resource]
  const [q, setQ] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [page, setPage] = useState(1)
  const params = new URLSearchParams({ page: String(page), ...filters })
  if (q) params.set('q', q)
  const { data, error, isLoading } = useSWR<Res>(`/api/v1/admin/c/${resource}?${params}`, fetcher, { keepPreviousData: true })
  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1

  return (
    <>
      <PageHeader
        title={config.label}
        description={config.description}
        actions={
          canWrite && !['footprint-page', 'about-page', 'resource-centre-page', 'faq-page', 'contact-page', 'careers-page', 'case-studies-page'].includes(resource) && (
            <Link href={`/admin/c/${resource}/new`} className={buttonVariants()}>
              <Plus className="size-4" aria-hidden="true" /> New {config.singular.toLowerCase()}
            </Link>
          )
        }
      />
      <div className="flex flex-col gap-2 md:flex-row">
        {config.searchFields.length > 0 && <Input aria-label="Search" placeholder={`Search ${config.label.toLowerCase()}`} value={q} onChange={(e) => (setQ(e.target.value), setPage(1))} className="md:max-w-sm" />}
        {config.filters?.map((f) => (
          <Select key={f.key} aria-label={f.label} value={filters[f.key] ?? ''} className="md:w-48" onChange={(e) => (setFilters((p) => { const n = { ...p }; if (e.target.value) n[f.key] = e.target.value; else delete n[f.key]; return n }), setPage(1))}>
            <option value="">All {f.label.toLowerCase()}</option>
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        ))}
      </div>
      {error && <Notice tone="error">{error.message}</Notice>}
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="border-b border-border bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              {config.columns.map((c) => (
                <th key={c.key} className="px-4 py-3 font-medium">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && !data && (
              <tr>
                <td colSpan={config.columns.length} className="px-4 py-8 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            )}
            {data?.items.length === 0 && (
              <tr>
                <td colSpan={config.columns.length} className="px-4 py-8 text-center text-muted-foreground">
                  Nothing here yet.
                </td>
              </tr>
            )}
            {data?.items.map((doc) => (
              <tr key={String(doc._id)} className="hover:bg-muted/40">
                {config.columns.map((c, i) => (
                  <td key={c.key} className="px-4 py-3">
                    {i === 0 ? (
                      <Link href={`/admin/c/${resource}/${doc._id}`} className="font-medium text-primary">
                        {cell(c, doc[c.key])}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">{cell(c, doc[c.key])}</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data && pages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {data.page} of {pages} · {data.total} total
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
    </>
  )
}
