import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/site/json-ld'
import { SmartImage, formatDate } from '@/components/site/primitives'
import { canonicalUrl } from '@/lib/seo/config'
import { breadcrumbSchema } from '@/lib/seo/jsonld'
import { buildMetadata } from '@/lib/seo/metadata'
import { redirectOrNotFound } from '@/lib/server/services/blog-slugs'
import { getSeries } from '@/lib/server/services/public'
import { getSeoSettings } from '@/lib/server/services/seo-inventory'
import { applyRouteSeoMetadata, routeSeoJsonLd } from '@/lib/server/services/seo-page'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const data = await getSeries(slug)
  if (!data) return { robots: { index: false } }
  const { site } = await getSeoSettings()
  const seo = data.series.seo ?? {}
  const base = buildMetadata({
    site,
    path: `/blog/series/${slug}`,
    title: seo.title || `${data.series.title}: complete series`,
    description: seo.description || data.series.description || `All ${data.posts.length} parts of ${data.series.title}, in reading order.`,
    canonical: seo.canonical,
    noindex: seo.noindex || data.posts.length < 2,
    ogImage: seo.ogImage || data.series.heroImage || data.posts[0]?.heroImage,
  })
  return applyRouteSeoMetadata(`/blog/series/${slug}`, base, { preserveNoindex: data.posts.length < 2 || Boolean(seo.noindex) })
}

export default async function SeriesPage({ params }: Props) {
  const { slug } = await params
  const data = await getSeries(slug)
  if (!data || !data.posts.length) return redirectOrNotFound(`/blog/series/${slug}`)
  const { series, posts } = data
  const { site } = await getSeoSettings()
  const path = `/blog/series/${series.slug}`
  const trail = [
    { name: 'Home', path: '/' },
    { name: 'Insights', path: '/blog' },
    { name: 'Series', path: '/blog/series' },
    { name: series.title, path },
  ]
  const jsonLd = [
    breadcrumbSchema(site, trail),
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: series.title,
      description: series.description || undefined,
      url: canonicalUrl(site.siteUrl, path),
      numberOfItems: posts.length,
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      itemListElement: posts.map((p: any, i: number) => ({ '@type': 'ListItem', position: i + 1, url: canonicalUrl(site.siteUrl, `/blog/${p.slug}`), name: p.title })),
    },
  ]

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10 px-5 pb-24 pt-16 md:px-8 md:pt-24">
      <JsonLd data={[...jsonLd, ...(await routeSeoJsonLd(path))]} />
      <header className="flex flex-col gap-4">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <Link href="/blog/series" className="hover:text-foreground hover:underline">
            All series
          </Link>
        </nav>
        <p className="text-sm font-semibold uppercase tracking-wider text-royal">{`Series · ${posts.length} parts`}</p>
        <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-balance md:text-5xl">{series.title}</h1>
        {series.description ? <p className="text-lg leading-relaxed text-muted-foreground text-pretty">{series.description}</p> : null}
      </header>
      <ol className="flex flex-col gap-4">
        {posts.map((p: any, i: number) => (
          <li key={p._id}>
            <Link href={`/blog/${p.slug}`} className="group flex items-start gap-5 rounded-2xl border border-line p-5 hover:bg-muted">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary font-display text-sm font-semibold text-primary-foreground">{i + 1}</span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="font-display text-lg font-semibold text-pretty group-hover:text-royal">{p.title}</span>
                {p.excerpt ? <span className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{p.excerpt}</span> : null}
                <span className="text-xs text-muted-foreground">
                  {formatDate(p.publishedAt || p.publishAt)}
                  {p.readingMinutes ? ` · ${p.readingMinutes} min read` : ''}
                </span>
              </span>
              {p.heroImage ? (
                <span className="relative hidden aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-xl bg-muted sm:block">
                  <SmartImage src={p.heroImage} alt="" sizes="112px" />
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ol>
    </div>
  )
}
