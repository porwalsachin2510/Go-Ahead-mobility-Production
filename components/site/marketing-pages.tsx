'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { ArrowDownRight, ArrowRight, Check, ChevronRight, Globe2, Headphones, MapPin, ShieldCheck, Sparkles, Users, Building2, CarFront, CalendarDays, Network, Route, BriefcaseBusiness, HeartPulse, Factory, Laptop2, Landmark, GraduationCap, Hotel, BedDouble, UsersRound, ClipboardList, CheckCircle2, FileText, MessageCircle, Handshake, CreditCard, Coffee, CalendarCheck, CircleCheck, Bus, Clock3, CircleDollarSign, Quote, Lightbulb, Leaf, Linkedin, Phone, Flag, Mail, Code2, Settings, Droplets, Monitor, Waves } from 'lucide-react'
import { Reveal } from '@/components/motion/reveal'
import { Carousel } from '@/components/motion/carousel'
import { CountUp, CoverageNetwork, Parallax, ProgressRail, RouteGraphic, RouteLine, type CoverageNode } from '@/components/motion/gsap-effects'
import { FaqAccordion, type FaqItem } from '@/components/motion/faq-accordion'
import { LeadForm } from '@/components/site/lead-form'
import { cn } from '@/lib/utils'
import { HomePage as DynamicHomePage } from '@/components/site/home-page'

type ImageCard = { image: string; eyebrow?: string; title: string; body: string }

const homeServices: ImageCard[] = [
  { image: '/images/site/svc-hotel.png', eyebrow: 'Global accommodation', title: 'Stay well, wherever work takes you.', body: 'Serviced apartments, project stays and hotel programmes coordinated around your people.' },
  { image: '/images/site/svc-cab.png', eyebrow: 'Local transportation', title: 'Move people with confidence.', body: 'Employee transport, shuttles and executive rides delivered with control and care.' },
]
const accommodation: ImageCard[] = [
  { image: '/images/site/svc-hotel.png', title: 'Hotels & serviced apartments', body: 'Comfortable stays for business travellers and teams, in key locations.' },
  { image: '/images/site/svc-longstay.png', title: 'Long-stay & project accommodation', body: 'Flexible options for extended assignments and site teams.' },
  { image: '/images/site/acc-group.png', title: 'Group, crew & relocation stays', body: 'Coordinated accommodation for teams and relocations.' },
  { image: '/images/site/acc-flex.png', title: 'Flexible stay requirements', body: 'Room types, durations, and traveller needs considered together.' },
]
const industries: ImageCard[] = [
  { image: '/images/site/ind-corporate.png', title: 'Corporate & enterprises', body: 'Executive travel, project stays and employee transportation managed seamlessly.' },
  { image: '/images/site/ind-it.png', title: 'IT & technology', body: 'Relocation, extended stays and commute solutions for tech teams.' },
  { image: '/images/site/ind-manufacturing.png', title: 'Manufacturing & engineering', body: 'Project accommodation and transport for plant visits and installations.' },
  { image: '/images/site/ind-healthcare.png', title: 'Healthcare & pharma', body: 'Comfortable stays and reliable transport for care teams.' },
  { image: '/images/site/ind-energy.png', title: 'Oil, gas & energy', body: 'Crew travel, remote site accommodation and secure logistics support.' },
  { image: '/images/site/ind-events.png', title: 'Events & conferences', body: 'Delegate stays, group transportation and end-to-end event mobility.' },
]
const faqs: FaqItem[] = [
  { _id: '1', question: 'What happens after I submit a requirement?', answer: 'A GoAhead specialist reviews your needs, clarifies the details and returns a coordinated proposal built around your people, dates and locations.' },
  { _id: '2', question: 'Can I enquire about accommodation and transport together?', answer: 'Yes. We coordinate both services through one accountable partner, so your programme has one clear line of communication.' },
  { _id: '3', question: 'Does submitting an enquiry confirm a booking?', answer: 'No. An enquiry starts a conversation and proposal process. Nothing is booked until your team has reviewed and approved the plan.' },
]

function Button({ children, href = '#contact', secondary = false }: { children: React.ReactNode; href?: string; secondary?: boolean }) {
  return <Link href={href} className={cn('group inline-flex min-h-12 items-center justify-center gap-3 rounded-full px-6 text-sm font-bold transition-transform hover:-translate-y-0.5', secondary ? 'border border-white/25 text-white hover:border-azure hover:bg-azure/10' : 'bg-azure text-white shadow-[0_10px_30px_-10px_rgba(26,124,245,.8)] hover:bg-azure-deep')}><span>{children}</span><ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden /></Link>
}

function Hero({ eyebrow, title, accent, body, image, children, compact = false }: { eyebrow: string; title: string; accent: string; body: string; image: string; children?: React.ReactNode; compact?: boolean }) {
  return <section className={cn('relative isolate overflow-hidden bg-night text-white', compact ? 'min-h-[610px]' : 'min-h-[720px]')}>
    <Image src={image} alt="" fill priority className="object-cover object-center opacity-70" sizes="100vw" />
    <div className="absolute inset-0 bg-[linear-gradient(90deg,#050b1d_7%,rgba(5,11,29,.92)_35%,rgba(5,11,29,.2)_82%,#050b1d_100%)]" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_55%,transparent_0,rgba(5,11,29,.24)_50%,rgba(5,11,29,.85)_100%)]" />
    <div className="relative mx-auto flex min-h-[inherit] max-w-[1240px] items-end px-6 pb-24 pt-40 lg:px-10 lg:pb-28">
      <Reveal className="max-w-2xl" y={35}>
        <p className="mb-5 text-xs font-bold uppercase tracking-[.24em] text-azure">{eyebrow}</p>
        <h1 className="text-balance text-5xl font-semibold leading-[.98] tracking-[-.05em] sm:text-6xl lg:text-8xl">{title} <span className="text-azure">{accent}</span></h1>
        <p className="mt-7 max-w-lg text-base leading-relaxed text-white/75 sm:text-lg">{body}</p>
        {eyebrow === 'GoAhead Mobility' ? <div className="mt-8 grid max-w-[620px] gap-3 sm:grid-cols-2">
          {[['/global-accommodation', 'Global accommodation', 'Hotels, serviced apartments & project stays', Globe2], ['/local-transportation', 'Local transportation', 'Corporate cabs, employee transport & shuttles', CarFront]].map(([href, label, detail, Icon]) => <Link key={String(label)} href={String(href)} className="group rounded-xl border border-white/20 bg-white/95 p-4 text-night shadow-lg backdrop-blur transition-all hover:-translate-y-1 hover:border-azure hover:bg-white"><span className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-azure text-white"><Icon className="size-5" aria-hidden /></span><span><strong className="block text-sm font-bold">{String(label)}</strong><span className="mt-1 block text-xs leading-relaxed text-night/60">{String(detail)}</span></span><ArrowRight className="ml-auto mt-1 size-4 shrink-0 text-azure transition-transform group-hover:translate-x-1" aria-hidden /></span></Link>)}
        </div> : null}
        <div className="mt-8 flex flex-wrap gap-3">{children}</div>
      </Reveal>
    </div>
    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
  </section>
}

function SectionTitle({ eyebrow, title, body, dark = false }: { eyebrow: string; title: string; body?: string; dark?: boolean }) {
  return <div className={cn('mb-12 max-w-3xl', dark ? 'text-white' : 'text-foreground')}><p className="mb-4 text-xs font-bold uppercase tracking-[.22em] text-azure">{eyebrow}</p><h2 className="text-balance text-4xl font-semibold leading-[1.03] tracking-[-.045em] sm:text-5xl">{title}</h2>{body ? <p className={cn('mt-5 max-w-xl text-base leading-relaxed', dark ? 'text-white/65' : 'text-muted-foreground')}>{body}</p> : null}</div>
}

function ImageCardGrid({ items, columns = 3 }: { items: ImageCard[]; columns?: 2 | 3 }) {
  return <div className={cn('grid gap-5', columns === 2 ? 'md:grid-cols-2' : 'md:grid-cols-2 xl:grid-cols-3')}>
    {items.map((item, i) => <Reveal key={item.title} delay={i * 70} className="group overflow-hidden rounded-2xl border border-line bg-background shadow-sm transition-all hover:-translate-y-1 hover:border-azure/40 hover:shadow-xl hover:shadow-azure/10">
      <div className="relative aspect-[1.55] overflow-hidden"><Image src={item.image} alt="" fill className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 33vw" /><div className="absolute inset-0 bg-gradient-to-t from-night/40 to-transparent" /></div>
      <div className="p-6"><div className="mb-5 flex size-10 items-center justify-center rounded-xl bg-azure/10 text-azure"><ArrowDownRight className="size-5" aria-hidden /></div><h3 className="text-xl font-semibold tracking-tight">{item.title}</h3><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.body}</p><Link href="#contact" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-azure">Explore solution <ArrowRight className="size-4" aria-hidden /></Link></div>
    </Reveal>)}
  </div>
}

