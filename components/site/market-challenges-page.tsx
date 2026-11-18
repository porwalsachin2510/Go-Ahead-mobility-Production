'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import {
  ArrowDownRight,
  ArrowRight,
  BedDouble,
  Building2,
  BusFront,
  CalendarClock,
  ChartNoAxesCombined,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Factory,
  HelpCircle,
  MoveRight,
  Route,
  Settings,
  ShieldCheck,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'
import { Parallax, ScrollReveal } from '@/components/motion/gsap-effects'

type PageRecord = {
  title: string
  path: string
  blocks: Array<{ id: string; type: string; hidden?: boolean; data?: Record<string, unknown> }>
}
type Data = Record<string, any>

const ICONS: Record<string, LucideIcon> = {
  'bed-double': BedDouble,
  'bus-front': BusFront,
  'building-2': Building2,
  'car-front': BusFront,
  'users-round': UsersRound,
  'chart-no-axes-combined': ChartNoAxesCombined,
  'clipboard-list': ClipboardList,
  'shield-check': ShieldCheck,
  settings: Settings,
  route: Route,
  'calendar-clock': CalendarClock,
  factory: Factory,
}

function str(data: Data, key: string, fallback = ''): string {
  const value = data?.[key]
  return typeof value === 'string' ? value : value == null ? fallback : String(value)
}

function rows(value: unknown): Data[] {
  return Array.isArray(value)
    ? value.filter((item): item is Data => Boolean(item) && typeof item === 'object' && !Array.isArray(item))
    : []
}

function Icon({ name, className = 'size-6' }: { name: unknown; className?: string }) {
  const Component = ICONS[String(name || '')] ?? HelpCircle
  return <Component aria-hidden className={className} strokeWidth={1.65} />
}

function RevealText({ title, highlight }: { title: string; highlight: string }) {
  if (!highlight) return <>{title}</>
  const at = title.indexOf(highlight)
  if (at < 0) return <>{title}</>
  return <>{title.slice(0, at)}<span className="text-[#0864f7]">{highlight}</span>{title.slice(at + highlight.length)}</>
}

function MotionSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 18 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: reduce ? 0 : 0.42, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function HeroImage({ src, alt, className = '', sizes }: { src: string; alt: string; className?: string; sizes: string }) {
  return (
    <div className={['relative h-full min-h-[210px] overflow-hidden bg-[#e8eef7]', className].join(' ')}>
      <Parallax amount={5} scale={1.045} className="absolute inset-0">
        <Image src={src} alt={alt} fill sizes={sizes} unoptimized className="object-cover" priority />
      </Parallax>
    </div>
  )
}

function ChallengeRow({ item, index, tone }: { item: Data; index: number; tone: 'dark' | 'blue' }) {
  const reduce = useReducedMotion()
  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 9 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: reduce ? 0 : 0.28, delay: reduce ? 0 : Math.min(index * 0.045, 0.16) }}
      className="grid min-h-[124px] grid-cols-[42px_minmax(0,1fr)] items-start gap-x-3 gap-y-2 border-b border-[#e5eaf2] px-3 py-4 last:border-b-0 sm:grid-cols-[42px_minmax(0,1.05fr)_16px_minmax(0,.9fr)] sm:items-center sm:gap-x-3 sm:px-4"
    >
      <span className={['row-span-2 flex size-10 items-center justify-center rounded-full text-white sm:row-span-1', tone === 'dark' ? 'bg-[#071b42]' : 'bg-[#0864f7]'].join(' ')}>
        <Icon name={item.icon} className="size-5" />
      </span>
      <div className="min-w-0">
        <h3 className="text-[11px] font-bold leading-snug text-[#14234b]">{str(item, 'title')}</h3>
        <p className="mt-1.5 text-[10px] leading-[1.6] text-[#52617d]">{str(item, 'body')}</p>
      </div>
      <MoveRight aria-hidden className="hidden size-4 text-[#14234b] sm:block" />
      <div className="col-start-2 border-l-2 border-[#d9e7ff] pl-3 sm:col-start-auto sm:border-l-0 sm:pl-0">
        <p className="text-[9px] font-bold text-[#0864f7]">{str(item, 'approachTitle', 'Our approach')}</p>
        <p className="mt-1 text-[10px] leading-[1.6] text-[#405071]">{str(item, 'approach')}</p>
      </div>
    </motion.article>
  )
}

