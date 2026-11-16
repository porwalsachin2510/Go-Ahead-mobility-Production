'use client'

import Link from 'next/link'
import { useState } from 'react'
import useSWR from 'swr'
import { Plus } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { fetcher } from '@/lib/client/api'
import { Card, formatDate, Notice, PageHeader, Select, StatusBadge } from './ui'

type Item = { _id: string; title: string; slug?: string; state?: string; updatedAt?: string; publishAt?: string; views?: number }
type Dash = {
  counts: Record<string, number>
  taxonomy: { categories: number; tags: number; authors: number }
  perMonth: { month: string; posts: number }[]
  viewsNote: string
  topViewed: Item[]
  recent: Item[]
  scheduled: Item[]
  review: Item[]
  activity: { _id: string; kind: string; toState: string; authorEmail: string; createdAt: string; postId?: { title?: string } | null }[]
  needsAttention: { id: string; title: string; issues: { code: string; level: string; message: string }[] }[]
}

function Stat({ label, value, href }: { label: string; value: number | string; href?: string }) {
  const body = (
    <Card className="flex flex-col gap-1 p-4 transition hover:border-foreground/30">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="font-display text-3xl font-semibold tabular-nums">{value}</span>
    </Card>
  )
  return href ? <Link href={href}>{body}</Link> : body
}

function PostList({ title, items, empty, right }: { title: string; items: Item[]; empty: string; right?: (i: Item) => string }) {
  return (
    <Card className="flex flex-col gap-3">
      <h2 className="font-display font-semibold">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border text-sm">
          {items.map((i) => (
            <li key={i._id} className="flex items-center justify-between gap-3 py-2">
              <Link href={`/admin/c/posts/${i._id}`} className="min-w-0 truncate hover:underline">
                {i.title}
              </Link>
              <span className="shrink-0 text-xs text-muted-foreground">{right ? right(i) : i.state ? <StatusBadge value={i.state} /> : null}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

export function BlogDashboard({ canWrite }: { canWrite: boolean }) {
  const [days, setDays] = useState('90')
  const { data, error } = useSWR<Dash>(`/api/v1/admin/blog/dashboard?days=${days}`, fetcher)
  if (error) return <Notice tone="error">{error.message}</Notice>
  if (!data) return <p className="text-sm text-muted-foreground">Loading…</p>
  const c = data.counts
  const n = (k: string) => c[k] ?? 0
  const inReview = n('editorial_review') + n('seo_review') + n('changes_requested')

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Blog"
        description="Real counts from the content database. Views are an internal counter, not external analytics."
        actions={
          <>
            <Select value={days} onChange={(e) => setDays(e.target.value)} aria-label="Date range">
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last 12 months</option>
            </Select>
            <Link href="/admin/c/posts" className={buttonVariants({ variant: 'outline', size: 'sm' })}>All posts</Link>
            {canWrite && (
              <Link href="/admin/c/posts/new" className={buttonVariants({ size: 'sm' })}>
                <Plus className="size-4" aria-hidden="true" /> New post
              </Link>
            )}
          </>
        }
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        <Stat label="Total" value={c.total ?? 0} href="/admin/c/posts" />
        <Stat label="Published" value={n('published') + n('update_needed')} />
        <Stat label="Drafts" value={n('draft') + n('idea') + n('brief')} />
        <Stat label="Scheduled" value={n('scheduled')} />
        <Stat label="In review" value={inReview} />
        <Stat label="Archived" value={n('archived')} />
        <Stat label="Categories" value={data.taxonomy.categories} href="/admin/c/categories" />
        <Stat label="Tags / authors" value={`${data.taxonomy.tags} / ${data.taxonomy.authors}`} href="/admin/c/tags" />
      </div>

      <Card className="flex flex-col gap-3">
        <h2 className="font-display font-semibold">Posts published per month</h2>
        {data.perMonth.length === 0 ? (
          <p className="text-sm text-muted-foreground">No posts were published in this period.</p>
        ) : (
          <ul className="flex h-48 items-end gap-3" aria-label="Posts published per month">
            {data.perMonth.map((m) => {
              const max = Math.max(...data.perMonth.map((x) => x.posts))
              return (
                <li key={m.month} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                  <span className="text-xs tabular-nums text-muted-foreground">{m.posts}</span>
                  <div className="w-full max-w-12 rounded-t bg-primary" style={{ height: `${Math.max(6, (m.posts / max) * 80)}%` }} role="presentation" />
                  <span className="text-[11px] text-muted-foreground">{m.month}</span>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <PostList title="Awaiting review" items={data.review} empty="Nothing is waiting for review." />
        <PostList title="Upcoming scheduled publications" items={data.scheduled} empty="No posts are scheduled." right={(i) => formatDate(i.publishAt, true)} />
        <PostList title="Recently updated" items={data.recent} empty="No posts yet." right={(i) => formatDate(i.updatedAt)} />
        <PostList title="Most viewed (internal counter)" items={data.topViewed.filter((i) => (i.views ?? 0) > 0)} empty="No views have been recorded yet." right={(i) => `${i.views} views`} />
      </div>

      <Card className="flex flex-col gap-3">
        <h2 className="font-display font-semibold">Content requiring attention</h2>
        {data.needsAttention.length === 0 ? (
          <p className="text-sm text-muted-foreground">No published post has blocking or warning-level content issues.</p>
        ) : (
          <ul className="flex flex-col gap-3 text-sm">
            {data.needsAttention.map((p) => (
              <li key={p.id}>
                <Link href={`/admin/c/posts/${p.id}`} className="font-medium hover:underline">
                  {p.title}
                </Link>
                <ul className="mt-1 list-disc pl-5 text-muted-foreground">
                  {p.issues.slice(0, 3).map((i) => (
                    <li key={i.code}>{i.message}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="font-display font-semibold">Recent publishing activity</h2>
        {data.activity.length === 0 ? (
          <p className="text-sm text-muted-foreground">No editorial activity has been recorded yet.</p>
        ) : (
          <ul className="flex flex-col gap-2 text-sm">
            {data.activity.map((a) => (
              <li key={a._id} className="flex flex-wrap justify-between gap-2">
                <span>
                  <span className="capitalize">{a.kind.replace(/_/g, ' ')}</span>: {a.postId?.title ?? 'Deleted post'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {a.authorEmail || 'system'} · {formatDate(a.createdAt, true)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <p className="text-xs text-muted-foreground">{data.viewsNote}</p>
    </div>
  )
}
