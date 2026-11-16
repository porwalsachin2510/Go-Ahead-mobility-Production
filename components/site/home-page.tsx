'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight, BadgeCheck, BedDouble, BriefcaseBusiness, Building2, BusFront, CalendarDays,
  CarFront, Check, Factory, Globe2, GraduationCap, HeartPulse, Headphones, Landmark,
  Laptop2, LockKeyhole, MapPin, Monitor, Network, Route, ShieldCheck, Store, Users,
  UsersRound,
} from 'lucide-react'
import { Reveal } from '@/components/motion/reveal'
import { Parallax, ProgressRail, RouteGraphic } from '@/components/motion/gsap-effects'
import { FaqAccordion, type FaqItem } from '@/components/motion/faq-accordion'
import { DEFAULT_HOME_PAGE_CONTENT } from '@/lib/homepage/defaults'
import { cn } from '@/lib/utils'

type HomeRecord = Record<string, any>
type HomeData = {
  faqs?: { _id?: string; question: string; answer: string }[]
  posts?: { slug: string; title: string; excerpt?: string; heroImage?: string; heroAlt?: string }[]
  resources?: { slug: string; title: string; summary?: string; image?: string; coverImage?: string; resourceType?: string; href?: string }[]
  content?: HomeRecord
}

type HomeProps = {
  cmsPage?: { _id?: string; id?: string; path?: string; title?: string } | null
  homeData?: HomeData
}

const ICONS: Record<string, typeof ArrowRight> = {
  'arrow-right': ArrowRight,
  'badge-check': BadgeCheck,
  bed: BedDouble,
  'bed-double': BedDouble,
  briefcase: BriefcaseBusiness,
  'briefcase-business': BriefcaseBusiness,
  building: Building2,
  'building-2': Building2,
  bus: BusFront,
  'bus-front': BusFront,
  calendar: CalendarDays,
  'calendar-days': CalendarDays,
  car: CarFront,
  'car-front': CarFront,
  check: Check,
  factory: Factory,
  globe: Globe2,
  'globe-2': Globe2,
  graduation: GraduationCap,
  'graduation-cap': GraduationCap,
  heart: HeartPulse,
  'heart-pulse': HeartPulse,
  headset: Headphones,
  headphones: Headphones,
  landmark: Landmark,
  laptop: Laptop2,
  'laptop-2': Laptop2,
  lock: LockKeyhole,
  'lock-keyhole': LockKeyhole,
  map: MapPin,
  'map-pin': MapPin,
  monitor: Monitor,
  network: Network,
  route: Route,
  shield: ShieldCheck,
  'shield-check': ShieldCheck,
  store: Store,
  users: Users,
  'users-round': UsersRound,
}

function HomeIcon({ name, fallback = ArrowRight, className }: { name?: string; fallback?: typeof ArrowRight; className?: string }) {
  const Icon = (name ? ICONS[name.toLowerCase()] : undefined) ?? fallback
  return <Icon className={className} aria-hidden="true" />
}

function textValue(content: HomeRecord, key: string, fallback: string) {
  const value = content[key]
  return typeof value === 'string' && value.trim() ? value : fallback
}

function listValue<T>(content: HomeRecord, key: string, fallback: readonly T[]): T[] {
  return Array.isArray(content[key]) ? content[key] as T[] : [...fallback]
}

function visible(content: HomeRecord, key: string) {
  return content[key] !== false
}

function PrimaryAction({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href || '/contact'} className="group inline-flex min-h-11 items-center justify-center gap-3 rounded-md bg-[#079be5] px-5 text-xs font-bold text-white shadow-[0_8px_24px_-12px_rgba(0,153,229,.85)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#087fca] hover:shadow-lg">
      {children}<ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
    </Link>
  )
}

