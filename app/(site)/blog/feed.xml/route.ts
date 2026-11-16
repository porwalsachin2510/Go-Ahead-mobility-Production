import { absoluteUrl, canonicalUrl } from '@/lib/seo/config'
import { listFeedPosts } from '@/lib/server/services/public'
import { xmlEscape } from '@/lib/server/services/seo-feeds'
import { getSeoSettings } from '@/lib/server/services/seo-inventory'

export const revalidate = 900

const cdata = (s: string) => `<![CDATA[${s.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`

/** RSS 2.0 feed of the latest live, indexable posts; feed readers and aggregators pick up new articles from here. */
export async function GET() {
  const [{ site }, posts] = await Promise.all([getSeoSettings(), listFeedPosts({ limit: 50 })])
  const feedUrl = canonicalUrl(site.siteUrl, '/blog/feed.xml')
  const blogUrl = canonicalUrl(site.siteUrl, '/blog')
  const lastBuild = posts[0]?.contentUpdatedAt || posts[0]?.publishedAt || new Date().toISOString()

  const items = posts
    .map((p: any) => {
      const url = canonicalUrl(site.siteUrl, `/blog/${p.slug}`)
      const cats = [...(p.categoryIds ?? []), ...(p.tagIds ?? [])].map((t: any) => `      <category>${xmlEscape(t.name)}</category>`).join('\n')
      const image = p.heroImage && !p.heroImage.startsWith('data:') ? absoluteUrl(site.siteUrl, p.heroImage) : ''
      return [
        '    <item>',
        `      <title>${xmlEscape(p.title)}</title>`,
        `      <link>${xmlEscape(url)}</link>`,
        `      <guid isPermaLink="true">${xmlEscape(url)}</guid>`,
        p.publishedAt ? `      <pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>` : '',
        p.authorId?.name ? `      <dc:creator>${cdata(p.authorId.name)}</dc:creator>` : '',
        `      <description>${cdata(p.excerpt || String(p.content || '').slice(0, 300))}</description>`,
        cats,
        image ? `      <media:content url="${xmlEscape(image)}" medium="image"${p.heroAlt ? `><media:description>${xmlEscape(p.heroAlt)}</media:description></media:content>` : ' />'}` : '',
        '    </item>',
      ]
        .filter(Boolean)
        .join('\n')
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${xmlEscape(`${site.brandName} Insights`)}</title>
    <link>${xmlEscape(blogUrl)}</link>
    <description>${xmlEscape(site.defaultDescription || `Latest articles from ${site.brandName}`)}</description>
    <language>${xmlEscape((site.locale || 'en').replace('_', '-').toLowerCase())}</language>
    <lastBuildDate>${new Date(lastBuild).toUTCString()}</lastBuildDate>
    <atom:link href="${xmlEscape(feedUrl)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`
  return new Response(xml, { headers: { 'content-type': 'application/rss+xml; charset=utf-8', 'cache-control': 'public, max-age=900' } })
}