function ChallengeComparison({ data }: { data: Data }) {
  const accommodation = rows(data.accommodationChallenges)
  const transportation = rows(data.transportationChallenges)
  if (!accommodation.length && !transportation.length) return null

  return (
    <section id="where-complexity-begins" className="scroll-mt-24">
      <div className="mb-4 text-center">
        <h2 className="text-[clamp(1.35rem,2.4vw,1.8rem)] font-bold tracking-[-.035em] text-[#14234b]">{str(data, 'challengesHeading')}</h2>
        <p className="mt-1 text-[11px] text-[#52617d]">{str(data, 'challengesIntro')}</p>
      </div>
      <div className="grid overflow-hidden rounded-lg border border-[#dce3ed] lg:grid-cols-2">
        <div className="min-w-0 border-b border-[#dce3ed] lg:border-b-0 lg:border-r">
          <h3 className="bg-[#071b42] px-4 py-3 text-center text-[11px] font-bold text-white">{str(data, 'accommodationChallengesHeading')}</h3>
          {accommodation.map((item, index) => <ChallengeRow key={index} item={item} index={index} tone="dark" />)}
        </div>
        <div className="min-w-0">
          <h3 className="bg-[#0864f7] px-4 py-3 text-center text-[11px] font-bold text-white">{str(data, 'transportationChallengesHeading')}</h3>
          {transportation.map((item, index) => <ChallengeRow key={index} item={item} index={index} tone="blue" />)}
        </div>
      </div>
      {str(data, 'challengeNote') ? (
        <p className="mt-2 flex items-start justify-center gap-2 px-3 text-center text-[10px] leading-relaxed text-[#405071]">
          <ShieldCheck aria-hidden className="mt-0.5 size-3.5 shrink-0 text-[#0864f7]" />
          {str(data, 'challengeNote')}
        </p>
      ) : null}
    </section>
  )
}

function Solutions({ data }: { data: Data }) {
  const solutions = rows(data.solutions)
  if (!solutions.length) return null
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      {solutions.map((solution, index) => {
        const items = rows(solution.items)
        const accommodation = String(solution.key) === 'accommodation' || index === 0
        return (
          <MotionSection key={String(solution.key || index)}>
            <article className={[
              'flex h-full flex-col rounded-xl p-4 sm:p-5',
              accommodation ? 'border border-[#dce8ff] bg-[#f2f7ff]' : 'border border-[#d9eee6] bg-[#f2faf6]',
            ].join(' ')}>
              <div className="mb-4 flex items-center gap-3">
                <span className={['flex size-10 items-center justify-center rounded-full text-white', accommodation ? 'bg-[#071b42]' : 'bg-[#0864f7]'].join(' ')}>
                  <Icon name={solution.icon} className="size-5" />
                </span>
                <h2 className="text-[15px] font-bold tracking-[-.02em] text-[#14234b]">{str(solution, 'title')}</h2>
              </div>
              <ul className="flex-1 divide-y divide-[#dce4ef]">
                {items.map((item, itemIndex) => (
                  <li key={itemIndex} className="group flex items-start justify-between gap-3 py-3 first:pt-0">
                    <div>
                      <h3 className="text-[10px] font-bold text-[#14234b]">{str(item, 'title')}</h3>
                      <p className="mt-0.5 text-[9px] leading-[1.55] text-[#52617d]">{str(item, 'body')}</p>
                    </div>
                    <ChevronRight aria-hidden className={['mt-1 size-4 shrink-0 transition-transform group-hover:translate-x-1', accommodation ? 'text-[#0864f7]' : 'text-[#0a9cbb]'].join(' ')} />
                  </li>
                ))}
              </ul>
              {str(solution, 'href') ? (
                <Link href={str(solution, 'href')} className="mt-4 inline-flex min-h-8 items-center gap-2 text-[10px] font-bold text-[#0864f7] hover:gap-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0864f7]">
                  {str(solution, 'ctaLabel', 'Learn more')} <ArrowRight aria-hidden className="size-3.5" />
                </Link>
              ) : null}
            </article>
          </MotionSection>
        )
      })}
    </section>
  )
}

