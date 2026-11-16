import Link from 'next/link'
import { Card, PageHeader, formatDate } from '@/components/admin/ui'
import { PurgeButton } from '@/components/admin/careers-purge-button'
import { can } from '@/lib/rbac'
import { requirePageUser } from '@/lib/server/auth/session'
import { careersAnalytics } from '@/lib/server/services/careers'

export const metadata = { title: 'Careers' }

export default async function CareersDashboard() {
  const user = await requirePageUser('applications.read')
  const a = await careersAnalytics()
  const max = Math.max(1, ...a.pipeline.map((p: any) => p.count))
  const stats = [
    ['Open roles', a.openJobs],
    ['Applications', a.totalApplications],
    ['Last 30 days', a.last30],
    ['Avg. days to hire', a.avgDaysToHire ?? '—'],
    ['Alert subscribers', a.confirmedAlerts],
  ]

  return (
    <>
      <PageHeader
        title="Careers"
        description="Hiring pipeline, job performance and Google for Jobs readiness."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/careers/applications" className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
              Open pipeline
            </Link>
            {can(user.role, 'careers.manage') ? (
              <Link href="/admin/c/jobs" className="inline-flex h-9 items-center rounded-md border border-border px-4 text-sm font-medium">
                Manage jobs
              </Link>
            ) : null}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {stats.map(([k, v]) => (
          <Card key={k} className="flex flex-col gap-1 p-4">
            <span className="text-xs text-muted-foreground">{k}</span>
            <span className="text-2xl font-semibold tabular-nums">{v}</span>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="flex flex-col gap-3 p-5 lg:col-span-2">
          <h2 className="font-semibold">Pipeline</h2>
          <ul className="flex flex-col gap-2">
            {a.pipeline.map((p: any) => (
              <li key={p.state}>
                <Link href={`/admin/careers/applications?state=${p.state}`} className="flex items-center gap-3 text-sm hover:underline">
                  <span className="w-24 shrink-0">{p.label}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <span className="block h-full rounded-full bg-primary" style={{ width: `${(p.count / max) * 100}%` }} />
                  </span>
                  <span className="w-10 text-right tabular-nums">{p.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="flex flex-col gap-3 p-5">
          <h2 className="font-semibold">Top sources</h2>
          {a.sources.length ? (
            <ul className="flex flex-col gap-2 text-sm">
              {a.sources.map((s: any) => (
                <li key={s.source} className="flex justify-between gap-3">
                  <span className="truncate">{s.source}</span>
                  <span className="tabular-nums">{s.count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No applications yet.</p>
          )}
          {a.expiredApplications && can(user.role, 'careers.manage') ? (
            <div className="mt-auto flex flex-col gap-2 border-t border-border pt-3 text-sm">
              <p>{a.expiredApplications} application(s) are past their retention date.</p>
              <PurgeButton />
            </div>
          ) : null}
        </Card>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-xs text-muted-foreground">
            <tr>
              <th className="p-3 font-medium">Role</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 text-right font-medium">Views</th>
              <th className="p-3 text-right font-medium">Applied</th>
              <th className="p-3 text-right font-medium">Conv.</th>
              <th className="p-3 text-right font-medium">New</th>
              <th className="p-3 text-right font-medium">Hired</th>
              <th className="p-3 font-medium">Google for Jobs</th>
            </tr>
          </thead>
          <tbody>
            {a.jobs.map((j: any) => (
              <tr key={j.id} className="border-b border-border last:border-0 align-top">
                <td className="p-3">
                  <Link href={`/admin/careers/applications?jobId=${j.id}`} className="font-medium hover:underline">
                    {j.title}
                  </Link>
                  <div className="text-xs text-muted-foreground">{j.place}</div>
                </td>
                <td className="p-3">
                  <span className="capitalize">{j.status}</span>
                  {j.closingSoon ? <div className="text-xs text-destructive">Closes {formatDate(j.closeAt)}</div> : null}
                </td>
                <td className="p-3 text-right tabular-nums">{j.views}</td>
                <td className="p-3 text-right tabular-nums">{j.applications}</td>
                <td className="p-3 text-right tabular-nums">{j.conversion}%</td>
                <td className="p-3 text-right tabular-nums">{j.newApplications}</td>
                <td className="p-3 text-right tabular-nums">{j.hired}</td>
                <td className="p-3">
                  {j.seoIssues.length ? (
                    <ul className="flex list-disc flex-col gap-0.5 pl-4 text-xs text-muted-foreground">
                      {j.seoIssues.map((i: string) => <li key={i}>{i}</li>)}
                    </ul>
                  ) : (
                    <span className="text-xs">{j.status === 'open' ? 'Ready' : '—'}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  )
}
