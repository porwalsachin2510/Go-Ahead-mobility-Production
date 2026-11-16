import type { Metadata } from 'next'
import { CareersPage as CareersLandingPage } from '@/components/site/careers-page'
import { JsonLd } from '@/components/site/json-ld'
import { searchJobs, type JobFilters } from '@/lib/server/services/careers'
import { getCareersPageContent, listOpenJobs } from '@/lib/server/services/public'
import { getSeoSettings } from '@/lib/server/services/seo-inventory'
import { breadcrumbSchema } from '@/lib/seo/jsonld'
import { canonicalUrl } from '@/lib/seo/config'
import { applyRouteSeoMetadata, routeSeoJsonLd } from '@/lib/server/services/seo-page'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }
const KEYS = ['q', 'department', 'location', 'type', 'workplace', 'level'] as const

async function readFilters(searchParams: Props['searchParams']): Promise<JobFilters> {
  const sp = await searchParams
  const out: JobFilters = {}
  for (const k of KEYS) {
    const v = sp[k]
    const s = (Array.isArray(v) ? v[0] : v)?.trim().slice(0, 80)
    if (s) out[k] = s
  }
  return out
}

const ALERT_MESSAGES: Record<string, string> = {
  confirmed: 'Your job alert is confirmed. We will email you when matching roles open.',
  unsubscribed: 'You have been unsubscribed from job alerts.',
  invalid: 'That link is invalid or has expired.',
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const [filters, content] = await Promise.all([readFilters(searchParams), getCareersPageContent()])
  const scope = [filters.department, filters.location].filter(Boolean).join(' jobs in ')
  const title = !scope && !filters.q && content?.seoTitle ? content.seoTitle : scope ? `${scope} jobs` : 'Careers & open jobs'
  const description = !filters.q && !scope && content?.seoDescription
    ? content.seoDescription
    : `Explore open ${scope ? `${scope} ` : ''}roles at GoAhead Mobility — corporate transport, fleet operations, engineering and customer roles. Apply online in minutes.`
  const base: Metadata = {
    title,
    description,
    alternates: { canonical: '/careers', types: { 'application/rss+xml': '/careers/feed.xml' } },
    robots: filters.q || content?.seoNoindex ? { index: false, follow: true } : undefined,
    openGraph: { title, description, images: [{ url: content?.ogImage || content?.heroImage || '/images/site/home-hero.png' }] },
  }
  return applyRouteSeoMetadata('/careers', base, { preserveNoindex: Boolean(filters.q) })
}

export default async function CareersPageRoute({ searchParams }: Props) {
  const [filters, sp] = await Promise.all([readFilters(searchParams), searchParams])
  const alert = typeof sp.alert === 'string' ? ALERT_MESSAGES[sp.alert] : undefined
  const [{ jobs, totalOpen, facets }, allJobs, content, { site }] = await Promise.all([
    searchJobs(filters),
    listOpenJobs(),
    getCareersPageContent(),
    getSeoSettings(),
  ])
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: jobs.slice(0, 50).map((job: any, index: number) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: canonicalUrl(site.siteUrl, `/careers/${job.slug}`),
      name: job.title,
    })),
  }

  return (
    <>
      <JsonLd data={[breadcrumbSchema(site, [{ name: 'Home', path: '/' }, { name: 'Careers', path: '/careers' }]), jobs.length ? itemList : null, ...(await routeSeoJsonLd('/careers'))]} />
      <CareersLandingPage content={content} jobs={jobs} allJobs={allJobs} totalOpen={totalOpen} filters={filters} facets={facets} alert={alert} />
    </>
  )
}
