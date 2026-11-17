import type { Metadata } from 'next'
import { notFound, permanentRedirect, redirect } from 'next/navigation'
import { RenderBlocks } from '@/components/blocks/render-blocks'
import { PrivacyPolicyPage } from '@/components/site/privacy-policy-page'
import { TermsConditionsPage } from '@/components/site/terms-conditions-page'
import { MarketingPage } from '@/components/site/marketing-pages'
import { ContactPage } from '@/components/site/contact-page'
import { ResourceCentrePage } from '@/components/site/resource-centre-page'
import { CaseStudiesPage } from '@/components/site/case-studies-page'
import { FaqPage } from '@/components/site/faq-page'
import { OurFootprintPage } from '@/components/site/our-footprint-page'
import { WhyChooseUsPage } from '@/components/site/why-choose-us-page'
import { JsonLd } from '@/components/site/json-ld'
import { entitySchemaNodes } from '@/lib/seo/entity-schema'
import { logNotFound } from '@/lib/server/services/seo-monitor'
import { buildMetadata, resolveEffectiveSeo } from '@/lib/seo/metadata'
import { findRedirect, getPublishedPage, getHomePageContent, listFaqs, listHomePosts, listResources, listProof, listLogos, listLocations, listTeam, listIndustries, listCaseStudies, getSettings, listOfficeLocations, listResourceCentreItems, getResourceCentrePageContent, getAccommodationPageContent, getTransportationPageContent, getAboutPageContent, getFaqPageContent, getFaqPageData, getContactPageContent, getCaseStudiesPageContent, getFootprintPageContent, getWhyChooseUsPageContent } from '@/lib/server/services/public'
import { getSeoSettings } from '@/lib/server/services/seo-inventory'
import { applyRouteSeoMetadata, routeSeoJsonLd } from '@/lib/server/services/seo-page'
import { isDedicatedPublicPath } from '@/lib/seo/route-ownership'

type Props = { params: Promise<{ path?: string[] }>; searchParams?: Promise<{ q?: string; category?: string; all?: string }> }

const toPath = (segments?: string[]) => `/${(segments ?? []).map(decodeURIComponent).join('/')}`

