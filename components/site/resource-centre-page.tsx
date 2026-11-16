'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowDownToLine, ArrowRight, BookOpen, ChartNoAxesCombined, ClipboardList, FileText, FileVideo, Lightbulb, Search, ShieldCheck, Sparkles, Newspaper, Users, X } from 'lucide-react'
import { Parallax } from '@/components/motion/gsap-effects'
import { Reveal } from '@/components/motion/reveal'
import { FaqAccordion, type FaqItem } from '@/components/motion/faq-accordion'
import { NewsletterForm } from '@/components/site/newsletter-form'

type Resource = {
  _id?: string
  slug: string
  title: string
  summary?: string
  resourceType?: string
  category?: string
  tags?: string[]
  fileFormat?: string
  fileSizeLabel?: string
  image?: string
  featured?: boolean
  gated?: boolean
  downloadCount?: number
  publishedAt?: string
  updatedAt?: string
  fileMediaId?: string | null
  externalUrl?: string
  href?: string
}

type ResourceCentreContent = {
  [key: string]: any
  categories?: { slug: string; title: string; description?: string; icon?: string; visible?: boolean; sortOrder?: number }[]
  heroFeatures?: { icon?: string; title: string; body?: string }[]
  requestFeatures?: { icon?: string; title: string; body?: string }[]
}
type Props = { resources: Resource[]; faqs: FaqItem[]; content?: ResourceCentreContent | null }

const fallbackCategories = [
  { slug: 'guides-playbooks', title: 'Guides & Playbooks', description: 'Step-by-step guides and best practices.', icon: 'clipboard-list' },
  { slug: 'whitepapers', title: 'Whitepapers', description: 'In-depth research and industry reports.', icon: 'file-text' },
  { slug: 'case-studies', title: 'Case Studies', description: 'Real success stories from our customers.', icon: 'newspaper' },
  { slug: 'templates', title: 'Templates', description: 'Ready-to-use templates and checklists.', icon: 'clipboard-list' },
  { slug: 'reports-insights', title: 'Reports & Insights', description: 'Market trends and industry intelligence.', icon: 'chart-no-axes-combined' },
  { slug: 'videos-webinars', title: 'Videos & Webinars', description: 'On-demand sessions and expert talks.', icon: 'file-video' },
] as const
const iconMap: Record<string, any> = {
  'book-open': BookOpen, 'clipboard-list': ClipboardList, 'file-text': FileText,
  newspaper: Newspaper, 'chart-no-axes-combined': ChartNoAxesCombined, 'file-video': FileVideo,
  'shield-check': ShieldCheck, lightbulb: Lightbulb, sparkles: Sparkles, users: Users,
}

const fallbackFaqs: FaqItem[] = [
  { _id: 'resource-faq-1', question: 'Are these resources free to access?', answer: 'Most resources are available without charge. If a resource requires additional details, its page will explain the request process before you continue.' },
  { _id: 'resource-faq-2', question: 'How often are new resources added?', answer: 'We publish new guides, case studies and practical insights as they are reviewed and approved by our team.' },
  { _id: 'resource-faq-3', question: 'Do I need to create an account to download?', answer: 'No account is required for resources marked as open access. Some gated resources may ask you to contact our team.' },
  { _id: 'resource-faq-4', question: 'Can I request a custom report or guide?', answer: 'Yes. Tell us what your team is researching and we can discuss a tailored resource or consultation.' },
  { _id: 'resource-faq-5', question: 'Can I share these resources with my team?', answer: 'You can share public resource links with colleagues. Please retain any attribution and usage notes included with a resource.' },
  { _id: 'resource-faq-6', question: 'Do you offer training or webinars?', answer: 'We can discuss training and knowledge sessions based on your team’s mobility and operational requirements.' },
]

