import Link from 'next/link'
import { Card, formatDate, Notice, PageHeader, StatusBadge } from '@/components/admin/ui'
import { LEAD_STATUS_LABELS, LEAD_TYPE_LABELS, type LeadStatus, type LeadType } from '@/lib/leads'
import { can } from '@/lib/rbac'
import { requirePageUser } from '@/lib/server/auth/session'
import { connectDb } from '@/lib/server/db'
import { Page } from '@/lib/server/models/content'
import { Post } from '@/lib/server/models/editorial'
import { Application, Lead, Subscriber } from '@/lib/server/models/operations'

export const metadata = { title: 'Dashboard' }

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const user = await requirePageUser()
  const { denied } = await searchParams
  await connectDb()
  const allLeads = can(user.role, 'leads.read.all')
  const leadScope = allLeads ? {} : { ownerId: user.id }
  const since = new Date(Date.now() - 30 * 86400000)
  const showLeads = allLeads || can(user.role, 'leads.read.own') || can(user.role, 'leads.read.team')

  const [newLeads, leads30, openLeads, recent, pages, posts, subscribers, applications] = await Promise.all([
    showLeads ? Lead.countDocuments({ ...leadScope, status: 'new', archived: false }) : 0,
    showLeads ? Lead.countDocuments({ ...leadScope, createdAt: { $gte: since } }) : 0,
    showLeads ? Lead.countDocuments({ ...leadScope, archived: false, status: { $nin: ['won', 'lost', 'disqualified'] } }) : 0,
    showLeads ? Lead.find({ ...leadScope, archived: false }).sort({ createdAt: -1 }).limit(8).select('publicReference type status contact.name contact.company createdAt').lean<any[]>() : [],
    Page.countDocuments({ state: 'published' }),
    Post.countDocuments({ state: 'published' }),
    can(user.role, 'subscribers.read') ? Subscriber.countDocuments({ status: 'confirmed' }) : null,
    can(user.role, 'applications.read') ? Application.countDocuments({ createdAt: { $gte: since } }) : null,
  ])

  const stats = [
    showLeads && { label: 'New leads awaiting action', value: newLeads, href: '/admin/leads?status=new' },
    showLeads && { label: 'Open pipeline', value: openLeads, href: '/admin/leads' },
    showLeads && { label: 'Leads, last 30 days', value: leads30, href: '/admin/leads' },
    { label: 'Published pages', value: pages, href: '/admin/pages' },
    { label: 'Published articles', value: posts, href: '/admin/c/posts' },
    subscribers !== null && { label: 'Confirmed subscribers', value: subscribers, href: '/admin/c/subscribers' },
    applications !== null && { label: 'Applications, 30 days', value: applications, href: '/admin/c/applications' },
  ].filter(Boolean) as { label: string; value: number; href: string }[]

  return (
    <>
      <PageHeader title={`Welcome back, ${user.name.split(' ')[0]}`} description="What needs attention across the website and enquiry pipeline today." />
      {denied && <Notice tone="error">You do not have permission to open that area.</Notice>}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="rounded-xl border border-border bg-card p-4 transition hover:border-primary/40">
            <p className="font-display text-3xl font-semibold text-foreground">{s.value.toLocaleString()}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
          </Link>
        ))}
      </div>
      {showLeads && (
        <Card className="flex flex-col gap-4 p-0">
          <div className="flex items-center justify-between px-5 pt-5">
            <h2 className="font-semibold">Latest enquiries</h2>
            <Link href="/admin/leads" className="text-sm font-medium text-primary">
              View all
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-muted-foreground">No enquiries yet. Submissions from the website forms appear here instantly.</p>
          ) : (
            <ul className="divide-y divide-border border-t border-border">
              {recent.map((l) => (
                <li key={String(l._id)}>
                  <Link href={`/admin/leads/${l._id}`} className="flex flex-col gap-1 px-5 py-3 hover:bg-muted/60 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {l.contact?.company || l.contact?.name || 'Unnamed'} <span className="font-mono text-xs text-muted-foreground">{l.publicReference}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">{LEAD_TYPE_LABELS[l.type as LeadType] ?? l.type}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge value={LEAD_STATUS_LABELS[l.status as LeadStatus] ? l.status : l.status} />
                      <span className="text-xs text-muted-foreground">{formatDate(l.createdAt, true)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </>
  )
}