async function generateBaseMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { path } = await params
  const requestedPath = toPath(path)
  if (requestedPath === '/') {
    const [content, { site }] = await Promise.all([getHomePageContent(), getSeoSettings()])
    const title = content.seoTitle || site.defaultTitle
    const description = content.seoDescription || site.defaultDescription
    const image = content.ogImage || site.ogImage
    return {
      title,
      description,
      alternates: { canonical: '/' },
      robots: content.seoNoindex ? { index: false, follow: true } : undefined,
      openGraph: { title, description, images: image ? [{ url: image }] : undefined },
    }
  }
  if (requestedPath === '/about') {
    return {
      alternates: { canonical: '/about-us' },
      robots: { index: false, follow: true },
    }
  }
  const page = await getPublishedPage(requestedPath)
  if (toPath(path) === '/faq') {
    const faq = await getFaqPageContent()
    const queryParams = (await searchParams) ?? {}
    const filtered = Boolean(queryParams.q?.trim() || queryParams.category || queryParams.all === '1')
    const title = faq?.seoTitle || 'FAQs | GoAhead Mobility'
    const description = faq?.seoDescription || 'Find answers to common questions about GoAhead Mobility services, booking, safety, technology, billing and partnerships.'
    return {
      title,
      description,
      alternates: { canonical: '/faq' },
      robots: faq?.seoNoindex || filtered ? { index: false, follow: true } : undefined,
      openGraph: { title, description, images: [{ url: faq?.ogImage || faq?.heroImage || '/images/site/transport-hero.png' }] },
    }
  }
  if (toPath(path) === '/contact') {
    const contact = await getContactPageContent()
    const title = contact?.seoTitle || 'Contact GoAhead Mobility | Let’s Move Forward Together'
    const description = contact?.seoDescription || 'Talk to GoAhead Mobility about corporate accommodation, employee transportation and mobility solutions. Send your enquiry or connect with our team.'
    return {
      title,
      description,
      alternates: { canonical: '/contact' },
      robots: contact?.seoNoindex ? { index: false, follow: true } : undefined,
      openGraph: { title, description, images: [{ url: contact?.ogImage || contact?.heroImage || '/images/site/transport-hero.png' }] },
    }
  }
  if (requestedPath === '/our-footprint') {
    const [content, { site }] = await Promise.all([getFootprintPageContent(), getSeoSettings()])
    const seo = content.seo ?? {}
    const title = seo.title || 'Our Footprint Across India | GoAhead Mobility'
    const description = seo.description || 'Explore GoAhead Mobility’s transportation network across India, including city coverage, regional presence and operational reach.'
    const image = seo.ogImage || content.heroImage || site.ogImage
    return {
      title,
      description,
      alternates: { canonical: seo.canonical || '/our-footprint' },
      robots: seo.noindex ? { index: false, follow: !seo.nofollow } : seo.nofollow ? { index: true, follow: false } : undefined,
      openGraph: {
        title: seo.ogTitle || title,
        description: seo.ogDescription || description,
        images: image ? [{ url: image, alt: content.heroImageAlt || 'GoAhead Mobility network across India' }] : undefined,
      },
    }
  }
  if (requestedPath === '/global-accommodation') {
    const [content, { site }] = await Promise.all([getAccommodationPageContent(), getSeoSettings()])
    const seo = content.seo ?? {}
    const title = seo.title || 'Global Accommodation | GoAhead Mobility'
    const description = seo.description || 'Accommodation options for business travel, extended assignments and project teams, coordinated around your requirements.'
    const image = seo.ogImage || content.heroImage || site.ogImage
    return {
      title,
      description,
      alternates: { canonical: seo.canonical || '/global-accommodation' },
      robots: seo.noindex ? { index: false, follow: !seo.nofollow } : seo.nofollow ? { index: true, follow: false } : undefined,
      openGraph: {
        title: seo.ogTitle || title,
        description: seo.ogDescription || description,
        images: image ? [{ url: image, alt: content.heroImageAlt || 'Global business accommodation' }] : undefined,
      },
    }
  }
  if (requestedPath === '/local-transportation') {
    const [content, { site }] = await Promise.all([getTransportationPageContent(), getSeoSettings()])
    const seo = content.seo ?? {}
    const title = seo.title || 'Local Transportation | GoAhead Mobility'
    const description = seo.description || 'Safe, punctual and comfortable transportation solutions for businesses, employees and teams across cities.'
    const image = seo.ogImage || content.heroImage || site.ogImage
    return {
      title,
      description,
      alternates: { canonical: seo.canonical || '/local-transportation' },
      robots: seo.noindex ? { index: false, follow: !seo.nofollow } : seo.nofollow ? { index: true, follow: false } : undefined,
      openGraph: {
        title: seo.ogTitle || title,
        description: seo.ogDescription || description,
        images: image ? [{ url: image, alt: content.heroImageAlt || 'Corporate transportation service' }] : undefined,
      },
    }
  }
  if (requestedPath === '/company/why-choose-us') {
    const content = await getWhyChooseUsPageContent()
    const title = content.seoTitle || 'Why Choose GoAhead Mobility | A Coordinated Mobility Partner'
    const description = content.seoDescription || 'Discover how GoAhead Mobility coordinates accommodation and local transportation with clear governance, verified coverage and accountable service.'
    return {
      title,
      description,
      alternates: { canonical: '/company/why-choose-us' },
      robots: content.seoNoindex ? { index: false, follow: true } : undefined,
      openGraph: {
        title,
        description,
        images: [{ url: content.ogImage || content.heroImage || '/images/site/transport-hero.png', alt: content.heroImageAlt || 'GoAhead Mobility business transport campus' }],
      },
    }
  }
  if (requestedPath === '/about-us' || requestedPath === '/company/about-us') {
    const about = await getAboutPageContent()
    const title = about?.seoTitle || 'About GoAhead Mobility | Moving Businesses Forward, Together'
    const description = about?.seoDescription || 'Discover the people, values, milestones and trusted partnerships behind GoAhead Mobility’s connected corporate accommodation and transportation services.'
    return {
      title,
      description,
      alternates: { canonical: '/about-us' },
      robots: about?.seoNoindex ? { index: false, follow: true } : undefined,
      openGraph: {
        title,
        description,
        images: [{ url: about?.ogImage || about?.heroImage || '/images/site/about-hero.png', alt: about?.heroImageAlt || 'GoAhead Mobility connected business travel' }],
      },
    }
  }
  if (toPath(path) === '/case-studies') {
    const content = await getCaseStudiesPageContent()
    const title = content?.seoTitle || 'Case Studies | Real Challenges. Proven Impact. | GoAhead Mobility'
    const description = content?.seoDescription || 'Explore how organisations partner with GoAhead Mobility to solve complex transportation challenges and deliver measurable, sustainable results.'
    return { title, description, alternates: { canonical: '/case-studies' }, robots: content?.seoNoindex ? { index: false, follow: true } : undefined, openGraph: { title, description, images: [{ url: content?.ogImage || content?.heroImage || '/images/site/home-hero.png' }] } }
  }
  if (toPath(path) === '/resources' || toPath(path) === '/learn') {
    const content = await getResourceCentrePageContent()
    const title = content?.seoTitle || 'Resource Centre | Mobility Guides, Reports & Case Studies | GoAhead Mobility'
    const description = content?.seoDescription || 'Explore practical guides, whitepapers, case studies, templates and insights for smarter corporate transportation and mobility operations.'
    return { title, description, alternates: { canonical: '/resources' }, robots: content?.seoNoindex ? { index: false, follow: true } : undefined, openGraph: { title, description, images: [{ url: content?.ogImage || content?.heroImage || '/images/site/home-hero.png' }] } }
  }
  if (!page) return { robots: { index: false } }
  const seo = page.seo ?? {}
  const { site } = await getSeoSettings()
  const summary = firstSummary(page.blocks)
  const kind = page.pageType === 'industry' ? 'industry' : page.pageType === 'case_study' ? 'case_study' : 'page'
  const eff = resolveEffectiveSeo(kind, site, { name: page.title, summary, explicitTitle: seo.title, explicitDescription: seo.description })
  return buildMetadata({
    site,
    path: page.path,
    title: page.pageType === 'home' && !seo.title ? site.defaultTitle : eff.title,
    description: eff.description,
    canonical: seo.canonical,
    noindex: seo.noindex,
    nofollow: seo.nofollow,
    ogTitle: seo.ogTitle,
    ogDescription: seo.ogDescription,
    ogImage: seo.ogImage || firstImage(page.blocks),
  })
}


