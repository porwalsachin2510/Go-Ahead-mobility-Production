'use client'

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  Activity,
  Bed,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  BusFront,
  CalendarDays,
  Camera,
  CarFront,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  ClipboardCheck,
  Clock3,
  Eye,
  FileCheck2,
  Flag,
  Gauge,
  Headset,
  Heart,
  Handshake,
  Lightbulb,
  MapPin,
  Monitor,
  Navigation,
  Plane,
  Quote,
  Receipt,
  Route,
  ShieldCheck,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'
import { CtaLink, Markdown, SmartImage } from '@/components/site/primitives'

gsap.registerPlugin(ScrollTrigger)

type RecordItem = Record<string, any>
type TabId = 'overview' | 'challenge' | 'approach' | 'implementation' | 'results' | 'testimonial'

const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: 'overview', label: 'Overview', icon: Eye },
  { id: 'challenge', label: 'The Challenge', icon: Activity },
  { id: 'approach', label: 'Our Approach', icon: Lightbulb },
  { id: 'implementation', label: 'Implementation', icon: ClipboardCheck },
  { id: 'results', label: 'Results', icon: BarChart3 },
  { id: 'testimonial', label: 'Testimonial', icon: Quote },
]

const ICONS: Record<string, LucideIcon> = {
  activity: Activity,
  'bar-chart': BarChart3,
  'bar-chart-3': BarChart3,
  briefcase: BriefcaseBusiness,
  building: BriefcaseBusiness,
  bed: Bed,
  bus: BusFront,
  'bus-front': BusFront,
  calendar: CalendarDays,
  'calendar-days': CalendarDays,
  camera: Camera,
  car: CarFront,
  'car-front': CarFront,
  check: Check,
  'check-circle': CheckCircle2,
  'clipboard-check': ClipboardCheck,
  clock: Clock3,
  'clock-3': Clock3,
  eye: Eye,
  'file-check': FileCheck2,
  'file-check-2': FileCheck2,
  flag: Flag,
  gauge: Gauge,
  handshake: Handshake,
  lightbulb: Lightbulb,
  'map-pin': MapPin,
  monitor: Monitor,
  navigation: Navigation,
  quote: Quote,
  route: Route,
  shield: ShieldCheck,
  'shield-check': ShieldCheck,
  users: UsersRound,
  'users-round': UsersRound,
  'building-2': BriefcaseBusiness,
  globe: Navigation,
  plane: Plane,
  headset: Headset,
  receipt: Receipt,
  heart: Heart,
  chart: BarChart3,
  factory: BriefcaseBusiness,
  cpu: Monitor,
  'chart-no-axes-combined': BarChart3,
  'trending-up': BarChart3,
  'file-text': FileCheck2,
  'clipboard-list': ClipboardCheck,
  'user-round': UsersRound,
  'map': MapPin,
  'route-off': Route,
}

