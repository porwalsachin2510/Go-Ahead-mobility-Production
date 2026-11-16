import type { MetadataRoute } from 'next'
import { buildRobots } from '@/lib/seo/robots'
import { getSeoSettings } from '@/lib/server/services/seo-inventory'

export const revalidate = 3600

/** Built from the shared robots builder so the admin preview, audit engine and live file can never disagree. */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const { site } = await getSeoSettings()
  const result = buildRobots({ siteUrl: site.siteUrl, mode: site.robotsMode, extraDisallow: site.extraDisallow, sitemapEnabled: site.sitemap.enabled })
  const sitemaps = result.sitemaps.length ? [...result.sitemaps, ...(site.imageSitemap !== false ? [`${site.siteUrl}/image-sitemap.xml`] : []), `${site.siteUrl}/news-sitemap.xml`] : result.sitemaps
  return {
    rules: result.groups.map((g) => ({ userAgent: g.userAgent, allow: g.allow.length ? g.allow : undefined, disallow: g.disallow })),
    sitemap: sitemaps.length ? sitemaps : undefined,
    host: result.blockAll ? undefined : site.siteUrl,
  }
}
