'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { Card, Select } from '@/components/admin/ui'
import { Button, buttonVariants } from '@/components/ui/button'
import type { AuditIssue } from '@/lib/seo/types'

const ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
const TONE: Record<string, string> = {
  critical: 'bg-destructive text-destructive-foreground',
  high: 'bg-destructive/15 text-destructive',
  medium: 'bg-accent text-accent-foreground',
  low: 'bg-muted text-muted-foreground',
}

export function IssueList({ issues }: { issues: AuditIssue[] }) {
  const router = useRouter()
  const [severity, setSeverity] = useState('all')
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')

  const groups = useMemo(() => {
    const map = new Map<string, AuditIssue[]>()
    for (const i of issues) {
      if (severity !== 'all' && i.severity !== severity) continue
      if (hidden.has(`${i.entityKey}|${i.code}`)) continue
      if (!map.has(i.code)) map.set(i.code, [])
      map.get(i.code)!.push(i)
    }
    return [...map.values()].sort((a, b) => (ORDER[a[0].severity] ?? 9) - (ORDER[b[0].severity] ?? 9))
  }, [issues, severity, hidden])

  async function ignore(i: AuditIssue) {
    setError('')
    const res = await fetch('/api/v1/admin/seo/issues', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'ignore', entityKey: i.entityKey, code: i.code, evidence: i.evidence, reason: 'Reviewed and accepted' }),
    })
    if (!res.ok) return setError('Could not update the issue. Check your permissions and try again.')
    setHidden((s) => new Set(s).add(`${i.entityKey}|${i.code}`))
    router.refresh()
  }

  if (issues.length === 0) return <Card className="p-6 text-sm text-muted-foreground">The latest audit found no open issues.</Card>

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <label htmlFor="sev" className="text-sm text-muted-foreground">Severity</label>
        <Select id="sev" value={severity} onChange={(e) => setSeverity(e.target.value)} className="w-40">
          <option value="all">All</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </Select>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {groups.length === 0 && <Card className="p-6 text-sm text-muted-foreground">No issues match this filter.</Card>}
      {groups.map((group) => {
        const first = group[0]
        return (
          <Card key={first.code} className="flex flex-col">
            <details>
              <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 p-4">
                <span className={`rounded px-2 py-0.5 text-xs font-semibold uppercase ${TONE[first.severity] ?? TONE.low}`}>{first.severity}</span>
                <span className="font-medium">{first.title}</span>
                <span className="text-sm text-muted-foreground">{group.length} URL{group.length === 1 ? '' : 's'}</span>
                {first.verification === 'external' && <span className="text-xs text-muted-foreground">Confirm with an external crawler or Search Console</span>}
              </summary>
              <div className="flex flex-col gap-3 border-t border-border p-4">
                <p className="text-sm"><span className="font-medium">Recommended fix: </span>{first.fix}</p>
                <ul className="flex flex-col divide-y divide-border rounded-md border border-border">
                  {group.slice(0, 50).map((i) => (
                    <li key={`${i.entityKey}-${i.evidence}`} className="flex flex-col gap-2 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <a href={i.path} target="_blank" rel="noreferrer" className="break-all font-mono text-xs underline">{i.path}</a>
                        <span className="break-words text-muted-foreground">{i.evidence}</span>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Link href={`/admin/seo/pages?q=${encodeURIComponent(i.path)}`} className={buttonVariants({ size: 'sm', variant: 'outline' })}>Edit SEO</Link>
                        <Button size="sm" variant="ghost" onClick={() => ignore(i)}>Ignore</Button>
                      </div>
                    </li>
                  ))}
                </ul>
                {group.length > 50 && <p className="text-xs text-muted-foreground">Showing 50 of {group.length}.</p>}
              </div>
            </details>
          </Card>
        )
      })}
    </div>
  )
}