const text = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') return value.trim() || fallback
  if (typeof value === 'number') return String(value)
  return fallback
}
const array = (value: unknown): RecordItem[] => Array.isArray(value) ? value.filter((item) => item && typeof item === 'object') : []
const strings = (value: unknown): string[] => Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())) : []
const tabFromHash = (): TabId => {
  if (typeof window === 'undefined') return 'overview'
  const id = window.location.hash.replace(/^#/, '')
  return TABS.some((tab) => tab.id === id) ? id as TabId : 'overview'
}
const titleCase = (value: string) => value.replace(/[-_]/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase())

function Icon({ name, className = 'size-5' }: { name?: unknown; className?: string }) {
  const key = text(name).toLowerCase()
  const Glyph = ICONS[key] ?? Circle
  return <Glyph aria-hidden="true" className={className} strokeWidth={1.65} />
}

function StudyImage({ src, alt, className = '', priority = false }: { src?: string; alt?: string; className?: string; priority?: boolean }) {
  if (!src) return null
  return (
    <div className={`relative isolate min-h-40 overflow-hidden rounded-2xl bg-slate-100 ${className}`}>
      <SmartImage src={src} alt={alt || ''} priority={priority} sizes="(min-width: 1024px) 50vw, 100vw" />
    </div>
  )
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-600">{children}</p>
}

function SectionTitle({ eyebrow, title, intro, centered = false, light = false }: { eyebrow?: string; title?: string; intro?: string; centered?: boolean; light?: boolean }) {
  if (!eyebrow && !title && !intro) return null
  return (
    <div className={`flex max-w-3xl flex-col gap-3 ${centered ? 'mx-auto items-center text-center' : ''}`}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      {title ? <h2 className={`font-display text-2xl font-bold tracking-tight md:text-3xl ${light ? 'text-white' : 'text-slate-950'}`}>{title}</h2> : null}
      {intro ? <p className={`text-sm leading-7 md:text-base ${light ? 'text-white/75' : 'text-slate-600'}`}>{intro}</p> : null}
    </div>
  )
}

function RichText({ value, className = '' }: { value?: string; className?: string }) {
  if (!value?.trim()) return null
  return <Markdown className={className}>{value}</Markdown>
}

function MetricCard({ item, compact = false }: { item: RecordItem; compact?: boolean }) {
  const value = text(item.value)
  const label = text(item.label || item.title)
  if (!value && !label) return null
  return (
    <div className={`flex min-w-0 items-center gap-3 ${compact ? '' : 'rounded-2xl border border-slate-200 bg-white p-4'}`}>
      <span className={`grid shrink-0 place-items-center rounded-xl border border-sky-100 bg-sky-50 text-royal ${compact ? 'size-10' : 'size-12'}`}>
        <Icon name={item.icon || 'chart'} className="size-5" />
      </span>
      <span className="min-w-0">
        {value ? <span className="block font-display text-xl font-bold leading-tight text-slate-950 md:text-2xl">{value}</span> : null}
        {label ? <span className="mt-1 block text-xs leading-5 text-slate-600">{label}</span> : null}
      </span>
    </div>
  )
}

function MetricGrid({ items, dark = false, compact = false }: { items: RecordItem[]; dark?: boolean; compact?: boolean }) {
  if (!items.length) return null
  return (
    <div className={`grid gap-3 ${items.length > 4 ? 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-4' : 'grid-cols-2 sm:grid-cols-4'}`}>
      {items.map((item, index) => (
        <div key={index} className={dark ? 'rounded-xl border border-white/10 bg-white/[0.04] p-3' : ''}>
          {dark ? (
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sky-400/10 text-sky-300"><Icon name={item.icon || 'chart'} /></span>
              <span className="min-w-0">
                <span className="block font-display text-xl font-bold text-white">{text(item.value)}</span>
                <span className="block text-xs leading-5 text-white/70">{text(item.label || item.title)}</span>
              </span>
            </div>
          ) : <MetricCard item={item} compact={compact} />}
        </div>
      ))}
    </div>
  )
}

function InfoCards({ items, columns = 3, variant = 'plain' }: { items: RecordItem[]; columns?: number; variant?: 'plain' | 'bordered' }) {
  if (!items.length) return null
  return (
    <div className={`grid gap-4 sm:grid-cols-2 ${columns >= 5 ? 'lg:grid-cols-5' : columns >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
      {items.map((item, index) => (
        <div key={index} className={variant === 'bordered' ? 'rounded-2xl border border-slate-200 bg-white p-5' : 'border-l border-slate-200 pl-5 first:border-0 first:pl-0'}>
          <span className="mb-3 grid size-11 place-items-center rounded-xl bg-sky-50 text-royal"><Icon name={item.icon || 'check'} className="size-6" /></span>
          {text(item.number) ? <p className="mb-1 text-sm font-bold text-sky-600">{text(item.number)}</p> : null}
          {text(item.title || item.label) ? <h3 className="font-display text-base font-bold text-slate-950">{text(item.title || item.label)}</h3> : null}
          {text(item.body || item.description) ? <p className="mt-2 text-sm leading-6 text-slate-600">{text(item.body || item.description)}</p> : null}
        </div>
      ))}
    </div>
  )
}

function BulletList({ items, icon = true }: { items: unknown[]; icon?: boolean }) {
  const values = items.map((item) => typeof item === 'string' ? item : text((item as RecordItem).title || (item as RecordItem).label || (item as RecordItem).body)).filter(Boolean)
  if (!values.length) return null
  return (
    <ul className="mt-4 space-y-3">
      {values.map((item, index) => (
        <li key={index} className="flex items-start gap-3 text-sm leading-6 text-slate-700">
          {icon ? <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-royal" /> : <span className="mt-2 size-1.5 shrink-0 rounded-full bg-sky-500" />}
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function QuotePanel({ quote, author, role, dark = false }: { quote?: string; author?: string; role?: string; dark?: boolean }) {
  if (!quote?.trim()) return null
  return (
    <figure className={`relative overflow-hidden rounded-2xl border p-6 md:p-8 ${dark ? 'border-slate-800 bg-[linear-gradient(120deg,#07152e,#020817)] text-white' : 'border-sky-100 bg-[linear-gradient(120deg,#f7faff,#edf4ff)] text-slate-900'}`}>
      <Quote aria-hidden="true" className="case-study-quote-mark absolute left-5 top-4 size-10 fill-current text-sky-400/70" />
      <blockquote className="relative ml-10 text-sm font-medium leading-7 md:text-base md:leading-8">{quote}</blockquote>
      {(author || role) ? (
        <figcaption className="relative ml-10 mt-5 border-t border-current/10 pt-4 text-xs leading-5 opacity-80">
          {author ? <span className="block font-bold">{author}</span> : null}
          {role ? <span className="block">{role}</span> : null}
        </figcaption>
      ) : null}
    </figure>
  )
}

function ContentCta({ title, body, label, href }: { title?: string; body?: string; label?: string; href?: string }) {
  if (!title && !body && !label) return null
  return (
    <section className="flex flex-col gap-5 rounded-2xl bg-[linear-gradient(115deg,#07152e,#020817)] p-6 text-white shadow-xl shadow-slate-900/10 md:flex-row md:items-center md:justify-between md:p-8">
      <div className="max-w-2xl">
        {title ? <h2 className="font-display text-xl font-bold md:text-2xl">{title}</h2> : null}
        {body ? <p className="mt-2 text-sm leading-6 text-white/75">{body}</p> : null}
      </div>
      {label && href ? <CtaLink href={href} label={label} variant="sky" className="w-fit shrink-0" /> : null}
    </section>
  )
}

function TabQuote({ study, prefix }: { study: RecordItem; prefix: string }) {
  return (
    <QuotePanel
      quote={text(study[`${prefix}Quote`])}
      author={text(study[`${prefix}QuoteAuthor`])}
      role={text(study[`${prefix}QuoteRole`])}
      dark={prefix === 'overview'}
    />
  )
}

function OverviewTab({ study, related }: { study: RecordItem; related: RecordItem[] }) {
  const stats = array(study.overviewStats)
  const challengeItems = array(study.overviewChallengeItems)
  const approachItems = array(study.overviewApproachItems)
  const metrics = array(study.overviewMetrics)
  const gallery = array(study.galleryItems)
  const bullets = strings(study.overviewImplementationBullets)
  const legacyResults = array(study.results)
  return (
    <div className="space-y-10 md:space-y-12">
      <section className="grid gap-5 rounded-2xl bg-slate-50 p-5 md:grid-cols-[0.9fr_1.5fr] md:items-center md:p-7">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-950">{text(study.overviewHeading, 'Client Background')}</h2>
          <RichText value={text(study.overviewBody, study.summary)} className="mt-3 text-sm leading-6 text-slate-600" />
        </div>
        {stats.length ? (
          <div className="rounded-2xl bg-[#06132a] p-4 md:p-5">
            <MetricGrid items={stats} dark />
          </div>
        ) : legacyResults.length ? (
          <div className="rounded-2xl bg-[#06132a] p-4 md:p-5 text-white">
            <MetricGrid items={legacyResults.map((item) => ({ value: item.value, label: item.label }))} dark />
          </div>
        ) : null}
      </section>

      {(text(study.overviewChallengeIntro) || challengeItems.length || study.overviewChallengeImage || study.challenge) ? (
        <section className="grid items-center gap-6 border-b border-slate-200 pb-9 md:grid-cols-[0.85fr_1.5fr]">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-950">{text(study.overviewChallengeHeading, 'The Challenge')}</h2>
            <RichText value={text(study.overviewChallengeIntro, study.challenge)} className="mt-2 text-sm leading-6 text-slate-600" />
            {challengeItems.length ? <BulletList items={challengeItems} /> : null}
          </div>
          <StudyImage src={text(study.overviewChallengeImage)} alt={text(study.overviewChallengeImageAlt)} className="aspect-[16/8]" />
        </section>
      ) : null}

      {approachItems.length ? (
        <section className="border-b border-slate-200 pb-9">
          <div className="mb-6">
            <h2 className="font-display text-xl font-bold text-slate-950">{text(study.overviewApproachHeading, 'Our Approach')}</h2>
            {text(study.overviewApproachIntro) ? <p className="mt-2 text-sm text-slate-600">{text(study.overviewApproachIntro)}</p> : null}
          </div>
          <InfoCards items={approachItems} columns={5} />
        </section>
      ) : null}

      {(bullets.length || study.overviewImplementationImage) ? (
        <section className="grid items-center gap-6 border-b border-slate-200 pb-9 md:grid-cols-[0.85fr_1.5fr]">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-950">{text(study.overviewImplementationHeading, 'Implementation Highlights')}</h2>
            {text(study.overviewImplementationIntro) ? <p className="mt-2 text-sm leading-6 text-slate-600">{text(study.overviewImplementationIntro)}</p> : null}
            <BulletList items={bullets} />
          </div>
          <StudyImage src={text(study.overviewImplementationImage)} alt={text(study.overviewImplementationImageAlt)} className="aspect-[16/8]" />
        </section>
      ) : null}

      {(metrics.length || (!metrics.length && legacyResults.length)) ? (
        <section className="border-b border-slate-200 pb-9">
          <h2 className="mb-5 font-display text-xl font-bold text-slate-950">{text(study.overviewImpactHeading, 'Impact & Results')}</h2>
          <MetricGrid items={metrics.length ? metrics : legacyResults.map((item) => ({ value: item.value, label: item.label }))} compact />
        </section>
      ) : null}

      {gallery.length ? (
        <section>
          <div className="mb-5 flex items-end justify-between gap-4">
            <h2 className="font-display text-xl font-bold text-slate-950">Project Gallery</h2>
            <span className="text-xs text-slate-500">{gallery.length} project {gallery.length === 1 ? 'image' : 'images'}</span>
          </div>
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            {gallery.map((item, index) => (
              <StudyImage key={index} src={text(item.image)} alt={text(item.alt || item.caption)} className="aspect-[4/3]" />
            ))}
          </div>
        </section>
      ) : null}

      <TabQuote study={study} prefix="overview" />

      {related.length ? (
        <section>
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="font-display text-xl font-bold text-slate-950">{text(study.relatedHeading, 'Related Case Studies')}</h2>
            <Link href="/case-studies" className="inline-flex items-center gap-2 text-sm font-semibold text-royal hover:text-sky-700">View all <ArrowRight className="size-4" /></Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {related.map((item, index) => (
              <Link key={text(item.slug, String(index))} href={`/case-studies/${text(item.slug)}`} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition-transform hover:-translate-y-1 hover:shadow-lg">
                <StudyImage src={text(item.image || item.heroImage)} alt={text(item.title)} className="aspect-[16/9] rounded-none" />
                <div className="p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-royal">{text(item.cardLabel, titleCase(text(item.category)))}</p>
                  <h3 className="mt-2 font-display font-bold text-slate-950 group-hover:text-royal">{text(item.title)}</h3>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-royal">View Case Study <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" /></span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}

function ChallengeTab({ study }: { study: RecordItem }) {
  const challenges = array(study.challengeItems)
  const glance = array(study.challengeGlanceItems).length ? array(study.challengeGlanceItems) : array(study.overviewStats)
  const impacts = array(study.challengeImpactItems)
  return (
    <div className="space-y-9 md:space-y-10">
      <SectionTitle eyebrow={text(study.challengeEyebrow, 'THE CHALLENGE')} title={text(study.challengeTitle, 'The Challenge')} intro={text(study.challengeIntro, study.challenge)} centered />
      <div className="grid items-start gap-6 lg:grid-cols-[1.7fr_0.95fr]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {challenges.map((item, index) => (
            <div key={index} className="grid gap-4 border-b border-slate-200 p-4 last:border-0 sm:grid-cols-[76px_1fr] sm:p-5">
              <span className="grid size-16 place-items-center rounded-2xl bg-slate-50 text-royal"><Icon name={item.icon || 'activity'} className="size-8" /></span>
              <div>
                <h3 className="font-display font-bold text-slate-950">{text(item.title)}</h3>
                {text(item.body || item.description) ? <p className="mt-1 text-sm leading-6 text-slate-600">{text(item.body || item.description)}</p> : null}
              </div>
            </div>
          ))}
          {!challenges.length && study.challenge ? <div className="p-6"><RichText value={text(study.challenge)} /></div> : null}
        </div>
        {glance.length ? (
          <aside className="rounded-2xl bg-[#06132a] p-5 text-white md:p-6">
            <h3 className="font-display text-xl font-bold">At a Glance</h3>
            <span className="mt-3 block h-0.5 w-10 bg-sky-400" />
            <div className="mt-5 space-y-4">
              {glance.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sky-400/10 text-sky-300"><Icon name={item.icon || 'chart'} /></span>
                  <span>
                    <strong className="block font-display text-lg">{text(item.value, text(item.title))}</strong>
                    <span className="block text-xs leading-5 text-white/70">{text(item.label, text(item.body))}</span>
                  </span>
                </div>
              ))}
            </div>
          </aside>
        ) : null}
      </div>
      <QuotePanel quote={text(study.challengeQuote)} author={text(study.challengeQuoteAuthor)} role={text(study.challengeQuoteRole)} />
      {impacts.length ? (
        <section className="rounded-2xl border border-sky-100 bg-[#f1f5ff] px-5 py-7 md:px-8">
          <h3 className="mb-6 text-center font-display text-xl font-bold text-slate-950">{text(study.challengeImpactTitle, 'The impact of these challenges')}</h3>
          <InfoCards items={impacts} columns={5} />
        </section>
      ) : null}
    </div>
  )
}

function ApproachTab({ study }: { study: RecordItem }) {
  const steps = array(study.approachSteps)
  const actions = array(study.approachActions)
  const enablers = array(study.approachEnablers)
  const why = array(study.approachWhyItems)
  return (
    <div className="space-y-10 md:space-y-12">
      <SectionTitle eyebrow={text(study.approachEyebrow, 'OUR APPROACH')} title={text(study.approachTitle, 'A Strategic, Technology-Driven Approach')} intro={text(study.approachIntro, study.approach)} centered />
      {steps.length ? (
        <section className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          <div className="absolute left-[8%] right-[8%] top-7 hidden h-px bg-sky-200 lg:block" />
          {steps.map((item, index) => (
            <div key={index} className="relative flex flex-col items-center text-center">
              <span className="relative z-10 grid size-14 place-items-center rounded-full border border-sky-100 bg-white text-royal shadow-sm"><Icon name={item.icon || 'lightbulb'} className="size-6" /></span>
              <span className="mt-2 font-display text-xl font-bold text-sky-500">{text(item.number, String(index + 1).padStart(2, '0'))}</span>
              <h3 className="mt-1 font-display font-bold text-slate-950">{text(item.title)}</h3>
              {text(item.body) ? <p className="mt-2 max-w-xs text-sm leading-6 text-slate-600">{text(item.body)}</p> : null}
            </div>
          ))}
        </section>
      ) : null}
      {(actions.length || study.approachImage) ? (
        <section>
          <h3 className="mb-5 text-center font-display text-xl font-bold text-slate-950">{text(study.approachActionTitle, 'Our Approach in Action')}</h3>
          <div className="grid items-stretch gap-5 lg:grid-cols-[0.95fr_1.4fr]">
            <div className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200">
              {actions.map((item, index) => (
                <div key={index} className="flex gap-3 p-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-sky-200 text-royal"><Icon name={item.icon || 'check'} /></span>
                  <div>
                    <h4 className="font-display text-sm font-bold text-slate-950">{text(item.title)}</h4>
                    {text(item.body || item.description) ? <p className="mt-1 text-xs leading-5 text-slate-600">{text(item.body || item.description)}</p> : null}
                  </div>
                </div>
              ))}
            </div>
            <StudyImage src={text(study.approachImage)} alt={text(study.approachImageAlt)} className="aspect-[4/3] min-h-64 lg:aspect-auto" />
          </div>
        </section>
      ) : null}
      {enablers.length ? (
        <section className="rounded-2xl bg-slate-50 px-5 py-6">
          <h3 className="mb-5 text-center font-display font-bold text-slate-950">{text(study.approachEnablersTitle, 'Key Enablers')}</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {enablers.map((item, index) => (
              <div key={index} className="flex items-center gap-3 border-slate-200 sm:border-l sm:pl-4 first:border-0 first:pl-0">
                <Icon name={item.icon} className="size-6 shrink-0 text-royal" />
                <span className="text-xs font-medium leading-5 text-slate-700">{text(item.title || item.label)}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
      {why.length ? (
        <section>
          <h3 className="mb-6 text-center font-display text-xl font-bold text-slate-950">{text(study.approachWhyTitle, 'Why This Approach Works')}</h3>
          <InfoCards items={why} columns={4} />
        </section>
      ) : null}
      <QuotePanel quote={text(study.approachQuote)} author={text(study.approachQuoteAuthor)} role={text(study.approachQuoteRole)} />
    </div>
  )
}

function ImplementationTab({ study }: { study: RecordItem }) {
  const phases = array(study.implementationPhases)
  const rollout = array(study.implementationRolloutItems)
  const handover = array(study.implementationHandoverItems)
  const principles = array(study.implementationPrinciples)
  return (
    <div className="space-y-9 md:space-y-11">
      <section className="grid items-center gap-7 lg:grid-cols-[0.85fr_1.35fr]">
        <div>
          <Eyebrow>{text(study.implementationEyebrow, 'IMPLEMENTATION')}</Eyebrow>
          <h2 className="mt-3 font-display text-2xl font-bold leading-tight text-slate-950 md:text-3xl">{text(study.implementationTitle, 'Turning the operating model into a coordinated rollout')}</h2>
          {text(study.implementationIntro) ? <p className="mt-4 text-sm leading-7 text-slate-600">{text(study.implementationIntro)}</p> : null}
          {text(study.implementationBody) ? <p className="mt-4 text-sm leading-7 text-slate-600">{text(study.implementationBody)}</p> : null}
        </div>
        <StudyImage src={text(study.implementationImage)} alt={text(study.implementationImageAlt)} className="aspect-[16/9]" />
      </section>

      {phases.length ? (
        <section>
          <h3 className="mb-6 font-display text-xl font-bold text-slate-950">{text(study.implementationTimelineTitle, 'A phased approach to implementation')}</h3>
          <div className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="case-study-timeline-track absolute left-0 right-0 top-4 hidden h-px bg-sky-200 lg:block"><span className="case-study-timeline-fill block h-full w-full bg-royal" /></div>
            {phases.map((item, index) => (
              <div key={index} className="relative">
                <span className="relative z-10 grid size-9 place-items-center rounded-full border border-royal bg-white font-display text-xs font-bold text-royal">{text(item.number, String(index + 1).padStart(2, '0'))}</span>
                <h4 className="mt-4 font-display font-bold text-slate-950">{text(item.title)}</h4>
                {text(item.body) ? <p className="mt-2 text-sm leading-6 text-slate-600">{text(item.body)}</p> : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {rollout.length ? (
        <section>
          <h3 className="mb-5 font-display text-xl font-bold text-slate-950">{text(study.implementationRolloutTitle, 'What the rollout brings together')}</h3>
          <InfoCards items={rollout} columns={4} />
        </section>
      ) : null}

      {study.implementationBannerImage ? (
        <section>
          <StudyImage src={text(study.implementationBannerImage)} alt={text(study.implementationBannerAlt)} className="aspect-[16/5]" />
          {text(study.implementationCaption) ? <p className="mt-2 text-center text-xs text-slate-500">{text(study.implementationCaption)}</p> : null}
        </section>
      ) : null}

      {(handover.length || text(study.implementationHandoverBody)) ? (
        <section className="grid gap-5 rounded-2xl bg-slate-50 p-5 md:grid-cols-[0.8fr_1.2fr] md:p-7">
          <div>
            <h3 className="font-display text-xl font-bold text-slate-950">{text(study.implementationHandoverTitle, 'Operational handover')}</h3>
            {text(study.implementationHandoverBody) ? <p className="mt-3 text-sm leading-6 text-slate-600">{text(study.implementationHandoverBody)}</p> : null}
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {handover.map((item, index) => (
              <li key={index} className="flex gap-2 text-sm text-slate-700">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-royal" />
                <span><strong className="block">{text(item.title)}</strong>{text(item.body) ? <span className="mt-1 block text-xs leading-5 text-slate-500">{text(item.body)}</span> : null}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {principles.length ? (
        <section className="rounded-2xl border border-slate-100 bg-[#f7f9fd] p-5 md:p-7">
          <h3 className="mb-5 text-center font-display font-bold text-slate-950">{text(study.implementationPrinciplesTitle, 'Implementation principles')}</h3>
          <InfoCards items={principles} columns={3} />
        </section>
      ) : null}
      <ContentCta title={text(study.implementationCtaTitle)} body={text(study.implementationCtaBody)} label={text(study.implementationCtaLabel)} href={text(study.implementationCtaHref)} />
    </div>
  )
}

function ResultsTab({ study }: { study: RecordItem }) {
  const newRows = array(study.resultRows)
  const legacyRows = array(study.results)
  const rows = newRows.length ? newRows : legacyRows.map((item) => ({ title: text(item.label), measuredOutcome: text(item.value) }))
  const steps = array(study.resultsMeasurementSteps)
  const evidence = array(study.resultsEvidenceItems)
  const changes = array(study.resultsOperationsChanges)
  return (
    <div className="space-y-9 md:space-y-11">
      <SectionTitle title={text(study.resultsTitle, 'Results that matter')} intro={text(study.resultsIntro, study.outcome)} centered />
      {rows.length ? (
        <div className="divide-y divide-slate-200 border-y border-slate-200">
          {rows.map((item, index) => (
            <div key={index} className="grid gap-4 py-5 md:grid-cols-[1.4fr_0.65fr_0.8fr_0.8fr] md:items-center">
              <div className="flex gap-3">
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-sky-50 text-royal"><Icon name={item.icon || 'chart'} className="size-6" /></span>
                <span>
                  <strong className="block font-display text-sm text-slate-950">{text(item.title || item.label)}</strong>
                  {text(item.description) ? <span className="mt-1 block text-xs leading-5 text-slate-600">{text(item.description)}</span> : null}
                </span>
              </div>
              {text(item.baseline) ? <div><span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">Baseline</span><span className="mt-1 block text-sm text-slate-700">{text(item.baseline)}</span></div> : null}
              {text(item.measuredOutcome || item.value) ? <div><span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">Measured outcome</span><span className="mt-1 block font-display text-base font-bold text-royal">{text(item.measuredOutcome || item.value)}</span></div> : null}
              {text(item.evidence) ? <div><span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">Evidence source</span><span className="mt-1 block text-xs leading-5 text-slate-600">{text(item.evidence)}</span></div> : null}
            </div>
          ))}
        </div>
      ) : null}

      {steps.length ? (
        <section className="rounded-2xl border border-slate-200 p-5 md:p-7">
          <h3 className="mb-5 text-center font-display text-xl font-bold text-slate-950">{text(study.resultsMeasurementTitle, 'How results are measured')}</h3>
          <div className="grid gap-5 md:grid-cols-3">
            {steps.map((item, index) => (
              <div key={index} className="flex gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full border border-royal text-xs font-bold text-royal">{text(item.number, String(index + 1).padStart(2, '0'))}</span>
                <span><strong className="block text-sm text-slate-950">{text(item.title)}</strong>{text(item.body) ? <span className="mt-1 block text-xs leading-5 text-slate-600">{text(item.body)}</span> : null}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {evidence.length ? (
        <section className="rounded-2xl border border-sky-100 bg-[#f1f5ff] p-5 md:p-7">
          <SectionTitle title={text(study.resultsEvidenceTitle, 'Evidence & client validation')} intro={text(study.resultsEvidenceIntro)} centered />
          <div className="mt-6"><InfoCards items={evidence} columns={3} /></div>
        </section>
      ) : null}
      <QuotePanel quote={text(study.resultsQuote)} author={text(study.resultsQuoteAuthor)} role={text(study.resultsQuoteRole)} />
      {changes.length ? (
        <section>
          <h3 className="mb-5 text-center font-display text-xl font-bold text-slate-950">{text(study.resultsOperationsTitle, 'What changed operationally')}</h3>
          <InfoCards items={changes} columns={3} />
        </section>
      ) : null}
      <ContentCta title={text(study.resultsCtaTitle)} body={text(study.resultsCtaBody)} label={text(study.resultsCtaLabel)} href={text(study.resultsCtaHref)} />
      {text(study.evidenceNote) ? <p className="border-l-2 border-sky-300 pl-4 text-xs leading-5 text-slate-500">{text(study.evidenceNote)}</p> : null}
      {text(study.disclaimer) ? <p className="text-xs leading-5 text-slate-500">{text(study.disclaimer)}</p> : null}
    </div>
  )
}

function TestimonialTab({ study }: { study: RecordItem }) {
  const topics = array(study.testimonialTopics)
  const links = array(study.testimonialLinks)
  const quote = text(study.detailTestimonialQuote)
  const approvedName = text(study.detailTestimonialName)
  const approvedRole = text(study.detailTestimonialRole)
  const approvedCompany = text(study.detailTestimonialCompany)
  const hasApprovedQuote = Boolean(quote && (study.clientApproved === true))
  return (
    <div className="space-y-9 md:space-y-11">
      <SectionTitle eyebrow={text(study.testimonialEyebrow, 'CLIENT PERSPECTIVE')} title={text(study.testimonialTitle, 'The people behind the programme')} intro={text(study.testimonialIntro)} centered />
      <section className="relative overflow-hidden rounded-2xl border border-sky-100 bg-[#f6f8ff] px-6 py-10 text-center md:px-12 md:py-14">
        <Quote aria-hidden="true" className="case-study-quote-mark mx-auto mb-5 size-12 fill-sky-300 text-sky-300" />
        {hasApprovedQuote ? (
          <blockquote className="mx-auto max-w-3xl font-display text-xl font-semibold leading-relaxed text-slate-950 md:text-2xl">{quote}</blockquote>
        ) : (
          <p className="mx-auto max-w-2xl font-display text-lg font-semibold text-slate-700 md:text-xl">Client testimonial will appear here after written client approval.</p>
        )}
        <span className="mx-auto mt-5 block h-0.5 w-10 bg-royal" />
        <div className="mt-5 flex flex-col items-center gap-1 text-sm">
          <span className="font-bold text-slate-950">{hasApprovedQuote ? (approvedName || 'Client representative') : 'Client representative'}</span>
          <span className="text-slate-600">{hasApprovedQuote ? [approvedRole, approvedCompany].filter(Boolean).join(' · ') : 'Attribution pending written approval'}</span>
        </div>
        <p className="mt-7 flex items-center justify-center gap-2 text-xs leading-5 text-slate-500"><ShieldCheck className="size-4 shrink-0" /> Quote and attribution are published only when written client approval is on file.</p>
      </section>

      {topics.length ? (
        <section>
          <h3 className="mb-6 text-center font-display text-xl font-bold text-slate-950">{text(study.testimonialTopicsTitle, 'What the testimonial should speak to')}</h3>
          <InfoCards items={topics} columns={4} />
        </section>
      ) : null}

      {(study.testimonialImage || text(study.testimonialPerspectiveBody)) ? (
        <section className="grid overflow-hidden rounded-2xl border border-slate-200 md:grid-cols-2">
          {study.testimonialImage ? <StudyImage src={text(study.testimonialImage)} alt={text(study.testimonialImageAlt)} className="aspect-[4/3] rounded-none md:aspect-auto" /> : null}
          <div className="p-6 md:p-8">
            <h3 className="font-display text-xl font-bold text-slate-950">{text(study.testimonialPerspectiveTitle, 'A perspective grounded in the project')}</h3>
            <RichText value={text(study.testimonialPerspectiveBody)} className="mt-4 text-sm leading-7 text-slate-600" />
          </div>
        </section>
      ) : null}

      {links.length ? (
        <section>
          <h3 className="mb-5 text-center font-display text-xl font-bold text-slate-950">{text(study.testimonialLinksTitle, 'More from this case study')}</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            {links.map((item, index) => {
              const href = text(item.href, '#overview')
              return (
                <Link key={index} href={href} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 transition-colors hover:border-sky-300 hover:bg-sky-50">
                  <span className="font-display font-bold text-slate-950">{text(item.title, 'View section')}</span>
                  <ArrowRight className="size-4 shrink-0 text-royal" />
                </Link>
              )
            })}
          </div>
        </section>
      ) : null}
      <ContentCta title={text(study.testimonialCtaTitle)} body={text(study.testimonialCtaBody)} label={text(study.testimonialCtaLabel)} href={text(study.testimonialCtaHref)} />
    </div>
  )
}

export function CaseStudyDetail({ study, related = [], ctaHref = '/contact', ctaLabel = 'Request a Proposal' }: {
  study: RecordItem
  related?: RecordItem[]
  ctaHref?: string
  ctaLabel?: string
}) {
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const tabRefs = useRef<Partial<Record<TabId, HTMLButtonElement | null>>>({})
  const panelRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()
  const heroImage = text(study.heroImage || study.image)
  const category = text(study.cardLabel, titleCase(text(study.category, text(study.vertical))))
  const service = text(study.serviceName, study.vertical === 'transport' ? 'Employee Transportation' : '')
  const clientLabel = !study.anonymized ? text(study.clientName) : ''

  const setTab = (id: TabId, focus = false) => {
    setActiveTab(id)
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${id}`)
    }
    if (focus) requestAnimationFrame(() => tabRefs.current[id]?.focus())
  }

  useEffect(() => {
    const sync = () => setActiveTab(tabFromHash())
    sync()
    window.addEventListener('hashchange', sync)
    window.addEventListener('popstate', sync)
    return () => {
      window.removeEventListener('hashchange', sync)
      window.removeEventListener('popstate', sync)
    }
  }, [])

  useEffect(() => {
    if (activeTab !== 'implementation' || reducedMotion || !panelRef.current) return
    const root = panelRef.current
    const ctx = gsap.context(() => {
      const fill = root.querySelector<HTMLElement>('.case-study-timeline-fill')
      if (fill) gsap.fromTo(fill, { scaleX: 0 }, {
        scaleX: 1,
        duration: 1.1,
        ease: 'power2.out',
        scrollTrigger: { trigger: fill.parentElement, start: 'top 85%', once: true },
      })
    }, root)
    return () => ctx.revert()
  }, [activeTab, reducedMotion])

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, current: TabId) => {
    const index = TABS.findIndex((tab) => tab.id === current)
    let next = index
    if (event.key === 'ArrowRight') next = (index + 1) % TABS.length
    else if (event.key === 'ArrowLeft') next = (index - 1 + TABS.length) % TABS.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = TABS.length - 1
    else return
    event.preventDefault()
    setTab(TABS[next].id, true)
  }

  const tabContent: Record<TabId, ReactNode> = {
    overview: <OverviewTab study={study} related={related} />,
    challenge: <ChallengeTab study={study} />,
    approach: <ApproachTab study={study} />,
    implementation: <ImplementationTab study={study} />,
    results: <ResultsTab study={study} />,
    testimonial: <TestimonialTab study={study} />,
  }
  const activeIndex = TABS.findIndex((tab) => tab.id === activeTab)
  const previous = TABS[(activeIndex - 1 + TABS.length) % TABS.length]
  const next = TABS[(activeIndex + 1) % TABS.length]

  return (
    <div className="case-study-detail">
      <header className="case-study-hero relative overflow-hidden bg-[#050b1d] text-white">
        {heroImage ? (
          <div className="absolute inset-0">
            <SmartImage src={heroImage} alt={text(study.heroImageAlt, text(study.title))} priority sizes="100vw" />
          </div>
        ) : null}
        <div className="case-study-hero-overlay absolute inset-0" />
        <div className="container-x relative z-10 flex min-h-[430px] flex-col justify-end gap-5 pb-12 pt-7 md:min-h-[490px] md:pb-14 lg:min-h-[520px]">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-white/75">
            <Link href="/" className="hover:text-white">Home</Link><ChevronRight className="size-3" />
            <Link href="/case-studies" className="hover:text-white">Case Studies</Link><ChevronRight className="size-3" />
            <span aria-current="page" className="text-white">{text(study.title)}</span>
          </nav>
          <div className="max-w-2xl">
            <Eyebrow>{text(study.heroEyebrow, 'CASE STUDY')}</Eyebrow>
            <h1 className="mt-3 font-display text-3xl font-extrabold leading-[1.08] tracking-tight text-white text-balance md:text-4xl lg:text-5xl">{text(study.title)}</h1>
            {clientLabel ? <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-sky-300">{clientLabel}</p> : null}
            {text(study.summary) ? <p className="mt-4 max-w-xl text-sm leading-6 text-white/80 md:text-base md:leading-7">{text(study.summary)}</p> : null}
          </div>
          <div className="flex flex-wrap gap-x-7 gap-y-3 pt-1">
            {category ? <div className="flex items-center gap-2 text-xs"><span className="grid size-9 place-items-center rounded-full border border-sky-400/20 bg-sky-400/10 text-sky-300"><BriefcaseBusiness className="size-4" /></span><span><strong className="block text-white">Industry</strong><span className="text-white/70">{category}</span></span></div> : null}
            {service ? <div className="flex items-center gap-2 text-xs"><span className="grid size-9 place-items-center rounded-full border border-sky-400/20 bg-sky-400/10 text-sky-300"><BusFront className="size-4" /></span><span><strong className="block text-white">Service</strong><span className="text-white/70">{service}</span></span></div> : null}
            {text(study.locationLabel) ? <div className="flex items-center gap-2 text-xs"><span className="grid size-9 place-items-center rounded-full border border-sky-400/20 bg-sky-400/10 text-sky-300"><MapPin className="size-4" /></span><span><strong className="block text-white">Location</strong><span className="text-white/70">{text(study.locationLabel)}</span></span></div> : null}
            {text(study.fleetSize) ? <div className="flex items-center gap-2 text-xs"><span className="grid size-9 place-items-center rounded-full border border-sky-400/20 bg-sky-400/10 text-sky-300"><BusFront className="size-4" /></span><span><strong className="block text-white">Fleet Size</strong><span className="text-white/70">{text(study.fleetSize)}</span></span></div> : null}
          </div>
        </div>
      </header>

      <nav className="case-study-tabs sticky top-14 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur lg:top-16" aria-label="Case study sections">
        <div className="container-x flex items-center gap-3 py-2">
          <div role="tablist" aria-label="Case study sections" className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
            {TABS.map((tab) => {
              const Glyph = tab.icon
              const selected = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  ref={(node) => { tabRefs.current[tab.id] = node }}
                  id={`case-tab-${tab.id}`}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls="case-study-panel"
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setTab(tab.id)}
                  onKeyDown={(event) => handleTabKeyDown(event, tab.id)}
                  className={`case-study-tab inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 ${selected ? 'text-royal' : 'text-slate-600 hover:bg-slate-50 hover:text-royal'}`}
                >
                  <Glyph className="size-4" />{tab.label}
                </button>
              )
            })}
          </div>
          <CtaLink href={ctaHref} label={ctaLabel} className="hidden shrink-0 px-4 py-2.5 text-xs sm:inline-flex" />
        </div>
      </nav>

      <div className="container-x py-9 md:py-12">
        <div
          id="case-study-panel"
          ref={panelRef}
          role="tabpanel"
          aria-labelledby={`case-tab-${activeTab}`}
          tabIndex={0}
          className="min-h-[360px] outline-none"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              initial={reducedMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: reducedMotion ? 0 : 0.28, ease: 'easeOut' }}
            >
              {tabContent[activeTab]}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-10 flex items-center justify-between border-y border-slate-200 py-4">
          <button type="button" onClick={() => setTab(previous.id)} className="group inline-flex items-center gap-3 rounded-lg px-2 py-2 text-left text-xs text-slate-600 transition-colors hover:text-royal">
            <span className="grid size-9 place-items-center rounded-full border border-sky-200 text-royal transition-colors group-hover:bg-sky-50"><ArrowLeft className="size-4" /></span>
            <span><span className="block text-slate-500">Previous</span><strong className="text-slate-950">{previous.label}</strong></span>
          </button>
          <button type="button" onClick={() => setTab(next.id)} className="group inline-flex items-center gap-3 rounded-lg px-2 py-2 text-right text-xs text-slate-600 transition-colors hover:text-royal">
            <span><span className="block text-slate-500">Next</span><strong className="text-slate-950">{next.label}</strong></span>
            <span className="grid size-9 place-items-center rounded-full border border-sky-200 text-royal transition-colors group-hover:bg-sky-50"><ArrowRight className="size-4" /></span>
          </button>
        </div>
        {study.disclaimer ? <p className="mt-5 text-xs leading-5 text-slate-500">{text(study.disclaimer)}</p> : null}
      </div>
    </div>
  )
}
