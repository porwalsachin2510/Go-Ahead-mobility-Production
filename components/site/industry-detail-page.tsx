import Link from 'next/link'
import {
  ArrowRight, ArrowUpRight, BadgeCheck, BedDouble, BriefcaseBusiness, Building2, Bus, CalendarCheck,
  CalendarDays, CarFront, ChartNoAxesCombined, Clock3, Cpu, Factory, FileCheck2, Globe2, Headset,
  HeartHandshake, Laptop, Mail, MapPinned, Plane, Quote, ReceiptText, Route as RouteIcon, ShieldCheck, UsersRound,
  type LucideIcon,
} from 'lucide-react'
import { Parallax, ProgressRail, RouteLine } from '@/components/motion/gsap-effects'
import { Reveal } from '@/components/motion/reveal'
import { Carousel } from '@/components/motion/carousel'
import { Breadcrumbs } from '@/components/site/breadcrumbs'
import { CtaLink, SmartImage } from '@/components/site/primitives'

type IconName = string
type Industry = {
  _id: string; slug: string; title: string; summary?: string; image?: string; imageAlt?: string; icon?: string
  heroTitle?: string; heroHighlight?: string; heroTitleSuffix?: string; heroEyebrow?: string
  heroSecondaryLabel?: string; heroSecondaryHref?: string
  heroHighlights?: { icon?: IconName; label: string; value?: string }[]
  benefits?: { icon?: IconName; title: string; body?: string }[]
  solutions?: { title: string; summary?: string; image?: string; icon?: string; href?: string; actionLabel?: string }[]
  processSteps?: { number?: string; icon?: IconName; title: string; body?: string }[]
  showHero?: boolean; showOverview?: boolean; showSolutions?: boolean; showProcess?: boolean
  showSuccessStories?: boolean; showLogos?: boolean; showTestimonials?: boolean; showFinalCta?: boolean
  overviewEyebrow?: string; overviewTitle?: string; context?: string
  solutionsEyebrow?: string; solutionsTitle?: string; solutionsActionLabel?: string
  processEyebrow?: string; processTitle?: string
  successStoriesEyebrow?: string; successStoriesTitle?: string; successStoriesLinkLabel?: string; successStoriesHref?: string; successStoriesLimit?: number
  successStoriesDefaultCardLabel?: string; successStoriesIllustrativeLabel?: string; successStoriesDefaultResultText?: string
  logosEyebrow?: string; logosTitle?: string
  testimonialsEyebrow?: string; testimonialsTitle?: string; testimonialsDescription?: string; testimonialsEmptyMessage?: string; testimonialsLimit?: number
  contactPhone?: string; contactEmail?: string; callActionHref?: string; emailActionHref?: string
  callActionLabel?: string; callActionFallback?: string; emailActionLabel?: string; emailActionFallback?: string
  meetingActionLabel?: string; meetingActionDetail?: string; meetingActionHref?: string
  finalCtaEyebrow?: string; finalCtaTitle?: string; finalCtaImage?: string; finalCtaImageAlt?: string
  finalCtaButtonLabel?: string; finalCtaButtonHref?: string
  ctaLabel?: string; ctaHref?: string; updatedAt?: string
  accommodationNeeds?: string[]; mobilityNeeds?: string[]; governance?: string
}
type CaseStudy = {
  _id: string; slug: string; title: string; summary?: string; image?: string; cardLabel?: string
  results?: { label: string; value: string }[]; disclaimer?: string
}
type Testimonial = { _id: string; quote: string; personName: string; personTitle?: string; company?: string; personPhoto?: string }
type Logo = { _id: string; name: string; logo: string; url?: string }
type Settings = {
  header?: { primaryCtaLabel?: string; primaryCtaHref?: string }
  contact?: Record<string, string>
}
const ICONS: Record<string, LucideIcon> = {
  globe: Globe2, headset: Headset, calendar: CalendarDays, shield: ShieldCheck, users: UsersRound,
  receipt: ReceiptText, heart: HeartHandshake, bed: BedDouble, car: CarFront, plane: Plane,
  briefcase: BriefcaseBusiness, cpu: Cpu, laptop: Laptop, building: Building2, check: BadgeCheck,
  clock: Clock3, chart: ChartNoAxesCombined, map: MapPinned, file: FileCheck2,
  bus: Bus, route: RouteIcon, factory: Factory,
}
function Icon({ name, className = 'size-5' }: { name?: string; className?: string }) {
  const Component = ICONS[name ?? ''] ?? Globe2
  return <Component className={className} aria-hidden />
}
function ContactAction({ href, icon: IconComponent, title, detail }: {
  href: string; icon: LucideIcon; title: string; detail: string
}) {
  return <a href={href} className="group flex items-center gap-3 rounded-xl border border-white/10 bg-[#0b2342]/75 px-4 py-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#1aa9ed]/60 hover:bg-[#103052] motion-reduce:transform-none motion-reduce:transition-none">
    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#0b83d8]/15 text-[#35baff]"><IconComponent className="size-5" aria-hidden /></span>
    <span className="min-w-0 flex-1"><strong className="block text-xs font-semibold text-white">{title}</strong><span className="block truncate text-[11px] text-white/60">{detail}</span></span>
    <ArrowRight className="size-4 shrink-0 text-[#35baff] transition-transform group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden />
  </a>
}
const text = (value: unknown, fallback = '') => typeof value === 'string' && value.trim() ? value : fallback

