'use client'

import Link from 'next/link'
import { useMemo, useState, type ChangeEvent } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowRight, ArrowUpRight, BusFront, CalendarDays, ChartNoAxesCombined, ChevronDown, Clock3, Cpu, Gauge, Leaf, MapPin, Plane, Play, Quote, Route, Search, ShieldCheck, Users, BriefcaseBusiness, type LucideIcon } from 'lucide-react'
import { Parallax, ScrollReveal } from '@/components/motion/gsap-effects'
import { SmartImage } from '@/components/site/primitives'

type Study = {
  slug: string; title: string; summary?: string; image?: string; vertical?: string; category?: string; cardLabel?: string
  locationLabel?: string; fleetSize?: string; projectDuration?: string; employeesImpacted?: string; industrySlugs?: string[]; featured?: boolean; sortOrder?: number
}
type Industry = { slug: string; title: string }
type Testimonial = { quote?: string; personName?: string; personTitle?: string; company?: string } | null

const DEFAULTS = {
  heroEyebrow: 'CASE STUDIES', heroTitle: 'Real Challenges.', heroHighlight: 'Proven Impact.', heroTitleSuffix: 'Stronger Journeys.',
  heroDescription: 'Explore how leading organisations partner with GoAhead Mobility to solve complex transportation challenges and deliver measurable, sustainable results.',
  heroImage: '/images/site/home-hero.png', heroImageAlt: 'GoAhead Mobility coach travelling through a city at dusk',
  featuredEyebrow: 'FEATURED CASE STUDY', featuredButtonLabel: 'View Full Story', listingTitle: 'All Case Studies', allStoriesLabel: 'All Stories',
  searchPlaceholder: 'Search case studies...', impactTitle: 'Impact That Drives Change',
  impactBody: 'Our data-driven approach delivers measurable results that create lasting value for our clients and their communities.',
  testimonialQuote: 'GoAhead Mobility has been a true partner in our growth journey. Their technology-driven approach, reliability, and commitment to safety have transformed our employee transportation experience.',
  testimonialName: 'Rohit Sharma', testimonialRole: 'Head – Administration, Global Manufacturing Company',
  testimonialVideoTitle: 'Client Success Video', testimonialVideoLabel: 'Explore the story', testimonialVideoPoster: '/images/site/ind-manufacturing.png',
  ctaTitle: 'Ready to create your success story?', ctaBody: 'Partner with GoAhead Mobility for tailored transportation solutions that drive efficiency, safety and satisfaction.',
  ctaButtonLabel: 'Request a Proposal', ctaButtonHref: '/contact',
}
const HERO_STATS = [
  { icon: 'briefcase', value: '250+', label: 'Successful Projects' }, { icon: 'chart', value: '15+', label: 'Industries Served' },
  { icon: 'users', value: '12M+', label: 'Lives Connected Daily' }, { icon: 'shield', value: '98%', label: 'Client Satisfaction' },
]
const CATEGORIES = [
  { slug: 'employee-transportation', label: 'Employee Transportation', icon: 'bus' }, { slug: 'airport-transfers', label: 'Airport Transfers', icon: 'plane' },
  { slug: 'event-transportation', label: 'Event Transportation', icon: 'calendar' }, { slug: 'school-transportation', label: 'School Transportation', icon: 'users' },
  { slug: 'sustainability', label: 'Sustainability', icon: 'heart' }, { slug: 'technology-driven', label: 'Technology Driven', icon: 'cpu' },
]
const IMPACT = [
  { icon: 'chart', value: '25%', label: 'Reduction in Operational Cost' }, { icon: 'chart', value: '30%', label: 'Increase in Operational Efficiency' },
  { icon: 'clock', value: '99.5%', label: 'On-time Performance' }, { icon: 'users', value: '12K+', label: 'Employees Impacted' },
  { icon: 'route', value: '50M+', label: 'Kilometers Driven Annually' }, { icon: 'bus', value: '1,000+', label: 'Modern Fleet Strength' },
]
const ICONS: Record<string, LucideIcon> = {
  briefcase: BriefcaseBusiness, chart: ChartNoAxesCombined, users: Users, shield: ShieldCheck, bus: BusFront, plane: Plane,
  calendar: CalendarDays, heart: Leaf, cpu: Cpu, clock: Clock3, route: Route, gauge: Gauge, map: MapPin,
}
const SERVICES: Record<string, string> = { accommodation: 'Global Accommodation', transport: 'Local Transportation', both: 'Accommodation & Transport', general: 'General' }
const iconFor = (name?: string): LucideIcon => ICONS[name || ''] || BusFront
const titleFromSlug = (slug: string) => slug.split('-').filter(Boolean).map((part) => part[0].toUpperCase() + part.slice(1)).join(' ')
const categoryLabel = (study: Study, categories: any[]) => study.cardLabel || categories.find((c) => c.slug === study.category)?.label || titleFromSlug(study.category || 'case-study')