const TYPE_LABELS: Record<string, string> = { whitepaper: 'White Paper', case_study: 'Case study', checklist: 'Checklist', webinar: 'Webinar', template: 'Template', article: 'Insight', tool: 'Report', event: 'Event', guide: 'Guide' }
const typeLabel = (type?: string) => TYPE_LABELS[type || ''] || 'Resource'
const dateLabel = (value?: string) => {
  if (!value) return 'Recently added'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Recently added' : new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}
const imageFor = (resource: Resource, index: number) => resource.image || ['/images/site/transport-hero.png', '/images/site/ind-it.png', '/images/site/planning.png', '/images/site/svc-saas.png'][index % 4]

export function ResourceCentrePage({ resources: initialResources, faqs, content }: Props) {
  const page = {
    heroEyebrow: 'Resource Center', heroTitle: 'Knowledge that', heroHighlight: 'Moves You Forward',
    heroDescription: 'Explore our libraries of guides, whitepapers, case studies, templates and tools to help your business build smarter, safer and more efficient transportation.',
    heroImage: '/images/site/home-hero.png', heroImageAlt: 'GoAhead Mobility transport fleet and city skyline',
    searchPlaceholder: 'Search resources by topic, keyword or file type...',
    categoriesEyebrow: 'Explore the library', categoriesTitle: 'Browse by Category', categoriesLinkLabel: 'View All Categories',
    featuredEyebrow: 'Hand-picked knowledge', featuredTitle: 'Featured Resources', featuredLinkLabel: 'View All Resources',
    downloadsEyebrow: 'Ready to use', downloadsTitle: 'Popular Downloads', downloadsLinkLabel: 'Explore All Downloads',
    requestEyebrow: 'Tailored knowledge', requestTitle: 'Need Something Specific?',
    requestBody: 'Can’t find what you’re looking for? Our team can help you with customized resources tailored to your needs.',
    requestImage: '/images/site/ind-it.png', requestImageAlt: 'GoAhead Mobility resource guide',
    requestButtonLabel: 'Request a Resource', requestButtonHref: '/contact?topic=resource',
    faqEyebrow: 'Questions', faqTitle: 'Frequently Asked Questions',
    newsletterEyebrow: 'Stay informed', newsletterTitle: 'Stay Ahead with the Latest Mobility Insights',
    newsletterBody: 'Subscribe to our newsletter and get the latest resources, industry updates and expert insights delivered to your inbox.',
    newsletterBackgroundImage: '/images/site/transport-hero.png',
    ...(content ?? {}),
  }
  const visibleCategories = (page.categories?.length ? page.categories : fallbackCategories).filter((item: any) => item.visible !== false).sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  const [resources, setResources] = useState(initialResources)
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [fileType, setFileType] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setLoading(true)
      setError('')
      const params = new URLSearchParams()
      if (search.trim()) params.set('q', search.trim())
      if (activeCategory !== 'all') params.set('category', activeCategory)
      if (fileType) params.set('fileType', fileType)
      try {
        const response = await fetch('/api/v1/resources?' + params.toString(), { signal: controller.signal, headers: { Accept: 'application/json' } })
        const payload = await response.json()
        if (!response.ok || !payload.ok) throw new Error(payload.error?.message || 'Unable to search resources right now.')
        setResources(payload.data)
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Unable to search resources right now.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 220)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [search, activeCategory, fileType])

  const featured = useMemo(() => {
    const selected = resources.filter((resource) => resource.featured)
    const combined = [...selected, ...resources.filter((resource) => !selected.some((item) => item.slug === resource.slug))]
    return combined.slice(0, 4)
  }, [resources])
  const popular = useMemo(() => resources.filter((resource) => resource.fileMediaId || resource.externalUrl).slice(0, 5), [resources])
  const fileTypes = useMemo(() => Array.from(new Set(initialResources.map((resource) => resource.fileFormat?.trim().toUpperCase()).filter(Boolean))).sort() as string[], [initialResources])
  const categoryCounts = useMemo(() => {
    const count = (id: string) => id === 'all' ? initialResources.length : initialResources.filter((resource) => {
      const type = resource.resourceType || ''
      const category = (resource.category || '').toLowerCase()
      const tags = (resource.tags || []).join(' ').toLowerCase()
      if (id === 'guides-playbooks') return ['guide', 'checklist'].includes(type) || /guide|playbook/.test(category + tags)
      if (id === 'whitepapers') return type === 'whitepaper' || /white.?paper/.test(category + tags)
      if (id === 'case-studies') return type === 'case_study' || /case study/.test(category)
      if (id === 'templates') return type === 'template' || /template/.test(category + tags)
      if (id === 'reports-insights') return ['article', 'tool'].includes(type) || /report|insight/.test(category + tags)
      if (id === 'videos-webinars') return type === 'webinar' || /video|webinar/.test(category + tags)
      const term = id.replace(/-/g, ' ').replace(/\s+/g, ' ').trim()
      return category.includes(term) || tags.includes(term)
    }).length
    return Object.fromEntries(visibleCategories.map((category: any) => [category.slug, count(category.slug)]))
  }, [initialResources, visibleCategories])

  const faqItems = faqs.length ? faqs.slice(0, 6) : fallbackFaqs
  const motionProps = reducedMotion ? {} : { initial: { opacity: 0, y: 18 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.12 }, transition: { duration: 0.55, ease: 'easeOut' as const } }

  return (
    <div data-page="resource-centre" className="bg-white text-[#101d42]">
      {page.showHero !== false && <section className="relative isolate min-h-[440px] overflow-hidden bg-[#030d25] text-white sm:min-h-[500px]">
        <div className="absolute inset-0">
          <Parallax amount={5} className="absolute inset-0">
            <Image src={page.heroImage || '/images/site/home-hero.png'} alt={page.heroImageAlt || ''} fill priority sizes="100vw" className="object-cover object-[60%_center] opacity-75" />
          </Parallax>
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#020a1d_0%,rgba(2,10,29,.94)_33%,rgba(2,10,29,.46)_68%,rgba(2,10,29,.22)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(2,10,29,.75),transparent_52%)]" />
        <div className="relative mx-auto max-w-[1240px] px-6 pb-12 pt-14 lg:px-10 lg:pb-16 lg:pt-20">
          <Reveal className="max-w-[650px]">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[.22em] text-[#13c4f4]">{page.heroEyebrow}</p>
            <h1 className="text-balance text-[clamp(2.5rem,5.4vw,4.5rem)] font-semibold leading-[1.02] tracking-[-.05em]">{page.heroTitle} <span className="block text-[#09aaf2]">{page.heroHighlight}</span></h1>
            <p className="mt-4 max-w-[500px] text-sm leading-relaxed text-white/75 sm:text-[15px]">{page.heroDescription}</p>
          </Reveal>
          <form className="mt-6 flex max-w-[570px] items-center gap-3 rounded-lg border border-white/25 bg-[#061630]/75 p-1.5 shadow-xl backdrop-blur-md" onSubmit={(event) => event.preventDefault()} role="search">
            <label htmlFor="resource-search" className="sr-only">Search resources by topic, keyword or file type</label>
            <input id="resource-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={page.searchPlaceholder} className="min-w-0 flex-1 bg-transparent px-3 py-2 text-xs text-white outline-none placeholder:text-white/45 focus-visible:ring-2 focus-visible:ring-[#12b8f4]" />
            {search ? <button type="button" onClick={() => setSearch('')} aria-label="Clear search" className="rounded p-2 text-white/70 hover:text-white"><X className="size-4" /></button> : <Search className="mr-2 size-5 text-white/75" aria-hidden />}
          </form>
          <div className="mt-7 grid max-w-[850px] grid-cols-2 gap-4 sm:grid-cols-4">
            {(page.heroFeatures?.length ? page.heroFeatures : [
              { icon: 'shield-check', title: 'Curated by Experts', body: 'Industry insights you can trust' },
              { icon: 'lightbulb', title: 'Practical & Actionable', body: 'Tools you can use right away' },
              { icon: 'sparkles', title: 'Always Updated', body: 'Latest trends and innovations' },
              { icon: 'clipboard-list', title: 'For Every Need', body: 'Guides, templates & more' },
            ]).map((feature: any, index: number) => {
              const Icon = iconMap[feature.icon || ''] || ShieldCheck
              return <Reveal key={feature.title} delay={index * 65} className="flex items-start gap-3"><Icon className="mt-0.5 size-6 shrink-0 text-[#08b5f4]" aria-hidden /><span><strong className="block text-[10px]">{feature.title}</strong><span className="mt-1 block text-[9px] leading-relaxed text-white/65">{feature.body}</span></span></Reveal>
            })}
          </div>
        </div>
      </section>}

      {page.showCategories !== false && <section className="mx-auto max-w-[1240px] px-6 py-8 lg:px-10 lg:py-10">
        <div className="mb-5 flex items-end justify-between gap-4"><div><p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#1684cf]">{page.categoriesEyebrow}</p><h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">{page.categoriesTitle}</h2></div><a href="#featured-resources" className="hidden items-center gap-2 text-xs font-semibold text-[#0877c9] sm:inline-flex">{page.categoriesLinkLabel} <ArrowRight className="size-4" /></a></div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {visibleCategories.map((category: any, index: number) => {
            const Icon = iconMap[category.icon || ''] || BookOpen
            const selected = activeCategory === category.slug
            return <motion.button key={category.slug} type="button" onClick={() => setActiveCategory(selected ? 'all' : category.slug)} whileHover={reducedMotion ? undefined : { y: -4 }} whileTap={reducedMotion ? undefined : { scale: .98 }} className={`group flex min-h-[154px] flex-col items-center rounded-xl border p-4 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087fe0] ${selected ? 'border-[#168ce5] bg-[#eff7ff]' : 'border-[#e5eaf1] bg-white hover:border-[#a9d7fa] hover:shadow-lg'}`}>
              <span className="flex size-12 items-center justify-center rounded-full bg-[#edf5ff] text-[#147fe0] transition-transform duration-300 group-hover:scale-105"><Icon className="size-5" aria-hidden /></span>
              <strong className="mt-3 text-[11px]">{category.title}</strong>
              <span className="mt-1.5 min-h-8 text-[9px] leading-relaxed text-[#66718a]">{category.description}</span>
              <span className="mt-2 text-[9px] font-semibold text-[#1479c8]">{categoryCounts[category.slug] || 0} Resources</span>
            </motion.button>
          })}
        </div>
      </section>}

      {page.showFeatured !== false && <section id="featured-resources" className="mx-auto max-w-[1240px] scroll-mt-24 px-6 pb-9 lg:px-10">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#1684cf]">{page.featuredEyebrow}</p><h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">{page.featuredTitle}</h2></div><div className="flex items-center gap-3"><Link href="#popular-downloads" className="hidden items-center gap-1 text-[10px] font-semibold text-[#0877c9] sm:inline-flex">{page.featuredLinkLabel} <ArrowRight className="size-3" /></Link><label className="sr-only" htmlFor="resource-file-type">Filter by file type</label><select id="resource-file-type" value={fileType} onChange={(event) => setFileType(event.target.value)} className="rounded-lg border border-[#dfe6f0] bg-white px-3 py-2 text-[10px] text-[#42516d] outline-none focus-visible:ring-2 focus-visible:ring-[#087fe0]"><option value="">All file types</option>{fileTypes.map((format) => <option key={format} value={format}>{format}</option>)}</select><span className="text-[10px] text-[#66718a]" aria-live="polite">{loading ? 'Searching…' : `${resources.length} resources found`}</span></div></div>
        {error ? <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        {featured.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((resource, index) => <motion.article key={resource._id || resource.slug} {...motionProps} transition={reducedMotion ? undefined : { duration: .5, delay: index * .07 }} className="group overflow-hidden rounded-xl border border-[#e5eaf1] bg-white shadow-[0_6px_24px_-20px_rgba(8,25,60,.5)] transition-shadow hover:shadow-xl">
            <Link href={resource.href || `/resources/${resource.slug}`} className="block">
              <div className="relative aspect-[1.5] overflow-hidden bg-[#061630]"><Image src={imageFor(resource, index)} alt={resource.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-cover transition-transform duration-700 group-hover:scale-105" /><span className="absolute left-3 top-3 rounded bg-white px-2 py-1 text-[8px] font-bold uppercase tracking-wide text-[#0878c8]">{typeLabel(resource.resourceType)}</span></div>
              <div className="flex min-h-[158px] flex-col p-3.5"><h3 className="text-[12px] font-bold leading-snug text-[#14234b]">{resource.title}</h3><p className="mt-2 line-clamp-3 text-[10px] leading-relaxed text-[#65718a]">{resource.summary || 'Practical knowledge to help your team plan and manage mobility with confidence.'}</p></div>
            </Link>
            <div className="flex items-center justify-between border-t border-[#edf0f5] px-3.5 py-3 text-[9px] text-[#69748a]"><span>{dateLabel(resource.publishedAt || resource.updatedAt)} <span className="px-1">·</span> {resource.fileFormat || typeLabel(resource.resourceType)}</span>{resource.gated ? <Link href={resource.href || `/resources/${resource.slug}`} className="text-[9px] font-semibold text-[#0878c8]">Request access</Link> : resource.fileMediaId || resource.externalUrl ? <Link href={`/api/v1/resources/${resource.slug}/download`} aria-label={`Download ${resource.title}`} className="rounded p-1.5 text-[#17294f] transition-colors hover:bg-[#edf5ff] hover:text-[#0878c8]"><ArrowDownToLine className="size-4" /></Link> : <Link href={resource.href || `/resources/${resource.slug}`} aria-label={`View ${resource.title}`} className="rounded p-1.5 text-[#17294f] hover:bg-[#edf5ff]"><ArrowRight className="size-4" /></Link>}</div>
          </motion.article>)}
        </div> : <div className="rounded-xl border border-dashed border-[#d6dfeb] py-12 text-center"><Search className="mx-auto size-7 text-[#9aa8bd]" /><p className="mt-3 text-sm font-semibold">No resources match your search</p><p className="mt-1 text-xs text-[#66718a]">Try another keyword or clear the selected category.</p><button type="button" onClick={() => { setSearch(''); setActiveCategory('all'); setFileType('') }} className="mt-4 rounded-full bg-[#087fe0] px-4 py-2 text-xs font-semibold text-white">Clear filters</button></div>}
      </section>}

      {(page.showDownloads !== false || page.showRequest !== false) && <section id="popular-downloads" className="mx-auto grid max-w-[1240px] gap-6 px-6 pb-10 lg:grid-cols-[.9fr_1.1fr] lg:px-10">
        {page.showDownloads !== false && <div>
          <div className="mb-4"><p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#1684cf]">{page.downloadsEyebrow}</p><h2 className="mt-1 text-xl font-semibold tracking-tight">{page.downloadsTitle}</h2></div>
          <div className="overflow-hidden rounded-xl border border-[#e5eaf1] bg-white">
            {popular.length ? popular.map((resource, index) => <div key={resource.slug} className="flex items-center gap-3 border-b border-[#edf0f5] px-3 py-3 last:border-0"><span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${index % 2 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}><FileText className="size-4" /></span><span className="min-w-0 flex-1"><strong className="block truncate text-[10px] font-semibold">{resource.title}</strong><span className="mt-0.5 block text-[9px] uppercase text-[#758198]">{resource.fileFormat || typeLabel(resource.resourceType)}{resource.fileSizeLabel ? ` · ${resource.fileSizeLabel}` : ''}</span></span>{resource.gated ? <Link href={`/resources/${resource.slug}`} className="text-[9px] font-semibold text-[#0878c8]">Details</Link> : <Link href={`/api/v1/resources/${resource.slug}/download`} aria-label={`Download ${resource.title}`} className="rounded p-2 text-[#1a2b4d] hover:bg-[#edf5ff]"><ArrowDownToLine className="size-4" /></Link>}</div>) : <p className="p-4 text-xs text-[#66718a]">Downloadable resources will appear here when published.</p>}
          </div>
          <Link href="#featured-resources" className="mt-4 inline-flex items-center gap-2 text-[11px] font-bold text-[#0878c8]">{page.downloadsLinkLabel} <ArrowRight className="size-3.5" /></Link>
        </div>}
        {page.showRequest !== false && <Reveal className="relative isolate flex min-h-[300px] items-center overflow-hidden rounded-2xl bg-[#f0f5ff] p-6 sm:p-8">
          <div className="absolute -right-10 -top-12 size-64 rounded-full bg-[#dcecff] blur-3xl" />
          <div className="relative z-10 max-w-[430px]">
            <p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#1684cf]">{page.requestEyebrow}</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#12204a]">{page.requestTitle}</h2>
            <p className="mt-2 max-w-sm text-[11px] leading-relaxed text-[#5f6b86]">{page.requestBody}</p>
            <div className="mt-5 space-y-4">
              {(page.requestFeatures?.length ? page.requestFeatures : [{ icon: 'shield-check', title: 'Custom Research', body: 'Tailored reports and insights for your business.' }, { icon: 'users', title: 'Expert Consultation', body: 'Connect with our mobility experts.' }, { icon: 'file-text', title: 'Resource Request', body: 'Tell us what you need and we’ll get it for you.' }]).map((feature: any) => { const Icon = iconMap[feature.icon || ''] || FileText; return <div key={feature.title} className="flex gap-3"><Icon className="mt-0.5 size-5 shrink-0 text-[#1387d5]" /><span><strong className="block text-[10px]">{feature.title}</strong><span className="mt-0.5 block text-[9px] text-[#66718a]">{feature.body}</span></span></div> })}
            </div>
            <Link href={page.requestButtonHref} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#061b43] px-4 py-3 text-[10px] font-semibold text-white transition-colors hover:bg-[#0b3270]">{page.requestButtonLabel} <ArrowRight className="size-3.5" /></Link>
          </div>
          <div className="pointer-events-none absolute bottom-4 right-5 hidden h-[245px] w-[170px] rotate-[8deg] drop-shadow-2xl lg:block"><Image src={page.requestImage || '/images/site/ind-it.png'} alt={page.requestImageAlt || ''} fill sizes="170px" className="rounded-md object-cover" /></div>
        </Reveal>}
      </section>}

      {page.showFaqs !== false && <section className="mx-auto max-w-[1240px] px-6 pb-10 lg:px-10">
        <p className="mb-1 text-center text-[9px] font-bold uppercase tracking-[.18em] text-[#1684cf]">{page.faqEyebrow}</p><h2 className="mb-5 text-center text-xl font-semibold tracking-tight">{page.faqTitle}</h2>
        <FaqAccordion items={faqItems} columns={2} />
      </section>}

      {page.showNewsletter !== false && <section className="mx-auto max-w-[1240px] px-6 pb-10 lg:px-10">
        <div className="relative isolate overflow-hidden rounded-2xl bg-[#06152f] px-6 py-7 text-white sm:px-8">
          <Image src={page.newsletterBackgroundImage || '/images/site/transport-hero.png'} alt="" fill sizes="100vw" className="object-cover opacity-35" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#06152f] via-[#06152f]/90 to-[#06152f]/55" />
          <div className="relative grid gap-5 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div><p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#11b7f2]">{page.newsletterEyebrow}</p><h2 className="mt-1 text-xl font-semibold sm:text-2xl">{page.newsletterTitle}</h2><p className="mt-2 max-w-md text-[10px] leading-relaxed text-white/70">{page.newsletterBody}</p></div>
            <div className="rounded-xl border border-white/20 bg-[#04132d]/75 p-4 backdrop-blur-sm"><NewsletterForm tone="dark" source="resource-centre" /></div>
          </div>
        </div>
      </section>}
    </div>
  )
}
