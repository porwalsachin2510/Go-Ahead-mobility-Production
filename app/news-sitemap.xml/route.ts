import { canonicalUrl } from '@/lib/seo/config'
import { listFeedPosts } from '@/lib/server/services/public'
import { xmlEscape } from '@/lib/server/services/seo-feeds'
import { getSeoSettings } from '@/lib/server/services/seo-inventory'

export const revalidate = 900

/** Google News only reads articles from the last 48 hours, so older posts are left to the main sitemap. */
const NEWS_WINDOW_MS = 48 * 60 * 60 * 1000

export async function GET() {
  const { site } = await getSeoSettings()
  if (!site.sitemap.enabled || site.robotsMode === 'disallow_all') return new Response('Not found', { status: 404 })
  const posts = await listFeedPosts({ limit: 1000, since: new Date(Date.now() - NEWS_WINDOW_MS) })
  const lang = (site.locale || 'en').split(/[-_]/)[0].toLowerCase()

  const urls = posts
    .map((p: any) => {
      const keywords = [...(p.categoryIds ?? []), ...(p.tagIds ?? [])].map((t: any) => t.name).slice(0, 10).join(', ')
      return `  <url>
    <loc>${xmlEscape(canonicalUrl(site.siteUrl, `/blog/${p.slug}`))}</loc>
    <news:news>
      <news:publication>
        <news:name>${xmlEscape(site.brandName)}</news:name>
        <news:language>${xmlEscape(p.language || lang)}</news:language>
      </news:publication>
      <news:publication_date>${new Date(p.publishedAt).toISOString()}</news:publication_date>
      <news:title>${xmlEscape(p.title)}</news:title>${keywords ? `\n      <news:keywords>${xmlEscape(keywords)}</news:keywords>` : ''}
    </news:news>
  </url>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>
`
  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8' } })
}
