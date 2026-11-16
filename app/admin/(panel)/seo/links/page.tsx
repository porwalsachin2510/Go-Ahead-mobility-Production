import Link from 'next/link'
import { Card, Notice, PageHeader } from '@/components/admin/ui'
import { normalizePath } from '@/lib/seo/config'
import { requirePageUser } from '@/lib/server/auth/session'
import { buildInventory } from '@/lib/server/services/seo-inventory'

export const dynamic = 'force-dynamic'

const ASSET = /\.(png|jpe?g|gif|webp|avif|svg|ico|pdf|zip|xml|txt|css|js|mp4|webm)$/i

function internalPath(href: string, host: string): string | null {
  const h = href.trim()
  if (!h || h.startsWith('#') || /^(mailto|tel|javascript):/i.test(h)) return null
  try {
    const u = new URL(h, `https://${host}`)
    if (u.host !== host) return null
    if (u.pathname.startsWith('/api/') || u.pathname.startsWith('/_next/') || ASSET.test(u.pathname)) return null
    return normalizePath(u.pathname)
  } catch {
    return null
  }
}

export default async function InternalLinksPage() {
  await requirePageUser('seo.write')
  const { site, entries, redirects } = await buildInventory()
  const host = new URL(site.siteUrl).host
  const publicEntries = entries.filter((e) => e.isPublic)
  const known = new Set(publicEntries.map((e) => normalizePath(e.path)))
  const redirectTargets = new Map(redirects.filter((r) => r.enabled).map((r) => [normalizePath(r.sourcePath), r]))

  const inbound = new Map<string, Set<string>>()
  const broken: { from: string; label: string; href: string; text: string }[] = []
  const viaRedirect: { from: string; label: string; href: string; target: string }[] = []

  for (const e of publicEntries) {
    const from = normalizePath(e.path)
    for (const l of e.links) {
      const to = internalPath(l.href, host)
      if (!to || to === from) continue
      const r = redirectTargets.get(to)
      if (r) {
        viaRedirect.push({ from, label: e.label, href: to, target: r.targetUrl || '410 Gone' })
        continue
      }
      if (!known.has(to)) {
        broken.push({ from, label: e.label, href: to, text: l.text })
        continue
      }
      inbound.set(to, (inbound.get(to) ?? new Set()).add(from))
    }
  }

  const rows = publicEntries
    .filter((e) => e.indexable)
    .map((e) => {
      const p = normalizePath(e.path)
      const outbound = new Set(e.links.map((l) => internalPath(l.href, host)).filter((x): x is string => !!x && x !== p))
      return { path: p, label: e.label, type: e.entityType, inbound: inbound.get(p)?.size ?? 0, outbound: outbound.size }
    })
  const orphans = rows.filter((r) => r.path !== '/' && r.inbound === 0)
  const weakest = [...rows].sort((a, b) => a.inbound - b.inbound || a.path.localeCompare(b.path)).slice(0, 25)

  const stat = (label: string, value: number, tone?: 'bad') => (
    <Card className="flex flex-col gap-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-2xl font-semibold tabular-nums ${tone && value ? 'text-destructive' : ''}`}>{value}</span>
    </Card>
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Internal links" description="Content links between your own pages: orphans, broken links and links that bounce through redirects. Navigation menus are not counted." />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stat('Indexable pages', rows.length)}
        {stat('Orphan pages', orphans.length, 'bad')}
        {stat('Broken internal links', broken.length, 'bad')}
        {stat('Links via redirect', viaRedirect.length, 'bad')}
      </div>

      <Card className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">Broken internal links</h2>
        {broken.length ? (
          <ul className="flex flex-col divide-y divide-border text-sm">
            {broken.map((b, i) => (
              <li key={i} className="flex flex-col gap-0.5 py-2">
                <span>
                  <span className="font-mono text-destructive">{b.href}</span> {b.text ? <span className="text-muted-foreground">{`("${b.text}")`}</span> : null}
                </span>
                <span className="text-muted-foreground">
                  on <Link href={b.from} className="underline underline-offset-2">{b.label}</Link>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <Notice tone="success">No content links point at missing pages.</Notice>
        )}
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">Orphan pages</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">Indexable pages no other page links to in its content. Search engines find and rank these poorly; link to them from related pages.</p>
        {orphans.length ? (
          <ul className="flex flex-col divide-y divide-border text-sm">
            {orphans.map((o) => (
              <li key={o.path} className="flex items-center justify-between gap-3 py-2">
                <span className="truncate">{o.label}</span>
                <span className="shrink-0 font-mono text-xs text-muted-foreground">{o.path}</span>
              </li>
            ))}
          </ul>
        ) : (
          <Notice tone="success">Every indexable page receives at least one internal link.</Notice>
        )}
      </Card>

      {viaRedirect.length ? (
        <Card className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">Links through redirects</h2>
          <p className="text-sm text-muted-foreground">Update these to point at the final URL to save crawl budget and pass full link equity.</p>
          <ul className="flex flex-col divide-y divide-border text-sm">
            {viaRedirect.map((r, i) => (
              <li key={i} className="flex flex-col gap-0.5 py-2">
                <span className="font-mono">{`${r.href} -> ${r.target}`}</span>
                <span className="text-muted-foreground">on {r.label}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card className="flex flex-col gap-3 overflow-x-auto">
        <h2 className="text-base font-semibold">Least-linked pages</h2>
        <table className="w-full text-left text-sm">
          <thead className="text-muted-foreground">
            <tr>
              <th scope="col" className="py-2 pr-3 font-medium">Page</th>
              <th scope="col" className="py-2 pr-3 font-medium">Type</th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">Inbound</th>
              <th scope="col" className="py-2 text-right font-medium">Outbound</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {weakest.map((r) => (
              <tr key={r.path}>
                <td className="py-2 pr-3">
                  <div className="flex flex-col">
                    <span>{r.label}</span>
                    <span className="font-mono text-xs text-muted-foreground">{r.path}</span>
                  </div>
                </td>
                <td className="py-2 pr-3 text-muted-foreground">{r.type}</td>
                <td className={`py-2 pr-3 text-right tabular-nums ${r.inbound === 0 ? 'text-destructive' : ''}`}>{r.inbound}</td>
                <td className="py-2 text-right tabular-nums">{r.outbound}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