function Hero({ content }: { content: HomeRecord }) {
  const cards = listValue(content, 'heroServiceCards', DEFAULT_HOME_PAGE_CONTENT.heroServiceCards)
  return (
    <section className="relative isolate min-h-[610px] overflow-hidden bg-[#050b1d] text-white sm:min-h-[650px] lg:min-h-[680px]">
      <div className="absolute inset-0">
        <Parallax amount={7} className="home-hero-parallax absolute inset-0">
          <Image
            src={textValue(content, 'heroImage', DEFAULT_HOME_PAGE_CONTENT.heroImage)}
            alt={textValue(content, 'heroImageAlt', DEFAULT_HOME_PAGE_CONTENT.heroImageAlt)}
            fill
            priority
            loading="eager"
            sizes="100vw"
            className="object-cover object-[62%_center]"
          />
        </Parallax>
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#050b1d_0%,rgba(5,11,29,.98)_22%,rgba(5,11,29,.83)_43%,rgba(5,11,29,.18)_78%,rgba(5,11,29,.08)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_76%_58%,transparent_0%,rgba(5,11,29,.12)_44%,rgba(5,11,29,.42)_100%)]" />
      <div aria-hidden className="absolute bottom-0 left-9 top-0 hidden w-px bg-gradient-to-b from-transparent via-[#26ade4]/70 to-transparent lg:block" />
      <div className="relative z-10 mx-auto flex min-h-[inherit] max-w-[1240px] items-center px-6 py-20 lg:px-10">
        <Reveal className="home-hero-reveal max-w-[590px]" y={36}>
          <p className="home-hero-enter home-hero-enter--eyebrow mb-5 text-[11px] font-bold uppercase tracking-[.22em] text-[#26ade4] sm:text-xs">{textValue(content, 'heroEyebrow', DEFAULT_HOME_PAGE_CONTENT.heroEyebrow)}</p>
          <h1 className="home-hero-enter home-hero-enter--headline max-w-[570px] text-balance text-[clamp(2.75rem,5.8vw,5.35rem)] font-semibold leading-[.98] tracking-[-.055em]">
            {textValue(content, 'heroTitle', DEFAULT_HOME_PAGE_CONTENT.heroTitle)}
            <span className="block text-[#26ade4]">{textValue(content, 'heroAccentLine1', DEFAULT_HOME_PAGE_CONTENT.heroAccentLine1)}</span>
            <span className="block text-[#26ade4]">{textValue(content, 'heroAccentLine2', DEFAULT_HOME_PAGE_CONTENT.heroAccentLine2)}</span>
          </h1>
          <p className="home-hero-enter home-hero-enter--description mt-6 max-w-[440px] text-sm leading-relaxed text-white/80 sm:text-base">{textValue(content, 'heroDescription', DEFAULT_HOME_PAGE_CONTENT.heroDescription)}</p>
          <div className="mt-7 grid max-w-[570px] gap-3 sm:grid-cols-2">
            {cards.map((card: HomeRecord, index: number) => (
              <Link key={card.title || index} href={card.href || '/contact'} style={{ animationDelay: `${420 + index * 100}ms` }} className="home-hero-enter home-hero-card group flex min-h-[88px] items-center gap-3 rounded-xl border border-white/70 bg-white px-4 py-3 text-[#101b42] shadow-[0_12px_35px_-22px_rgba(0,0,0,.8)] transition-all duration-300 hover:-translate-y-1 hover:border-[#26ade4] hover:shadow-xl">
                <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg text-white', index === 1 ? 'bg-[#102044]' : 'bg-[#079be5]')}>
                  <HomeIcon name={card.icon} fallback={index === 1 ? CarFront : BedDouble} className="size-5" />
                </span>
                <span className="min-w-0">
                  <strong className="block text-sm font-bold">{card.title}</strong>
                  <span className="mt-1 block text-[11px] leading-relaxed text-[#5c6681]">{card.body}</span>
                </span>
                <ArrowRight className="ml-auto size-4 shrink-0 text-[#1689d8] transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            ))}
          </div>
          <div className="home-hero-enter home-hero-enter--actions mt-7 flex flex-wrap items-center gap-5">
            <PrimaryAction href={textValue(content, 'heroPrimaryHref', DEFAULT_HOME_PAGE_CONTENT.heroPrimaryHref)}>
              {textValue(content, 'heroPrimaryLabel', DEFAULT_HOME_PAGE_CONTENT.heroPrimaryLabel)}
            </PrimaryAction>
            <Link href={textValue(content, 'heroSecondaryHref', DEFAULT_HOME_PAGE_CONTENT.heroSecondaryHref)} className="group inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-white transition-colors hover:text-[#26ade4]">
              {textValue(content, 'heroSecondaryLabel', DEFAULT_HOME_PAGE_CONTENT.heroSecondaryLabel)}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </div>
        </Reveal>
      </div>
      <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1 text-[9px] font-semibold uppercase tracking-[.2em] text-white/55">
        <span>{textValue(content, 'heroScrollLabel', DEFAULT_HOME_PAGE_CONTENT.heroScrollLabel)}</span>
        <span aria-hidden className="relative h-7 w-px overflow-hidden bg-white/30"><span className="absolute left-0 top-0 h-3 w-px animate-[route_2.4s_ease-in-out_infinite] bg-[#26ade4]" /></span>
        <span aria-hidden className="size-1.5 rounded-full border border-[#26ade4]" />
      </div>
    </section>
  )
}

function TrustStrip({ content }: { content: HomeRecord }) {
  const items = listValue(content, 'trustItems', DEFAULT_HOME_PAGE_CONTENT.trustItems)
  return (
    <section className="relative overflow-hidden border-y border-[#dde5f1] bg-[#f4f7fc] py-7 sm:py-8">
      <div aria-hidden className="pointer-events-none absolute -right-12 -top-16 size-64 rounded-full border border-[#26ade4]/20" />
      <div aria-hidden className="pointer-events-none absolute -right-4 -top-8 size-48 rounded-full border border-[#26ade4]/15" />
      <div className="relative mx-auto max-w-[1240px] px-6 text-center lg:px-10">
        <h2 className="text-xl font-semibold tracking-tight text-[#101b42] sm:text-2xl">{textValue(content, 'trustTitle', DEFAULT_HOME_PAGE_CONTENT.trustTitle)}</h2>
        <div className="mt-6 grid grid-cols-2 gap-y-5 sm:grid-cols-3 lg:grid-cols-6 lg:gap-0">
          {items.map((item: HomeRecord, index: number) => (
            <Reveal key={item.label || index} delay={index * 45} className="relative flex min-h-20 flex-col items-center justify-center gap-3 px-3 text-center">
              <span className="flex size-9 items-center justify-center rounded-xl text-[#25396f]">
                <HomeIcon name={item.icon} fallback={ShieldCheck} className="size-6" />
              </span>
              <span className="text-[11px] font-semibold text-[#1a274d] sm:text-xs">{item.label}</span>
              {index < items.length - 1 ? <span aria-hidden className="absolute -right-1 top-5 hidden size-1.5 rounded-full bg-[#26ade4]/70 lg:block" /> : null}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function Offering({ content }: { content: HomeRecord }) {
  const cards = listValue(content, 'offeringCards', DEFAULT_HOME_PAGE_CONTENT.offeringCards)
  return (
    <section id="services" className="relative mx-auto max-w-[1240px] px-6 py-14 lg:px-10 lg:py-16">
      <div className="grid items-center gap-8 lg:grid-cols-[.72fr_1.7fr] lg:gap-12">
        <Reveal className="relative lg:pb-8">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[.2em] text-[#1689d8]">{textValue(content, 'offeringEyebrow', DEFAULT_HOME_PAGE_CONTENT.offeringEyebrow)}</p>
          <h2 className="text-balance text-3xl font-semibold leading-[1.05] tracking-[-.045em] text-[#111d46] sm:text-4xl">
            {textValue(content, 'offeringTitle', DEFAULT_HOME_PAGE_CONTENT.offeringTitle)}
            <span className="block text-[#1689d8]">{textValue(content, 'offeringHighlight', DEFAULT_HOME_PAGE_CONTENT.offeringHighlight)}</span>
            <span className="block text-[#1689d8]">{textValue(content, 'offeringHighlightSuffix', DEFAULT_HOME_PAGE_CONTENT.offeringHighlightSuffix)}</span>
          </h2>
          <p className="mt-5 max-w-[340px] text-sm leading-relaxed text-[#53607e]">{textValue(content, 'offeringBody', DEFAULT_HOME_PAGE_CONTENT.offeringBody)}</p>
          <RouteGraphic
            viewBox="0 0 340 110"
  paths={['M0 68 C30 46 52 30 82 30 C128 30 160 70 210 68 C240 67 254 26 284 26 C308 26 324 32 340 40']}
  markers={[
  { x: 82, y: 30, kind: 'pin' },
  { x: 284, y: 26, kind: 'pin' },
              { x: 177, y: 92, kind: 'dot' },
            ]}
            pinIcon={<MapPin />}
            className="mt-6 w-full max-w-[340px] text-[#26ade4]"
          />
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2">
          {cards.map((card: HomeRecord, index: number) => (
            <Reveal key={card.title || index} delay={index * 90} className="group overflow-hidden rounded-2xl border border-[#e6eaf2] bg-white shadow-[0_8px_28px_-22px_rgba(13,31,73,.35)] transition-all duration-300 hover:-translate-y-1 hover:border-[#26ade4]/50 hover:shadow-[0_18px_45px_-24px_rgba(13,31,73,.32)]">
              <Link href={card.href || '/contact'} className="block">
                <div className="relative aspect-[1.55] overflow-hidden">
                  {card.image ? <Image src={card.image} alt={card.imageAlt || card.title || ''} fill sizes="(max-width: 640px) 100vw, 45vw" className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.045]" /> : <div className="absolute inset-0 bg-[#edf2f8]" />}
                </div>
                <div className="relative px-5 pb-5 pt-0 sm:px-6">
                  <span className="-mt-5 mb-3 flex size-10 items-center justify-center rounded-lg border-4 border-white bg-[#079be5] text-white shadow-sm">
                    <HomeIcon name={card.icon} fallback={index === 1 ? CarFront : BedDouble} className="size-5" />
                  </span>
                  <h3 className="text-lg font-semibold tracking-tight text-[#111d46]">{card.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-[#5a6681]">{card.body}</p>
                  <span className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#1689d8]">{card.action || textValue(content, 'cardActionFallbackLabel', DEFAULT_HOME_PAGE_CONTENT.cardActionFallbackLabel)} <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" /></span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function Challenges({ content }: { content: HomeRecord }) {
  const columns = [
    {
      title: textValue(content, 'challengeLeftTitle', DEFAULT_HOME_PAGE_CONTENT.challengeLeftTitle),
      accent: textValue(content, 'challengeLeftAccent', DEFAULT_HOME_PAGE_CONTENT.challengeLeftAccent),
      items: listValue(content, 'challengeLeftItems', DEFAULT_HOME_PAGE_CONTENT.challengeLeftItems),
    },
    {
      title: textValue(content, 'challengeRightTitle', DEFAULT_HOME_PAGE_CONTENT.challengeRightTitle),
      accent: textValue(content, 'challengeRightAccent', DEFAULT_HOME_PAGE_CONTENT.challengeRightAccent),
      items: listValue(content, 'challengeRightItems', DEFAULT_HOME_PAGE_CONTENT.challengeRightItems),
    },
  ]

  return (
    <section className="relative overflow-hidden border-y border-[#e9edf5] bg-[#f5f7fc] py-12 sm:py-14">
      <div className="mx-auto max-w-[1120px] px-6 lg:px-10">
        <p className="mb-7 text-center text-[10px] font-bold uppercase tracking-[.2em] text-[#1689d8]">
          {textValue(content, 'challengeEyebrow', DEFAULT_HOME_PAGE_CONTENT.challengeEyebrow)}
        </p>
        <div className="relative grid min-w-0 gap-9 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-20">
          {columns.map((column, index) => (
            <Reveal key={column.title} delay={index * 100} className="min-w-0 w-full">
              <h2 className="text-balance text-2xl font-semibold leading-tight tracking-[-.035em] text-[#111d46] sm:text-3xl">
                {column.title}
                <span className="block">{column.accent}</span>
              </h2>
              <ul className="mt-6 space-y-3">
                {column.items.map((item: string, itemIndex: number) => (
                  <li key={item} className="flex min-w-0 items-start gap-3 text-xs leading-relaxed text-[#4f5d7b] sm:text-sm">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#26ade4]/10 text-[#1689d8]">
                      <HomeIcon name={['shield-check', 'map-pin', 'users-round', 'check'][itemIndex % 4]} fallback={Check} className="size-3.5" />
                    </span>
                    <span className="min-w-0">{item}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
          <div aria-hidden className="pointer-events-none absolute bottom-1 left-1/2 top-1 z-0 hidden w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[#26ade4]/55 to-transparent md:block">
            <span className="absolute left-1/2 top-1/2 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#26ade4]/50 bg-white text-[#1689d8] shadow-[0_6px_18px_-8px_rgba(22,137,216,.45)]">
              <Route className="size-4" />
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

function Toolkit({ content }: { content: HomeRecord }) {
  const cards = listValue(content, 'toolkitCards', DEFAULT_HOME_PAGE_CONTENT.toolkitCards)
  return (
    <section id="solutions" className="mx-auto max-w-[1240px] px-6 py-14 lg:px-10 lg:py-16">
      <div className="mx-auto mb-8 max-w-3xl text-center">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[.2em] text-[#1689d8]">{textValue(content, 'toolkitEyebrow', DEFAULT_HOME_PAGE_CONTENT.toolkitEyebrow)}</p>
        <h2 className="text-balance text-3xl font-semibold tracking-[-.04em] text-[#111d46] sm:text-4xl">{textValue(content, 'toolkitTitle', DEFAULT_HOME_PAGE_CONTENT.toolkitTitle)}</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card: HomeRecord, index: number) => (
          <Reveal key={card.title || index} delay={index * 55} className="group overflow-hidden rounded-xl border border-[#e5eaf3] bg-white shadow-[0_6px_22px_-19px_rgba(11,26,61,.38)] transition-all duration-300 hover:-translate-y-1 hover:border-[#26ade4]/50 hover:shadow-[0_16px_34px_-22px_rgba(11,26,61,.4)]">
            <Link href={card.href || '/contact'} className="grid min-h-[142px] grid-cols-[1.04fr_.96fr]">
              <div className="flex flex-col justify-center p-4 sm:p-5">
                <span className="mb-3 flex size-8 items-center justify-center rounded-lg bg-[#0d1c43] text-[#26ade4]">
                  <HomeIcon name={card.icon} fallback={index < 2 ? Building2 : index === 3 ? Users : CarFront} className="size-4" />
                </span>
                <h3 className="text-sm font-bold leading-tight text-[#12204a]">{card.title}</h3>
                <p className="mt-2 text-[10px] leading-relaxed text-[#5b6783] sm:text-[11px]">{card.body}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold text-[#1689d8]">{textValue(content, 'cardActionFallbackLabel', DEFAULT_HOME_PAGE_CONTENT.cardActionFallbackLabel)} <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" aria-hidden="true" /></span>
              </div>
              <div className="relative min-h-[142px] overflow-hidden">
                {card.image ? <Image src={card.image} alt={card.imageAlt || card.title || ''} fill sizes="(max-width: 1024px) 50vw, 20vw" className="object-cover transition-transform duration-700 ease-out group-hover:scale-105" /> : <div className="absolute inset-0 bg-[#edf2f8]" />}
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function HomeProcess({ content }: { content: HomeRecord }) {
  const steps = listValue(content, 'processSteps', DEFAULT_HOME_PAGE_CONTENT.processSteps)
  return (
    <section className="mx-auto max-w-[1240px] px-6 py-12 lg:px-10 lg:py-14">
      <div className="mx-auto mb-8 max-w-3xl text-center">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[.2em] text-[#1689d8]">{textValue(content, 'processEyebrow', DEFAULT_HOME_PAGE_CONTENT.processEyebrow)}</p>
        <h2 className="text-balance text-3xl font-semibold tracking-[-.04em] text-[#111d46] sm:text-4xl">{textValue(content, 'processTitle', DEFAULT_HOME_PAGE_CONTENT.processTitle)}</h2>
      </div>
      <div className="relative grid gap-8 sm:grid-cols-2 md:grid-cols-4">
        <ProgressRail className="absolute left-[8%] right-[8%] top-6 hidden h-px bg-[#1689d8] md:block" />
        {steps.map((step: HomeRecord, index: number) => (
          <Reveal key={step.title || index} delay={index * 85} className="relative flex flex-col items-center text-center">
            <div className="flex size-12 items-center justify-center rounded-full border-2 border-[#1689d8] bg-white text-sm font-bold text-[#1689d8]">{String(index + 1).padStart(2, '0')}</div>
            <h3 className="mt-5 text-sm font-semibold text-[#13214a]">{step.title}</h3>
            <p className="mt-2 max-w-[230px] text-xs leading-relaxed text-[#64708b]">{step.body}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function IndustriesBand({ content }: { content: HomeRecord }) {
  const items = listValue(content, 'industryItems', DEFAULT_HOME_PAGE_CONTENT.industryItems)
  return (
    <section className="relative overflow-hidden bg-[#050b28] py-12 text-white sm:py-14">
      <div className="absolute inset-0 opacity-20">
        <Image src={textValue(content, 'industriesBackgroundImage', DEFAULT_HOME_PAGE_CONTENT.industriesBackgroundImage)} alt="" fill sizes="100vw" className="object-cover" />
      </div>
      <div className="relative mx-auto max-w-[1240px] px-6 lg:px-10">
        <div className="mx-auto mb-8 max-w-3xl text-center">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[.2em] text-[#26ade4]">{textValue(content, 'industriesEyebrow', DEFAULT_HOME_PAGE_CONTENT.industriesEyebrow)}</p>
          <h2 className="text-balance text-2xl font-semibold leading-tight tracking-[-.035em] text-white sm:text-3xl">{textValue(content, 'industriesTitle', DEFAULT_HOME_PAGE_CONTENT.industriesTitle)}</h2>
        </div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-4 lg:grid-cols-8">
          {items.map((item: HomeRecord, index: number) => (
            <Reveal key={item.label || index} delay={index * 45} className="flex flex-col items-center gap-3 text-center">
              <span className="flex size-12 items-center justify-center rounded-full border border-[#1689d8]/70 text-[#26ade4] transition-all duration-300 hover:scale-105 hover:bg-[#1689d8]/10">
                <HomeIcon name={item.icon} fallback={Building2} className="size-5" />
              </span>
              <span className="text-[10px] font-semibold leading-tight text-white/80 sm:text-xs">{item.label}</span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function resolveHomeFaqs(items: HomeData['faqs'], limit: number): FaqItem[] {
  const available = items ?? []
  return available.slice(0, Math.max(0, limit)).map((item, index) => ({
    _id: String(item._id || 'home-faq-' + index),
    question: item.question,
    answer: item.answer,
  }))
}

function Insights({ content, homeData }: { content: HomeRecord; homeData?: HomeData }) {
  const storyLimit = Math.min(6, Math.max(0, Number(content.storiesLimit ?? DEFAULT_HOME_PAGE_CONTENT.storiesLimit) || 0))
  const resourceLimit = Math.min(6, Math.max(0, Number(content.resourcesLimit ?? DEFAULT_HOME_PAGE_CONTENT.resourcesLimit) || 0))
  const stories = (homeData?.posts ?? []).slice(0, storyLimit)
  const resources = (homeData?.resources ?? []).slice(0, resourceLimit)
  return (
    <section className="mx-auto max-w-[1240px] px-6 py-14 lg:px-10 lg:py-16">
      <div className="grid gap-10 lg:grid-cols-[.78fr_1.22fr] lg:gap-8">
        <div className="lg:border-r lg:border-[#e1e7f1] lg:pr-8">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[.2em] text-[#1689d8]">{textValue(content, 'storiesEyebrow', DEFAULT_HOME_PAGE_CONTENT.storiesEyebrow)}</p>
          <h2 className="max-w-md text-balance text-3xl font-semibold leading-tight tracking-[-.04em] text-[#111d46]">{textValue(content, 'storiesTitle', DEFAULT_HOME_PAGE_CONTENT.storiesTitle)}</h2>
          {stories.length ? <div className="mt-7 space-y-4">
            {stories.map((story, index) => (
              <Reveal key={story.slug || story.title} delay={index * 70} className="group grid grid-cols-[104px_1fr] gap-4 border-b border-[#e9edf4] pb-4 last:border-0">
                <Link href={story.slug ? '/blog/' + story.slug : '/blog'} className="relative block aspect-[1.16] overflow-hidden rounded-lg">
                  {story.heroImage ? <Image src={story.heroImage} alt={story.heroAlt || story.title} fill sizes="104px" className="object-cover transition-transform duration-700 group-hover:scale-105" /> : <div className="absolute inset-0 bg-[#edf2f8]" />}
                </Link>
                <div className="min-w-0 self-center">
                  <Link href={story.slug ? '/blog/' + story.slug : '/blog'} className="text-sm font-semibold leading-snug text-[#12204a] transition-colors hover:text-[#1689d8]">{story.title}</Link>
                  <p className="mt-1.5 line-clamp-2 text-[10px] leading-relaxed text-[#63708a]">{story.excerpt || textValue(content, 'storyFallbackExcerpt', DEFAULT_HOME_PAGE_CONTENT.storyFallbackExcerpt)}</p>
                  <Link href={story.slug ? '/blog/' + story.slug : '/blog'} className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-[#1689d8]">{textValue(content, 'storyActionLabel', DEFAULT_HOME_PAGE_CONTENT.storyActionLabel)} <ArrowRight className="size-3" aria-hidden="true" /></Link>
                </div>
              </Reveal>
            ))}
          </div> : <p className="mt-7 text-sm text-[#63708a]">{textValue(content, 'storiesEmptyState', DEFAULT_HOME_PAGE_CONTENT.storiesEmptyState)}</p>}
          <Link href="/blog" className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-[#1689d8]">{textValue(content, 'storiesLinkLabel', DEFAULT_HOME_PAGE_CONTENT.storiesLinkLabel)} <ArrowRight className="size-3.5" aria-hidden="true" /></Link>
        </div>
        <div>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[.2em] text-[#1689d8]">{textValue(content, 'resourcesEyebrow', DEFAULT_HOME_PAGE_CONTENT.resourcesEyebrow)}</p>
          <h2 className="text-balance text-3xl font-semibold leading-tight tracking-[-.04em] text-[#111d46]">{textValue(content, 'resourcesTitle', DEFAULT_HOME_PAGE_CONTENT.resourcesTitle)}</h2>
          {resources.length ? <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {resources.map((resource, index) => {
              const image = resource.image || resource.coverImage || '/images/site/planning.png'
              const href = resource.href || (resource.slug ? '/resources/' + resource.slug : '/learn')
              return (
                <Reveal key={resource.slug || resource.title} delay={index * 65} className="group overflow-hidden rounded-xl border border-[#e5eaf2] bg-white shadow-[0_6px_22px_-19px_rgba(11,26,61,.4)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <Link href={href} className="block">
                    <div className="relative aspect-[1.35] overflow-hidden">
                      <Image src={image} alt={resource.title} fill sizes="(max-width: 640px) 100vw, 20vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                      <span className="absolute left-3 top-3 rounded bg-[#0d1c43]/90 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-white">{resource.resourceType || textValue(content, 'resourceTypeFallback', DEFAULT_HOME_PAGE_CONTENT.resourceTypeFallback)}</span>
                    </div>
                    <div className="flex min-h-[110px] flex-col p-4">
                      <h3 className="text-xs font-semibold leading-snug text-[#13214a]">{resource.title}</h3>
                      <p className="mt-2 line-clamp-2 text-[10px] leading-relaxed text-[#66718b]">{resource.summary || textValue(content, 'resourceFallbackSummary', DEFAULT_HOME_PAGE_CONTENT.resourceFallbackSummary)}</p>
                      <span className="mt-auto inline-flex justify-end pt-3 text-[#1689d8]"><ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></span>
                    </div>
                  </Link>
                </Reveal>
              )
            })}
          </div> : <p className="mt-7 text-sm text-[#63708a]">{textValue(content, 'resourcesEmptyState', DEFAULT_HOME_PAGE_CONTENT.resourcesEmptyState)}</p>}
          <Link href="/learn" className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-[#1689d8]">{textValue(content, 'resourcesLinkLabel', DEFAULT_HOME_PAGE_CONTENT.resourcesLinkLabel)} <ArrowRight className="size-3.5" aria-hidden="true" /></Link>
        </div>
      </div>
    </section>
  )
}

function HomeFaq({ content, homeData }: { content: HomeRecord; homeData?: HomeData }) {
  const limit = Math.min(12, Math.max(0, Number(content.faqLimit ?? DEFAULT_HOME_PAGE_CONTENT.faqLimit) || 0))
  const available = homeData?.faqs ?? []
  const featuredIds = Array.isArray(content.featuredFaqIds) ? content.featuredFaqIds.map(String) : []
  const chosen = featuredIds.length
    ? featuredIds.map((id) => available.find((item) => String(item._id) === id)).filter((item): item is NonNullable<typeof item> => Boolean(item))
    : available.slice(0, limit)
  const items = resolveHomeFaqs(chosen, limit)
  return (
    <section id="faq" className="border-y border-[#e8edf5] bg-[#f5f7fc] py-12 sm:py-14">
      <div className="mx-auto max-w-[1240px] px-6 lg:px-10">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[.2em] text-[#1689d8]">{textValue(content, 'faqEyebrow', DEFAULT_HOME_PAGE_CONTENT.faqEyebrow)}</p>
            <h2 className="text-3xl font-semibold tracking-[-.04em] text-[#111d46] sm:text-4xl">{textValue(content, 'faqTitle', DEFAULT_HOME_PAGE_CONTENT.faqTitle)}</h2>
          </div>
          <Link href={textValue(content, 'faqLinkHref', DEFAULT_HOME_PAGE_CONTENT.faqLinkHref)} className="inline-flex items-center gap-2 text-xs font-bold text-[#1689d8]">{textValue(content, 'faqLinkLabel', DEFAULT_HOME_PAGE_CONTENT.faqLinkLabel)} <ArrowRight className="size-3.5" aria-hidden="true" /></Link>
        </div>
        {items.length ? <FaqAccordion items={items} /> : <p className="text-sm text-[#63708a]">{textValue(content, 'faqEmptyState', DEFAULT_HOME_PAGE_CONTENT.faqEmptyState)}</p>}
      </div>
    </section>
  )
}

function FinalCta({ content }: { content: HomeRecord }) {
  const items = listValue(content, 'ctaItems', DEFAULT_HOME_PAGE_CONTENT.ctaItems)
  return (
    <section id="contact" className="relative overflow-hidden bg-[#050b28] py-12 text-white sm:py-14">
      <div className="pointer-events-none absolute inset-0 opacity-25">
        <Image src={textValue(content, 'ctaBackgroundImage', DEFAULT_HOME_PAGE_CONTENT.ctaBackgroundImage)} alt="" fill className="object-cover object-[75%_center]" sizes="100vw" />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,11,29,.98),rgba(5,11,29,.84)_55%,rgba(5,11,29,.46))]" />
      <div className="relative mx-auto grid max-w-[1240px] items-center gap-8 px-6 lg:grid-cols-[.72fr_1.28fr] lg:px-10">
        <Reveal>
          <h2 className="max-w-md text-balance text-3xl font-semibold leading-[1.04] tracking-[-.045em] sm:text-4xl">
            {(() => {
              const title = textValue(content, 'ctaTitle', DEFAULT_HOME_PAGE_CONTENT.ctaTitle)
              const highlight = textValue(content, 'ctaHighlight', DEFAULT_HOME_PAGE_CONTENT.ctaHighlight)
              const position = highlight ? title.indexOf(highlight) : -1
              return position < 0 ? title : <>{title.slice(0, position)}<span className="text-[#26ade4]">{highlight}</span>{title.slice(position + highlight.length)}</>
            })()}
          </h2>
        </Reveal>
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item: HomeRecord, index: number) => (
            <Reveal key={item.title || index} delay={index * 70} className="h-full">
              <Link href={item.href || '/contact'} className="group flex h-full min-h-[126px] items-center gap-4 rounded-xl border border-white/80 bg-white p-5 text-[#12204a] shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-[#26ade4]">
                <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-lg text-white', index === 1 ? 'bg-[#102044]' : 'bg-[#079be5]')}>
                  <HomeIcon name={item.icon} fallback={index === 1 ? CarFront : BedDouble} className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block text-sm font-bold">{item.title}</strong>
                  <span className="mt-2 block text-[11px] leading-relaxed text-[#5f6b86]">{item.body}</span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-[#1689d8] transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

export function HomePage({ cmsPage, homeData }: HomeProps) {
  const content: HomeRecord = { ...DEFAULT_HOME_PAGE_CONTENT, ...(homeData?.content ?? {}) }
  return (
    <div data-page="home" data-cms-page={cmsPage?._id || cmsPage?.id ? 'connected' : 'fallback'} data-cms-path={cmsPage?.path ?? '/'}>
      {visible(content, 'showHero') && <Hero content={content} />}
      {visible(content, 'showTrust') && <TrustStrip content={content} />}
      {visible(content, 'showOffering') && <Offering content={content} />}
      {visible(content, 'showChallenges') && <Challenges content={content} />}
      {visible(content, 'showToolkit') && <Toolkit content={content} />}
      {visible(content, 'showProcess') && <HomeProcess content={content} />}
      {visible(content, 'showIndustries') && <IndustriesBand content={content} />}
      {visible(content, 'showInsights') && <Insights content={content} homeData={homeData} />}
      {visible(content, 'showFaqs') && <HomeFaq content={content} homeData={homeData} />}
      {visible(content, 'showCta') && <FinalCta content={content} />}
    </div>
  )
}
