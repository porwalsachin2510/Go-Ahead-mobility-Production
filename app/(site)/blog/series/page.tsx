import type { Metadata } from 'next'
import Link from 'next/link'
import { EmptyState, PageIntro } from '@/components/site/primitives'
import { listPublicSeries } from '@/lib/server/services/public'
import { JsonLd } from '@/components/site/json-ld'
import { applyRouteSeoMetadata, routeSeoJsonLd } from '@/lib/server/services/seo-page'

export async function generateMetadata(): Promise<Metadata> {
  const base: Metadata = {
    title: 'Guide series',
    description: 'Multi-part guides on corporate accommodation, employee transportation and mobility operations, in reading order.',
    alternates: { canonical: '/blog/series' },
  }
  return applyRouteSeoMetadata('/blog/series', base)
}

export default async function SeriesIndex() {
  const series = await listPublicSeries()
  return (
    <>
      <JsonLd data={await routeSeoJsonLd('/blog/series')} />
      <PageIntro eyebrow="Insights" title="Guide series" intro="Multi-part guides you can read start to finish." />
      <section className="mx-auto max-w-7xl px-5 pb-24 md:px-8">
        {series.length ? (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {series.map((s: any) => (
              <li key={s._id}>
                <Link href={`/blog/series/${s.slug}`} className="flex h-full flex-col gap-3 rounded-2xl border border-line p-6 hover:bg-muted">
                  <span className="text-xs font-semibold uppercase tracking-wider text-royal">{`${s.postCount} parts`}</span>
                  <span className="font-display text-xl font-semibold text-balance">{s.title}</span>
                  {s.description ? <span className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{s.description}</span> : null}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No series yet" body="Multi-part guides will appear here once published." />
        )}
      </section>
    </>
  )
}
