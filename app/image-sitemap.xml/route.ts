import { absoluteUrl } from '@/lib/seo/config'
import { sitemapEligibleEntries, xmlEscape } from '@/lib/server/services/seo-feeds'

export const revalidate = 3600

/** Google image sitemap: every image on indexable pages, with its alt text as the caption. */
export async function GET() {
  const { site, eligible } = await sitemapEligibleEntries()
  if (!site.sitemap.enabled || site.robotsMode === 'disallow_all' || site.imageSitemap === false) return new Response('Not found', { status: 404 })

  const blocks: string[] = []
  for (const { entry, url } of eligible) {
    const images = new Map<string, string>()
    for (const img of [...(entry.ogImage ? [{ src: entry.ogImage, alt: entry.title }] : []), ...entry.images]) {
      if (!img.src || img.src.startsWith('data:')) continue
      const loc = absoluteUrl(site.siteUrl, img.src)
      if (!/^https?:\/\//.test(loc) || images.has(loc)) continue
      images.set(loc, img.alt)
      if (images.size >= 1000) break
    }
    if (!images.size) continue
    const imgs = [...images.entries()]
      .map(([loc, alt]) => `    <image:image>\n      <image:loc>${xmlEscape(loc)}</image:loc>${alt ? `\n      <image:caption>${xmlEscape(alt)}</image:caption>` : ''}\n    </image:image>`)
      .join('\n')
    blocks.push(`  <url>\n    <loc>${xmlEscape(url)}</loc>\n${imgs}\n  </url>`)
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${blocks.join('\n')}\n</urlset>\n`
  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8' } })
}