export function CaseStudiesPage({ content, caseStudies, industries, testimonial }: {
  content: Record<string, any> | null; caseStudies: Study[]; industries: Industry[]
  testimonial: Testimonial
}) {
  const reduceMotion = useReducedMotion()
  const copy = { ...DEFAULTS, ...(content || {}) }
  const heroStats = Array.isArray(content?.heroStats) && content.heroStats.length ? content.heroStats : HERO_STATS
  const impacts = Array.isArray(content?.impactMetrics) && content.impactMetrics.length ? content.impactMetrics : IMPACT
  const categories = (Array.isArray(content?.categories) && content.categories.length ? content.categories : CATEGORIES)
    .filter((c: any) => c.visible !== false).sort((a: any, b: any) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
  const featured = caseStudies.find((s) => s.featured) || caseStudies[0] || null
  const listing = caseStudies.length > 1 && featured ? caseStudies.filter((s) => s.slug !== featured.slug) : caseStudies
  const industryOptions = useMemo(() => industries.map((i) => ({ value: i.slug, label: i.title })), [industries])
  const locations = useMemo(() => Array.from(new Set(caseStudies.map((s) => s.locationLabel).filter(Boolean))) as string[], [caseStudies])
  const [category, setCategory] = useState('all')
  const [industry, setIndustry] = useState('all')
  const [service, setService] = useState('all')
  const [location, setLocation] = useState('all')
  const [query, setQuery] = useState('')
  const [visible, setVisible] = useState(6)
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return listing.filter((s) =>
      (category === 'all' || s.category === category) &&
      (industry === 'all' || (s.industrySlugs || []).includes(industry)) &&
      (service === 'all' || (s.vertical || 'general') === service) &&
      (location === 'all' || s.locationLabel === location) &&
      (!term || [s.title, s.summary, s.locationLabel, categoryLabel(s, categories)].join(' ').toLowerCase().includes(term)))
  }, [listing, category, industry, service, location, query, categories])
  const change = (setter: (v: string) => void) => (e: ChangeEvent<HTMLSelectElement>) => { setter(e.target.value); setVisible(6) }
  const reset = () => { setCategory('all'); setIndustry('all'); setService('all'); setLocation('all'); setQuery(''); setVisible(6) }
  const quote = copy.testimonialQuote || testimonial?.quote || ''
  const name = copy.testimonialName || testimonial?.personName || ''
  const role = copy.testimonialRole || [testimonial?.personTitle, testimonial?.company].filter(Boolean).join(', ')
  const videoHref = copy.testimonialVideoUrl || (featured ? '/case-studies/' + featured.slug : '')
  const videoExternal = Boolean(copy.testimonialVideoUrl)
  const poster = copy.testimonialVideoPoster || featured?.image || copy.heroImage

  return <div className="overflow-hidden bg-white text-ink">
    {content?.showHero !== false ? <section className="relative isolate z-10 min-h-[430px] bg-night text-white md:min-h-[470px]">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <Parallax amount={7} className="absolute inset-0"><SmartImage src={copy.heroImage} alt={copy.heroImageAlt} priority sizes="100vw" /></Parallax>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,10,24,0.98)_0%,rgba(3,10,24,0.9)_32%,rgba(3,10,24,0.55)_58%,rgba(3,10,24,0.12)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-night/80 via-transparent to-night/30" />
      </div>
      <div className="container-x flex min-h-[430px] flex-col justify-center pb-24 pt-8 md:min-h-[470px] md:pb-28 md:pt-12">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-[11px] font-medium text-white/75"><Link href="/" className="hover:text-sky">Home</Link><span aria-hidden>›</span><Link href="/resources" className="hover:text-sky">Resources</Link><span aria-hidden>›</span><span className="text-white">Case Studies</span></div>
        <ScrollReveal className="max-w-[570px]"><p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-sky">{copy.heroEyebrow}</p>
          <h1 className="font-display text-4xl font-extrabold leading-[1.03] tracking-[-0.04em] text-white sm:text-5xl lg:text-[3.5rem]">{copy.heroTitle}<span className="block text-sky">{copy.heroHighlight}</span><span className="block">{copy.heroTitleSuffix}</span></h1>
          <p className="mt-5 max-w-[520px] text-sm leading-relaxed text-white/80 md:text-[15px]">{copy.heroDescription}</p>
        </ScrollReveal>
      </div>
      {content?.showHighlights !== false ? <div className="container-x absolute inset-x-0 bottom-0 translate-y-1/2">
        <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-white/10 bg-[#061a2d]/95 shadow-2xl shadow-ink/20 backdrop-blur md:grid-cols-4">
          {heroStats.slice(0,4).map((item: any, i: number) => { const Icon = iconFor(item.icon); return <div key={i} className="flex min-h-[76px] items-center gap-3 border-white/10 px-4 py-4 md:min-h-[88px] md:justify-center md:border-r md:px-5 last:md:border-r-0">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sky/10 text-sky"><Icon className="size-5" aria-hidden /></span>
            <span className="flex min-w-0 flex-col"><strong className="font-display text-xl font-bold leading-none text-white md:text-2xl">{item.value}</strong><span className="mt-1 text-[10px] leading-tight text-white/75 md:text-xs">{item.label}</span></span>
          </div> })}
        </div>
      </div> : null}
    </section> : null}

    <div className="container-x pb-14 pt-16 md:pb-20 md:pt-20">
      {content?.showFilters !== false ? <ScrollReveal className="mb-5">
        <div className="grid gap-3 rounded-2xl border border-line bg-white p-3 shadow-sm md:grid-cols-4 md:p-4">
          <label className="relative block"><span className="sr-only">Filter by industry</span><select value={industry} onChange={change(setIndustry)} className="h-11 w-full appearance-none rounded-xl border border-line bg-white px-4 pr-10 text-sm text-ink outline-none transition focus:border-sky focus:ring-2 focus:ring-sky/20"><option value="all">All Industries</option>{industryOptions.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3.5 size-4 text-muted-foreground" aria-hidden /></label>
          <label className="relative block"><span className="sr-only">Filter by service</span><select value={service} onChange={change(setService)} className="h-11 w-full appearance-none rounded-xl border border-line bg-white px-4 pr-10 text-sm text-ink outline-none transition focus:border-sky focus:ring-2 focus:ring-sky/20"><option value="all">All Services</option>{['accommodation','transport','both','general'].map((v) => <option key={v} value={v}>{SERVICES[v]}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3.5 size-4 text-muted-foreground" aria-hidden /></label>
          <label className="relative block"><span className="sr-only">Filter by location</span><select value={location} onChange={change(setLocation)} className="h-11 w-full appearance-none rounded-xl border border-line bg-white px-4 pr-10 text-sm text-ink outline-none transition focus:border-sky focus:ring-2 focus:ring-sky/20"><option value="all">All Locations</option>{locations.map((v) => <option key={v} value={v}>{v}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3.5 size-4 text-muted-foreground" aria-hidden /></label>
          <label className="relative block"><span className="sr-only">Search case studies</span><input value={query} onChange={(e) => { setQuery(e.target.value); setVisible(6) }} placeholder={copy.searchPlaceholder} className="h-11 w-full rounded-xl border border-line bg-white px-4 pr-11 text-sm text-ink outline-none transition placeholder:text-muted-foreground/70 focus:border-sky focus:ring-2 focus:ring-sky/20" /><Search className="pointer-events-none absolute right-3 top-3.5 size-4 text-ink" aria-hidden /></label>
        </div>
      </ScrollReveal> : null}

      {content?.showFeatured !== false ? <ScrollReveal className="mb-9">
        {featured ? <article className="grid overflow-hidden rounded-2xl border border-line bg-paper shadow-sm lg:grid-cols-[1.08fr_1fr]">
          <div className="relative min-h-[250px] overflow-hidden bg-ink sm:min-h-[320px] lg:min-h-[365px]"><Parallax amount={5} className="absolute inset-0"><SmartImage src={featured.image || copy.heroImage} alt={featured.title} sizes="(min-width: 1024px) 55vw, 100vw" /></Parallax><span className="absolute left-4 top-4 rounded-md bg-azure px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white">{copy.featuredEyebrow}</span></div>
          <div className="flex flex-col justify-center p-6 md:p-8 lg:p-9"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-azure">{categoryLabel(featured,categories)}{featured.vertical ? ' · '+(SERVICES[featured.vertical] || titleFromSlug(featured.vertical)) : ''}</p>
            <h2 className="mt-3 max-w-xl font-display text-2xl font-bold leading-tight tracking-tight text-ink md:text-[1.75rem]">{featured.title}</h2>{featured.summary ? <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">{featured.summary}</p> : null}
            <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-4 text-[11px] text-muted-foreground sm:grid-cols-4">
              {[{icon:MapPin,label:'Location',value:featured.locationLabel},{icon:BusFront,label:'Fleet Size',value:featured.fleetSize},{icon:Clock3,label:'Project Duration',value:featured.projectDuration},{icon:Users,label:'Employees Impacted',value:featured.employeesImpacted}].filter((item) => item.value).map((item) => { const Icon=item.icon; return <div key={item.label} className="flex min-w-0 items-start gap-2"><Icon className="mt-0.5 size-3.5 shrink-0 text-royal" aria-hidden /><span><span className="block">{item.label}</span><strong className="mt-0.5 block font-semibold text-ink">{item.value}</strong></span></div> })}
            </div>
            <Link href={'/case-studies/'+featured.slug} className="group mt-6 inline-flex w-fit items-center gap-3 rounded-lg bg-night px-5 py-3 text-xs font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-royal focus-visible:outline-offset-4">{copy.featuredButtonLabel}<ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden /></Link>
          </div>
        </article> : <div className="rounded-2xl border border-dashed border-line bg-paper px-6 py-10 text-center"><p className="font-display text-lg font-semibold">Your featured story will appear here</p><p className="mt-2 text-sm text-muted-foreground">Publish an approved case study and mark it as featured in the admin panel.</p></div>}
      </ScrollReveal> : null}

      {content?.showFilters !== false ? <section id="all-case-studies" className="scroll-mt-24">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">{copy.listingTitle}</h2><p className="mt-1 text-xs text-muted-foreground" aria-live="polite">{filtered.length} {filtered.length===1?'story':'stories'} available</p></div>
          <button type="button" onClick={reset} className="group inline-flex items-center gap-2 text-xs font-semibold text-azure transition-colors hover:text-royal">View all case studies<ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden /></button>
        </div>
        <div className="grid gap-5 lg:grid-cols-[180px_minmax(0,1fr)]">
          <aside aria-label="Filter case studies by category" className="flex flex-row gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
            <motion.button type="button" onClick={() => {setCategory('all');setVisible(6)}} whileHover={!reduceMotion?{x:3}:undefined} whileTap={!reduceMotion?{scale:0.98}:undefined} aria-pressed={category==='all'} className={'flex min-w-[170px] items-center gap-3 rounded-xl border px-3 py-3 text-left text-xs transition-colors lg:w-full '+(category==='all'?'border-night bg-night text-white shadow-lg shadow-night/10':'border-line bg-white text-ink hover:border-sky hover:bg-paper')}>
              <span className={'flex size-8 shrink-0 items-center justify-center rounded-lg '+(category==='all'?'bg-sky/15 text-sky':'bg-paper text-royal')}><BusFront className="size-4" aria-hidden /></span><span className="min-w-0"><strong className="block">{copy.allStoriesLabel}</strong><span className={'mt-0.5 block text-[10px] '+(category==='all'?'text-white/65':'text-muted-foreground')}>{caseStudies.length} Projects</span></span>
            </motion.button>
            {categories.map((c:any) => { const Icon=iconFor(c.icon); const active=category===c.slug; const count=listing.filter((s)=>s.category===c.slug).length; return <motion.button key={c.slug} type="button" onClick={()=>{setCategory(c.slug);setVisible(6)}} whileHover={!reduceMotion?{x:3}:undefined} whileTap={!reduceMotion?{scale:0.98}:undefined} aria-pressed={active} className={'flex min-w-[170px] items-center gap-3 rounded-xl border px-3 py-3 text-left text-xs transition-colors lg:w-full '+(active?'border-royal bg-royal text-white':'border-line bg-white text-ink hover:border-sky hover:bg-paper')}>
              <span className={'flex size-8 shrink-0 items-center justify-center rounded-lg '+(active?'bg-white/10 text-sky':'bg-paper text-royal')}><Icon className="size-4" aria-hidden /></span><span className="font-medium">{c.label}</span><span className={'ml-auto text-[10px] '+(active?'text-white/60':'text-muted-foreground')}>{count}</span>
            </motion.button> })}
          </aside>
          <div className="min-w-0">{filtered.length ? <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filtered.slice(0,visible).map((study,index)=>{const Icon=iconFor(categories.find((c:any)=>c.slug===study.category)?.icon);return <motion.article key={study.slug} layout initial={reduceMotion?false:{opacity:0,y:16}} whileInView={!reduceMotion?{opacity:1,y:0}:undefined} viewport={{once:true,amount:0.08}} transition={{duration:0.45,delay:Math.min(index%3,2)*0.06}} whileHover={!reduceMotion?{y:-4}:undefined} className="group overflow-hidden rounded-xl border border-line bg-white shadow-sm transition-shadow hover:shadow-xl hover:shadow-ink/10">
              <Link href={'/case-studies/'+study.slug} className="block h-full"><div className="relative h-40 overflow-hidden bg-paper">{study.image?<SmartImage src={study.image} alt={study.title} sizes="(min-width: 1280px) 28vw, (min-width: 640px) 45vw, 100vw" />:<div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-night to-royal text-sky"><Icon className="size-10" aria-hidden /></div>}
                <span className="absolute bottom-2 left-3 rounded bg-white/95 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-royal shadow-sm">{categoryLabel(study,categories)}</span><span className="absolute bottom-2 right-3 flex size-8 items-center justify-center rounded-full border border-white/30 bg-night/90 text-white transition-transform duration-300 group-hover:rotate-45 group-hover:bg-azure"><ArrowUpRight className="size-4" aria-hidden /></span></div>
                <div className="p-4"><h3 className="font-display text-base font-bold leading-snug text-ink transition-colors group-hover:text-royal">{study.title}</h3>{study.locationLabel?<p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground"><MapPin className="size-3.5" aria-hidden />{study.locationLabel}</p>:null}{study.summary?<p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{study.summary}</p>:null}</div>
              </Link>
            </motion.article>})}</div>
            <div className="mt-6 flex justify-center">{visible<filtered.length?<motion.button type="button" onClick={()=>setVisible((n)=>n+6)} whileHover={!reduceMotion?{y:-2}:undefined} whileTap={!reduceMotion?{scale:0.98}:undefined} className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-6 py-3 text-xs font-semibold text-ink transition-colors hover:border-royal hover:text-royal">Load More Stories<ArrowRight className="size-4" aria-hidden /></motion.button>:null}</div>
          </> : <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-line bg-paper px-6 py-12 text-center"><Search className="size-8 text-royal/60" aria-hidden /><h3 className="mt-3 font-display text-lg font-semibold text-ink">No case studies found</h3><p className="mt-1 max-w-sm text-sm text-muted-foreground">Try a different search or clear your filters to see all published stories.</p><button type="button" onClick={reset} className="mt-4 text-sm font-semibold text-azure underline underline-offset-4">Clear filters</button></div>}</div>
        </div>
      </section> : null}
    </div>

    {content?.showImpact !== false ? <div className="container-x pb-8"><ScrollReveal><section className="rounded-2xl bg-gradient-to-br from-[#050b1d] via-[#071a30] to-[#08243a] px-5 py-7 text-white shadow-xl md:px-8 md:py-8">
      <div className="mb-7 flex flex-col justify-between gap-3 md:flex-row md:items-end"><h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">{copy.impactTitle}</h2><p className="max-w-md text-xs leading-relaxed text-white/70">{copy.impactBody}</p></div>
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6 lg:gap-2">{impacts.slice(0,6).map((item:any,i:number)=>{const Icon=iconFor(item.icon);return <div key={i} className="border-white/15 px-2 lg:border-r lg:px-4 last:lg:border-r-0"><Icon className="mb-3 size-5 text-sky" aria-hidden /><strong className="block font-display text-2xl font-bold leading-none md:text-3xl">{item.value}</strong><span className="mt-2 block max-w-[130px] text-[11px] leading-relaxed text-white/75">{item.label}</span></div>})}</div>
    </section></ScrollReveal></div>:null}

    {content?.showTestimonial !== false && (quote || testimonial?.quote || featured) ? <div className="container-x py-2 pb-10"><ScrollReveal><section className="grid overflow-hidden rounded-2xl border border-line bg-paper shadow-sm lg:grid-cols-2">
      <div className="flex flex-col justify-center p-6 md:p-8"><Quote className="size-8 fill-azure text-azure" aria-hidden /><blockquote className="mt-4 max-w-xl text-sm leading-relaxed text-ink md:text-base">“{quote || testimonial?.quote}”</blockquote>
        <div className="mt-6 flex items-center gap-3">{copy.testimonialAvatar?<div className="relative size-11 overflow-hidden rounded-full bg-white"><SmartImage src={copy.testimonialAvatar} alt={name||'Client'} /></div>:<div className="flex size-11 items-center justify-center rounded-full bg-royal text-sm font-bold text-white">{(name||'G').split(' ').map((part:string)=>part[0]).slice(0,2).join('')}</div>}
          <div><strong className="block text-xs font-bold text-ink">{name||'GoAhead Mobility client'}</strong><span className="mt-0.5 block text-[11px] text-muted-foreground">{role}</span></div></div></div>
      <div className="relative min-h-[250px] overflow-hidden bg-night md:min-h-[320px]"><SmartImage src={poster} alt={copy.testimonialVideoTitle} sizes="(min-width: 1024px) 50vw, 100vw" /><div className="absolute inset-0 bg-gradient-to-t from-night/85 via-night/15 to-transparent" />
        {videoHref?<a href={videoHref} target={videoExternal?'_blank':undefined} rel={videoExternal?'noopener noreferrer':undefined} aria-label={videoExternal?'Watch client success video':'Read the featured case study'} className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white"><span className="flex size-14 items-center justify-center rounded-full bg-white text-royal shadow-xl transition-transform hover:scale-110"><Play className="ml-1 size-5 fill-current" aria-hidden /></span><strong className="text-sm font-semibold">{copy.testimonialVideoTitle}</strong><span className="text-xs text-white/75">{videoExternal?copy.testimonialVideoLabel:'Explore the featured story'}</span></a>:<div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white">{copy.testimonialVideoTitle}</div>}
      </div>
    </section></ScrollReveal></div>:null}

    {content?.showCta !== false ? <div className="container-x pb-8"><ScrollReveal><section className="flex flex-col items-start justify-between gap-5 rounded-2xl border border-white/10 bg-gradient-to-r from-[#050b1d] to-[#08243a] px-6 py-7 text-white shadow-xl md:flex-row md:items-center md:px-8">
      <div className="flex items-center gap-4"><span className="flex size-14 shrink-0 items-center justify-center rounded-full border border-sky/70 text-sky"><ArrowUpRight className="size-7" aria-hidden /></span><div><h2 className="font-display text-xl font-bold md:text-2xl">{copy.ctaTitle}</h2><p className="mt-1 max-w-2xl text-xs leading-relaxed text-white/70">{copy.ctaBody}</p></div></div>
      <Link href={copy.ctaButtonHref||'/contact'} className="group inline-flex shrink-0 items-center gap-3 rounded-lg bg-azure px-5 py-3 text-xs font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-azure-deep focus-visible:outline-offset-4">{copy.ctaButtonLabel}<ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden /></Link>
    </section></ScrollReveal></div>:null}
  </div>
}