export async function generateMetadata(props: Props): Promise<Metadata> {
  const [routeParams, search] = await Promise.all([
    props.params,
    props.searchParams ?? Promise.resolve({} as { q?: string; category?: string; all?: string }),
  ])
  const requestedPath = toPath(routeParams.path)
  const base = await generateBaseMetadata(props)
  if (!isDedicatedPublicPath(requestedPath)) return base
  const canonicalPath = requestedPath === '/company/about-us' ? '/about-us' : requestedPath === '/learn' ? '/resources' : requestedPath
  const preserveNoindex = requestedPath === '/faq'
    && Boolean(search.q?.trim() || search.category || search.all === '1')
  return applyRouteSeoMetadata(canonicalPath, base, { preserveNoindex })
}

function firstSummary(blocks: any[] = []): string {
  for (const b of blocks) {
    if (b?.hidden) continue
    const d = b?.data ?? {}
    const t = d.subtitle || d.intro || (typeof d.body === 'string' ? d.body : '')
    if (typeof t === 'string' && t.trim()) return t
  }
  return ''
}

function firstImage(blocks: any[] = []): string {
  for (const b of blocks) if (!b?.hidden && typeof b?.data?.image === 'string' && b.data.image) return b.data.image
  return ''
}

async function CmsPageContent({ params, searchParams }: Props) {
  const { path } = await params
  const fullPath = toPath(path)
  // Keep old bookmarks and inbound links, but serve the redesigned canonical About Us page.
  if (fullPath === '/about') {
    let legacyRedirect: { targetUrl: string; statusCode: number } | null = null
    try {
      legacyRedirect = await findRedirect(fullPath)
    } catch (error) {
      console.error('[route] could not read the legacy About Us redirect; using the canonical fallback', error)
    }
    if (legacyRedirect?.statusCode === 302 && legacyRedirect.targetUrl) redirect(legacyRedirect.targetUrl)
    if (legacyRedirect?.statusCode === 301 && legacyRedirect.targetUrl) permanentRedirect(legacyRedirect.targetUrl)
    permanentRedirect('/about-us')
  }
  const queryParams = (await searchParams) ?? {}
  const redesignedPaths = new Set(['/', '/company/why-choose-us', '/our-footprint', '/global-accommodation', '/local-transportation', '/about-us', '/company/about-us', '/industries', '/case-studies', '/contact', '/resources', '/learn', '/faq'])
  if (redesignedPaths.has(fullPath)) {
    if (fullPath === '/') {
      const [page, faqs, posts, resources, content] = await Promise.all([
        getPublishedPage(fullPath),
        listFaqs({ limit: 100 }),
        listHomePosts(6),
        listResources({ limit: 6 }),
        getHomePageContent(),
      ])
      return <MarketingPage path={fullPath} cmsPage={page} homeData={{ faqs, posts, resources, content }} />
    }
    if (fullPath === '/company/why-choose-us') {
      const content = await getWhyChooseUsPageContent()
      return <WhyChooseUsPage content={content} />
    }
    if (fullPath === '/our-footprint') {
      const [content, settings] = await Promise.all([getFootprintPageContent(), getSettings()])
      return <OurFootprintPage content={content} contact={settings.contact} />
    }
    if (fullPath === '/global-accommodation') {
      const [page, faqs, posts, resources, content] = await Promise.all([
        getPublishedPage(fullPath),
        listFaqs({ vertical: 'accommodation', limit: 40 }),
        listHomePosts(3, 'accommodation'),
        listResources({ vertical: 'accommodation', limit: 3 }),
        getAccommodationPageContent(),
      ])
      return <MarketingPage path={fullPath} cmsPage={page} accommodationData={{ faqs, posts, resources, content }} />
    }
    if (fullPath === '/local-transportation') {
      const [content, proof, logos, settings] = await Promise.all([
        getTransportationPageContent(),
        listProof('transport'),
        listLogos(),
        getSettings(),
      ])
      return <MarketingPage path={fullPath} transportationData={{ content, proof, logos, contact: settings.contact }} />
    }
    if (fullPath === '/faq') {
      const query = typeof queryParams.q === 'string' ? queryParams.q.trim().slice(0, 100) : ''
      const category = typeof queryParams.category === 'string' ? queryParams.category.trim().slice(0, 80) : ''
      const showAll = queryParams.all === '1' || Boolean(query) || Boolean(category)
      const [content, settings] = await Promise.all([getFaqPageContent(), getSettings()])
      const topicCategories = (content?.topics ?? [
        { category: 'services-solutions' }, { category: 'booking-operations' }, { category: 'safety-compliance' },
        { category: 'technology-platform' }, { category: 'billing-payments' }, { category: 'partnerships' },
      ]).map((item: any) => String(item.category || '')).filter(Boolean)
      const questions = await getFaqPageData({
        q: query || undefined,
        category: category || undefined,
        topicCategories,
        limit: showAll ? 200 : Math.min(30, Math.max(1, Number(content?.questionsPerPage) || 7)),
      })
      const structuredData = !query && !category && !showAll ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: questions.items.map((item: any) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      } : null
      return <>
        <JsonLd data={structuredData} />
        <FaqPage content={content} questions={questions.items} total={questions.total} topicCounts={questions.topicCounts} query={query || undefined} category={category || undefined} showAll={showAll} contact={settings.contact} />
      </>
    }
    if (fullPath === '/case-studies') {
      const [content, caseStudies, industries, proof] = await Promise.all([getCaseStudiesPageContent(), listCaseStudies(), listIndustries(100), listProof()])
      const testimonial = proof.testimonials?.[0]
      return <CaseStudiesPage content={content} caseStudies={caseStudies} industries={industries.map((item: any) => ({ slug: item.slug, title: item.title }))} testimonial={testimonial ? { quote: testimonial.quote, personName: testimonial.personName, personTitle: testimonial.personTitle, company: testimonial.company } : null} />
    }
    if (fullPath === '/resources' || fullPath === '/learn') {
      const [resources, faqs, content] = await Promise.all([
        listResourceCentreItems({ limit: 100 }),
        listFaqs({ path: '/resources', limit: 6 }),
        getResourceCentrePageContent(),
      ])
      return <ResourceCentrePage resources={resources} faqs={faqs.map((item: any, index: number) => ({ _id: String(item._id || 'resource-faq-' + index), question: item.question, answer: item.answer }))} content={content} />
    }
    if (fullPath === '/contact') {
      const [offices, locations, settings, content] = await Promise.all([
        listOfficeLocations(),
        listLocations(),
        getSettings(),
        getContactPageContent(),
      ])
      const faqs = await listFaqs({
        path: '/contact',
        category: content?.faqCategory || undefined,
        limit: Math.max(1, Math.min(12, Number(content?.faqLimit) || 6)),
      })
      return <ContactPage offices={offices} locations={locations.map((location: any) => location.city).filter(Boolean)} faqs={faqs} contact={settings.contact} social={settings.social} content={content} />
    }
    if (fullPath === '/industries') {
      const [page, industries, caseStudies, logos, settings] = await Promise.all([
        getPublishedPage(fullPath),
        listIndustries(16),
        listCaseStudies(),
        listLogos(),
        getSettings(),
      ])
      return <MarketingPage path={fullPath} cmsPage={page} industriesData={{ industries, caseStudies, logos, contact: settings.contact }} />
    }
    if (fullPath === '/about-us' || fullPath === '/company/about-us') {
      const [page, team, logos, proof, settings, content] = await Promise.all([
        getPublishedPage(fullPath),
        listTeam(),
        listLogos(),
        listProof(),
        getSettings(),
        getAboutPageContent(),
      ])
      return <MarketingPage path={fullPath} cmsPage={page} aboutData={{ team, logos, proof, contact: settings.contact, content }} />
    }
    const page = await getPublishedPage(fullPath)
    return <MarketingPage path={fullPath} cmsPage={page} />
  }
  const page = await getPublishedPage(fullPath)
  if (!page) {
    const rule = await findRedirect(fullPath)
    if (rule?.statusCode === 301 && rule.targetUrl) permanentRedirect(rule.targetUrl)
    if (rule?.statusCode === 302 && rule.targetUrl) redirect(rule.targetUrl)
    await logNotFound(fullPath)
    notFound()
  }
  if (fullPath === '/privacy') return <PrivacyPolicyPage page={page} />
  if (fullPath === '/terms') return <TermsConditionsPage page={page} />
  const { site } = await getSeoSettings()
  return (
    <>
      <JsonLd data={entitySchemaNodes(site, page.path, page.seo)} />
      <RenderBlocks blocks={page.blocks} />
    </>
  )
}

export default async function CmsPage(props: Props) {
  const { path } = await props.params
  const requestedPath = toPath(path)
  const canonicalPath = requestedPath === '/company/about-us' ? '/about-us' : requestedPath === '/learn' ? '/resources' : requestedPath
  const structuredData = isDedicatedPublicPath(requestedPath) ? await routeSeoJsonLd(canonicalPath) : []
  return (
    <>
      <JsonLd data={structuredData} />
      <CmsPageContent {...props} />
    </>
  )
}
