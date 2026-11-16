import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { JsonLd } from '@/components/site/json-ld'
import { CaseStudyDetail } from '@/components/site/case-study-detail'
import { getCaseStudy, getSettings, listCaseStudies } from '@/lib/server/services/public'
import { detailJsonLd, detailMetadata, liveHub } from '@/lib/server/services/seo-page'

type Props = { params: Promise<{ slug: string }> }

const TEXT_FIELDS = [
  'summary', 'challenge', 'approach', 'outcome', 'deliveryModel',
  'overviewBody', 'overviewChallengeIntro', 'overviewApproachIntro', 'overviewImplementationIntro',
  'challengeIntro', 'approachIntro', 'implementationIntro', 'implementationBody',
  'resultsIntro', 'resultsEvidenceIntro', 'testimonialIntro', 'testimonialPerspectiveBody',
  'overviewQuote', 'challengeQuote', 'approachQuote', 'resultsQuote', 'detailTestimonialQuote',
  'disclaimer',
]

const ARRAY_FIELDS = [
  'overviewStats', 'overviewChallengeItems', 'overviewApproachItems', 'overviewImplementationBullets',
  'overviewMetrics', 'galleryItems', 'challengeItems', 'challengeGlanceItems', 'challengeImpactItems',
  'approachSteps', 'approachActions', 'approachEnablers', 'approachWhyItems',
  'implementationPhases', 'implementationRolloutItems', 'implementationHandoverItems', 'implementationPrinciples',
  'resultRows', 'resultsMeasurementSteps', 'resultsEvidenceItems', 'resultsOperationsChanges',
  'testimonialTopics', 'testimonialLinks', 'results',
]

function searchableText(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (Array.isArray(value)) return value.map(searchableText).join(' ')
  if (value && typeof value === 'object') return Object.values(value as Record<string, unknown>).map(searchableText).join(' ')
  return ''
}

const bodyOf = (document: Record<string, any>) => [
  ...TEXT_FIELDS.map((key) => document[key]),
  ...ARRAY_FIELDS.map((key) => document[key]),
].map(searchableText).filter(Boolean).join('\n\n')

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const study = await getCaseStudy(slug)
  if (!study) return { robots: { index: false } }
  return detailMetadata({
    kind: 'case_study',
    path: `/case-studies/${study.slug}`,
    name: study.title,
    summary: study.summary,
    bodyText: bodyOf(study),
    image: study.heroImage || study.image,
    seo: study.seo,
  })
}

export default async function CaseStudyPage({ params }: Props) {
  const { slug } = await params
  const study = await getCaseStudy(slug)
  if (!study) notFound()

  const [settings, hub, allStudies] = await Promise.all([
    getSettings(),
    liveHub([{ name: 'Case studies', path: '/case-studies' }]),
    listCaseStudies(),
  ])
  const path = `/case-studies/${study.slug}`
  const trail = [{ name: 'Home', path: '/' }, ...(hub ? [hub] : []), { name: study.title, path }]
  const jsonLd = await detailJsonLd({
    path,
    name: study.title,
    description: study.summary,
    modified: study.updatedAt,
    trail,
    seo: study.seo,
  })
  const related = allStudies
    .filter((item: any) => item.slug !== study.slug)
    .sort((left: any, right: any) => {
      const leftMatch = Number(left.category === study.category) + Number(left.vertical === study.vertical)
      const rightMatch = Number(right.category === study.category) + Number(right.vertical === study.vertical)
      return rightMatch - leftMatch
    })
    .slice(0, 3)

  return (
    <article>
      <JsonLd data={jsonLd} />
      <CaseStudyDetail
        study={study}
        related={related}
        ctaHref={settings.header?.primaryCtaHref || '/contact'}
        ctaLabel={settings.header?.primaryCtaLabel || 'Request a Proposal'}
      />
    </article>
  )
}
