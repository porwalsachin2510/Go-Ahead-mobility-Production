import { canonicalUrl, isPrivatePath, normalizePath } from './config'
import type { InventoryEntry } from './types'

export const SITEMAP_CHUNK_SIZE = 5000
export const SITEMAP_HARD_LIMIT = 50000

export type SitemapEntry = { url: string; lastModified?: string }

/** Why an inventory entry is excluded from the sitemap. Returns null when eligible. */
export function sitemapExclusion(entry: InventoryEntry, opts: { redirectSources?: Set<string>; excludePaths?: string[] } = {}): string | null {
  if (!entry.isPublic) return 'Not publicly live'
  if (!entry.indexable) return entry.noindexReason || 'Marked noindex'
  if (isPrivatePath(entry.path)) return 'Private path'
  if (entry.canonicalPath !== entry.path) return 'Canonical points to a different URL'
  if (opts.redirectSources?.has(entry.path)) return 'URL redirects elsewhere'
  const excluded = (opts.excludePaths ?? []).map(normalizePath)
  if (excluded.some((p) => entry.path === p || entry.path.startsWith(`${p}/`))) return 'Excluded in sitemap settings'
  return null
}

export function buildSitemapEntries(entries: InventoryEntry[], siteUrl: string, opts: { redirectSources?: Set<string>; excludePaths?: string[] } = {}): SitemapEntry[] {
  const seen = new Map<string, SitemapEntry>()
  for (const entry of entries) {
    if (sitemapExclusion(entry, opts)) continue
    const url = canonicalUrl(siteUrl, entry.path)
    if (seen.has(url)) continue
    const lastModified = entry.updatedAt && !Number.isNaN(Date.parse(entry.updatedAt)) ? new Date(entry.updatedAt).toISOString() : undefined
    seen.set(url, { url, lastModified })
  }
  return [...seen.values()].sort((a, b) => a.url.localeCompare(b.url))
}

export function chunkSitemap<T>(items: T[], size = SITEMAP_CHUNK_SIZE): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size))
  return chunks
}

const xmlEscape = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')

export function renderUrlset(entries: SitemapEntry[]): string {
  const body = entries.map((e) => `  <url>\n    <loc>${xmlEscape(e.url)}</loc>${e.lastModified ? `\n    <lastmod>${e.lastModified}</lastmod>` : ''}\n  </url>`).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
}

export function renderSitemapIndex(siteUrl: string, chunkCount: number, lastModified?: string): string {
  const body = Array.from({ length: chunkCount }, (_, i) => `  <sitemap>\n    <loc>${xmlEscape(`${siteUrl}/sitemaps/${i + 1}.xml`)}</loc>${lastModified ? `\n    <lastmod>${lastModified}</lastmod>` : ''}\n  </sitemap>`).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>\n`
}

export function validateSitemap(entries: SitemapEntry[], siteUrl: string): string[] {
  const issues: string[] = []
  const host = new URL(siteUrl).host
  const seen = new Set<string>()
  if (entries.length > SITEMAP_HARD_LIMIT) issues.push(`More than ${SITEMAP_HARD_LIMIT} URLs; a sitemap index is required`)
  for (const e of entries) {
    let u: URL
    try {
      u = new URL(e.url)
    } catch {
      issues.push(`Invalid URL: ${e.url}`)
      continue
    }
    if (u.host !== host) issues.push(`Off-host URL: ${e.url}`)
    if (u.search || u.hash) issues.push(`URL has query or fragment: ${e.url}`)
    if (isPrivatePath(u.pathname)) issues.push(`Private URL listed: ${e.url}`)
    if (seen.has(e.url)) issues.push(`Duplicate URL: ${e.url}`)
    seen.add(e.url)
  }
  return issues
}
