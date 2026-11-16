import type { MetadataRoute } from 'next'
import { normalizePath } from '@/lib/seo/config'
import { buildSitemapEntries } from '@/lib/seo/sitemap'
import { buildInventory } from '@/lib/server/services/seo-inventory'

export const revalidate = 3600

/**
 * Only public, indexable, self-canonical URLs that are not redirect sources. lastModified comes from the
 * record's own updatedAt, never the request time, so crawlers get truthful freshness signals.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const snapshot = await buildInventory()
  const { site, entries, redirects } = snapshot
  if (!site.sitemap.enabled || site.robotsMode === 'disallow_all') return []
  const redirectSources = new Set(redirects.filter((r) => r.enabled).map((r) => normalizePath(r.sourcePath)))
  return buildSitemapEntries(entries, site.siteUrl, { redirectSources, excludePaths: site.sitemap.excludePaths }).map((e) => ({
    url: e.url,
    lastModified: e.lastModified,
  }))
}
