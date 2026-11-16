import type { Metadata } from 'next'
import { BlogPage } from '@/components/site/blog-page'
import { JsonLd } from '@/components/site/json-ld'
import { listPosts, listTermsWithCounts } from '@/lib/server/services/public'
import { archiveJsonLd, archiveMetadata, parsePage } from '@/lib/server/services/blog-archive'
import { applyRouteSeoMetadata, routeSeoJsonLd } from '@/lib/server/services/seo-page'

type Props = { searchParams: Promise<{ page?: string; category?: string; q?: string; sort?: string }> }
const description = 'Explore the latest mobility trends, expert insights and practical ideas on corporate transportation, employee mobility and sustainable travel.'

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams
  const page = parsePage(sp.page)
  const query = typeof sp.q === 'string' ? sp.q.trim().slice(0, 80) : ''
  const category = typeof sp.category === 'string' ? sp.category.trim().slice(0, 80) : ''
  const sort = sp.sort === 'popular' ? 'popular' : 'latest'
  const result = await listPosts({ page, category: category || undefined, q: query || undefined, sort, limit: 9 })
  const metadata = await archiveMetadata({
    path: '/blog',
    title: 'Blog & Insights | Ideas. Insights. Impact.',
    description,
    total: result.total,
    page,
    image: '/images/site/transport-hero.png',
  })
  const filtered = Boolean(query || category || page > 1 || sort !== 'latest')
  const effective = filtered ? { ...metadata, robots: { index: false, follow: true } } : metadata
  const preserveNoindex = filtered || result.total < 2
  return applyRouteSeoMetadata('/blog', effective, { preserveNoindex })
}

export default async function BlogIndex({ searchParams }: Props) {
  const sp = await searchParams
  const page = parsePage(sp.page)
  const query = typeof sp.q === 'string' ? sp.q.trim().slice(0, 80) : ''
  const category = typeof sp.category === 'string' ? sp.category.trim().slice(0, 80) : ''
  const sort = sp.sort === 'popular' ? 'popular' : 'latest'
  const [result, categories, recent] = await Promise.all([
    listPosts({ page, category: category || undefined, q: query || undefined, sort, limit: 9 }),
    listTermsWithCounts('category'),
    listPosts({ page: 1, limit: 5, sort: 'latest' }),
  ])
  const jsonLd = await archiveJsonLd({
    path: '/blog',
    name: 'Blog & Insights',
    description,
    trail: [{ name: 'Home', path: '/' }, { name: 'Blog & Insights', path: '/blog' }],
  })
  return <>
    <JsonLd data={[...jsonLd, ...(await routeSeoJsonLd('/blog'))]} />
    <BlogPage
      result={result}
      categories={categories.filter((item: any) => item.postCount > 0)}
      recent={recent.items}
      query={query || undefined}
      category={category || undefined}
      sort={sort}
    />
  </>
}
