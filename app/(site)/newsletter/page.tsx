import type { Metadata } from 'next'
import { NewsletterPage } from '@/components/site/newsletter-page'
import { JsonLd } from '@/components/site/json-ld'
import { getPublishedPage } from '@/lib/server/services/public'
import { routeSeoJsonLd } from '@/lib/server/services/seo-page'

type Props = { searchParams: Promise<{ status?: string }> }

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPublishedPage('/newsletter')
  const seo = page?.seo ?? {}
  const title = seo.title || 'Business mobility, thoughtfully delivered | GoAhead Mobility'
  const description = seo.description || 'Practical insights on corporate accommodation, employee transportation, operations, safety and industry trends — curated for enterprise teams.'
  const image = seo.ogImage || '/images/site/transport-hero.png'

  return {
    title,
    description,
    alternates: { canonical: seo.canonical || '/newsletter' },
    robots: { index: seo.noindex !== true, follow: seo.nofollow !== true },
    openGraph: { title: seo.ogTitle || title, description: seo.ogDescription || description, images: [{ url: image }] },
  }
}

export default async function NewsletterLandingPage({ searchParams }: Props) {
  const [{ status }, page, structuredData] = await Promise.all([
    searchParams,
    getPublishedPage('/newsletter'),
    routeSeoJsonLd('/newsletter'),
  ])

  return (
    <>
      <JsonLd data={structuredData} />
      <NewsletterPage page={page} status={status} />
    </>
  )
}
