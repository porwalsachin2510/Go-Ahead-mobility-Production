import Link from 'next/link'
import { redirect } from 'next/navigation'
import { IssueList } from '@/components/admin/seo/issue-list'
import { NotFoundRow } from '@/components/admin/seo/not-found-row'
import { RunAuditButton } from '@/components/admin/seo/run-audit-button'
import { Card, formatDate, Notice, PageHeader } from '@/components/admin/ui'
import { can } from '@/lib/rbac'
import { analyzeRedirects } from '@/lib/seo/redirects'
import { buildSitemapEntries, validateSitemap } from '@/lib/seo/sitemap'
import { requirePageUser } from '@/lib/server/auth/session'
import { connectDb } from '@/lib/server/db'
import { SeoAuditRun } from '@/lib/server/models/seo'
import { buildInventory, listAuditRuns, listNotFound } from '@/lib/server/services/seo-inventory'

export const metadata = { title: 'SEO overview' }
export const dynamic = 'force-dynamic'

const SEVERITIES = ['critical', 'high', 'medium', 'low'] as const

/** Suggests the live page whose last path segment shares the most words with the broken URL. */
function suggestTarget(broken: string, livePaths: string[]): string {
  const words = (p: string) => new Set((p.split('/').filter(Boolean).pop() ?? '').toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2))
  const want = words(broken)
  if (!want.size) return ''
  let best = ''
  let bestScore = 0
  for (const p of livePaths) {
    const have = words(p)
    let score = 0
    for (const w of want) if (have.has(w)) score++
    if (score > bestScore) {
      bestScore = score
      best = p
    }
  }
  return best
}