function TrustStrip() {
  const items = [
    [ShieldCheck, 'Accountable Service'],
    [Sparkles, 'Consistent Standards'],
    [Network, 'Simplified Operations'],
    [Users, 'Traveller Comfort'],
    [ShieldCheck, 'Enterprise Security'],
    [Headphones, 'Reliable Support'],
  ] as const
  return (
    <section className="relative overflow-hidden border-y border-line bg-[#f5f7fc] py-7 sm:py-8">
      <div aria-hidden className="pointer-events-none absolute -right-12 -top-16 size-64 rounded-full border border-sky/20" />
      <div aria-hidden className="pointer-events-none absolute -right-4 -top-8 size-48 rounded-full border border-sky/15" />
      <div className="relative mx-auto max-w-[1240px] px-6 text-center lg:px-10">
        <h2 className="text-xl font-semibold tracking-tight text-[#101b42] sm:text-2xl">One partner for two connected business needs</h2>
        <div className="mt-6 grid grid-cols-2 gap-y-5 sm:grid-cols-3 lg:grid-cols-6 lg:gap-0">
          {items.map(([Icon, label], index) => (
            <Reveal key={label} delay={index * 45} className="relative flex min-h-20 flex-col items-center justify-center gap-3 px-3 text-center">
              <span className="flex size-9 items-center justify-center rounded-xl text-[#25396f]"><Icon className="size-6" strokeWidth={1.7} aria-hidden /></span>
              <span className="text-[11px] font-semibold text-[#1a274d] sm:text-xs">{label}</span>
              {index < items.length - 1 ? <span aria-hidden className="absolute -right-1 top-5 hidden size-1.5 rounded-full bg-sky/70 lg:block" /> : null}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function RouteBand({ title = 'One partner for two connected business needs' }: { title?: string }) {
  return <section className="relative overflow-hidden bg-paper py-20"><div className="mx-auto max-w-[1240px] px-6 lg:px-10"><SectionTitle eyebrow="The connected difference" title={title} body="Every handoff is considered. Every traveller is supported. Every detail is visible." /><div className="relative grid gap-10 md:grid-cols-2"><div className="relative rounded-2xl border border-azure/15 bg-background p-8"><Globe2 className="size-9 text-azure" aria-hidden /><h3 className="mt-6 text-2xl font-semibold">Global accommodation</h3><p className="mt-3 text-sm leading-relaxed text-muted-foreground">From short business trips to long-term project stays, coordinated around your requirements.</p><RouteLine className="absolute bottom-8 left-8 right-8 h-12 text-azure/60" viewBox="0 0 400 48" d="M2 40 C 90 0, 130 0, 200 28 S 310 48, 398 4" /></div><div className="relative rounded-2xl border border-azure/15 bg-background p-8"><CarFront className="size-9 text-azure" aria-hidden /><h3 className="mt-6 text-2xl font-semibold">Local transportation</h3><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Safe, punctual and comfortable transport for employees, executives and teams.</p><RouteLine className="absolute bottom-8 left-8 right-8 h-12 text-azure/60" viewBox="0 0 400 48" d="M2 8 C 90 48, 130 48, 200 20 S 310 0, 398 42" /></div></div></div></section>
}

function Process({ labels = ['Share the requirement', 'Discuss your needs', 'Review a tailored proposal', 'Coordinate implementation & ongoing service'] }: { labels?: string[] }) {
  const descriptions = [
    'Tell us about your team, travel patterns and preferences.',
    'Our team understands and aligns on your priorities.',
    'Receive a proposal designed around your requirements.',
    'We manage the transition and provide continuous support.',
    'We review performance and keep improving the programme.',
  ]
  return (
    <section className="mx-auto max-w-[1240px] px-6 py-16 lg:px-10 lg:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <SectionTitle eyebrow="Our process" title="Simple steps. Clear communication." />
      </div>
      <div className="relative grid gap-8 sm:grid-cols-2 md:grid-cols-4">
        <ProgressRail className="absolute left-[8%] right-[8%] top-6 hidden h-px bg-azure md:block" />
        {labels.map((label, index) => (
          <Reveal key={label} delay={index * 85} className="relative flex flex-col items-center text-center">
            <div className="flex size-12 items-center justify-center rounded-full border-2 border-azure bg-background text-sm font-bold text-azure">{String(index + 1).padStart(2, '0')}</div>
            <h3 className="mt-5 text-sm font-semibold text-[#13214a]">{label}</h3>
            <p className="mt-2 max-w-[230px] text-xs leading-relaxed text-[#64708b]">{descriptions[index] || descriptions[descriptions.length - 1]}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function DarkCta({ title = 'Let’s plan a better-connected business journey.', body = 'Talk to our experts about a coordinated accommodation or transportation programme.' }: { title?: string; body?: string }) {
  return <section id="contact" className="relative overflow-hidden bg-night py-24 text-white"><div className="absolute inset-0 opacity-30"><Image src="/images/site/home-hero.png" alt="" fill className="object-cover" /></div><div className="relative mx-auto flex max-w-[1240px] flex-col items-start justify-between gap-10 px-6 lg:flex-row lg:items-center lg:px-10"><div className="max-w-2xl"><p className="mb-4 text-xs font-bold uppercase tracking-[.22em] text-azure">Start a conversation</p><h2 className="text-balance text-4xl font-semibold tracking-[-.04em] sm:text-6xl">{title}</h2><p className="mt-5 max-w-lg text-white/65">{body}</p></div><Button href="/contact">Request a proposal</Button></div></section>
}

function HomeHero() {
  return (
    <section className="relative isolate min-h-[650px] overflow-hidden bg-night text-white sm:min-h-[680px] lg:min-h-[700px]">
      <div className="absolute inset-0">
        <Parallax amount={7} className="absolute inset-0">
          <Image src="/images/site/home-hero.png" alt="A premium city hotel and corporate vehicle representing connected business travel" fill priority loading="eager" sizes="100vw" className="object-cover object-[62%_center]" />
        </Parallax>
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#050b1d_0%,rgba(5,11,29,.98)_22%,rgba(5,11,29,.83)_43%,rgba(5,11,29,.18)_78%,rgba(5,11,29,.08)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_76%_58%,transparent_0%,rgba(5,11,29,.12)_44%,rgba(5,11,29,.42)_100%)]" />
      <div aria-hidden className="absolute bottom-0 left-9 top-0 hidden w-px bg-gradient-to-b from-transparent via-sky/70 to-transparent lg:block" />
      <div className="relative z-10 mx-auto flex min-h-[inherit] max-w-[1240px] items-center px-6 py-20 lg:px-10">
        <Reveal className="max-w-[590px]" y={34}>
          <p className="mb-5 text-[11px] font-bold uppercase tracking-[.22em] text-sky sm:text-xs">Corporate travel, thoughtfully connected</p>
          <h1 className="max-w-[570px] text-balance text-[clamp(2.75rem,5.8vw,5.35rem)] font-semibold leading-[.98] tracking-[-.055em]">
            Business travel,<span className="block text-sky">seamlessly</span><span className="block text-sky">connected.</span>
          </h1>
          <p className="mt-6 max-w-[440px] text-sm leading-relaxed text-white/80 sm:text-base">Corporate accommodation and local transportation, coordinated around the way your teams work.</p>
          <div className="mt-7 grid max-w-[570px] gap-3 sm:grid-cols-2">
            <Link href="/global-accommodation" className="group flex min-h-[88px] items-center gap-3 rounded-xl border border-white/70 bg-white px-4 py-3 text-[#101b42] shadow-[0_12px_35px_-22px_rgba(0,0,0,.8)] transition-all duration-300 hover:-translate-y-1 hover:border-sky hover:shadow-xl">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sky text-white"><Globe2 className="size-5" aria-hidden /></span>
              <span className="min-w-0"><strong className="block text-sm font-bold">Global Accommodation</strong><span className="mt-1 block text-[11px] leading-relaxed text-[#5c6681]">Hotels, serviced apartments and project stays</span></span>
              <ArrowRight className="ml-auto size-4 shrink-0 text-azure transition-transform group-hover:translate-x-1" aria-hidden />
            </Link>
            <Link href="/local-transportation" className="group flex min-h-[88px] items-center gap-3 rounded-xl border border-white/70 bg-white px-4 py-3 text-[#101b42] shadow-[0_12px_35px_-22px_rgba(0,0,0,.8)] transition-all duration-300 hover:-translate-y-1 hover:border-sky hover:shadow-xl">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#102044] text-white"><CarFront className="size-5" aria-hidden /></span>
              <span className="min-w-0"><strong className="block text-sm font-bold">Local Transportation</strong><span className="mt-1 block text-[11px] leading-relaxed text-[#5c6681]">Corporate cabs, employee transport and shuttles</span></span>
              <ArrowRight className="ml-auto size-4 shrink-0 text-azure transition-transform group-hover:translate-x-1" aria-hidden />
            </Link>
          </div>
          <div className="mt-7 flex flex-wrap items-center gap-5">
            <Button href="/contact">Request a proposal</Button>
            <Link href="#services" className="group inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-white transition-colors hover:text-sky">Explore solutions <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden /></Link>
          </div>
        </Reveal>
      </div>
      <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1 text-[9px] font-semibold uppercase tracking-[.2em] text-white/55">
        <span>Scroll</span><span aria-hidden className="relative h-7 w-px overflow-hidden bg-white/30"><span className="absolute left-0 top-0 h-3 w-px animate-[route_2.4s_ease-in-out_infinite] bg-sky" /></span><span aria-hidden className="size-1.5 rounded-full border border-sky" />
      </div>
    </section>
  )
}

function HomeOffering() {
  const cards = [
    { image: '/images/site/svc-hotel.png', icon: Globe2, title: 'Global Accommodation', body: 'Carefully chosen hotels, serviced apartments and project stays for teams on the move.', href: '/global-accommodation', action: 'Explore accommodation' },
    { image: '/images/site/svc-cab.png', icon: CarFront, title: 'Local Transportation', body: 'Corporate cabs, employee transport and shuttles, managed with precision and professionalism.', href: '/local-transportation', action: 'Explore transport' },
  ] as const
  return (
    <section id="services" className="relative mx-auto max-w-[1240px] px-6 py-14 lg:px-10 lg:py-16">
      <div className="grid items-center gap-8 lg:grid-cols-[.72fr_1.7fr] lg:gap-12">
        <Reveal className="relative lg:pb-8">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[.2em] text-azure">Our offering</p>
          <h2 className="text-balance text-3xl font-semibold leading-[1.05] tracking-[-.045em] text-[#111d46] sm:text-4xl">Two services.<span className="block text-azure">One considered</span><span className="block text-azure">experience.</span></h2>
          <p className="mt-5 max-w-[340px] text-sm leading-relaxed text-[#53607e]">We bring together quality accommodation and dependable transportation with the care, consistency and control your business expects.</p>
          <RouteLine d="M 0 50 C 80 10 130 72 210 38 S 300 16 360 42" viewBox="0 0 360 90" className="pointer-events-none mt-5 h-16 w-full max-w-[360px] text-sky/70" strokeWidth={1.5} />
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2">
          {cards.map(({ image, icon: Icon, title, body, href, action }, index) => (
            <Reveal key={title} delay={index * 90} className="group overflow-hidden rounded-2xl border border-[#e6eaf2] bg-white shadow-[0_8px_28px_-22px_rgba(13,31,73,.35)] transition-all duration-300 hover:-translate-y-1 hover:border-sky/50 hover:shadow-[0_18px_45px_-24px_rgba(13,31,73,.32)]">
              <Link href={href} className="block">
                <div className="relative aspect-[1.55] overflow-hidden"><Image src={image} alt="" fill sizes="(max-width: 640px) 100vw, 45vw" className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.045]" /></div>
                <div className="relative px-5 pb-5 pt-0 sm:px-6">
                  <span className="-mt-5 mb-3 flex size-10 items-center justify-center rounded-lg border-4 border-white bg-azure text-white shadow-sm"><Icon className="size-5" aria-hidden /></span>
                  <h3 className="text-lg font-semibold tracking-tight text-[#111d46]">{title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-[#5a6681]">{body}</p>
                  <span className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-azure">{action} <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" aria-hidden /></span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function HomeChallenges() {
  const columns = [
    { title: 'Accommodation,', accent: 'without the fragmented process', items: ['Multiple suppliers and inconsistent experiences', 'Rate variations and limited policy alignment', 'Manual coordination and time-consuming admin', 'Lack of visibility and traveller support'] },
    { title: 'Transport,', accent: 'with clearer coordination', items: ['Disconnected transport vendors and SLAs', 'Manual operations and last-minute changes', 'Limited visibility into routes and attendance', 'Safety, compliance and reporting challenges'] },
  ] as const

  const renderColumn = (column: (typeof columns)[number], index: number) => (
    <Reveal key={column.title} delay={index * 100} className="max-w-[480px]">
      <h2 className="text-2xl font-semibold leading-tight tracking-[-.035em] text-[#111d46] sm:text-3xl">{column.title}<span className="block">{column.accent}</span></h2>
      <ul className="mt-6 space-y-3">
        {column.items.map((item, itemIndex) => (
          <li key={item} className="flex items-start gap-3 text-xs leading-relaxed text-[#4f5d7b] sm:text-sm">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-sky/10 text-azure">
              {itemIndex === 0 ? <ShieldCheck className="size-3.5" aria-hidden /> : itemIndex === 1 ? <MapPin className="size-3.5" aria-hidden /> : itemIndex === 2 ? <Users className="size-3.5" aria-hidden /> : <Check className="size-3.5" aria-hidden />}
            </span>
            {item}
          </li>
        ))}
      </ul>
    </Reveal>
  )

  return (
    <section className="relative overflow-hidden border-y border-[#e9edf5] bg-[#f5f7fc] py-14 sm:py-16">
      <div className="relative mx-auto grid max-w-[1120px] gap-10 px-6 md:grid-cols-[1fr_1px_1fr] md:gap-10 lg:px-10">
        {renderColumn(columns[0], 0)}
        <div aria-hidden className="relative hidden w-px bg-gradient-to-b from-transparent via-sky/55 to-transparent md:block">
          <span className="absolute left-1/2 top-1/2 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-sky/50 bg-white text-azure shadow-sm"><Route className="size-4" /></span>
        </div>
        {renderColumn(columns[1], 1)}
      </div>
    </section>
  )
}

function ConnectedToolkit() {
  const cards = [
    { image: '/images/site/svc-hotel.png', title: 'Hotels & Serviced Apartments', body: 'Quality stays for individuals and teams, in key locations.', href: '/global-accommodation' },
    { image: '/images/site/svc-longstay.png', title: 'Long-Stay & Project Stays', body: 'Flexible long-stay solutions for extended assignments.', href: '/global-accommodation' },
    { image: '/images/site/svc-cab.png', title: 'Corporate Cab Services', body: 'On-demand and scheduled corporate cab services.', href: '/local-transportation' },
    { image: '/images/site/svc-employee.png', title: 'Employee Transport', body: 'Daily commute solutions for your workforce.', href: '/local-transportation' },
    { image: '/images/site/svc-shuttle.png', title: 'Shuttles, Industrial & Event Transport', body: 'Reliable transport for sites, events and large groups.', href: '/local-transportation' },
    { image: '/images/site/svc-saas.png', title: 'Transport SaaS / ERP', body: 'Technology to manage transport operations more effectively.', href: '/local-transportation' },
  ] as const
  return (
    <section className="mx-auto max-w-[1240px] px-6 py-16 lg:px-10 lg:py-20">
      <div className="mx-auto mb-8 max-w-3xl text-center"><p className="mb-3 text-[10px] font-bold uppercase tracking-[.2em] text-azure">Our solutions</p><h2 className="text-balance text-3xl font-semibold tracking-[-.04em] text-[#111d46] sm:text-4xl">A connected toolkit for corporate travel</h2></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, index) => (
          <Reveal key={card.title} delay={index * 55} className="group overflow-hidden rounded-xl border border-[#e5eaf3] bg-white shadow-[0_6px_22px_-19px_rgba(11,26,61,.38)] transition-all duration-300 hover:-translate-y-1 hover:border-sky/50 hover:shadow-[0_16px_34px_-22px_rgba(11,26,61,.4)]">
            <Link href={card.href} className="grid min-h-[142px] grid-cols-[1.04fr_.96fr]">
              <div className="flex flex-col justify-center p-4 sm:p-5">
                <span className="mb-3 flex size-8 items-center justify-center rounded-lg bg-[#0d1c43] text-sky">{index < 2 ? <Building2 className="size-4" aria-hidden /> : index === 2 ? <CarFront className="size-4" aria-hidden /> : index === 3 ? <Users className="size-4" aria-hidden /> : index === 4 ? <Route className="size-4" aria-hidden /> : <Laptop2 className="size-4" aria-hidden />}</span>
                <h3 className="text-sm font-bold leading-tight text-[#12204a]">{card.title}</h3>
                <p className="mt-2 text-[10px] leading-relaxed text-[#5b6783] sm:text-[11px]">{card.body}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold text-azure">Explore <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" aria-hidden /></span>
              </div>
              <div className="relative min-h-[142px] overflow-hidden"><Image src={card.image} alt="" fill sizes="(max-width: 1024px) 50vw, 20vw" className="object-cover transition-transform duration-700 ease-out group-hover:scale-105" /></div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function IndustryBand() {
  const items = [[Building2, 'IT & Global Capability Centres'], [Users, 'BPO / 24-7 Operations'], [Factory, 'Manufacturing'], [HeartPulse, 'Healthcare'], [BriefcaseBusiness, 'Retail & Distributed Offices'], [Landmark, 'Construction & Projects'], [CalendarDays, 'Events & Conferences'], [GraduationCap, 'Consulting & Professional Services']] as const
  return (
    <section className="relative overflow-hidden bg-night py-14 text-white sm:py-16">
      <div className="absolute inset-0 opacity-20"><Image src="/images/site/world-map.png" alt="" fill className="object-cover" /></div>
      <div className="relative mx-auto max-w-[1240px] px-6 lg:px-10">
        <div className="mx-auto max-w-3xl text-center"><SectionTitle dark eyebrow="Industries we serve" title="Solutions aligned to the way your industry operates" /></div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-4 lg:grid-cols-8">
          {items.map(([Icon, label], index) => (
            <Reveal key={label} delay={index * 45} className="flex flex-col items-center gap-3 text-center">
              <span className="flex size-12 items-center justify-center rounded-full border border-azure/60 text-azure transition-all duration-300 hover:scale-105 hover:bg-azure/10"><Icon className="size-5" aria-hidden /></span>
              <span className="text-[10px] font-semibold leading-tight text-white/80 sm:text-xs">{label}</span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

type HomeFaqRecord = { _id?: string; question: string; answer: string }
type HomePostRecord = { slug: string; title: string; excerpt?: string; heroImage?: string; heroAlt?: string }
type HomeResourceRecord = { slug: string; title: string; summary?: string; image?: string; resourceType?: string }
type HomeData = { faqs?: HomeFaqRecord[]; posts?: HomePostRecord[]; resources?: HomeResourceRecord[]; content?: Record<string, any> }

function InsightsSection({ homeData }: { homeData?: HomeData }) {
  const fallbackStories = [
    { slug: '', title: 'Coordinating project-team stays', excerpt: 'An operations perspective on how teams manage accommodation for extended assignments.', image: '/images/site/ind-corporate.png' },
    { slug: '', title: 'Planning transport around shift patterns', excerpt: 'An editorial perspective on aligning transport with workforce schedules.', image: '/images/site/svc-cab.png' },
  ]
  const fallbackResources = [
    { slug: '', title: 'A practical guide to corporate accommodation', summary: 'A useful starting point for planning business stays.', image: '/images/site/svc-hotel.png', resourceType: 'Guide' },
    { slug: '', title: 'Planning employee transport across shift patterns', summary: 'How to organise reliable movement around shifts.', image: '/images/site/svc-shuttle.png', resourceType: 'Operations' },
    { slug: '', title: 'What to include in a transport proposal', summary: 'The details that help shape a coordinated plan.', image: '/images/site/planning.png', resourceType: 'Checklist' },
  ]
  const stories = homeData?.posts?.length ? homeData.posts.slice(0, 2).map((post) => ({ ...post, image: post.heroImage || '/images/site/svc-hotel.png' })) : fallbackStories
  const resources = homeData?.resources?.length ? homeData.resources.slice(0, 3).map((resource) => ({ ...resource, image: resource.image || '/images/site/planning.png' })) : fallbackResources

  return (
    <section className="mx-auto max-w-[1240px] px-6 py-16 lg:px-10 lg:py-20">
      <div className="grid gap-10 lg:grid-cols-[.78fr_1.22fr] lg:gap-8">
        <div className="lg:border-r lg:border-[#e1e7f1] lg:pr-8">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[.2em] text-azure">Evidence over promises</p>
          <h2 className="max-w-md text-balance text-3xl font-semibold leading-tight tracking-[-.04em] text-[#111d46]">Stories & operational perspectives</h2>
          <div className="mt-7 space-y-4">
            {stories.map((story, index) => (
              <Reveal key={story.slug || story.title} delay={index * 70} className="group grid grid-cols-[104px_1fr] gap-4 border-b border-[#e9edf4] pb-4 last:border-0">
                <Link href={story.slug ? '/blog/' + story.slug : '/blog'} className="relative block aspect-[1.16] overflow-hidden rounded-lg"><Image src={story.image} alt={story.title} fill sizes="104px" className="object-cover transition-transform duration-700 group-hover:scale-105" /></Link>
                <div className="min-w-0 self-center">
                  <Link href={story.slug ? '/blog/' + story.slug : '/blog'} className="text-sm font-semibold leading-snug text-[#12204a] transition-colors hover:text-azure">{story.title}</Link>
                  <p className="mt-1.5 line-clamp-2 text-[10px] leading-relaxed text-[#63708a]">{story.excerpt || 'Practical insight from the teams coordinating better business travel.'}</p>
                  <Link href={story.slug ? '/blog/' + story.slug : '/blog'} className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-azure">Read perspective <ArrowRight className="size-3" aria-hidden /></Link>
                </div>
              </Reveal>
            ))}
          </div>
          <Link href="/blog" className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-azure">Explore all perspectives <ArrowRight className="size-3.5" aria-hidden /></Link>
        </div>
        <div>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[.2em] text-azure">Insights & resources</p>
          <h2 className="text-balance text-3xl font-semibold leading-tight tracking-[-.04em] text-[#111d46]">Ideas for better-coordinated travel</h2>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {resources.map((resource, index) => (
              <Reveal key={resource.slug || resource.title} delay={index * 65} className="group overflow-hidden rounded-xl border border-[#e5eaf2] bg-white shadow-[0_6px_22px_-19px_rgba(11,26,61,.4)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <Link href={resource.slug ? '/resources/' + resource.slug : '/learn'} className="block">
                  <div className="relative aspect-[1.35] overflow-hidden"><Image src={resource.image} alt={resource.title} fill sizes="(max-width: 640px) 100vw, 20vw" className="object-cover transition-transform duration-700 group-hover:scale-105" /><span className="absolute left-3 top-3 rounded bg-[#0d1c43]/90 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-white">{resource.resourceType || 'Resource'}</span></div>
                  <div className="flex min-h-[110px] flex-col p-4"><h3 className="text-xs font-semibold leading-snug text-[#13214a]">{resource.title}</h3><p className="mt-2 line-clamp-2 text-[10px] leading-relaxed text-[#66718b]">{resource.summary || 'Ideas and tools to help teams coordinate travel with confidence.'}</p><span className="mt-auto inline-flex justify-end pt-3 text-azure"><ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden /></span></div>
                </Link>
              </Reveal>
            ))}
          </div>
          <Link href="/learn" className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-azure">Explore all resources <ArrowRight className="size-3.5" aria-hidden /></Link>
        </div>
      </div>
    </section>
  )
}

function resolveHomeFaqs(homeData?: HomeData): FaqItem[] {
  const available = homeData?.faqs ?? []
  if (!available.length) return faqs
  const find = (terms: string[]) => available.find((item) => terms.some((term) => item.question.toLowerCase().includes(term)))
  const selected = [
    find(['what happens after']),
    find(['shuttle routes', 'long stays']),
    find(['which locations', 'submitting an enquiry', 'confirm a booking']),
  ].filter((item): item is HomeFaqRecord => Boolean(item))
  for (const item of available) {
    if (selected.length >= 3) break
    if (!selected.some((chosen) => chosen.question === item.question)) selected.push(item)
  }
  return (selected.length ? selected : faqs).slice(0, 3).map((item, index) => ({
    _id: String(item._id || 'home-faq-' + index),
    question: item.question,
    answer: item.answer,
  }))
}

export function HomePage({ cmsPage, homeData }: { cmsPage?: { _id?: string; id?: string; path?: string; title?: string } | null; homeData?: HomeData }) {
  return <DynamicHomePage cmsPage={cmsPage} homeData={homeData} />
}

type AccommodationRecord = Record<string, any>
type AccommodationPageData = {
  content?: AccommodationRecord
  faqs?: { _id?: string; question: string; answer: string }[]
  posts?: { slug: string; title: string; heroImage?: string; heroAlt?: string; excerpt?: string }[]
  resources?: { slug: string; title: string; summary?: string; coverImage?: string; image?: string; resourceType?: string }[]
}

const ACCOMMODATION_ICONS: Record<string, typeof ArrowRight> = {
  'arrow-right': ArrowRight,
  'bed': BedDouble,
  'bed-double': BedDouble,
  'briefcase': BriefcaseBusiness,
  'briefcase-business': BriefcaseBusiness,
  'building': Building2,
  'building-2': Building2,
  'calendar': CalendarDays,
  'calendar-check': CalendarCheck,
  'calendar-days': CalendarDays,
  'check-circle': CircleCheck,
  'clipboard-list': ClipboardList,
  'coffee': Coffee,
  'credit-card': CreditCard,
  'factory': Factory,
  'file-text': FileText,
  'handshake': Handshake,
  'headphones': Headphones,
  'heart-pulse': HeartPulse,
  'hotel': Hotel,
  'map-pin': MapPin,
  'message-circle': MessageCircle,
  'shield': ShieldCheck,
  'shield-check': ShieldCheck,
  'users': Users,
  'users-round': UsersRound,
}

function AccommodationIcon({ name, className = 'size-5' }: { name?: string; className?: string }) {
  const Icon = name ? ACCOMMODATION_ICONS[name.toLowerCase()] ?? CircleCheck : CircleCheck
  return <Icon className={className} aria-hidden />
}

function accommodationText(content: AccommodationRecord, key: string, fallback = '') {
  const value = content[key]
  return typeof value === 'string' && value.trim() ? value : fallback
}

function accommodationList<T>(content: AccommodationRecord, key: string, fallback: readonly T[] = []): T[] {
  return Array.isArray(content[key]) ? content[key] as T[] : [...fallback]
}

function AccommodationHero({ content }: { content: AccommodationRecord }) {
  const assurances = accommodationList<AccommodationRecord>(content, 'heroAssurances')
  return (
    <section className="relative isolate min-h-[500px] overflow-hidden bg-[#040b1d] text-white sm:min-h-[540px] lg:min-h-[570px]">
      <div className="absolute inset-0">
        <Parallax amount={6} className="home-hero-parallax absolute inset-0">
          <Image src={accommodationText(content, 'heroImage', '/images/site/acc-hero.png')} alt={accommodationText(content, 'heroImageAlt', '')} fill priority sizes="100vw" className="object-cover object-[58%_center]" />
        </Parallax>
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#040b1d_0%,rgba(4,11,29,.96)_26%,rgba(4,11,29,.67)_54%,rgba(4,11,29,.12)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(4,11,29,.45),transparent_32%)]" />
      <div className="relative mx-auto max-w-[1240px] px-6 pb-9 pt-5 lg:px-10 lg:pb-10">
        <nav aria-label="Breadcrumb" className="mb-7 flex items-center gap-2 text-sm text-white/65">
          <Link href="/" className="transition-colors hover:text-sky">{accommodationText(content, 'breadcrumbHomeLabel', 'Home')}</Link>
          <ChevronRight className="size-3" aria-hidden />
          <span aria-current="page">{accommodationText(content, 'heroEyebrow', 'Global accommodation')}</span>
        </nav>
        <div className="max-w-[660px]">
          <p className="home-hero-enter home-hero-enter--eyebrow mb-3 text-sm font-bold uppercase tracking-[.22em] text-sky">{accommodationText(content, 'heroEyebrow', 'Global accommodation')}</p>
          <h1 className="home-hero-enter home-hero-enter--headline text-balance text-[clamp(2.45rem,5.2vw,4.25rem)] font-semibold leading-[1.02] tracking-[-.05em]">
            {accommodationText(content, 'heroTitle', 'The right stay.')}
            <span className="block">
              {accommodationText(content, 'heroSubtitle', 'For every')}{' '}
              <span className="text-sky">{accommodationText(content, 'heroAccent', 'business journey.')}</span>
            </span>
          </h1>
          <p className="home-hero-enter home-hero-enter--description mt-4 max-w-[470px] text-sm leading-relaxed text-white/75 sm:text-[15px]">{accommodationText(content, 'heroDescription')}</p>
          <div className="home-hero-enter mt-5 flex flex-wrap items-center gap-4" style={{ animationDelay: '440ms' }}>
            <Button href={accommodationText(content, 'heroPrimaryHref', '#accommodation-enquiry')}>{accommodationText(content, 'heroPrimaryLabel', 'Submit accommodation requirement')}</Button>
            <Link href={accommodationText(content, 'heroSecondaryHref', '#stay-solutions')} className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-white transition-colors hover:text-sky">
              {accommodationText(content, 'heroSecondaryLabel', 'Explore stay solutions')} <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
        <div className="mt-6 grid max-w-[760px] grid-cols-2 gap-2 sm:grid-cols-4">
          {assurances.map((item, index) => (
            <div key={item.label || index} style={{ animationDelay: `${600 + index * 90}ms` }} className="home-hero-enter flex min-h-[62px] items-center gap-2 rounded-lg border border-white/20 bg-night/65 px-2.5 py-2 backdrop-blur-sm sm:px-3">
              <AccommodationIcon name={item.icon} className="size-5 shrink-0 text-sky" />
              <span className="text-xs font-semibold leading-tight">{item.label}<span className="mt-0.5 block font-normal text-white/70">{item.detail}</span></span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function AccommodationSolutions({ content }: { content: AccommodationRecord }) {
  const cards = accommodationList<AccommodationRecord>(content, 'solutionCards')
  return (
    <section id="stay-solutions" className="mx-auto max-w-[1240px] px-6 py-10 lg:px-10 lg:py-12">
      <div className="mb-6 grid items-end gap-4 md:grid-cols-[1fr_.9fr]">
        <Reveal>
          <p className="mb-2 text-xs font-bold uppercase tracking-[.2em] text-azure">{accommodationText(content, 'solutionsEyebrow')}</p>
          <h2 className="max-w-[540px] text-2xl font-semibold leading-tight tracking-[-.035em] text-[#111d46] sm:text-3xl">{accommodationText(content, 'solutionsTitle')}</h2>
        </Reveal>
        <Reveal delay={80} className="max-w-[460px] pb-1 text-sm leading-relaxed text-[#596782]">{accommodationText(content, 'solutionsBody')}</Reveal>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, index) => (
          <Reveal key={card.title || index} delay={index * 65} className="group overflow-hidden rounded-xl border border-line bg-white shadow-[0_5px_18px_-14px_rgba(13,31,73,.35)] transition-all duration-300 hover:-translate-y-1 hover:border-azure/40 hover:shadow-lg">
            <Link href={card.href || '#accommodation-enquiry'} className="block h-full">
              <div className="relative aspect-[1.55] overflow-hidden bg-[#eaf0f7]">
                {card.image ? <Image src={card.image} alt={card.imageAlt || card.title || ''} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.045]" /> : null}
              </div>
              <div className="relative px-4 pb-4 pt-0">
                <span className="-mt-5 mb-2.5 flex size-9 items-center justify-center rounded-full border-[3px] border-white bg-azure text-white shadow-sm"><AccommodationIcon name={card.icon} className="size-4" /></span>
                <h3 className="text-base font-bold leading-snug text-[#14234b]">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#5d6983]">{card.body}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-azure">{card.actionLabel || accommodationText(content, 'solutionsActionLabel', 'Explore solution')} <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" aria-hidden /></span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function AccommodationChallenges({ content }: { content: AccommodationRecord }) {
  const challenges = accommodationList<string>(content, 'challengeItems')
  const approach = accommodationList<string>(content, 'approachItems')
  return (
    <section className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-10">
      <div className="relative overflow-hidden rounded-2xl border border-[#e9eff8] bg-[#f2f6fc] px-5 py-6 sm:px-9 sm:py-7">
        <div aria-hidden className="pointer-events-none absolute -left-16 top-5 size-44 rounded-full border border-sky/15" />
        <div aria-hidden className="pointer-events-none absolute -right-16 bottom-0 size-52 rounded-full border border-sky/15" />
        <div className="relative grid gap-6 md:grid-cols-[minmax(0,.9fr)_minmax(0,1.3fr)] md:items-center md:gap-4">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-wider text-azure">{accommodationText(content, 'challengesEyebrow')}</p>
            <h2 className="mt-1 max-w-sm text-lg font-semibold leading-tight text-[#14234b]">{accommodationText(content, 'challengesTitle')}</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {challenges.map(item => <li key={item} className="flex items-start gap-2 text-sm leading-relaxed text-[#4e5d7a]"><CheckCircle2 className="mt-1 size-3.5 shrink-0 text-[#4385c9]" aria-hidden />{item}</li>)}
            </ul>
          </Reveal>
          <div className="flex items-end gap-3">
            <ChallengeFlow branches={Math.max(approach.length, 1)} />
            <Reveal delay={90} className="min-w-0 md:w-56 md:shrink-0">
              <p className="text-xs font-bold uppercase tracking-wider text-azure">{accommodationText(content, 'approachEyebrow')}</p>
              <ul className="mt-2 flex flex-col">
                {approach.map(item => (
                  <li key={item} className="group flex min-h-9 items-center gap-2 text-sm font-semibold leading-tight text-[#293958]">
                    <CircleCheck className="size-4 shrink-0 text-[#4385c9] transition-transform duration-300 group-hover:scale-110" aria-hidden />
                    <span className="transition-colors duration-300 group-hover:text-azure">{item}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}

const FLOW_ROW = 36
const FLOW_WIDTH = 300
const FLOW_HUB_X = 138

function ChallengeFlow({ branches }: { branches: number }) {
  const height = branches * FLOW_ROW
  const hubY = height / 2
  const topIn = Math.round(height * 0.24)
  const bottomIn = Math.round(height * 0.76)
  const rows = Array.from({ length: branches }, (_, index) => FLOW_ROW / 2 + index * FLOW_ROW)
  const inputs = [topIn, bottomIn].map(y => `M0 ${y} L70 ${y} C104 ${y} 106 ${hubY} ${FLOW_HUB_X} ${hubY}`)
  const outputs = rows.map(y => `M${FLOW_HUB_X} ${hubY} C178 ${hubY} 188 ${y} 228 ${y} L292 ${y}`)
  return (
    <div className="hidden min-w-0 flex-1 md:block" style={{ height }}>
      <RouteGraphic
        stretch
        viewBox={`0 0 ${FLOW_WIDTH} ${height}`}
        paths={[{ d: `M0 ${hubY} L${FLOW_HUB_X} ${hubY}`, faint: true }, ...inputs, ...outputs]}
        markers={[
          { x: 70, y: topIn, kind: 'dot' },
          { x: 70, y: bottomIn, kind: 'dot' },
          { x: FLOW_HUB_X, y: hubY, kind: 'hub' },
          ...rows.map(y => ({ x: 252, y, kind: 'dot' as const })),
          ...rows.map(y => ({ x: 295, y, kind: 'arrow' as const })),
        ]}
        className="size-full text-sky"
      />
    </div>
  )
}

function AccommodationEnquiry({ content }: { content: AccommodationRecord }) {
  const [formOpen, setFormOpen] = useState(false)
  const considerations = accommodationList<AccommodationRecord>(content, 'enquiryConsiderations')
  return (
    <section id="accommodation-enquiry" className="mx-auto max-w-[1240px] scroll-mt-24 px-6 py-10 lg:px-10 lg:py-12">
      <div className="grid items-center gap-5 lg:grid-cols-[.72fr_1.08fr_.78fr]">
        <Reveal>
          <p className="text-xs font-bold uppercase tracking-wider text-azure">{accommodationText(content, 'enquiryEyebrow')}</p>
          <h2 className="mt-2 text-xl font-semibold leading-tight text-[#12204a] sm:text-2xl">{accommodationText(content, 'enquiryTitle')}</h2>
          <p className="mt-3 max-w-[280px] text-sm leading-relaxed text-[#596782]">{accommodationText(content, 'enquiryBody')}</p>
          <button type="button" aria-expanded={formOpen} aria-controls="accommodation-request-form" onClick={() => setFormOpen(value => !value)} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-full bg-azure px-4 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-azure-deep">
            {formOpen ? accommodationText(content, 'enquiryFormCloseLabel', 'Close enquiry form') : accommodationText(content, 'enquiryButtonLabel', 'Share your requirement')}
            <ArrowRight className={cn('size-3.5 transition-transform', formOpen && 'rotate-90')} aria-hidden />
          </button>
        </Reveal>
        <Reveal delay={80} className="relative min-h-[210px] overflow-hidden rounded-xl bg-[#eaf0f7] sm:min-h-[245px]">
          <Image src={accommodationText(content, 'enquiryImage', '/images/site/svc-hotel.png')} alt={accommodationText(content, 'enquiryImageAlt')} fill sizes="(max-width: 1024px) 100vw, 45vw" className="object-cover transition-transform duration-700 hover:scale-[1.025]" />
        </Reveal>
        <Reveal delay={140} className="rounded-xl border border-line bg-white p-4 shadow-sm sm:p-5">
          <h3 className="text-xs font-bold text-[#12204a]">{accommodationText(content, 'considerationsTitle', 'Information we consider')}</h3>
          <ul className="mt-3 space-y-2.5">
            {considerations.map((item, index) => <li key={item.label || index} className="flex items-start gap-2 text-sm leading-snug text-[#485875]"><AccommodationIcon name={item.icon} className="mt-px size-3.5 shrink-0 text-[#4385c9]" />{item.label}</li>)}
          </ul>
        </Reveal>
      </div>
      {formOpen ? (
        <div id="accommodation-request-form" className="mx-auto mt-8 max-w-[900px] scroll-mt-24 rounded-2xl border border-[#e5eaf2] bg-white p-5 shadow-[0_16px_40px_-32px_rgba(10,28,65,.55)] sm:p-7">
          <div className="mb-4 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-azure">{accommodationText(content, 'enquiryFormEyebrow')}</p>
            <h3 className="mt-1 text-xl font-semibold text-[#12204a]">{accommodationText(content, 'enquiryFormTitle')}</h3>
            <p className="mt-1 text-sm text-[#64708b]">{accommodationText(content, 'enquiryFormNote')}</p>
          </div>
          <LeadForm variant="accommodation" compact />
        </div>
      ) : null}
    </section>
  )
}

function AccommodationProcess({ content }: { content: AccommodationRecord }) {
  const steps = accommodationList<AccommodationRecord>(content, 'processSteps')
  return (
    <section className="bg-[#f7f9fc] py-8 sm:py-10">
      <div className="mx-auto max-w-[1240px] px-6 lg:px-10">
        <Reveal className="mb-6 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-azure">{accommodationText(content, 'processEyebrow')}</p>
          <h2 className="mx-auto mt-1 max-w-3xl text-lg font-semibold text-[#14234b] sm:text-xl">{accommodationText(content, 'processTitle')}</h2>
        </Reveal>
        <div className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <ProgressRail className="absolute left-[10%] right-[10%] top-6 hidden h-px bg-azure/45 lg:block" />
          {steps.map((step, index) => (
            <Reveal key={step.title || index} delay={index * 65} className="relative flex flex-col items-center text-center">
              <span className="flex size-11 items-center justify-center rounded-full border border-[#4385c9]/60 bg-white text-[#4385c9]"><AccommodationIcon name={step.icon} className="size-5" /></span>
              <h3 className="mt-3 text-sm font-bold text-[#15244a]">{step.title}</h3>
              <p className="mt-1 max-w-[220px] text-xs leading-relaxed text-[#66728b]">{step.body}</p>
            </Reveal>
          ))}
        </div>
        <p className="mt-5 text-center text-xs text-[#7a859a]">{accommodationText(content, 'processNote')}</p>
      </div>
    </section>
  )
}

// City coordinates in the 1456x720 world-map image: New York, London, Frankfurt, Dubai, Delhi, Mumbai,
// Kathmandu, Singapore, Shanghai, Tokyo, Sydney, Johannesburg, Asia-Pacific hub, Sao Paulo.
const COVERAGE_NODES: CoverageNode[] = [
  { x: 403, y: 250 }, { x: 686, y: 200 }, { x: 748, y: 207 }, { x: 908, y: 322 }, { x: 997, y: 310 }, { x: 978, y: 350 },
  { x: 1043, y: 330 }, { x: 1104, y: 425 }, { x: 1172, y: 296 }, { x: 1246, y: 272 }, { x: 1292, y: 575 }, { x: 802, y: 538 },
  { x: 1172, y: 368, hub: true }, { x: 512, y: 528 },
]
const COVERAGE_LINKS: [number, number][] = [[0, 1], [1, 3], [2, 4], [3, 5], [5, 7], [4, 6], [7, 12], [8, 9], [12, 10], [11, 3], [12, 9], [13, 11], [0, 13]]

function AccommodationCoverage({ content }: { content: AccommodationRecord }) {
  const legend = accommodationList<AccommodationRecord>(content, 'coverageLegend')
  const toneClasses: Record<string, string> = { sky: 'bg-sky', emerald: 'bg-emerald-400', amber: 'bg-amber-400' }
  return (
    <section className="relative isolate overflow-hidden bg-[#edf4fd] py-8 sm:py-10">
      <div className="absolute inset-y-0 right-0 w-full sm:w-[72%]">
        <Parallax amount={3} className="absolute inset-0">
          <Image src={accommodationText(content, 'coverageMapImage', '/images/site/world-map.png')} alt={accommodationText(content, 'coverageMapAlt')} fill sizes="(max-width: 640px) 100vw, 72vw" className="object-cover object-center opacity-80" />
          <CoverageNetwork width={1456} height={720} nodes={COVERAGE_NODES} links={COVERAGE_LINKS} className="absolute inset-0 size-full" />
        </Parallax>
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-[#edf4fd] via-[#edf4fd]/90 to-transparent" />
      <div className="relative mx-auto grid max-w-[1240px] items-center gap-6 px-6 lg:grid-cols-[.78fr_1.22fr] lg:px-10">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-azure">{accommodationText(content, 'coverageEyebrow')}</p>
          <h2 className="mt-1 text-xl font-semibold leading-tight text-[#12204a] sm:text-2xl">{accommodationText(content, 'coverageTitle')}</h2>
          <p className="mt-2 max-w-[360px] text-sm leading-relaxed text-[#596782]">{accommodationText(content, 'coverageBody')}</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
            {legend.map((item, index) => <div key={item.title || index} className="flex gap-2 rounded-lg bg-white/85 p-2.5">
              <span className={cn('mt-1 size-2 shrink-0 rounded-full', toneClasses[item.tone] || toneClasses.sky)} />
              <span className="text-xs leading-relaxed text-[#64708b]"><strong className="block text-[#213253]">{item.title}</strong>{item.body}</span>
            </div>)}
          </div>
        </div>
        <div aria-hidden className="hidden min-h-[230px] lg:block" />
      </div>
    </section>
  )
}

function AccommodationAudiences({ content }: { content: AccommodationRecord }) {
  const audiences = accommodationList<AccommodationRecord>(content, 'audienceItems')
  return (
    <section className="mx-auto max-w-[1240px] px-6 py-8 lg:px-10">
      <Reveal>
        <p className="text-xs font-bold uppercase tracking-wider text-azure">{accommodationText(content, 'audiencesEyebrow')}</p>
        <h2 className="mt-1 text-xl font-semibold text-[#11204a] sm:text-2xl">{accommodationText(content, 'audiencesTitle')}</h2>
      </Reveal>
      <div className="mt-5 grid grid-cols-2 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
        {audiences.map((item, index) => <Reveal key={item.title || index} delay={index * 45} className="border-[#e2e8f1] px-3 first:pl-0 sm:border-l sm:pl-4">
          <AccommodationIcon name={item.icon} className="size-7 text-[#4385c9]" />
          <h3 className="mt-2 text-sm font-bold leading-snug text-[#1d2b4d]">{item.title}</h3>
          <p className="mt-1 text-xs leading-relaxed text-[#64708b]">{item.body}</p>
        </Reveal>)}
      </div>
    </section>
  )
}

function AccommodationStories({ content, data }: { content: AccommodationRecord; data?: AccommodationPageData }) {
  const managedCards = accommodationList<AccommodationRecord>(content, 'storyCards')
  const liveCards = [
    ...(data?.posts ?? []).map(post => ({ title: post.title, image: post.heroImage || '/images/site/svc-hotel.png', imageAlt: post.heroAlt || post.title, href: '/blog/' + post.slug })),
    ...(data?.resources ?? []).map(resource => ({ title: resource.title, image: resource.coverImage || resource.image || '/images/site/acc-flex.png', imageAlt: resource.title, href: '/resources/' + resource.slug })),
  ].slice(0, 3)
  const cards = liveCards.length ? liveCards : managedCards
  return (
    <section className="border-y border-line bg-white py-7 sm:py-8">
      <div className="mx-auto grid max-w-[1240px] gap-5 px-6 lg:grid-cols-[.58fr_1.42fr] lg:px-10">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-azure">{accommodationText(content, 'storiesEyebrow')}</p>
          <h2 className="mt-1 text-lg font-semibold leading-tight text-[#14234b]">{accommodationText(content, 'storiesTitle')}</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#64708b]">{accommodationText(content, 'storiesBody')}</p>
          <Link href={accommodationText(content, 'storiesLinkHref', '/resources')} className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-azure">{accommodationText(content, 'storiesLinkLabel')} <ArrowRight className="size-3" aria-hidden /></Link>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {cards.slice(0, 3).map((card, index) => <Reveal key={card.title || index} delay={index * 55} className="group relative aspect-[1.65] overflow-hidden rounded-lg bg-[#eaf0f7]">
            <Link href={card.href || '/resources'} className="absolute inset-0">
              {card.image ? <Image src={card.image} alt={card.imageAlt || card.title || ''} fill sizes="(max-width: 640px) 100vw, 30vw" className="object-cover transition-transform duration-700 group-hover:scale-105" /> : null}
              <span className="absolute inset-0 bg-gradient-to-t from-night/75 via-transparent to-transparent" />
              <span className="absolute inset-x-2 bottom-2 text-xs font-semibold leading-tight text-white sm:inset-x-3 sm:bottom-3 sm:text-sm">{card.title}</span>
            </Link>
          </Reveal>)}
        </div>
      </div>
    </section>
  )
}

function AccommodationFaq({ content, data }: { content: AccommodationRecord; data?: AccommodationPageData }) {
  const allFaqs = data?.faqs ?? []
  const featuredIds = Array.isArray(content.featuredFaqIds) ? content.featuredFaqIds.map(String) : []
  const orderedFaqs = featuredIds.length
    ? featuredIds.map(id => allFaqs.find(item => String(item._id) === id)).filter((item): item is NonNullable<typeof item> => Boolean(item))
    : allFaqs
  const items: FaqItem[] = orderedFaqs.slice(0, Math.min(12, Math.max(0, Number(content.faqLimit ?? 5)))).map((item, index) => ({
    _id: String(item._id || 'accommodation-faq-' + index),
    question: item.question,
    answer: item.answer,
  }))
  return (
    <section className="mx-auto max-w-[1240px] px-6 py-7 lg:px-10">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-wider text-azure">{accommodationText(content, 'faqEyebrow')}</p><h2 className="text-xl font-semibold text-[#11204a] sm:text-2xl">{accommodationText(content, 'faqTitle')}</h2></div>
        <Link href={accommodationText(content, 'faqLinkHref', '/faq')} className="shrink-0 text-xs font-bold text-azure sm:text-sm">{accommodationText(content, 'faqLinkLabel')} <ArrowRight className="inline size-3" aria-hidden /></Link>
      </div>
      {items.length ? <FaqAccordion items={items} columns={2} /> : <p className="rounded-lg border border-line bg-[#f7f9fc] px-4 py-3 text-xs text-[#64708b]">{accommodationText(content, 'faqEmptyState')}</p>}
    </section>
  )
}

export function AccommodationPage({ data }: { data?: AccommodationPageData }) {
  const content = data?.content ?? {}
  return (
    <div data-page="global-accommodation">
      {content.showHero !== false && <AccommodationHero content={content} />}
      {content.showSolutions !== false && <AccommodationSolutions content={content} />}
      {content.showChallenges !== false && <AccommodationChallenges content={content} />}
      {content.showEnquiry !== false && <AccommodationEnquiry content={content} />}
      {content.showProcess !== false && <AccommodationProcess content={content} />}
      {content.showCoverage !== false && <AccommodationCoverage content={content} />}
      {content.showAudiences !== false && <AccommodationAudiences content={content} />}
      {content.showStories !== false && <AccommodationStories content={content} data={data} />}
      {content.showFaq !== false && <AccommodationFaq content={content} data={data} />}
    </div>
  )
}

type TransportationRecord = Record<string, any>
type TransportationPageData = {
  content?: TransportationRecord
  proof?: { testimonials?: any[]; caseStudies?: any[] }
  logos?: any[]
  contact?: Record<string, string>
}

const TRANSPORTATION_ICONS: Record<string, typeof ArrowRight> = {
  'arrow-right': ArrowRight,
  'bus': Bus,
  'building': Building2,
  'building-2': Building2,
  'calendar': CalendarDays,
  'calendar-days': CalendarDays,
  'car': CarFront,
  'car-front': CarFront,
  'circle-dollar-sign': CircleDollarSign,
  'clock': Clock3,
  'clock-3': Clock3,
  'factory': Factory,
  'headphones': Headphones,
  'mail': Mail,
  'map-pin': MapPin,
  'network': Network,
  'phone': Phone,
  'route': Route,
  'shield': ShieldCheck,
  'shield-check': ShieldCheck,
  'users': Users,
  'users-round': UsersRound,
}

function TransportationIcon({ name, className = 'size-5' }: { name?: string; className?: string }) {
  const Icon = name ? TRANSPORTATION_ICONS[name.toLowerCase()] ?? CircleCheck : CircleCheck
  return <Icon className={className} aria-hidden />
}

function transportationText(content: TransportationRecord, key: string, fallback = '') {
  const value = content[key]
  return typeof value === 'string' && value.trim() ? value : fallback
}

function transportationList<T>(content: TransportationRecord, key: string, fallback: readonly T[] = []): T[] {
  return Array.isArray(content[key]) ? content[key] as T[] : [...fallback]
}

function TransportationHero({ content }: { content: TransportationRecord }) {
  const assurances = transportationList<TransportationRecord>(content, 'heroAssurances')
  return (
    <section className="relative isolate min-h-[430px] overflow-hidden bg-[#030b20] text-white sm:min-h-[485px] lg:min-h-[500px]">
      <div className="absolute inset-0">
        <Parallax amount={5} className="absolute inset-0">
          <Image src={transportationText(content, 'heroImage', '/images/site/transport-hero.png')} alt={transportationText(content, 'heroImageAlt')} fill priority sizes="100vw" className="object-cover object-[62%_center]" />
        </Parallax>
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#030b20_0%,rgba(3,11,32,.96)_28%,rgba(3,11,32,.64)_52%,rgba(3,11,32,.08)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(3,11,32,.78),transparent_40%)]" />
      <div className="relative mx-auto max-w-[1240px] px-6 pb-7 pt-5 lg:px-10 lg:pb-8">
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-[10px] text-white/65">
          <Link href="/" className="hover:text-sky">{transportationText(content, 'breadcrumbHomeLabel', 'Home')}</Link>
          <ChevronRight className="size-3" aria-hidden />
          <span aria-current="page">{transportationText(content, 'heroEyebrow', 'Local Transportation')}</span>
        </nav>
        <Reveal y={30} className="max-w-[600px]">
          <p className="mb-2 text-[9px] font-bold uppercase tracking-[.2em] text-sky">{transportationText(content, 'heroEyebrow', 'Local transportation')}</p>
          <h1 className="text-balance text-[clamp(2.35rem,5vw,4.1rem)] font-semibold leading-[1.02] tracking-[-.05em]">
            {transportationText(content, 'heroTitle', 'Reliable transportation.')}
            <span className="block text-sky">{transportationText(content, 'heroAccent', 'Connected journeys.')}</span>
          </h1>
          <p className="mt-4 max-w-[430px] text-[12px] leading-relaxed text-white/75 sm:text-sm">{transportationText(content, 'heroDescription')}</p>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <Button href={transportationText(content, 'heroPrimaryHref', '#transport-request')}>{transportationText(content, 'heroPrimaryLabel', 'Request Transportation')}</Button>
            <Link href={transportationText(content, 'heroSecondaryHref', '#transport-services')} className="inline-flex min-h-11 items-center gap-2 text-[10px] font-bold text-white transition-colors hover:text-sky">
              {transportationText(content, 'heroSecondaryLabel', 'Explore Solutions')} <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </Reveal>
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/15 pt-4 sm:grid-cols-3 lg:grid-cols-5">
          {assurances.map((item, index) => (
            <Reveal key={item.label || index} delay={index * 45} className="flex items-center gap-2 text-[9px] font-semibold text-white/85">
              <TransportationIcon name={item.icon} className="size-4 shrink-0 text-sky" />
              {item.label}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function TransportationServices({ content }: { content: TransportationRecord }) {
  const cards = transportationList<TransportationRecord>(content, 'serviceCards')
  return (
    <section id="transport-services" className="mx-auto max-w-[1240px] scroll-mt-20 px-6 py-9 lg:px-10 lg:py-11">
      <Reveal className="mb-5 text-center">
        <p className="text-[9px] font-bold uppercase tracking-[.2em] text-azure">{transportationText(content, 'servicesEyebrow')}</p>
        <h2 className="mx-auto mt-1 max-w-4xl text-xl font-semibold tracking-tight text-[#14234b] sm:text-2xl">{transportationText(content, 'servicesTitle')}</h2>
      </Reveal>
      <Carousel label="Transportation services" controls="top">
        {cards.map((card, index) => (
          <li key={card.title || index} className="w-[66vw] shrink-0 snap-start sm:w-[34vw] lg:w-[calc((100%-100px)/6)]">
            <Reveal delay={index * 45} className="group h-full overflow-hidden rounded-xl border border-line bg-white shadow-[0_5px_18px_-14px_rgba(13,31,73,.35)] transition-all duration-300 hover:-translate-y-1 hover:border-azure/40 hover:shadow-lg">
              <Link href={card.href || '#transport-request'} className="block h-full">
                <div className="relative aspect-[1.25] overflow-hidden bg-[#eaf0f7]">
                  {card.image ? <Image src={card.image} alt={card.imageAlt || card.title || ''} fill sizes="(max-width: 640px) 70vw, (max-width: 1024px) 34vw, 17vw" className="object-cover transition-transform duration-700 group-hover:scale-105" /> : null}
                </div>
                <div className="relative px-3 pb-3 pt-0 sm:px-3.5">
                  <span className="-mt-4 mb-2 flex size-8 items-center justify-center rounded-full border-2 border-white bg-azure text-white shadow-sm"><TransportationIcon name={card.icon} className="size-3.5" /></span>
                  <h3 className="text-[10px] font-bold leading-snug text-[#14234b] sm:text-[11px]">{card.title}</h3>
                  <p className="mt-1.5 text-[9px] leading-relaxed text-[#64708b]">{card.body}</p>
                  <span className="mt-2 inline-flex items-center gap-1 text-[9px] font-bold text-azure">{card.actionLabel || transportationText(content, 'servicesActionLabel', 'Explore service')} <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" aria-hidden /></span>
                </div>
              </Link>
            </Reveal>
          </li>
        ))}
      </Carousel>
    </section>
  )
}

function TransportationBenefits({ content }: { content: TransportationRecord }) {
  const benefits = transportationList<TransportationRecord>(content, 'benefitItems')
  return (
    <section className="bg-[#f5f8fd] py-8 sm:py-10">
      <div className="mx-auto max-w-[1240px] px-6 lg:px-10">
        <Reveal className="mb-5 text-center">
          <p className="text-[9px] font-bold uppercase tracking-wider text-azure">{transportationText(content, 'benefitsEyebrow')}</p>
          <h2 className="mt-1 text-xl font-semibold text-[#14234b] sm:text-2xl">{transportationText(content, 'benefitsTitle')}</h2>
        </Reveal>
        <div className="grid grid-cols-2 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
          {benefits.map((item, index) => (
            <Reveal key={item.title || index} delay={index * 45} className="flex flex-col items-center border-[#dfe7f2] px-3 text-center sm:border-l first:sm:border-l-0">
              <TransportationIcon name={item.icon} className="size-6 text-[#4385c9]" />
              <h3 className="mt-2 text-[10px] font-bold text-[#1d2b4d]">{item.title}</h3>
              <p className="mt-1.5 max-w-[165px] text-[9px] leading-relaxed text-[#64708b]">{item.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function TransportationProcess({ content }: { content: TransportationRecord }) {
  const steps = transportationList<TransportationRecord>(content, 'processSteps')
  return (
    <section className="mx-auto max-w-[1240px] px-6 py-8 lg:px-10">
      <Reveal className="mb-5 text-center">
        <p className="text-[9px] font-bold uppercase tracking-wider text-azure">{transportationText(content, 'processEyebrow')}</p>
        <h2 className="mt-1 text-xl font-semibold text-[#14234b] sm:text-2xl">{transportationText(content, 'processTitle')}</h2>
      </Reveal>
      <div className="relative grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        <ProgressRail className="absolute left-[8%] right-[8%] top-4 hidden h-px bg-azure/55 lg:block" />
        {steps.map((step, index) => (
          <Reveal key={step.number || index} delay={index * 55} className="relative flex flex-col items-center text-center">
            <span className="flex size-8 items-center justify-center rounded-full bg-azure text-[10px] font-bold text-white shadow-[0_0_0_5px_white]">{step.number || String(index + 1).padStart(2, '0')}</span>
            <h3 className="mt-3 text-[10px] font-bold text-[#1d2b4d]">{step.title}</h3>
            <p className="mt-1.5 max-w-[190px] text-[9px] leading-relaxed text-[#64708b]">{step.body}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function FleetShowcase({ content }: { content: TransportationRecord }) {
  const fleet = transportationList<TransportationRecord>(content, 'fleetItems')
  return (
    <section className="bg-[#f4f7fb] py-8 sm:py-10">
      <div className="mx-auto max-w-[1240px] px-6 lg:px-10">
        <Reveal className="mb-5 text-center">
          <p className="text-[9px] font-bold uppercase tracking-wider text-azure">{transportationText(content, 'fleetEyebrow')}</p>
          <h2 className="mt-1 text-xl font-semibold text-[#14234b] sm:text-2xl">{transportationText(content, 'fleetTitle')}</h2>
        </Reveal>
        <Carousel label="Fleet categories" controls="sides">
          {fleet.map((item, index) => (
            <li key={item.title || index} className="w-[72vw] shrink-0 snap-start sm:w-[42vw] lg:w-[calc((100%-80px)/5)]">
              <Reveal delay={index * 50} className="group h-full overflow-hidden rounded-xl border border-line bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <Link href={item.href || '#transport-request'} className="block h-full">
                  <div className="relative aspect-[1.48] overflow-hidden bg-[#edf2f8]">
                    {item.image ? <Image src={item.image} alt={item.imageAlt || item.title || ''} fill sizes="(max-width: 640px) 75vw, 20vw" className="object-contain p-2 transition-transform duration-500 group-hover:scale-105" /> : null}
                  </div>
                  <div className="p-3">
                    <h3 className="text-[11px] font-bold text-[#14234b]">{item.title}</h3>
                    <p className="mt-1 text-[9px] leading-relaxed text-[#64708b]">{item.body}</p>
                    <span className="mt-2 inline-flex items-center gap-1 text-[9px] font-bold text-azure">{transportationText(content, 'fleetActionLabel', 'View details')} <ArrowRight className="size-3" aria-hidden /></span>
                  </div>
                </Link>
              </Reveal>
            </li>
          ))}
        </Carousel>
      </div>
    </section>
  )
}

function TransportationImpact({ content }: { content: TransportationRecord }) {
  const items = transportationList<TransportationRecord>(content, 'impactItems')
  return (
    <section className="relative isolate overflow-hidden bg-[#06183a] py-7 text-white sm:py-8">
      <div className="absolute inset-0 opacity-20">
        <Image src={transportationText(content, 'heroImage', '/images/site/transport-hero.png')} alt="" fill sizes="100vw" className="object-cover object-center" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-[#03102a] via-[#06183a]/90 to-[#03102a]/80" />
      <div className="relative mx-auto max-w-[1240px] px-6 lg:px-10">
        <Reveal className="mb-4 text-center">
          <p className="text-[9px] font-bold uppercase tracking-wider text-sky">{transportationText(content, 'impactEyebrow')}</p>
        </Reveal>
        <div className="grid grid-cols-2 gap-y-5 sm:grid-cols-3 lg:grid-cols-5">
          {items.map((item, index) => (
            <Reveal key={item.label || index} delay={index * 60} className="flex flex-col items-center border-white/10 px-3 text-center sm:border-l first:sm:border-l-0">
              <strong className="text-3xl font-bold tracking-tight text-sky sm:text-4xl">{item.value}</strong>
              <span className="mt-1 text-[10px] font-semibold text-white/90">{item.label}</span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function TransportationLogos({ content, data }: { content: TransportationRecord; data?: TransportationPageData }) {
  const logos = data?.logos ?? []
  if (!logos.length) return null
  return (
    <section className="border-y border-white/10 bg-[#030b20] py-5 text-white">
      <div className="mx-auto max-w-[1240px] px-6 lg:px-10">
        {transportationText(content, 'logosEyebrow') ? <p className="mb-4 text-center text-[8px] font-bold uppercase tracking-[.2em] text-sky">{transportationText(content, 'logosEyebrow')}</p> : null}
        {transportationText(content, 'logosTitle') ? <h2 className="sr-only">{transportationText(content, 'logosTitle')}</h2> : null}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
          {logos.slice(0, 10).map((logo: any, index: number) => (
            <div key={logo._id || logo.name || index} className="relative h-8 w-24 opacity-80 grayscale transition hover:opacity-100 hover:grayscale-0">
              <Image src={logo.logo} alt={logo.name || 'Client logo'} fill sizes="96px" className="object-contain" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function TransportationTestimonials({ content, data }: { content: TransportationRecord; data?: TransportationPageData }) {
  const testimonials = (data?.proof?.testimonials ?? []).slice(0, Math.min(8, Math.max(0, Number(content.testimonialLimit ?? 3))))
  if (!testimonials.length) return null
  return (
    <section className="bg-[#06122f] py-8 text-white sm:py-10">
      <div className="mx-auto max-w-[1240px] px-6 lg:px-10">
        <div className="mb-5 grid gap-3 sm:grid-cols-[.65fr_1.35fr] sm:items-end">
          <div><p className="text-[9px] font-bold uppercase tracking-wider text-sky">{transportationText(content, 'testimonialsEyebrow')}</p><h2 className="mt-1 text-xl font-semibold leading-tight">{transportationText(content, 'testimonialsTitle')}</h2></div>
          {transportationText(content, 'testimonialsBody') ? <p className="max-w-lg text-[10px] leading-relaxed text-white/55 sm:justify-self-end">{transportationText(content, 'testimonialsBody')}</p> : null}
        </div>
        <Carousel label="Client testimonials" tone="dark" controls="sides">
          {testimonials.map((item: any, index: number) => (
            <li key={item._id || index} className="w-[82vw] shrink-0 snap-start sm:w-[48vw] lg:w-[calc((100%-40px)/3)]">
              <article className="flex h-full min-h-[190px] flex-col rounded-xl border border-white/10 bg-white/[.05] p-4 transition-colors hover:bg-white/[.08]">
                <Quote className="size-5 text-sky" aria-hidden />
                <p className="mt-2 flex-1 text-[10px] leading-relaxed text-white/80">“{item.quote}”</p>
                <div className="mt-4 flex items-center gap-3 border-t border-white/10 pt-3">
                  {item.personPhoto ? <div className="relative size-9 shrink-0 overflow-hidden rounded-full bg-white/10"><Image src={item.personPhoto} alt="" fill sizes="36px" className="object-cover" /></div> : <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-sky"><UsersRound className="size-4" aria-hidden /></span>}
                  <div className="min-w-0"><p className="truncate text-[10px] font-bold">{item.personName}</p><p className="truncate text-[9px] text-white/55">{[item.personTitle, item.company].filter(Boolean).join(', ')}</p></div>
                </div>
              </article>
            </li>
          ))}
        </Carousel>
      </div>
    </section>
  )
}

function TransportationRequest({ content, data }: { content: TransportationRecord; data?: TransportationPageData }) {
  const [formOpen, setFormOpen] = useState(false)
  const contact = data?.contact ?? {}
  const cards = transportationList<TransportationRecord>(content, 'ctaContactCards')
  const phone = String(contact.phone || '').trim()
  const email = String(contact.transportEmail || contact.email || '').trim()
  return (
    <section id="transport-request" className="scroll-mt-20 bg-[#04112e] py-8 text-white sm:py-10">
      <div className="mx-auto max-w-[1240px] px-6 lg:px-10">
        <div className="grid gap-5 lg:grid-cols-[.72fr_1.05fr_1fr] lg:items-center">
          <Reveal className="relative min-h-[210px] overflow-hidden rounded-xl bg-[#0a2350] sm:min-h-[250px]">
            <Image src={transportationText(content, 'ctaBackgroundImage', '/images/site/transport-hero.png')} alt={transportationText(content, 'ctaBackgroundAlt')} fill sizes="(max-width: 1024px) 100vw, 28vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#03102a]/30 to-transparent" />
          </Reveal>
          <Reveal delay={80}>
            <p className="text-[9px] font-bold uppercase tracking-wider text-sky">{transportationText(content, 'ctaEyebrow')}</p>
            <h2 className="mt-2 max-w-xl text-2xl font-semibold leading-tight sm:text-3xl">{transportationText(content, 'ctaTitle')}</h2>
            <p className="mt-2 max-w-lg text-[10px] leading-relaxed text-white/65">{transportationText(content, 'ctaBody')}</p>
            <button type="button" aria-expanded={formOpen} aria-controls="transport-enquiry-form" onClick={() => setFormOpen(value => !value)} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-full bg-azure px-4 text-[10px] font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-azure-deep">
              {formOpen ? transportationText(content, 'ctaFormCloseLabel', 'Close enquiry form') : transportationText(content, 'ctaButtonLabel', 'Request a Proposal')} <ArrowRight className="size-3.5" aria-hidden />
            </button>
          </Reveal>
          <div className="grid gap-2">
            {cards.map((card, index) => {
              const isPhone = /call|phone/i.test(String(card.title || ''))
              const isEmail = /email/i.test(String(card.title || ''))
              const value = card.body || (isPhone ? phone : isEmail ? email : 'Book a convenient slot')
              const fallbackHref = isPhone && phone ? 'tel:' + phone.replace(/[^+\d]/g, '') : isEmail && email ? 'mailto:' + email : '/contact'
              const href = card.href || fallbackHref
              return (
                <Reveal key={card.title || index} delay={index * 55}>
                  <a href={href} className="group flex min-h-[64px] items-center gap-3 rounded-xl border border-white/10 bg-white/[.055] px-4 py-3 transition-all hover:-translate-y-0.5 hover:border-sky/50 hover:bg-white/[.09]">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sky/10 text-sky"><TransportationIcon name={card.icon} className="size-4" /></span>
                    <span className="min-w-0 flex-1"><strong className="block text-[10px] font-bold">{card.title}</strong><span className="mt-0.5 block truncate text-[9px] text-white/60">{value}</span></span>
                    <ArrowRight className="size-4 shrink-0 text-sky transition-transform group-hover:translate-x-1" aria-hidden />
                  </a>
                </Reveal>
              )
            })}
          </div>
        </div>
        {formOpen ? (
          <div id="transport-enquiry-form" className="mt-7 scroll-mt-24 rounded-2xl border border-white/10 bg-white p-5 text-[#14234b] shadow-[0_16px_40px_-32px_rgba(10,28,65,.55)] sm:p-7">
            <div className="mb-4 text-center">
              <p className="text-[9px] font-bold uppercase tracking-wider text-azure">{transportationText(content, 'ctaFormEyebrow')}</p>
              <h3 className="mt-1 text-xl font-semibold">{transportationText(content, 'ctaFormTitle')}</h3>
              <p className="mt-1 text-[10px] text-[#64708b]">{transportationText(content, 'ctaFormBody')}</p>
            </div>
            <LeadForm variant="transport" compact />
          </div>
        ) : null}
      </div>
    </section>
  )
}

export function TransportationPage({ data }: { data?: TransportationPageData }) {
  const content = data?.content ?? {}
  return (
    <div data-page="local-transportation">
      {content.showHero !== false && <TransportationHero content={content} />}
      {content.showServices !== false && <TransportationServices content={content} />}
      {content.showBenefits !== false && <TransportationBenefits content={content} />}
      {content.showProcess !== false && <TransportationProcess content={content} />}
      {content.showFleet !== false && <FleetShowcase content={content} />}
      {content.showImpact !== false && <TransportationImpact content={content} />}
      {content.showLogos !== false && <TransportationLogos content={content} data={data} />}
      {content.showTestimonials !== false && <TransportationTestimonials content={content} data={data} />}
      {content.showCta !== false && <TransportationRequest content={content} data={data} />}
    </div>
  )
}

type AboutPageData = {
  team?: Array<{ _id: string; name: string; role?: string; bio?: string; photo?: string; linkedin?: string }>
  logos?: Array<{ _id: string; name: string; logo: string; url?: string }>
  proof?: { testimonials?: Array<{ _id: string; quote: string; personName: string; personTitle?: string; company?: string }> }
  contact?: Record<string, string>
  content?: Record<string, any> | null
}

const ABOUT_ICON_MAP: Record<string, React.ElementType> = {
  globe: Globe2, network: Network, layers: Network, users: Users,
  shield: ShieldCheck, 'shield-check': ShieldCheck, building: Building2,
  clock: Clock3, star: Sparkles, sparkles: Sparkles, lightbulb: Lightbulb,
  handshake: Handshake, leaf: Leaf, flag: Flag, car: CarFront,
  'car-front': CarFront, monitor: Monitor, rocket: ArrowRight,
  calendar: CalendarDays, 'heart-handshake': Handshake, 'headphones': Headphones,
}

function AboutIcon({ name, className }: { name?: string; className?: string }) {
  const Icon = ABOUT_ICON_MAP[(name || '').toLowerCase()] || ShieldCheck
  return <Icon className={className} aria-hidden strokeWidth={1.6} />
}

function AboutHighlightedText({ text, highlight, className }: { text: string; highlight?: string; className: string }) {
  if (!highlight) return <>{text}</>
  const index = text.toLowerCase().indexOf(highlight.toLowerCase())
  if (index < 0) return <>{text}</>
  return <>{text.slice(0, index)}<span className={className}>{text.slice(index, index + highlight.length)}</span>{text.slice(index + highlight.length)}</>
}

function AboutContactLinks({ contact, content, compact = false }: { contact?: Record<string, string>; content?: Record<string, any>; compact?: boolean }) {
  const phone = contact?.phone?.trim() || ''
  const email = contact?.email?.trim() || contact?.salesEmail?.trim() || ''
  const links = [
    { Icon: Phone, title: content?.contactPhoneLabel || 'Call Us', detail: phone || content?.contactPhoneFallback || 'Speak with our team', href: phone ? 'tel:' + phone.replace(/[^\d+]/g, '') : '/contact' },
    { Icon: Mail, title: content?.contactEmailLabel || 'Email Us', detail: email || content?.contactEmailFallback || 'Send us your requirements', href: email ? 'mailto:' + email : '/contact' },
    { Icon: CalendarCheck, title: content?.contactMeetingLabel || 'Schedule a Meeting', detail: content?.contactMeetingDetail || 'Book a convenient slot', href: content?.contactMeetingHref || '/contact' },
  ]
  return <div className={cn('grid gap-2', compact && 'gap-1.5')}>
    {links.map(({ Icon, title, detail, href }) => <a key={title} href={href} className={cn('group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.045] transition-all duration-300 hover:-translate-y-0.5 hover:border-sky/50 hover:bg-white/[.09] motion-reduce:transition-none motion-reduce:hover:translate-y-0', compact ? 'px-3 py-2.5' : 'px-4 py-3.5')}>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sky/10 text-sky"><Icon className="size-4.5" aria-hidden /></span>
      <span className="min-w-0 flex-1"><strong className="block text-[11px] font-bold text-white">{title}</strong><span className="mt-0.5 block truncate text-[9px] text-white/60">{detail}</span></span>
      <ArrowRight className="size-4 shrink-0 text-sky transition-transform group-hover:translate-x-1" aria-hidden />
    </a>)}
  </div>
}

const DEFAULT_ABOUT_VALUES = [
  { icon: 'users', title: 'Customer First', body: 'Our clients’ success is our success.' },
  { icon: 'shield-check', title: 'Integrity', body: 'We operate with honesty, transparency and respect.' },
  { icon: 'star', title: 'Excellence', body: 'We go the extra mile to deliver the best.' },
  { icon: 'lightbulb', title: 'Innovation', body: 'We embrace technology to create smarter solutions.' },
  { icon: 'handshake', title: 'Teamwork', body: 'We collaborate to achieve more together.' },
  { icon: 'leaf', title: 'Responsibility', body: 'We care for people, communities and our planet.' },
]
const DEFAULT_ABOUT_MILESTONES = [
  { icon: 'flag', year: '2010', description: 'GoAhead Mobility was founded.' },
  { icon: 'globe', year: '2013', description: 'Expanded accommodation network globally.' },
  { icon: 'car-front', year: '2016', description: 'Launched local transportation services.' },
  { icon: 'users', year: '2019', description: 'Reached 50+ countries and 1000+ corporate clients.' },
  { icon: 'monitor', year: '2022', description: 'Technology platform enhancements.' },
  { icon: 'rocket', year: '2024+', description: 'Continuing to innovate for the future.' },
]
const DEFAULT_ABOUT_METRICS = [
  { icon: 'building', value: '1M+', label: 'Happy Corporate Clients' },
  { icon: 'globe', value: '150+', label: 'Cities Served' },
  { icon: 'clock', value: '99.6%', label: 'On-time Performance' },
]
const DEFAULT_ABOUT_BADGES = [
  { icon: 'globe', label: 'Trusted by Businesses Worldwide' },
  { icon: 'layers', label: 'End-to-End Mobility Solutions' },
  { icon: 'users', label: 'People-Centric Service Approach' },
  { icon: 'shield-check', label: 'Safety, Compliance & Reliability' },
]

export function AboutPage({ data }: { data?: AboutPageData }) {
  const content = data?.content ?? {}
  const team = data?.team ?? []
  const logos = data?.logos ?? []
  const testimonials = data?.proof?.testimonials ?? []
  const contact = data?.contact ?? {}

  const heroTitle = content.heroTitle ?? 'Moving businesses\nforward, together.'
  const heroHighlight = content.heroHighlight ?? 'together.'
  const badges = Array.isArray(content.heroBadges) ? content.heroBadges : DEFAULT_ABOUT_BADGES
  const metrics = Array.isArray(content.metrics) ? content.metrics : DEFAULT_ABOUT_METRICS
  const values = Array.isArray(content.values) ? content.values : DEFAULT_ABOUT_VALUES
  const milestones = Array.isArray(content.milestones) ? content.milestones : DEFAULT_ABOUT_MILESTONES
  const storyTitle = content.storyTitle ?? 'A commitment to smarter, more connected mobility.'
  const ctaTitle = content.ctaTitle ?? 'Let’s build a better-connected business travel experience.'

  return <div data-page="about-us" className="overflow-hidden bg-white">
    {content.showHero !== false ? <section className="relative isolate min-h-[470px] overflow-hidden bg-[#030b20] text-white sm:min-h-[510px]">
      <Parallax amount={5} className="absolute inset-0"><Image src={content.heroImage || '/images/site/about-hero.png'} alt={content.heroImageAlt || ''} fill priority sizes="100vw" className="object-cover object-[58%_center]" /></Parallax>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,10,29,.98)_0%,rgba(2,10,29,.91)_33%,rgba(2,10,29,.48)_62%,rgba(2,10,29,.10)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(2,10,29,.80),transparent_40%)]" />
      <div className="relative mx-auto flex min-h-[470px] max-w-[1240px] items-start px-6 pb-24 pt-3 sm:min-h-[510px] lg:px-10">
        <Reveal y={32} className="max-w-[610px]">
          <nav aria-label="Breadcrumb" className="mb-7 flex items-center gap-2 text-[10px] text-white/65"><Link href="/" className="hover:text-white">Home</Link><ChevronRight className="size-3" aria-hidden /><span aria-current="page">About Us</span></nav>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[.22em] text-sky">{content.heroEyebrow ?? 'About GoAhead'}</p>
          <h1 className="whitespace-pre-line text-balance text-4xl font-semibold leading-[1.02] tracking-[-.045em] sm:text-5xl lg:text-[58px]"><AboutHighlightedText text={heroTitle} highlight={heroHighlight} className="text-sky" /></h1>
          <p className="mt-4 max-w-[470px] text-[13px] leading-relaxed text-white/80 sm:text-sm">{content.heroDescription ?? 'GoAhead Mobility provides integrated accommodation and transportation solutions that help businesses operate efficiently, care for their people and achieve more.'}</p>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            {content.heroPrimaryLabel !== '' ? <Button href={content.heroPrimaryHref || '/contact'}>{content.heroPrimaryLabel || 'Request a Proposal'}</Button> : null}
            {content.heroSecondaryLabel !== '' ? <Link href={content.heroSecondaryHref || '#story'} className="group inline-flex min-h-11 items-center gap-3 px-1 text-[10px] font-bold text-white transition-colors hover:text-sky">{content.heroSecondaryLabel || 'Explore Our Services'} <span className="flex size-7 items-center justify-center rounded-full border border-white/55 transition-all group-hover:border-sky group-hover:bg-sky/10"><ArrowRight className="size-3.5" aria-hidden /></span></Link> : null}
          </div>
        </Reveal>
      </div>
      <div className="absolute inset-x-0 bottom-5 z-10">
        <div className="mx-auto max-w-[1240px] px-6 lg:px-10">
          <div className="grid max-w-[650px] grid-cols-2 gap-2 sm:grid-cols-4">
            {badges.slice(0, 4).map((badge: any, i: number) => <Reveal key={badge.label + i} delay={i*55} className="flex min-h-[54px] items-center gap-2 rounded-lg border border-white/15 bg-[#061633]/65 px-2.5 py-2 backdrop-blur-md"><AboutIcon name={badge.icon} className="size-5 shrink-0 text-sky" /><span className="text-[9px] leading-snug text-white/90">{badge.label}</span></Reveal>)}
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent" />
    </section> : null}

    <div>
      {content.showStory !== false ? <section id="story" className="mx-auto grid max-w-[1240px] items-center gap-6 px-6 py-8 sm:py-10 lg:grid-cols-[1fr_1.05fr_.56fr] lg:gap-7 lg:px-10">
        <Reveal className="relative min-h-[230px] overflow-hidden rounded-xl border border-line bg-[#071b3d] sm:min-h-[270px]">
          <Parallax amount={4} className="absolute inset-0"><Image src={content.storyImage || '/images/site/about-story.png'} alt={content.storyImageAlt || 'City skyline and connected transport routes at dusk'} fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover" /></Parallax>
          <div className="absolute inset-0 bg-gradient-to-t from-[#04132e]/35 to-transparent" />
          {content.storyVideoUrl ? <a href={content.storyVideoUrl} target="_blank" rel="noreferrer" aria-label="Watch the GoAhead company story" className="absolute left-1/2 top-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/50 bg-[#0878ed]/90 shadow-[0_8px_30px_rgba(0,87,210,.45)] transition-transform hover:scale-105 motion-reduce:transition-none motion-reduce:hover:scale-100"><span className="ml-1 h-0 w-0 border-y-[9px] border-l-[13px] border-y-transparent border-l-white" /></a> : <span aria-hidden className="absolute left-1/2 top-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/50 bg-[#0878ed]/90 shadow-[0_8px_30px_rgba(0,87,210,.45)]"><span className="ml-1 h-0 w-0 border-y-[9px] border-l-[13px] border-y-transparent border-l-white" /></span>}
        </Reveal>
        <Reveal delay={70} className="self-center">
          <p className="text-[9px] font-bold uppercase tracking-[.2em] text-azure">{content.storyEyebrow ?? 'Our Story'}</p>
          <h2 className="mt-2 whitespace-pre-line text-[25px] font-semibold leading-[1.08] tracking-[-.035em] text-[#122148] sm:text-[29px]"><AboutHighlightedText text={storyTitle} highlight={content.storyHighlight ?? 'connected'} className="text-azure" /></h2>
          <p className="mt-3 text-[11px] leading-[1.7] text-[#526079]">{content.storyBody ?? 'Founded with a simple belief — business travel should be effortless. GoAhead brings global accommodation reach and local transportation expertise together to deliver a seamless experience for companies, their employees and project teams.'}</p>
          {content.storySecondaryBody ? <p className="mt-3 text-[11px] leading-[1.7] text-[#526079]">{content.storySecondaryBody}</p> : null}
        </Reveal>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 lg:grid-cols-1">
          {metrics.slice(0, 4).map((metric: any, i: number) => <Reveal key={metric.label + i} delay={i*65} className="flex min-h-[68px] items-center gap-3 rounded-xl border border-[#e5eaf2] bg-white px-3.5 py-3 shadow-[0_4px_18px_rgba(13,37,78,.055)] transition-all hover:-translate-y-0.5 hover:border-[#add4fb] motion-reduce:transition-none motion-reduce:hover:translate-y-0"><span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-azure/35 text-azure"><AboutIcon name={metric.icon} className="size-5" /></span><span><strong className="block text-[22px] font-bold tracking-tight text-azure"><CountUp value={String(metric.value)} /></strong><span className="text-[9px] text-[#65718a]">{metric.label}</span></span></Reveal>)}
        </div>
      </section> : null}

      {content.showValues !== false ? <section className="bg-[#f6f8fc] py-8 sm:py-10">
        <div className="mx-auto max-w-[1240px] px-6 lg:px-10">
          <div className="mb-7 text-center"><p className="text-[9px] font-bold uppercase tracking-[.2em] text-azure">{content.valuesEyebrow ?? 'Our Values'}</p><h2 className="mt-1.5 text-xl font-semibold tracking-tight text-[#122148] sm:text-2xl">{content.valuesTitle ?? 'The principles that drive everything we do.'}</h2></div>
          <div className="grid grid-cols-2 gap-y-7 sm:grid-cols-3 lg:grid-cols-6">
            {values.slice(0, 8).map((item: any, i: number) => <Reveal key={item.title + i} delay={i*45} className="group flex flex-col items-center border-[#dce5f1] px-3 text-center sm:border-r last:border-0"><AboutIcon name={item.icon} className="size-8 text-[#3288dc] transition-transform duration-300 group-hover:-translate-y-1 motion-reduce:transition-none motion-reduce:transform-none" /><h3 className="mt-3 text-[11px] font-bold text-[#15244a]">{item.title}</h3><p className="mt-1.5 max-w-[155px] text-[9px] leading-relaxed text-[#68738b]">{item.body}</p></Reveal>)}
          </div>
        </div>
      </section> : null}

      {content.showJourney !== false ? <section className="relative isolate overflow-hidden bg-[#03132f] py-9 text-white sm:py-11">
        {content.journeyBackgroundImage ? <div className="absolute inset-0 opacity-20"><Image src={content.journeyBackgroundImage} alt="" fill sizes="100vw" className="object-cover" /></div> : <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[.12] [background-image:radial-gradient(#1489dc_1px,transparent_1px)] [background-size:14px_14px]" />}
        <div aria-hidden className="pointer-events-none absolute -left-20 top-8 size-72 rounded-full border border-sky/20" />
        <div aria-hidden className="pointer-events-none absolute -right-20 bottom-0 size-80 rounded-full border border-sky/20" />
        <div className="relative mx-auto max-w-[1240px] px-6 lg:px-10">
          <div className="mb-7 text-center"><p className="text-[9px] font-bold uppercase tracking-[.2em] text-sky">{content.journeyEyebrow ?? 'Our Journey'}</p><h2 className="mt-1.5 text-xl font-semibold sm:text-2xl">{content.journeyTitle ?? 'Milestones that define our growth.'}</h2></div>
          <div className="relative grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            <ProgressRail className="absolute left-[7%] right-[7%] top-6 hidden h-px bg-sky/55 lg:block" />
            {milestones.slice(0, 10).map((item: any, i: number) => <Reveal key={item.year + i} delay={i*60} className="relative flex flex-col items-center text-center"><span className="flex size-12 items-center justify-center rounded-full border border-sky/65 bg-[#061a3a] text-sky shadow-[0_0_0_6px_#03132f] transition-all duration-300 hover:scale-105 hover:border-white motion-reduce:transition-none motion-reduce:hover:scale-100"><AboutIcon name={item.icon} className="size-5" /></span><strong className="mt-3 text-lg font-bold text-sky">{item.year}</strong><p className="mt-1.5 max-w-[145px] text-[9px] leading-relaxed text-white/70">{item.description}</p></Reveal>)}
          </div>
        </div>
      </section> : null}

      {content.showLeadership !== false ? <section id="leadership" className="mx-auto max-w-[1240px] px-6 py-9 sm:py-11 lg:px-10">
        <div className="mb-6 text-center"><p className="text-[9px] font-bold uppercase tracking-[.2em] text-azure">{content.leadershipEyebrow ?? 'Leadership Team'}</p><h2 className="mt-1.5 text-xl font-semibold tracking-tight text-[#14234b] sm:text-2xl">{content.leadershipTitle ?? 'Experienced leaders. Shared vision.'}</h2>{content.leadershipDescription ? <p className="mt-2 text-xs text-muted-foreground">{content.leadershipDescription}</p> : null}</div>
        {team.length ? <Carousel label="GoAhead leadership team" controls="sides"><>{team.map((person,i) => <li key={person._id} className="w-[69vw] shrink-0 snap-start sm:w-[34vw] lg:w-[calc((100%-64px)/5)]"><Reveal delay={i*45} className="h-full overflow-hidden rounded-xl border border-[#e2e8f1] bg-white shadow-[0_3px_12px_rgba(8,25,57,.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl motion-reduce:transition-none motion-reduce:hover:translate-y-0"><article className="h-full"><div className="relative aspect-[1.45] bg-[#e9eef5]">{person.photo ? <Image src={person.photo} alt={person.name} fill sizes="(max-width: 640px) 69vw, 20vw" className="object-cover object-top transition-transform duration-500 hover:scale-[1.025] motion-reduce:transition-none motion-reduce:hover:scale-100" /> : <div className="flex h-full items-center justify-center"><Users className="size-12 text-slate-300" aria-hidden /></div>}</div><div className="p-3"><h3 className="text-[10px] font-bold text-[#17264b] sm:text-[11px]">{person.name}</h3><p className="mt-1 min-h-7 text-[9px] leading-relaxed text-[#66718a]">{person.role}</p>{person.linkedin ? <a href={person.linkedin} target="_blank" rel="noreferrer" aria-label={person.name + ' on LinkedIn'} className="mt-1.5 inline-flex text-[#1676b9] transition hover:text-azure"><Linkedin className="size-4" /></a> : null}</div></article></Reveal></li>)}</></Carousel> : <div className="rounded-xl border border-dashed border-line bg-paper px-5 py-8 text-center text-xs text-muted-foreground">Leadership profiles will appear here when published by the GoAhead team.</div>}
        {content.leadershipButtonLabel !== '' ? <div className="mt-5 text-center"><Button href={content.leadershipButtonHref || '/contact'}>{content.leadershipButtonLabel || 'Meet Our Team'}</Button></div> : null}
      </section> : null}

      {content.showPartners !== false ? <section className="border-y border-line bg-[#f6f8fc] py-8 sm:py-9">
        <div className="mx-auto max-w-[1240px] px-6 lg:px-10">
          <div className="mb-5 text-center"><p className="text-[9px] font-bold uppercase tracking-[.2em] text-azure">{content.partnersEyebrow ?? 'Our Partners'}</p><h2 className="mt-1.5 text-xl font-semibold text-[#14234b] sm:text-2xl">{content.partnersTitle ?? 'Strong partnerships. Global reach.'}</h2></div>
          {logos.length ? <Carousel label="Approved GoAhead partners" controls="sides"><>{logos.map((logo) => <li key={logo._id} className="flex w-[42vw] shrink-0 snap-start items-center justify-center rounded-xl border border-[#e3e9f1] bg-white p-5 shadow-[0_3px_12px_rgba(8,25,57,.04)] sm:w-48"><div className="relative h-10 w-full"><Image src={logo.logo} alt={logo.name} fill sizes="192px" className="object-contain" /></div></li>)}</></Carousel> : <div className="rounded-xl border border-dashed border-line bg-white px-5 py-6 text-center text-xs text-muted-foreground">Partner logos will appear here as approved partner records are published.</div>}
        </div>
      </section> : null}

      {content.showTestimonials !== false ? <section className="relative isolate overflow-hidden bg-[#03132f] py-9 text-white sm:py-11">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[.12] [background-image:radial-gradient(#1688db_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="relative mx-auto max-w-[1240px] px-6 lg:px-10">
          <div className="mb-6 text-center"><p className="text-[9px] font-bold uppercase tracking-[.2em] text-sky">{content.testimonialsEyebrow ?? 'What Our Clients Say'}</p><h2 className="mt-1.5 text-xl font-semibold sm:text-2xl">{content.testimonialsTitle ?? 'Trusted by businesses that value every journey.'}</h2></div>
          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="min-w-0">
              {testimonials.length ? <Carousel label="GoAhead client testimonials" tone="dark" controls="sides"><>{testimonials.slice(0,6).map((item,i) => <li key={item._id} className="w-[78vw] shrink-0 snap-start sm:w-[44vw] lg:w-[calc((100%-40px)/3)]"><Reveal delay={i*50} className="h-full rounded-xl border border-white/15 bg-white/[.045] p-4 transition-all duration-300 hover:-translate-y-1 hover:border-sky/50 hover:bg-white/[.075] motion-reduce:transition-none motion-reduce:hover:translate-y-0"><Quote className="size-5 text-sky" aria-hidden /><p className="mt-2.5 min-h-[76px] text-[10px] leading-[1.65] text-white/80">“{item.quote}”</p><div className="mt-3 border-t border-white/10 pt-3"><p className="text-[10px] font-bold">{item.personName}</p><p className="mt-1 text-[9px] text-white/55">{[item.personTitle,item.company].filter(Boolean).join(' · ')}</p></div></Reveal></li>)}</></Carousel> : <div className="rounded-xl border border-dashed border-white/20 bg-white/[.04] px-5 py-8 text-center text-xs text-white/60">Client stories will appear here when approved testimonials are published.</div>}
            </div>
            <AboutContactLinks contact={contact} content={content} />
          </div>
        </div>
      </section> : null}

      {content.showCta !== false ? <section className="border-t border-white/10 bg-[#020d24] py-8 text-white sm:py-10">
        <div className="mx-auto grid max-w-[1240px] gap-6 px-6 lg:grid-cols-[1.05fr_.8fr_1fr] lg:items-center lg:px-10">
          <h2 className="whitespace-pre-line text-[27px] font-semibold leading-[1.08] tracking-[-.035em] sm:text-3xl"><AboutHighlightedText text={ctaTitle} highlight={content.ctaHighlight || 'better-connected'} className="text-sky" /></h2>
          <div className="border-l border-white/15 pl-5"><p className="text-[11px] leading-relaxed text-white/70">{content.ctaBody ?? 'Our team is ready to understand your needs and create the right solution for your business.'}</p>{content.ctaButtonLabel !== '' ? <div className="mt-4"><Button href={content.ctaButtonHref || '/contact'}>{content.ctaButtonLabel || 'Request a Proposal'}</Button></div> : null}</div>
          <AboutContactLinks contact={contact} content={content} compact />
        </div>
      </section> : null}
    </div>
  </div>
}

type IndustriesPageData = {
  industries?: Array<{ _id: string; slug: string; title: string; summary?: string; context?: string; image?: string; icon?: string }>
  caseStudies?: Array<{ _id: string; slug: string; title: string; summary?: string; image?: string; vertical?: string; industrySlugs?: string[]; results?: Array<{ label: string; value: string }>; disclaimer?: string }>
  logos?: Array<{ _id: string; name: string; logo: string; url?: string }>
  contact?: Record<string, string>
}
const industryImages: Record<string,string> = {
  technology:'/images/site/ind-it.png', manufacturing:'/images/site/ind-manufacturing.png',
  'energy-infrastructure':'/images/site/ind-energy.png', 'events-associations':'/images/site/ind-events.png',
  healthcare:'/images/site/ind-healthcare.png', consulting:'/images/site/ind-corporate.png',
}
const industryIcons: Record<string,React.ElementType> = {
  cpu:Code2, factory:Settings, building:Building2, calendar:CalendarDays, heart:HeartPulse,
  briefcase:BriefcaseBusiness, monitor:Monitor, oil:Droplets, energy:Waves, education:GraduationCap,
}

function IndustriesHero({ industries=[] }: { industries?: IndustriesPageData['industries'] }) {
  const tabs = [
    [Building2,'Corporate & Enterprises','corporate'],[Code2,'IT & Technology','technology'],
    [Settings,'Manufacturing & Engineering','manufacturing'],[HeartPulse,'Healthcare & Pharma','healthcare'],
    [Droplets,'Oil, Gas & Energy','energy-infrastructure'],[CalendarDays,'Events & Conferences','events-associations'],
    [GraduationCap,'Education Institutions','education'],[Landmark,'Government & Public Sector','government'],
  ] as const
  return <section className="relative isolate overflow-hidden bg-[#030b20] text-white">
    <div className="absolute inset-0"><Parallax amount={4} className="absolute inset-0"><Image src="/images/site/industries-hero.png" alt="Corporate transport in a city at night" fill priority sizes="100vw" className="object-cover object-[62%_center]" /></Parallax></div>
    <div className="absolute inset-0 bg-[linear-gradient(90deg,#030b20_0%,rgba(3,11,32,.94)_30%,rgba(3,11,32,.45)_62%,rgba(3,11,32,.08)_100%)]" />
    <div className="absolute inset-0 bg-[linear-gradient(0deg,#030b20_0%,transparent_42%)]" />
    <div className="relative mx-auto max-w-[1240px] px-6 pb-7 pt-5 lg:px-10 lg:pb-8">
      <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-2 text-[10px] text-white/65"><Link href="/">Home</Link><ChevronRight className="size-3" aria-hidden /><span aria-current="page">Industries</span></nav>
      <Reveal y={26} className="max-w-[550px]">
        <p className="mb-2 text-[9px] font-bold uppercase tracking-[.2em] text-sky">Industries we serve</p>
        <h1 className="text-balance text-[clamp(2.5rem,5vw,4.2rem)] font-semibold leading-[1.02] tracking-[-.05em]">Solutions tailored<br/>for every <span className="text-sky">industry.</span></h1>
        <p className="mt-4 max-w-[420px] text-[12px] leading-relaxed text-white/75 sm:text-sm">We understand that every industry has unique travel, accommodation and transportation needs. Our solutions are built to deliver efficiency, comfort and control.</p>
        <div className="mt-5 flex flex-wrap items-center gap-4"><Button href="/contact">Request a proposal</Button><Link href="#industry-cards" className="inline-flex min-h-11 items-center gap-2 text-[10px] font-bold text-white hover:text-sky">Explore our services <ArrowRight className="size-4" aria-hidden /></Link></div>
      </Reveal>
    </div>
    <div className="relative border-t border-white/10 bg-[#030b20]/85 backdrop-blur-sm"><div className="mx-auto grid max-w-[1240px] grid-cols-2 gap-y-2 px-6 py-4 sm:grid-cols-4 lg:grid-cols-8 lg:px-10">
      {tabs.map(([Icon,label,slug],i)=><Reveal key={slug} delay={i*35}><Link href={(industries ?? []).some(x=>x.slug===slug)?'#industry-'+slug:'#industry-cards'} className="group flex h-full flex-col items-center justify-center gap-2 border-r border-white/10 px-2 py-2 text-center last:border-0"><Icon className="size-6 text-[#5aa9f5] transition-transform group-hover:-translate-y-1" strokeWidth={1.6} aria-hidden/><span className="max-w-[125px] text-[9px] font-semibold leading-snug text-white/90">{label}</span></Link></Reveal>)}
    </div></div>
  </section>
}

function IndustryFocus({ items }: { items: NonNullable<IndustriesPageData['industries']> }) {
  return <section id="industry-cards" className="scroll-mt-20 bg-[#f7f9fc] py-8 sm:py-10"><div className="mx-auto max-w-[1240px] px-6 lg:px-10">
    <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_.8fr] sm:items-end"><div><p className="text-[9px] font-bold uppercase tracking-[.2em] text-azure">Industry focus</p><h2 className="mt-1 text-xl font-semibold text-[#14234b] sm:text-2xl">Solutions that drive results</h2></div><p className="max-w-md text-[10px] leading-relaxed text-[#64708b] sm:justify-self-end">From global accommodation to local transportation, we deliver seamless experiences that help your business operate better.</p></div>
    <Carousel label="Industry solutions" controls="sides">{items.map((item,i)=>{const Icon=industryIcons[(item.icon??'').toLowerCase()]??Building2;const image=item.image?.startsWith('/')?item.image:industryImages[item.slug]??'/images/site/ind-corporate.png';return <li id={'industry-'+item.slug} key={item._id} className="w-[72vw] shrink-0 snap-start sm:w-[42vw] lg:w-[calc((100%-100px)/5)]"><Reveal delay={i*45} className="group h-full overflow-hidden rounded-xl border border-[#e5eaf2] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-azure/40 hover:shadow-lg"><Link href={'/industries/'+item.slug} className="block h-full"><div className="relative aspect-[1.28] overflow-hidden bg-[#e9eef5]"><Image src={image} alt={item.title} fill sizes="(max-width:640px) 72vw,20vw" className="object-cover transition-transform duration-700 group-hover:scale-105"/></div><div className="relative px-3 pb-3 pt-0"><span className="-mt-4 mb-2 flex size-8 items-center justify-center rounded-full border-2 border-white bg-azure text-white"><Icon className="size-3.5" aria-hidden/></span><h3 className="text-[10px] font-bold leading-snug text-[#14234b] sm:text-[11px]">{item.title}</h3><p className="mt-1.5 line-clamp-3 text-[9px] leading-relaxed text-[#64708b]">{item.summary||item.context}</p><span className="mt-2 inline-flex items-center gap-1 text-[9px] font-bold text-azure">Learn more <ArrowRight className="size-3" aria-hidden/></span></div></Link></Reveal></li>})}</Carousel>
    <div className="mt-4 text-center"><Link href="/industries" className="inline-flex min-h-9 items-center gap-2 rounded-full bg-azure px-5 text-[10px] font-bold text-white">View all industries <ArrowRight className="size-3.5" aria-hidden/></Link></div>
  </div></section>
}

function IndustryAdvantages() {
  const points=[[UsersRound,'Industry expertise','We understand your business and its challenges.'],[ShieldCheck,'Customised solutions','Tailored services that fit your needs.'],[Globe2,'Global reach, local care','Worldwide network with personalised support.'],[CircleDollarSign,'Cost efficiency','Optimised solutions that deliver measurable value.'],[Droplets,'Safety & compliance','High standards for safety and compliance.'],[Headphones,'24/7 dedicated support','Always there when you need us.']] as const
  return <section className="bg-[#04102d] py-7 text-white sm:py-9"><div className="mx-auto max-w-[1240px] px-6 lg:px-10"><div className="mb-5 text-center"><p className="text-[9px] font-bold uppercase tracking-[.2em] text-sky">Why industries choose GoAhead</p><h2 className="mt-1 text-xl font-semibold sm:text-2xl">The GoAhead advantage for your industry</h2></div><div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">{points.map(([Icon,title,body],i)=><Reveal key={title} delay={i*55} className="flex items-start gap-2 border-t border-white/15 pt-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-sky/40 text-sky"><Icon className="size-4" aria-hidden/></span><span><strong className="block text-[9px] font-bold">{title}</strong><span className="mt-1 block text-[8px] leading-relaxed text-white/60">{body}</span></span></Reveal>)}</div></div></section>
}

function IndustrySuccessStories({ items }: { items: NonNullable<IndustriesPageData['caseStudies']> }) {
  if(!items.length)return null
  return <section className="mx-auto max-w-[1240px] px-6 py-8 sm:py-10 lg:px-10"><div className="mb-5 flex items-end justify-between gap-4"><div><p className="text-[9px] font-bold uppercase tracking-[.2em] text-azure">Success stories</p><h2 className="mt-1 text-xl font-semibold text-[#14234b] sm:text-2xl">Real impact. Real results.</h2></div><Link href="/case-studies" className="shrink-0 text-[9px] font-bold text-azure">View all case studies <ArrowRight className="inline size-3" aria-hidden/></Link></div>
    <Carousel label="Industry case studies" controls="sides">{items.slice(0,6).map((item,i)=>{const image=item.image?.startsWith('/')?item.image:industryImages[item.industrySlugs?.[0]??'']??(item.vertical==='transport'?'/images/site/transport-hero.png':'/images/site/ind-corporate.png');const category=item.industrySlugs?.[0]?.replace(/-/g,' ')||item.vertical||'Business travel';return <li key={item._id} className="w-[82vw] shrink-0 snap-start sm:w-[46vw] lg:w-[calc((100%-40px)/3)]"><Reveal delay={i*60} className="h-full overflow-hidden rounded-xl border border-line bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"><div className="relative aspect-[2.15] overflow-hidden"><Image src={image} alt="" fill sizes="(max-width:640px) 82vw,33vw" className="object-cover"/><span className="absolute bottom-2 left-3 rounded-full bg-azure px-2.5 py-1 text-[8px] font-bold uppercase text-white">{category}</span></div><div className="p-4"><h3 className="text-[12px] font-bold leading-snug text-[#14234b]">{item.title}</h3><p className="mt-2 line-clamp-2 text-[9px] leading-relaxed text-[#64708b]">{item.summary}</p>{item.results?.length?<div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-3">{item.results.slice(0,3).map(result=><div key={result.label}><strong className="block text-sm font-bold text-azure">{result.value}</strong><span className="text-[8px] text-[#64708b]">{result.label}</span></div>)}</div>:null}{item.disclaimer?<p className="mt-3 text-[8px] leading-relaxed text-[#7a8498]">{item.disclaimer}</p>:null}<Link href={'/case-studies/'+item.slug} className="mt-3 inline-flex items-center gap-1 text-[9px] font-bold text-azure">Read case study <ArrowRight className="size-3" aria-hidden/></Link></div></Reveal></li>})}</Carousel>
  </section>
}

function IndustryPartners({ items }: { items: NonNullable<IndustriesPageData['logos']> }) {
  if(!items.length)return null
  return <section className="border-y border-line bg-[#f7f9fc] py-5"><div className="mx-auto max-w-[1240px] px-6 lg:px-10"><p className="mb-4 text-center text-[9px] font-bold uppercase tracking-[.2em] text-azure">Trusted by industry leaders</p><div className="flex flex-wrap items-center justify-center gap-3">{items.slice(0,10).map(logo=><div key={logo._id} className="flex h-12 w-[calc(50%-8px)] items-center justify-center rounded-lg border border-line bg-white px-4 sm:w-[calc(25%-12px)] lg:w-[calc(12.5%-12px)]"><div className="relative h-7 w-full"><Image src={logo.logo} alt={logo.name} fill sizes="120px" className="object-contain"/></div></div>)}</div></div></section>
}

function IndustryContactBand({ contact }: { contact?: Record<string, string> }) {
  const links=[[Phone,'Call us',contact?.phone || 'Speak with our team',contact?.phone ? 'tel:'+contact.phone : '/contact'],[Mail,'Email us',contact?.email || 'Share your requirements',contact?.email ? 'mailto:'+contact.email : '/contact'],[CalendarCheck,'Schedule a meeting','Book a convenient slot','/contact']] as const
  return <section id="contact" className="relative isolate overflow-hidden bg-[#030b20] py-9 text-white sm:py-12"><div className="absolute inset-0"><Image src="/images/site/transport-hero.png" alt="" fill sizes="100vw" className="object-cover opacity-25"/></div><div className="absolute inset-0 bg-[linear-gradient(90deg,#030b20_0%,rgba(3,11,32,.96)_55%,rgba(3,11,32,.55)_100%)]"/><div className="relative mx-auto grid max-w-[1240px] gap-6 px-6 lg:grid-cols-[1.15fr_.8fr_.65fr] lg:items-center lg:px-10"><div><p className="text-[9px] font-bold uppercase tracking-[.2em] text-sky">Ready to partner with GoAhead?</p><h2 className="mt-2 max-w-xl text-3xl font-semibold leading-tight sm:text-4xl">Let’s build a solution that fits your <span className="text-sky">industry.</span></h2><div className="mt-5"><Button href="/contact">Request a proposal</Button></div></div><div className="grid gap-2 rounded-xl border border-white/10 bg-[#061633]/85 p-3 backdrop-blur">{links.map(([Icon,title,body,href])=><Link key={title} href={href} className="group flex items-center gap-3 border-b border-white/10 px-2 py-3 last:border-0"><Icon className="size-5 shrink-0 text-sky" aria-hidden/><span className="min-w-0 flex-1"><strong className="block text-[10px]">{title}</strong><span className="text-[8px] text-white/60">{body}</span></span><ArrowRight className="size-4 text-sky transition-transform group-hover:translate-x-1" aria-hidden/></Link>)}</div><div className="relative hidden aspect-[4/5] overflow-hidden rounded-xl lg:block"><Image src="/images/site/cta-agent.png" alt="GoAhead team member ready to help" fill sizes="22vw" className="object-cover object-top"/></div></div></section>
}

export function IndustriesPage({ data }: { data?: IndustriesPageData }) {
  const items=data?.industries??[]
  return <div data-page="industries"><IndustriesHero industries={items}/><main>{items.length?<IndustryFocus items={items}/>:<section id="industry-cards" className="px-6 py-12 text-center text-sm text-muted-foreground">Industry programmes will appear here as they are published.</section>}<IndustryAdvantages/><IndustrySuccessStories items={data?.caseStudies??[]}/><IndustryPartners items={data?.logos??[]}/><IndustryContactBand contact={data?.contact}/></main></div>
}

export function MarketingPage({ path, cmsPage, homeData, accommodationData, transportationData, aboutData, industriesData }: { path: string; cmsPage?: { _id?: string; id?: string; path?: string; title?: string } | null; homeData?: HomeData; accommodationData?: AccommodationPageData; transportationData?: TransportationPageData; aboutData?: AboutPageData; industriesData?: IndustriesPageData }) {
  if (path === '/global-accommodation') return <AccommodationPage data={accommodationData} />
  if (path === '/local-transportation') return <TransportationPage data={transportationData} />
  if (path === '/about-us' || path === '/company/about-us') return <AboutPage data={aboutData} />
  if (path === '/industries') return <IndustriesPage data={industriesData} />
  return <HomePage cmsPage={cmsPage} homeData={homeData} />
}