export function IndustryDetailPage({ industry, trail, caseStudies, settings, logos = [], testimonials = [] }: {
  industry: Industry; trail: { name: string; path: string }[]; caseStudies: CaseStudy[]
  settings: Settings; logos?: Logo[]; testimonials?: Testimonial[]
}) {
  const heroImage = industry.image || '/images/site/industries-hero.png'
  const ctaHref = industry.ctaHref || settings.header?.primaryCtaHref || '/contact'
  const ctaLabel = industry.ctaLabel || settings.header?.primaryCtaLabel || 'Request a Proposal'
  const contact = settings.contact ?? {}
  const phone = industry.contactPhone || contact.phone || ''
  const email = industry.contactEmail || contact.email || ''
  const before = industry.heroTitle || 'Travel solutions built for'
  const highlight = industry.heroHighlight || industry.title
  const after = industry.heroTitleSuffix || 'companies'
  const overviewTitle = industry.overviewTitle || `Why ${industry.title} companies choose GoAhead`
  const processTitle = industry.processTitle || `How we make it easy for ${industry.title} companies`
  const storyLimit = Math.min(6, Math.max(0, Number(industry.successStoriesLimit ?? 3)))
  const testimonialLimit = Math.min(8, Math.max(0, Number(industry.testimonialsLimit ?? 2)))
  const stories = caseStudies.slice(0, storyLimit)
  const clientTestimonials = testimonials.slice(0, testimonialLimit)
  const finalCtaHref = industry.finalCtaButtonHref || ctaHref
  const finalCtaLabel = industry.finalCtaButtonLabel || ctaLabel
  const callLabel = industry.callActionLabel || 'Call Us'
  const emailLabel = industry.emailActionLabel || 'Email Us'
  const meetingLabel = industry.meetingActionLabel || 'Schedule a Meeting'
  const callFallback = industry.callActionFallback || 'Request a callback from our team'
  const emailFallback = industry.emailActionFallback || 'Send a message to our team'
  const meetingHref = industry.meetingActionHref || '/contact#meeting'
  const meetingDetail = industry.meetingActionDetail || 'Book a convenient slot'
  const callHref = industry.callActionHref || (phone ? 'tel:' + phone.replace(/[^+\\d]/g, '') : '/contact#directory')
  const emailHref = industry.emailActionHref || (email ? 'mailto:' + email : '/contact#directory')
  return <article className="overflow-hidden bg-[#f7f9fc] text-[#10234b]">
    {industry.showHero !== false ? <section className="relative isolate min-h-[540px] overflow-hidden bg-[#020b20] text-white sm:min-h-[590px] lg:min-h-[650px]">
      <div className="absolute inset-0"><Parallax amount={5} className="absolute inset-0"><SmartImage src={heroImage} alt={text(industry.imageAlt, industry.title)} sizes="100vw" priority /></Parallax></div>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#020b20_0%,rgba(2,11,32,.97)_30%,rgba(2,11,32,.67)_57%,rgba(2,11,32,.12)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(0deg,#020b20_0%,transparent_48%)]" />
      <div className="relative mx-auto flex min-h-[540px] max-w-[1240px] flex-col justify-between px-6 pb-7 pt-5 sm:min-h-[590px] lg:min-h-[650px] lg:px-10 lg:pb-9">
        <Breadcrumbs trail={trail} />
        <div className="max-w-[680px] pb-6 pt-14 lg:pb-8 lg:pt-16">
          <Reveal><p className="mb-4 text-[10px] font-bold uppercase tracking-[.22em] text-[#42baff]">{industry.heroEyebrow || 'Industry solutions'}</p></Reveal>
          <Reveal delay={80} y={25}><h1 className="max-w-[680px] text-balance text-[clamp(2.5rem,5vw,4.45rem)] font-semibold leading-[1.06] tracking-[-.045em]"><span>{before} </span><span className="text-[#1cb5f2]">{highlight}</span><span> {after}</span></h1></Reveal>
          {industry.summary ? <Reveal delay={150} y={18}><p className="mt-5 max-w-[510px] text-sm leading-[1.85] text-white/75 sm:text-[15px]">{industry.summary}</p></Reveal> : null}
          <Reveal delay={220} y={15}><div className="mt-7 flex flex-wrap items-center gap-5"><CtaLink href={ctaHref} label={ctaLabel} variant="sky" /><Link href={industry.heroSecondaryHref || '/industries'} className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-white transition-colors hover:text-[#50c0ff]">{industry.heroSecondaryLabel || 'Explore all industries'} <span className="flex size-7 items-center justify-center rounded-full border border-white/45"><ArrowRight className="size-3.5" aria-hidden /></span></Link></div></Reveal>
        </div>
        {industry.heroHighlights?.length ? <div className="grid gap-2 border-t border-white/15 pt-4 sm:grid-cols-2 lg:max-w-[820px] lg:grid-cols-4">{industry.heroHighlights.map((item, i) => <Reveal key={item.label} delay={i * 55} className="flex items-center gap-3 rounded-xl border border-white/15 bg-[#07172d]/65 px-3 py-3 backdrop-blur-md"><Icon name={item.icon} className="size-6 shrink-0 text-[#28b8f5]" /><span><strong className="block text-[11px] font-semibold text-white">{item.label}</strong><span className="text-[10px] text-white/60">{item.value}</span></span></Reveal>)}</div> : null}
      </div>
    </section> : null}

    {industry.showOverview !== false ? <section className="bg-[#f7f9fc] py-10 sm:py-12"><div className="mx-auto grid max-w-[1200px] gap-7 px-6 lg:grid-cols-[.9fr_2.1fr] lg:items-center lg:px-10">
      <Reveal><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#168ce0]">{industry.overviewEyebrow || 'Industry overview'}</p><h2 className="mt-2 text-[clamp(1.55rem,2.5vw,2.2rem)] font-semibold leading-tight tracking-tight text-[#10234b]">{overviewTitle}</h2>{industry.context ? <p className="mt-3 text-xs leading-[1.8] text-[#65718a]">{industry.context}</p> : null}</Reveal>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-5">{(industry.benefits ?? []).map((item, i) => <Reveal key={item.title} delay={i * 55} className="group flex min-h-[150px] flex-col items-center justify-center rounded-xl border border-[#e8edf4] bg-white px-3 py-4 text-center shadow-[0_6px_22px_rgba(9,30,66,.035)] transition-all duration-300 hover:-translate-y-1 hover:border-[#159de9]/40 hover:shadow-lg motion-reduce:transform-none motion-reduce:transition-none"><Icon name={item.icon} className="mb-3 size-7 text-[#168ce0] transition-transform group-hover:scale-110 motion-reduce:transition-none" /><h3 className="text-[11px] font-bold leading-snug text-[#14284d]">{item.title}</h3>{item.body ? <p className="mt-2 text-[9px] leading-relaxed text-[#718096]">{item.body}</p> : null}</Reveal>)}</div>
    </div></section> : null}

    {industry.showSolutions !== false && industry.solutions?.length ? <section className="bg-[#f7f9fc] pb-12 pt-7 sm:pb-16"><div className="mx-auto max-w-[1200px] px-6 lg:px-10">
      <div className="mb-7 text-center"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#168ce0]">{industry.solutionsEyebrow || 'Solutions we provide'}</p><h2 className="mt-2 text-[clamp(1.55rem,2.6vw,2.15rem)] font-semibold tracking-tight text-[#10234b]">{industry.solutionsTitle || 'Solutions for every stage of your business journey'}</h2></div>
      <Carousel label={industry.solutionsTitle || 'Industry solutions'} controls="top">
        {industry.solutions.map((item, i) => <li key={item.title} className="w-[68vw] shrink-0 snap-start sm:w-[36vw] lg:w-[calc((100%-60px)/4)] xl:w-[calc((100%-75px)/6)]"><Reveal delay={i * 55} className="group h-full overflow-hidden rounded-xl border border-[#e7ebf2] bg-white shadow-[0_5px_18px_rgba(9,30,66,.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl motion-reduce:transform-none motion-reduce:transition-none"><Link href={item.href || ctaHref} className="block h-full"><div className="relative aspect-[1.45] overflow-hidden bg-[#e9eef5]">{item.image ? <SmartImage src={item.image} alt={item.title} sizes="(max-width:768px) 70vw,16vw" className="transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none" /> : <div className="flex h-full items-center justify-center"><Icon name={item.icon} className="size-10 text-[#168ce0]" /></div>}<span className="absolute bottom-0 left-3 flex size-9 translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-[#087fd0] text-white shadow-md"><Icon name={item.icon} className="size-4" /></span></div><div className="p-3.5 pt-5"><h3 className="text-[12px] font-bold leading-snug text-[#12264b]">{item.title}</h3>{item.summary ? <p className="mt-2 min-h-[54px] text-[10px] leading-[1.65] text-[#65718a]">{item.summary}</p> : null}<span className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold text-[#087fd0]">{item.actionLabel || industry.solutionsActionLabel || 'Learn more'} <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" aria-hidden /></span></div></Link></Reveal></li>)}
      </Carousel>
    </div></section> : null}

    {industry.showProcess !== false && industry.processSteps?.length ? <section className="relative overflow-hidden bg-white py-12 sm:py-14"><div className="mx-auto max-w-[1200px] px-6 lg:px-10"><div className="mb-8 text-center"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#168ce0]">{industry.processEyebrow || 'Our process'}</p><h2 className="mt-2 text-[clamp(1.55rem,2.5vw,2.1rem)] font-semibold tracking-tight text-[#10234b]">{processTitle}</h2></div><div className="relative grid gap-7 sm:grid-cols-2 lg:grid-cols-5"><ProgressRail className="absolute left-[8%] right-[8%] top-7 hidden h-px bg-[#168ce0]/60 lg:block" />{industry.processSteps.map((item, i) => <Reveal key={item.title} delay={i * 70} className="relative flex flex-col items-center text-center"><span className="relative z-10 flex size-14 items-center justify-center rounded-full border border-[#168ce0]/55 bg-white text-[#168ce0] shadow-[0_0_0_6px_white]">{item.icon ? <Icon name={item.icon} className="size-6" /> : <span className="text-sm font-semibold tabular-nums">{item.number || `0${i + 1}`}</span>}</span><h3 className="mt-4 text-xs font-bold text-[#14284d]">{item.title}</h3>{item.body ? <p className="mt-2 max-w-[190px] text-[10px] leading-[1.7] text-[#65718a]">{item.body}</p> : null}</Reveal>)}</div></div></section> : null}

    {industry.showSuccessStories !== false && stories.length ? <section className="bg-[#f7f9fc] py-12 sm:py-14"><div className="mx-auto max-w-[1200px] px-6 lg:px-10"><div className="mb-7 flex items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#168ce0]">{industry.successStoriesEyebrow || 'Success stories'}</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#10234b] sm:text-3xl">{industry.successStoriesTitle || 'Real solutions. Real impact.'}</h2></div><Link href={industry.successStoriesHref || '/case-studies'} className="inline-flex items-center gap-1 text-[10px] font-bold text-[#087fd0]">{industry.successStoriesLinkLabel || 'View all case studies'} <ArrowRight className="size-3" aria-hidden /></Link></div><div className="grid gap-4 lg:grid-cols-3">{stories.map((item, i) => <Reveal key={item._id} delay={i * 75} className="group relative min-h-[250px] overflow-hidden rounded-2xl bg-[#06152e] text-white shadow-lg"><div className="absolute inset-0">{item.image ? <SmartImage src={item.image} alt={item.title} sizes="(max-width:1024px) 100vw,33vw" className="opacity-55 transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none" /> : null}</div><div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,12,34,.96),rgba(2,12,34,.68)_65%,rgba(2,12,34,.25))]" /><div className="relative flex h-full min-h-[250px] flex-col p-5"><span className="text-[9px] font-bold uppercase tracking-[.18em] text-[#27b9f4]">{item.cardLabel || (item.disclaimer ? (industry.successStoriesIllustrativeLabel || 'Illustrative engagement') : (industry.successStoriesDefaultCardLabel || 'Client success story'))}</span><h3 className="mt-3 max-w-[300px] text-lg font-semibold leading-snug">{item.title}</h3>{item.summary ? <p className="mt-2 max-w-[310px] text-[11px] leading-relaxed text-white/75">{item.summary}</p> : null}<div className="mt-auto flex items-end justify-between gap-3 pt-5">{item.results?.length ? <div className="grid grid-cols-2 gap-x-5 gap-y-2">{item.results.slice(0, 4).map(result => <div key={result.label}><strong className="block text-lg font-bold text-[#25b5f2]">{result.value}</strong><span className="text-[9px] text-white/65">{result.label}</span></div>)}</div> : <span className="text-[10px] text-white/55">{industry.successStoriesDefaultResultText || 'Coordinated delivery and programme support'}</span>}<Link href={'/case-studies/' + item.slug} aria-label={'Read ' + item.title} className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#078be2] text-white transition-transform hover:scale-110"><ArrowUpRight className="size-4" aria-hidden /></Link></div></div></Reveal>)}</div></div></section> : null}

    {industry.showLogos !== false && logos.length ? <section className="border-y border-[#e8edf4] bg-white py-8"><div className="mx-auto max-w-[1200px] px-6 lg:px-10"><p className="mb-5 text-center text-[10px] font-bold uppercase tracking-[.2em] text-[#168ce0]">{industry.logosEyebrow || 'Trusted by leading companies'}</p>{industry.logosTitle ? <h2 className="sr-only">{industry.logosTitle}</h2> : null}<Carousel label={industry.logosTitle || 'Industry client logos'} controls="sides">{logos.map(logo => <li key={logo._id} className="w-[138px] shrink-0 snap-start sm:w-[180px]"><a href={logo.url || '#'} target={logo.url ? '_blank' : undefined} rel={logo.url ? 'noopener noreferrer' : undefined} aria-label={logo.name} className="relative flex h-[76px] w-full items-center justify-center rounded-xl border border-[#edf0f5] bg-[#fbfcfe] px-5 py-3 transition-all hover:border-[#168ce0]/40 hover:shadow-md">{logo.logo ? <SmartImage src={logo.logo} alt={logo.name} sizes="140px" className="object-contain p-2" /> : <span className="text-sm font-semibold text-[#18365f]">{logo.name}</span>}</a></li>)}</Carousel></div></section> : null}

    {industry.showTestimonials !== false ? <section className="relative overflow-hidden bg-[#03122d] py-12 text-white sm:py-14"><div className="absolute inset-0 opacity-[.15]"><RouteLine d="M 0 260 C 190 160 300 340 470 240 S 790 140 960 240 S 1240 340 1440 120" viewBox="0 0 1440 420" className="h-full w-full text-[#1b9de5]" /></div><div className="relative mx-auto grid max-w-[1200px] gap-7 px-6 lg:grid-cols-[1.65fr_0.85fr] lg:px-10"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#27b9f4]">{industry.testimonialsEyebrow || 'What our clients say'}</p><h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{industry.testimonialsTitle || 'Trusted by teams that move the world.'}</h2>{industry.testimonialsDescription ? <p className="mt-2 max-w-xl text-xs leading-relaxed text-white/60">{industry.testimonialsDescription}</p> : null}{clientTestimonials.length ? <div className="mt-6 grid gap-3 md:grid-cols-2">{clientTestimonials.map((item, i) => <Reveal key={item._id} delay={i * 80} className="rounded-xl border border-white/10 bg-[#0a2040]/80 p-5"><Quote className="size-6 text-[#1ca7ed]" aria-hidden /><p className="mt-3 text-xs leading-[1.8] text-white/80">“{item.quote}”</p><div className="mt-5 flex items-center gap-3 border-t border-white/10 pt-3">{item.personPhoto ? <div className="relative size-10 shrink-0 overflow-hidden rounded-full bg-white/10"><SmartImage src={item.personPhoto} alt="" sizes="40px" /></div> : null}<div><strong className="block text-xs">{item.personName}</strong><span className="mt-1 block text-[10px] text-white/55">{[item.personTitle, item.company].filter(Boolean).join(' · ')}</span></div></div></Reveal>)}</div> : <p className="mt-5 max-w-lg text-sm leading-relaxed text-white/60">{industry.testimonialsEmptyMessage || 'Client feedback will appear here after publication and approval by the relevant client.'}</p>}</div><div className="flex flex-col gap-2 self-center"><ContactAction href={callHref} icon={Headset} title={callLabel} detail={phone || callFallback} /><ContactAction href={emailHref} icon={Mail} title={emailLabel} detail={email || emailFallback} /><ContactAction href={meetingHref} icon={CalendarCheck} title={meetingLabel} detail={meetingDetail} /></div></div></section> : null}

    {industry.showFinalCta !== false ? <section className="relative isolate overflow-hidden border-t border-white/10 bg-[#020b20] text-white"><div className="absolute inset-0">{industry.finalCtaImage ? <SmartImage src={industry.finalCtaImage} alt={text(industry.finalCtaImageAlt)} sizes="100vw" className="opacity-35" /> : <SmartImage src={heroImage} alt="" sizes="100vw" className="opacity-35" />}</div><div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,11,32,.86),rgba(2,11,32,.96)_45%,#020b20)]" /><div className="relative mx-auto grid max-w-[1200px] gap-8 px-6 py-12 lg:grid-cols-[1.35fr_1fr] lg:items-center lg:px-10 lg:py-14"><Reveal><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#27b9f4]">{industry.finalCtaEyebrow || 'Ready to simplify travel for your teams?'}</p><h2 className="mt-3 max-w-[560px] text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{industry.finalCtaTitle || 'Let’s build a travel solution that drives your projects forward.'}</h2><div className="mt-6"><CtaLink href={finalCtaHref} label={finalCtaLabel} variant="sky" /></div></Reveal><Reveal delay={100} className="flex flex-col gap-2"><ContactAction href={callHref} icon={Headset} title={callLabel} detail={phone || callFallback} /><ContactAction href={emailHref} icon={Mail} title={emailLabel} detail={email || emailFallback} /><ContactAction href={meetingHref} icon={CalendarCheck} title={meetingLabel} detail={meetingDetail} /></Reveal></div></section> : null}
  </article>
}