export default async function SeoOverviewPage() {
  const user = await requirePageUser()
  if (!can(user.role, 'seo.write')) redirect('/admin')
  await connectDb()
  const [snapshot, latest, runs, notFound] = await Promise.all([
    buildInventory(),
    SeoAuditRun.findOne({}).sort({ createdAt: -1 }).lean<any>(),
    listAuditRuns(8),
    listNotFound(10),
  ])
  const publicEntries = snapshot.entries.filter((e) => e.isPublic)
  const indexable = publicEntries.filter((e) => e.indexable)
  const withExplicitTitle = indexable.filter((e) => e.titleSource === 'explicit').length
  const withDescription = indexable.filter((e) => e.descriptionSource !== 'none').length
  const redirectSources = new Set(snapshot.redirects.filter((r) => r.enabled).map((r) => r.sourcePath))
  const sitemapEntries = buildSitemapEntries(snapshot.entries, snapshot.site.siteUrl, { redirectSources })
  const sitemapErrors = validateSitemap(sitemapEntries, snapshot.site.siteUrl)
  const redirectProblems = analyzeRedirects(snapshot.redirects, new Set(publicEntries.map((e) => e.path)))
  const issues = JSON.parse(JSON.stringify(latest?.issues ?? []))

  return (
    <>
      <PageHeader
        title="SEO overview"
        description="Audit results come from this application's own routes and content records. Search performance data requires Google Search Console."
        actions={<RunAuditButton />}
      />

      {!snapshot.siteUrlConfigured && (
        <Notice tone="error">
          The production site URL is not set. Canonicals, sitemap and Open Graph URLs fall back to a default host. Set it in{' '}
          <Link href="/admin/settings" className="underline">Site settings</Link> or the <code>NEXT_PUBLIC_SITE_URL</code> variable.
        </Notice>
      )}
      {snapshot.site.robotsMode === 'disallow_all' && <Notice tone="error">robots.txt is blocking all crawlers. Nothing on this site can be indexed until this is switched back to allow.</Notice>}

      <section aria-labelledby="seo-health" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <h2 id="seo-health" className="sr-only">Health summary</h2>
        <Card className="flex flex-col gap-1 p-5">
          <span className="text-sm text-muted-foreground">Health score</span>
          <span className="font-display text-3xl font-semibold">{latest ? latest.score : '—'}</span>
          <span className="text-xs text-muted-foreground">{latest ? `Last audit ${formatDate(latest.createdAt, true)}` : 'No audit has been run yet'}</span>
        </Card>
        <Card className="flex flex-col gap-1 p-5">
          <span className="text-sm text-muted-foreground">Indexable pages</span>
          <span className="font-display text-3xl font-semibold">{indexable.length}</span>
          <span className="text-xs text-muted-foreground">{publicEntries.length - indexable.length} public pages set to noindex</span>
        </Card>
        <Card className="flex flex-col gap-1 p-5">
          <span className="text-sm text-muted-foreground">Metadata coverage</span>
          <span className="font-display text-3xl font-semibold">{indexable.length ? Math.round((withDescription / indexable.length) * 100) : 0}%</span>
          <span className="text-xs text-muted-foreground">have a description · {withExplicitTitle} use a hand-written title</span>
        </Card>
        <Card className="flex flex-col gap-1 p-5">
          <span className="text-sm text-muted-foreground">XML sitemap</span>
          <span className="font-display text-3xl font-semibold">{snapshot.site.sitemap.enabled ? sitemapEntries.length : 'Off'}</span>
          <span className="text-xs text-muted-foreground">
            {sitemapErrors.length ? `${sitemapErrors.length} validation errors` : 'URLs, valid'} ·{' '}
            <a href="/sitemap.xml" className="underline" target="_blank" rel="noreferrer">view</a> ·{' '}
            <a href="/robots.txt" className="underline" target="_blank" rel="noreferrer">robots.txt</a>
          </span>
        </Card>
      </section>

      {latest && (
        <div className="flex flex-wrap gap-2 text-sm">
          {SEVERITIES.map((s) => (
            <span key={s} className="rounded-md border border-border px-2.5 py-1 capitalize">
              {s}: <strong>{latest.counts?.[s] ?? 0}</strong>
            </span>
          ))}
          <Link href="/admin/seo/pages" className="rounded-md border border-border px-2.5 py-1 hover:bg-muted">Page inventory and editor</Link>
          <Link href="/admin/c/redirects" className="rounded-md border border-border px-2.5 py-1 hover:bg-muted">Redirect manager</Link>
        </div>
      )}

      <section aria-labelledby="issues-heading" className="flex flex-col gap-3">
        <h2 id="issues-heading" className="font-display text-lg font-semibold">Issue centre</h2>
        {latest ? <IssueList issues={issues} /> : <Card className="p-6 text-sm text-muted-foreground">Run the first audit to inspect every public route, content record, redirect and sitemap entry.</Card>}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="redirects-heading" className="flex flex-col gap-3">
          <h2 id="redirects-heading" className="font-display text-lg font-semibold">Redirect health</h2>
          <Card className="flex flex-col divide-y divide-border">
            {redirectProblems.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">{snapshot.redirects.length} redirect rules, no chains, loops or collisions detected.</p>
            ) : (
              redirectProblems.slice(0, 20).map((p, i) => (
                <div key={i} className="flex flex-col gap-0.5 p-4 text-sm">
                  <span className="font-medium">{(p as any).kind ?? (p as any).type}</span>
                  <span className="break-all text-muted-foreground">{(p as any).message ?? (p as any).sourcePath}</span>
                </div>
              ))
            )}
          </Card>
        </section>
        <section aria-labelledby="nf-heading" className="flex flex-col gap-3">
          <h2 id="nf-heading" className="font-display text-lg font-semibold">Top 404s</h2>
          <Card className="flex flex-col divide-y divide-border">
            {notFound.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No unresolved 404s have been logged.</p>
            ) : (
              notFound.map((n) => (
                <NotFoundRow
                  key={String(n._id)}
                  id={String(n._id)}
                  path={n.path}
                  hits={n.hits}
                  referrer={n.lastReferrer}
                  suggestion={suggestTarget(n.path, publicEntries.map((e) => e.path))}
                />
              ))
            )}
          </Card>
        </section>
      </div>

      <section aria-labelledby="runs-heading" className="flex flex-col gap-3">
        <h2 id="runs-heading" className="font-display text-lg font-semibold">Audit history</h2>
        <Card className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Score</th>
                <th className="px-4 py-2 font-medium">Pages</th>
                <th className="px-4 py-2 font-medium">Indexable</th>
                <th className="px-4 py-2 font-medium">Trigger</th>
              </tr>
            </thead>
            <tbody>
              {runs.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-4 text-muted-foreground">No audits yet.</td></tr>
              ) : (
                runs.map((r) => (
                  <tr key={String(r._id)} className="border-b border-border last:border-0">
                    <td className="px-4 py-2">{formatDate(r.createdAt, true)}</td>
                    <td className="px-4 py-2">{r.score}</td>
                    <td className="px-4 py-2">{r.pageCount}</td>
                    <td className="px-4 py-2">{r.indexableCount}</td>
                    <td className="px-4 py-2 capitalize">{r.trigger}</td>
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