function ProcessSteps({ data }: { data: Data }) {
  const steps = rows(data.processSteps)
  if (!steps.length) return null
  return (
    <section className="py-1">
      <div className="mb-5 text-center">
        <h2 className="text-[clamp(1.25rem,2.2vw,1.65rem)] font-bold tracking-[-.03em] text-[#14234b]">{str(data, 'processHeading')}</h2>
        <p className="mt-1 text-[10px] text-[#52617d]">{str(data, 'processSubtitle')}</p>
      </div>
      <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
        {steps.map((step, index) => (
          <li key={index} className="relative px-3 text-center">
            {index < steps.length - 1 ? <span aria-hidden className="absolute left-[calc(50%+20px)] right-[-50%] top-4 hidden border-t border-dashed border-[#8fb4f4] lg:block" /> : null}
            <span className="relative z-10 mx-auto flex size-8 items-center justify-center rounded-full bg-[#0864f7] text-[11px] font-bold text-white shadow-[0_3px_10px_rgba(8,100,247,.2)]">{index + 1}</span>
            <h3 className="mx-auto mt-3 max-w-[180px] text-[10px] font-bold text-[#14234b]">{str(step, 'title')}</h3>
            <p className="mx-auto mt-1.5 max-w-[205px] text-[9px] leading-[1.6] text-[#52617d]">{str(step, 'body')}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

function Insights({ data }: { data: Data }) {
  const insights = rows(data.insights)
  if (!insights.length) return null
  return (
    <section>
      <div className="mb-4 text-center">
        <h2 className="text-[clamp(1.25rem,2.2vw,1.65rem)] font-bold tracking-[-.03em] text-[#14234b]">{str(data, 'insightsHeading')}</h2>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        {insights.map((item, index) => (
          <MotionSection key={index}>
            <article className="group flex h-full overflow-hidden rounded-lg border border-[#dce3ed] bg-white transition-all duration-300 hover:-translate-y-1 hover:border-[#a9c8ff] hover:shadow-[0_12px_28px_rgba(18,50,100,.09)]">
              {str(item, 'image') ? (
                <div className="relative min-h-[160px] w-[39%] shrink-0 overflow-hidden bg-[#eaf0f7] sm:min-h-[178px]">
                  <Image src={str(item, 'image')} alt={str(item, 'imageAlt')} fill sizes="(max-width: 1024px) 40vw, 14vw" unoptimized className="object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
              ) : null}
              <div className="flex min-w-0 flex-1 flex-col p-3">
                <p className="text-[8px] font-bold uppercase tracking-[.12em] text-[#0864f7]">{str(item, 'tag')}</p>
                <h3 className="mt-2 text-[10px] font-bold leading-[1.45] text-[#14234b]">{str(item, 'title')}</h3>
                <p className="mt-1.5 text-[9px] leading-[1.55] text-[#52617d]">{str(item, 'body')}</p>
                {str(item, 'href') ? (
                  <Link href={str(item, 'href')} className="mt-auto inline-flex items-center gap-1.5 pt-3 text-[9px] font-bold text-[#0864f7] hover:gap-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0864f7]">
                    {str(item, 'ctaLabel', 'Read more')} <ArrowRight aria-hidden className="size-3" />
                  </Link>
                ) : null}
              </div>
            </article>
          </MotionSection>
        ))}
      </div>
      {str(data, 'insightsCtaHref') ? (
        <div className="mt-4 text-center">
          <Link href={str(data, 'insightsCtaHref')} className="inline-flex min-h-9 items-center justify-center gap-3 rounded-md border border-[#8db6ff] px-6 text-[10px] font-bold text-[#0864f7] transition-colors hover:bg-[#eff5ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0864f7]">
            {str(data, 'insightsCtaLabel', 'Explore all resources')} <ArrowRight aria-hidden className="size-3.5" />
          </Link>
        </div>
      ) : null}
    </section>
  )
}

function FaqSection({ data }: { data: Data }) {
  const faqs = rows(data.faqs)
  const [open, setOpen] = useState<number | null>(null)
  const reduce = useReducedMotion()
  if (!faqs.length) return null
  return (
    <section className="mx-auto max-w-4xl">
      <h2 className="mb-4 text-center text-[clamp(1.2rem,2vw,1.5rem)] font-bold text-[#14234b]">{str(data, 'faqHeading', 'Common questions')}</h2>
      <div className="divide-y divide-[#e2e8f1] overflow-hidden rounded-xl border border-[#dce3ed]">
        {faqs.map((faq, index) => {
          const expanded = open === index
          const panelId = `market-faq-panel-${index}`
          return (
            <div key={index}>
              <h3>
                <button type="button" aria-expanded={expanded} aria-controls={panelId} onClick={() => setOpen(expanded ? null : index)} className="flex min-h-12 w-full items-center justify-between gap-4 px-4 py-3 text-left text-[11px] font-bold text-[#14234b] transition-colors hover:bg-[#f7faff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0864f7]">
                  {str(faq, 'question')}
                  <ChevronDown aria-hidden className={['size-4 shrink-0 text-[#0864f7] transition-transform duration-200 motion-reduce:transition-none', expanded ? 'rotate-180' : ''].join(' ')} />
                </button>
              </h3>
              <AnimatePresence initial={false}>
                {expanded ? (
                  <motion.div
                    id={panelId}
                    role="region"
                    initial={reduce ? false : { height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                    transition={{ duration: reduce ? 0 : 0.24 }}
                    className="overflow-hidden"
                  >
                    <p className="px-4 pb-4 text-[10px] leading-[1.7] text-[#52617d]">{str(faq, 'answer')}</p>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function BottomCta({ data }: { data: Data }) {
  const actions = [
    {
      icon: 'bed-double',
      title: str(data, 'accommodationCtaTitle'),
      label: str(data, 'accommodationCtaLabel'),
      href: str(data, 'accommodationCtaHref'),
    },
    {
      icon: 'bus-front',
      title: str(data, 'transportationCtaTitle'),
      label: str(data, 'transportationCtaLabel'),
      href: str(data, 'transportationCtaHref'),
    },
  ]
  return (
    <section className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#061738] via-[#052457] to-[#064dbd] px-5 py-5 text-white shadow-[0_10px_28px_rgba(7,27,66,.12)] sm:px-7 sm:py-6">
      <div aria-hidden className="pointer-events-none absolute -left-5 -top-10 h-44 w-72 rounded-full border border-[#1478ed]/35 opacity-70" />
      <div aria-hidden className="pointer-events-none absolute -bottom-20 left-20 h-52 w-72 rounded-full border border-[#1478ed]/25" />
      <div className="relative grid gap-5 lg:grid-cols-[1fr_1.45fr] lg:items-center">
        <h2 className="max-w-[390px] text-[clamp(1.15rem,2.2vw,1.65rem)] font-bold leading-tight tracking-[-.025em]">{str(data, 'ctaHeading')}</h2>
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-0">
          {actions.map((action, index) => (
            <div key={index} className={['flex items-center gap-3', index === 1 ? 'sm:border-l sm:border-[#38a5ff]/60 sm:pl-5' : 'sm:pr-5'].join(' ')}>
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-white/45 bg-white/5 text-white">
                <Icon name={action.icon} className="size-6" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-[10px] font-bold leading-[1.5] sm:text-[11px]">{action.title}</h3>
                {action.href ? (
                  <Link href={action.href} className="mt-1.5 inline-flex items-center gap-2 text-[9px] font-semibold text-[#a9dcff] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                    {action.label} <ArrowRight aria-hidden className="size-3" />
                  </Link>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function MarketChallengesPage({ page }: { page: PageRecord | null }) {
  const block = page?.blocks.find((item) => item.type === 'marketChallenges' && !item.hidden)
  const data: Data = block?.data ?? {}
  const verticals = rows(data.verticals)

  return (
    <div data-page="market-challenges" className="bg-white text-[#14234b]">
      <div className="mx-auto max-w-[1280px] px-4 pb-7 pt-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-[10px] text-[#64708b]">
          <Link href="/" className="hover:text-[#0864f7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0864f7]">Home</Link>
          <ChevronRight aria-hidden className="size-3" />
          <span>Company</span>
          <ChevronRight aria-hidden className="size-3" />
          <span aria-current="page" className="font-medium text-[#14234b]">{page?.title || 'Market Challenges'}</span>
        </nav>

        <section className="grid items-center gap-6 pb-6 lg:grid-cols-[.78fr_1.22fr] lg:gap-8">
          <MotionSection className="max-w-[450px]">
            <p className="mb-2 text-[9px] font-bold uppercase tracking-[.16em] text-[#0864f7]">{str(data, 'eyebrow')}</p>
            <h1 className="text-[clamp(2rem,4.4vw,3.1rem)] font-bold leading-[1.06] tracking-[-.045em] text-[#071b42]">
              <RevealText title={str(data, 'heroTitle', page?.title || 'Market Challenges')} highlight={str(data, 'heroHighlight')} />
            </h1>
            <p className="mt-4 max-w-[420px] text-[11px] leading-[1.75] text-[#405071] sm:text-[12px]">{str(data, 'heroIntro')}</p>
            {str(data, 'heroCtaHref') ? (
              <Link href={str(data, 'heroCtaHref')} className="mt-4 inline-flex min-h-8 items-center gap-2 text-[10px] font-bold text-[#0864f7] transition-all hover:gap-3 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#0864f7]">
                {str(data, 'heroCtaLabel', 'Explore our approach')} <ArrowRight aria-hidden className="size-3.5" />
              </Link>
            ) : null}
          </MotionSection>

          <MotionSection className="relative min-w-0">
            <div className="relative grid grid-cols-[.88fr_1.12fr] gap-1.5 overflow-visible rounded-xl">
              <HeroImage src={str(data, 'heroAccommodationImage', '/images/site/acc-hero.png')} alt={str(data, 'heroAccommodationImageAlt')} sizes="(max-width: 1024px) 44vw, 25vw" className="rounded-l-xl" />
              <HeroImage src={str(data, 'heroTransportationImage', '/images/site/transport-hero.png')} alt={str(data, 'heroTransportationImageAlt')} sizes="(max-width: 1024px) 55vw, 32vw" className="rounded-r-xl" />
              <div aria-hidden className="pointer-events-none absolute -inset-x-2 bottom-[-12px] h-5 rounded-full border-b-2 border-[#8fc8ff]/75" />
              <span className="absolute -bottom-5 left-[8%] z-10 flex size-12 items-center justify-center rounded-full border-[4px] border-white bg-[#0864f7] text-white shadow-lg">
                <BedDouble aria-hidden className="size-5" />
              </span>
              <span className="absolute -bottom-5 left-[64%] z-10 flex size-12 items-center justify-center rounded-full border-[4px] border-white bg-[#0864f7] text-white shadow-lg">
                <BusFront aria-hidden className="size-5" />
              </span>
              <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
                <path d="M 54 -7 L 48 46 Q 47 53 55 53 L 50 108" fill="none" stroke="white" strokeWidth="3.4" vectorEffect="non-scaling-stroke" />
                <path d="M 54 -7 L 48 46 Q 47 53 55 53 L 50 108" fill="none" stroke="#32a7ff" strokeWidth="0.75" vectorEffect="non-scaling-stroke" />
              </svg>
            </div>
          </MotionSection>
        </section>

        {verticals.length ? (
          <MotionSection className="mb-6 grid overflow-hidden rounded-lg border border-[#dce3ed] sm:grid-cols-2">
            {verticals.map((vertical, index) => (
              <Link
                key={String(vertical.key || index)}
                href={str(vertical, 'href') || '#where-complexity-begins'}
                className={[
                  'group flex min-h-[116px] items-center gap-4 px-5 py-4 transition-all focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#0864f7] sm:px-7',
                  index === 0 ? 'bg-[#071b42] text-white hover:bg-[#0b2a60]' : 'bg-white text-[#14234b] hover:bg-[#f7faff]',
                ].join(' ')}
              >
                <span className={['flex size-14 shrink-0 items-center justify-center rounded-full border', index === 0 ? 'border-white/45 text-white' : 'border-[#dce7f8] text-[#0864f7]'].join(' ')}>
                  <Icon name={vertical.icon} className="size-7" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[14px] font-bold">{str(vertical, 'title')}</span>
                  <span className={['mt-1 block max-w-[280px] text-[10px] leading-[1.6]', index === 0 ? 'text-white/75' : 'text-[#52617d]'].join(' ')}>{str(vertical, 'body')}</span>
                </span>
                <ArrowDownRight aria-hidden className={['ml-auto size-4 shrink-0 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100', index === 0 ? 'text-white' : 'text-[#0864f7]'].join(' ')} />
              </Link>
            ))}
          </MotionSection>
        ) : null}

        <div className="space-y-8 sm:space-y-9">
          <ScrollReveal><div data-scroll-reveal><ChallengeComparison data={data} /></div></ScrollReveal>
          <ScrollReveal><div data-scroll-reveal><Solutions data={data} /></div></ScrollReveal>
          <ScrollReveal><div data-scroll-reveal><ProcessSteps data={data} /></div></ScrollReveal>
          <ScrollReveal><div data-scroll-reveal><Insights data={data} /></div></ScrollReveal>
          <FaqSection data={data} />
          <BottomCta data={data} />
        </div>
      </div>
    </div>
  )
}
