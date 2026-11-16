import { sitemapEligibleEntries } from '@/lib/server/services/seo-feeds'

export const revalidate = 3600

const SECTION: Record<string, string> = {
  page: 'Pages',
  post: 'Blog',
  archive: 'Blog archives',
  industry: 'Industries',
  case_study: 'Case studies',
  resource: 'Resources',
  job: 'Careers',
}

/** llms.txt (llmstxt.org): a Markdown index that helps AI assistants and answer engines cite the site accurately. */
export async function GET() {
  const { site, eligible } = await sitemapEligibleEntries()
  if (site.llms?.enabled === false || site.robotsMode === 'disallow_all') return new Response('Not found', { status: 404 })

  const groups = new Map<string, string[]>()
  for (const { entry, url } of eligible) {
    const section = SECTION[entry.entityType] ?? 'Other'
    const desc = entry.description.replace(/\s+/g, ' ').trim()
    const line = `- [${entry.title.replace(/[[\]]/g, '')}](${url})${desc ? `: ${desc}` : ''}`
    groups.set(section, [...(groups.get(section) ?? []), line])
  }

  const order = Object.values(SECTION)
  const sections = [...groups.entries()].sort((a, b) => (order.indexOf(a[0]) + 99) % 99 - (order.indexOf(b[0]) + 99) % 99)
  const lines = [`# ${site.brandName}`, '', `> ${site.defaultDescription || site.tagline}`, '']
  if (site.llms?.intro?.trim()) lines.push(site.llms.intro.trim(), '')
  if (site.contact.email || site.contact.phone) lines.push(`Contact: ${[site.contact.email, site.contact.phone].filter(Boolean).join(' · ')}`, '')
  for (const [title, items] of sections) lines.push(`## ${title}`, '', ...items, '')
  return new Response(`${lines.join('\n').trim()}\n`, { headers: { 'content-type': 'text/markdown; charset=utf-8' } })
}
