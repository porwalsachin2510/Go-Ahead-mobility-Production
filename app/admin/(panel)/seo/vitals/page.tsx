import { redirect } from 'next/navigation'
import { Card, Notice, PageHeader } from '@/components/admin/ui'
import { can } from '@/lib/rbac'
import { formatVital, p75, rateVital, VITAL_THRESHOLDS, type VitalName, type VitalRating } from '@/lib/seo/vitals'
import { requirePageUser } from '@/lib/server/auth/session'
import { connectDb } from '@/lib/server/db'
import { WebVital } from '@/lib/server/models/seo'

export const metadata = { title: 'Core Web Vitals' }
export const dynamic = 'force-dynamic'

const CORE: VitalName[] = ['LCP', 'INP', 'CLS']
const ALL: VitalName[] = ['LCP', 'INP', 'CLS', 'FCP', 'TTFB']
const DEVICES = ['mobile', 'desktop'] as const

const tone: Record<VitalRating, string> = {
  good: 'text-success',
  'needs-improvement': 'text-warning',
  poor: 'text-destructive',
}
const ratingLabel: Record<VitalRating, string> = { good: 'Good', 'needs-improvement': 'Needs work', poor: 'Poor' }

export default async function VitalsPage() {
  const user = await requirePageUser()
  if (!can(user.role, 'seo.write')) redirect('/admin')
  await connectDb()
  const since = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)
  const rows: { _id: { path: string; name: VitalName; device: 'mobile' | 'desktop' }; values: number[] }[] = await WebVital.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $sort: { createdAt: -1 } },
    { $group: { _id: { path: '$path', name: '$name', device: '$device' }, values: { $push: '$value' } } },
    { $project: { values: { $slice: ['$values', 2000] } } },
  ])

  const site: Record<string, number[]> = {}
  const byPath = new Map<string, Partial<Record<VitalName, number[]>>>()
  for (const r of rows) {
    const key = `${r._id.device}:${r._id.name}`
    ;(site[key] ??= []).push(...r.values)
    const entry = byPath.get(r._id.path) ?? {}
    ;(entry[r._id.name] ??= []).push(...r.values)
    byPath.set(r._id.path, entry)
  }
  const total = rows.reduce((n, r) => n + r.values.length, 0)

  const pages = [...byPath.entries()]
    .map(([path, m]) => {
      const lcp = m.LCP?.length ? p75(m.LCP) : null
      const inp = m.INP?.length ? p75(m.INP) : null
      const cls = m.CLS?.length ? p75(m.CLS) : null
      const ratings = [lcp != null && rateVital('LCP', lcp), inp != null && rateVital('INP', inp), cls != null && rateVital('CLS', cls)].filter(Boolean) as VitalRating[]
      const weight = ratings.reduce((s, x) => s + (x === 'poor' ? 2 : x === 'needs-improvement' ? 1 : 0), 0)
      return { path, lcp, inp, cls, samples: (m.LCP?.length ?? 0) + (m.INP?.length ?? 0) + (m.CLS?.length ?? 0), weight, passes: ratings.length > 0 && ratings.every((x) => x === 'good') }
    })
    .sort((a, b) => b.weight - a.weight || b.samples - a.samples)
    .slice(0, 40)

  return (
    <>
      <PageHeader title="Core Web Vitals" description="Field data from real visitors over the last 28 days, assessed at the 75th percentile like Google's page experience signals." />
      {total === 0 ? (
        <Notice>No measurements yet. Data appears as visitors browse the public site; each page view reports its vitals automatically.</Notice>
      ) : null}

      {DEVICES.map((device) => (
        <section key={device} aria-labelledby={`cwv-${device}`} className="flex flex-col gap-3">
          <h2 id={`cwv-${device}`} className="font-display text-lg font-semibold capitalize">{device}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {ALL.map((name) => {
              const values = site[`${device}:${name}`] ?? []
              const v = p75(values)
              const r = values.length ? rateVital(name, v) : null
              return (
                <Card key={name} className="flex flex-col gap-1">
                  <p className="text-xs text-muted-foreground">{VITAL_THRESHOLDS[name].label}{CORE.includes(name) ? ' (core)' : ''}</p>
                  <p className={`font-display text-2xl font-semibold ${r ? tone[r] : 'text-muted-foreground'}`}>{values.length ? formatVital(name, v) : 'No data'}</p>
                  <p className="text-xs text-muted-foreground">
                    {r ? `${ratingLabel[r]} · ` : ''}{values.length} samples · good {'≤'} {formatVital(name, VITAL_THRESHOLDS[name].good)}
                  </p>
                </Card>
              )
            })}
          </div>
        </section>
      ))}

      <section aria-labelledby="cwv-pages" className="flex flex-col gap-3">
        <h2 id="cwv-pages" className="font-display text-lg font-semibold">Pages, worst first</h2>
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Path</th>
                <th className="px-4 py-2 font-medium">LCP</th>
                <th className="px-4 py-2 font-medium">INP</th>
                <th className="px-4 py-2 font-medium">CLS</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {pages.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-4 text-muted-foreground">No page data yet.</td></tr>
              ) : (
                pages.map((p) => (
                  <tr key={p.path} className="border-b border-border last:border-0">
                    <td className="break-all px-4 py-2 font-mono text-xs">{p.path}</td>
                    {(['LCP', 'INP', 'CLS'] as const).map((n) => {
                      const v = n === 'LCP' ? p.lcp : n === 'INP' ? p.inp : p.cls
                      return <td key={n} className={`px-4 py-2 ${v != null ? tone[rateVital(n, v)] : 'text-muted-foreground'}`}>{v != null ? formatVital(n, v) : '-'}</td>
                    })}
                    <td className="px-4 py-2">{p.passes ? 'Passes' : 'Needs work'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      </section>
    </>
  )
}
