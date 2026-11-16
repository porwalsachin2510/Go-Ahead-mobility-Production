'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import useSWR from 'swr'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api, fetcher } from '@/lib/client/api'
import { Card, FieldShell, formatDate, Input, Notice, StatusBadge } from './ui'

type PageRow = { _id: string; path: string; pageType: string; state: string; draft?: { title?: string }; updatedAt?: string; isSystem?: boolean }

export function PagesList({ canWrite }: { canWrite: boolean }) {
  const router = useRouter()
  const [q, setQ] = useState('')
  const { data, error, isLoading } = useSWR<PageRow[]>(`/api/v1/admin/pages${q ? `?q=${encodeURIComponent(q)}` : ''}`, fetcher)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ title: '', path: '/' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function create(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    const r = await api<{ _id: string }>('/api/v1/admin/pages', { method: 'POST', json: form })
    setBusy(false)
    if (r.ok) router.push(`/admin/pages/${r.data._id}`)
    else {
      setErrors(r.error.details ?? {})
      setMsg(r.error.message)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="w-full sm:max-w-xs">
          <span className="sr-only">Search pages</span>
          <Input placeholder="Search by title or path" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        {canWrite && (
          <Button onClick={() => setCreating((v) => !v)}>
            <Plus className="size-4" aria-hidden />
            New page
          </Button>
        )}
      </div>

      {creating && (
        <Card>
          <form onSubmit={create} className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <FieldShell id="np-title" label="Title" required error={errors.title}>
              <Input id="np-title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </FieldShell>
            <FieldShell id="np-path" label="URL path" required error={errors.path} help="e.g. /services/hotels">
              <Input id="np-path" required value={form.path} onChange={(e) => setForm({ ...form, path: e.target.value.toLowerCase() })} />
            </FieldShell>
            <Button type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create'}</Button>
          </form>
          {msg && <div className="mt-3"><Notice tone="error">{msg}</Notice></div>}
        </Card>
      )}

      {error && <Notice tone="error">{error.message}</Notice>}
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Path</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={5} className="px-4 py-6 text-muted-foreground">Loading…</td></tr>
            )}
            {data?.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-muted-foreground">No pages found.</td></tr>
            )}
            {data?.map((p) => (
              <tr key={p._id} className="border-b border-border last:border-0 hover:bg-muted/50">
                <td className="px-4 py-3 font-medium">
                  <Link href={`/admin/pages/${p._id}`} className="hover:underline">{p.draft?.title || '(untitled)'}</Link>
                  {p.isSystem && <span className="ml-2 text-xs text-muted-foreground">system</span>}
                </td>
                <td className="px-4 py-3 font-mono text-xs">{p.path}</td>
                <td className="px-4 py-3 capitalize">{p.pageType}</td>
                <td className="px-4 py-3"><StatusBadge value={p.state} /></td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(p.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
