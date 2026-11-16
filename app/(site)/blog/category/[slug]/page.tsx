import type { Metadata } from 'next'
import { redirectOrNotFound } from '@/lib/server/services/blog-slugs'
import { ArchiveCrumbs, ArchivePosts } from '@/components/blog/archive-view'
import { JsonLd } from '@/components/site/json-ld'
import { PageIntro } from '@/components/site/primitives'
import { archiveJsonLd, archiveMetadata, parsePage } from '@/lib/server/services/blog-archive'
import { applyRouteSeoMetadata, routeSeoJsonLd } from '@/lib/server/services/seo-page'
import { getTaxonomy, listPosts } from '@/lib/server/services/public'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> }

async function load({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams])
  const term = await getTaxonomy('category', slug)
  if (!term) return null
  const page = parsePage(sp.page)
  const result = await listPosts({ category: slug, page, limit: 12 })
  return { term, page, result, path: `/blog/category/${term.slug}` }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const d = await load(props)
  if (!d) return { robots: { index: false } }
  const base = await archiveMetadata({ path: d.path, title: `${d.term.name} articles`, description: d.term.description || `Articles about ${d.term.name.toLowerCase()} from the Go Ahead Mobility team.`, total: d.result.total, page: d.page, termNoindex: d.term.noindex })
  return applyRouteSeoMetadata(d.path, base, { preserveNoindex: d.page > 1 || d.result.total < 2 || Boolean(d.term.noindex) })
}

export default async function CategoryArchive(props: Props) {
  const d = await load(props)
  if (!d) return redirectOrNotFound(`/blog/category/${slug}`)
  const trail = [
    { name: 'Home', path: '/' },
    { name: 'Insights', path: '/blog' },
    { name: d.term.name, path: d.path },
  ]
  return (
    <>
      <JsonLd data={[...(await archiveJsonLd({ path: d.path, name: d.term.name, description: d.term.description, trail })), ...(await routeSeoJsonLd(d.path))]} />
      <ArchiveCrumbs trail={trail} />
      <PageIntro eyebrow="Category" title={d.term.name} intro={d.term.description || `${d.result.total} published ${d.result.total === 1 ? 'article' : 'articles'}.`} />
      <ArchivePosts items={d.result.items} page={d.page} pages={d.result.pages} basePath={d.path} />
    </>
  )
}
