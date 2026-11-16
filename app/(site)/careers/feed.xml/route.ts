import { canonicalUrl } from '@/lib/seo/config'
import { searchJobs } from '@/lib/server/services/careers'
import { xmlEscape } from '@/lib/server/services/seo-feeds'
import { getSeoSettings } from '@/lib/server/services/seo-inventory'
import { jobMeta } from '@/lib/careers/labels'

export const revalidate = 900

const cdata = (s: string) => `<![CDATA[${s.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`

/** RSS feed of open roles; job aggregators and alert tools poll this for new listings. */
export async function GET() {
  const [{ site }, { jobs }] = await Promise.all([getSeoSettings(), searchJobs({})])
  const feedUrl = canonicalUrl(site.siteUrl, '/careers/feed.xml')
  const items = jobs
    .slice(0, 100)
    .map((j: any) => {
      const url = canonicalUrl(site.siteUrl, `/careers/${j.slug}`)
      return [
        '    <item>',
        `      <title>${xmlEscape(j.title)}</title>`,
        `      <link>${xmlEscape(url)}</link>`,
        `      <guid isPermaLink="true">${xmlEscape(url)}</guid>`,
        j.publishedAt || j.createdAt ? `      <pubDate>${new Date(j.publishedAt || j.createdAt).toUTCString()}</pubDate>` : '',
        j.department ? `      <category>${xmlEscape(j.department)}</category>` : '',
        `      <description>${cdata([jobMeta(j), j.summary].filter(Boolean).join(' — '))}</description>`,
        '    </item>',
      ]
        .filter(Boolean)
        .join('\n')
    })
    .join('\n')
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xmlEscape(`Careers at ${site.brandName}`)}</title>
    <link>${xmlEscape(canonicalUrl(site.siteUrl, '/careers'))}</link>
    <description>${xmlEscape(`Open roles at ${site.brandName}`)}</description>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${xmlEscape(feedUrl)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`
  return new Response(xml, { headers: { 'content-type': 'application/rss+xml; charset=utf-8', 'cache-control': 'public, max-age=900' } })
}
