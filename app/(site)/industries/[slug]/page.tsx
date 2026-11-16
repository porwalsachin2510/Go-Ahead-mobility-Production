import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { JsonLd } from '@/components/site/json-ld'
import { IndustryDetailPage } from '@/components/site/industry-detail-page'
import { getIndustry, getSettings, listIndustryCaseStudies, listIndustryLogos, listIndustryTestimonials } from '@/lib/server/services/public'
import { detailJsonLd, detailMetadata, liveHub } from '@/lib/server/services/seo-page'

type Props = { params: Promise<{ slug: string }> }

const bodyOf = (d: any) => [
  d.summary, d.heroTitle, d.heroHighlight, d.heroTitleSuffix, d.overviewTitle, d.context,
  d.solutionsTitle, d.processTitle, d.successStoriesTitle, d.testimonialsTitle, d.finalCtaTitle, d.governance,
  ...(d.heroHighlights ?? []).flatMap((x: any) => [x.label, x.value]),
  ...(d.benefits ?? []).flatMap((x: any) => [x.title, x.body]),
  ...(d.solutions ?? []).flatMap((x: any) => [x.title, x.summary]),
  ...(d.processSteps ?? []).flatMap((x: any) => [x.title, x.body]),
  ...(d.accommodationNeeds ?? []), ...(d.mobilityNeeds ?? []),
].filter(Boolean).join('\n\n')

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const d = await getIndustry(slug)
  if (!d) return { robots: { index: false } }
  return detailMetadata({ kind: 'industry', path: `/industries/${d.slug}`, name: d.title, summary: d.summary, bodyText: bodyOf(d), image: d.image, seo: d.seo })
}

export default async function IndustryPage({ params }: Props) {
  const { slug } = await params
  const industry = await getIndustry(slug)
  if (!industry) notFound()

  const [settings, related, hub, logos, testimonials] = await Promise.all([
    getSettings(),
    listIndustryCaseStudies(industry.slug, 3),
    liveHub([{ name: 'Industries', path: '/industries' }]),
    listIndustryLogos(industry.slug),
    listIndustryTestimonials(industry.slug),
  ])
  const path = `/industries/${industry.slug}`
  const trail = [{ name: 'Home', path: '/' }, ...(hub ? [hub] : [{ name: 'Industries', path: '/industries' }]), { name: industry.title, path }]
  const jsonLd = await detailJsonLd({
    path,
    name: industry.title,
    description: industry.summary,
    modified: industry.updatedAt,
    trail,
    seo: industry.seo,
  })

  return (
    <>
      <JsonLd data={jsonLd} />
      <IndustryDetailPage
        industry={industry}
        trail={trail}
        caseStudies={related}
        settings={settings}
        logos={logos}
        testimonials={testimonials}
      />
    </>
  )
}
