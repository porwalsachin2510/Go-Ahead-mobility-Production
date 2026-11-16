import 'server-only'
import { normalizePath } from '@/lib/seo/config'
import { buildSitemapEntries } from '@/lib/seo/sitemap'
import type { InventoryEntry } from '@/lib/seo/types'
import { buildInventory } from './seo-inventory'

/** Inventory entries that are eligible for the sitemap, paired with their canonical URL. */
export async function sitemapEligibleEntries() {
  const snapshot = await buildInventory()
  const { site, entries, redirects } = snapshot
  const redirectSources = new Set(redirects.filter((r) => r.enabled).map((r) => normalizePath(r.sourcePath)))
  const opts = { redirectSources, excludePaths: site.sitemap.excludePaths }
  const eligible: { entry: InventoryEntry; url: string }[] = []
  const seen = new Set<string>()
  for (const entry of entries) {
    const [hit] = buildSitemapEntries([entry], site.siteUrl, opts)
    if (!hit || seen.has(hit.url)) continue
    seen.add(hit.url)
    eligible.push({ entry, url: hit.url })
  }
  return { site, eligible, snapshot }
}

export const xmlEscape = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
