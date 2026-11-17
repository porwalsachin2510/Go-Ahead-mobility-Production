'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  ArrowRight, BellRing, Bus, CarFront, CheckCircle2, ChevronDown, ClipboardList,
  Eye, Factory, FileCheck, FileClock, FileText, GraduationCap, IdCard, Info,
  MapPin, MessageCircle, RefreshCw, ShieldCheck, Target, Users, type LucideIcon,
} from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Parallax, ScrollReveal } from '@/components/motion/gsap-effects'

type SafetyTrustPageData = {
  title: string
  path: string
  blocks: Array<{ id: string; type: string; hidden?: boolean; data?: Record<string, unknown> }>
}
type RecordValue = Record<string, unknown>

const ICONS: Record<string, LucideIcon> = {
  users: Users, 'clipboard-list': ClipboardList, eye: Eye, 'shield-check': ShieldCheck,
  target: Target, 'refresh-cw': RefreshCw, 'id-card': IdCard, 'bell-ring': BellRing,
  'graduation-cap': GraduationCap, 'map-pin': MapPin, 'file-check': FileCheck,
  'file-clock': FileClock, 'file-text': FileText, bus: Bus, 'car-front': CarFront,
  factory: Factory, 'message-circle': MessageCircle,
}
const str = (value: unknown, fallback = '') => typeof value === 'string' ? value : fallback
const records = (value: unknown): RecordValue[] => Array.isArray(value)
  ? value.filter((item): item is RecordValue => Boolean(item) && typeof item === 'object')
  : []
const tags = (value: unknown): string[] => Array.isArray(value)
  ? value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
  : []

function SafetyIcon({ name, className = 'size-6' }: { name: unknown; className?: string }) {
  const Icon = ICONS[str(name)] || ShieldCheck
  return <Icon className={className} strokeWidth={1.55} aria-hidden />
}

function CMSImage({ src, alt, className = '', sizes = '100vw' }: { src: unknown; alt: unknown; className?: string; sizes?: string }) {
  const source = str(src)
  if (!source) return <div className={'h-full w-full bg-gradient-to-br from-[#eaf2ff] to-[#f5f8fc] ' + className} aria-hidden />
  // CMS images can be uploaded to the configured media provider or selected from the site library.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={source} alt={str(alt)} loading="lazy" sizes={sizes} className={'h-full w-full object-cover ' + className} />
}

function SafetyFaq({ items }: { items: RecordValue[] }) {
  const [open, setOpen] = useState<number | null>(0)
  const reduceMotion = useReducedMotion()
  return (
    <div className="overflow-hidden rounded-xl border border-[#dce5f2] bg-white">
      {items.map((item, index) => {
        const expanded = open === index
        const panelId = 'safety-faq-panel-' + index
        return (
          <div key={str(item.question) + '-' + index} className="border-b border-[#e6ebf3] last:border-b-0">
            <h3>
              <button type="button" aria-expanded={expanded} aria-controls={panelId}
                onClick={() => setOpen(expanded ? null : index)}
                className="flex min-h-14 w-full items-center justify-between gap-4 px-4 py-3 text-left text-[13px] font-semibold text-[#14234b] transition-colors hover:bg-[#f7faff] focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#0864f7] sm:px-5">
                <span>{str(item.question)}</span>
                <ChevronDown className={'size-4 shrink-0 text-[#0864f7] transition-transform duration-200 ' + (expanded ? 'rotate-180' : '')} aria-hidden />
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {expanded ? (
                <motion.div id={panelId} key="answer"
                  initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.24, ease: 'easeOut' }}
                  className="overflow-hidden">
                  <p className="px-4 pb-4 text-[12px] leading-[1.75] text-[#405071] sm:px-5">{str(item.answer)}</p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}

export function SafetyTrustPage({ page }: { page: SafetyTrustPageData }) {
  const reduceMotion = useReducedMotion()
  const block = page.blocks.find((item) => item.type === 'safetyTrust' && !item.hidden)
  const data = block?.data ?? {}
  const benefits = records(data.benefits)
  const introItems = records(data.introItems)
  const framework = records(data.frameworkItems)
  const steps = records(data.steps)
  const contexts = records(data.contexts)
  const policies = records(data.policies)
  const faqs = records(data.faqs)
  const quickLinks = records(data.quickLinks)

  return (
    <main id="main" className="overflow-hidden bg-white text-[#14234b]" data-page="safety-trust">
      <div className="mx-auto max-w-[1320px] px-4 pb-8 pt-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-[11px] text-[#64708b]">
          <Link href="/" className="transition-colors hover:text-[#0864f7]">Home</Link>
          <span aria-hidden>/</span>
          <Link href="/about-us" className="transition-colors hover:text-[#0864f7]">Company</Link>
          <span aria-hidden>/</span>
          <span aria-current="page" className="font-medium text-[#14234b]">Safety &amp; Trust</span>
        </nav>

        <section className="grid items-center gap-7 lg:grid-cols-[.88fr_1.12fr] lg:gap-9" aria-labelledby="safety-hero-title">
          <motion.div initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }} className="relative z-10 py-3 lg:py-7">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[.14em] text-[#0864f7]">{str(data.eyebrow, 'Safety & Trust')}</p>
            <h1 id="safety-hero-title" className="max-w-[590px] text-[clamp(2rem,4.2vw,3.25rem)] font-semibold leading-[1.09] tracking-[-.045em]">
              {str(data.heroTitle, 'People-first mobility.')}
              <span className="mt-1 block text-[#0864f7]">{str(data.heroHighlight, 'Clearer safety practices.')}</span>
            </h1>
            <p className="mt-4 max-w-[510px] text-[13px] leading-[1.8] text-[#405071]">{str(data.heroIntro)}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={str(data.primaryCtaHref, '/contact')} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[#0864f7] px-4 text-[11px] font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#0753cf] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0864f7]">
                {str(data.primaryCtaLabel, 'Discuss Your Requirements')} <ArrowRight className="size-3.5" aria-hidden />
              </Link>
              <Link href={str(data.secondaryCtaHref, '#safety-framework')} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#9bbcff] bg-white px-4 text-[11px] font-semibold text-[#0864f7] transition-colors hover:bg-[#f2f7ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0864f7]">
                {str(data.secondaryCtaLabel, 'Explore Our Approach')}
              </Link>
            </div>
          </motion.div>

          <div className="relative min-h-[250px] sm:min-h-[340px] lg:min-h-[390px]">
            <div className="absolute -left-3 top-5 bottom-0 hidden w-14 rounded-[34px_0_0_0] border-l-2 border-t-2 border-[#16a4ff] lg:block" aria-hidden />
            <Parallax amount={7} scale={1.04} className="absolute inset-0 overflow-hidden rounded-[18px_5px_5px_18px]">
              <CMSImage src={data.heroImage} alt={data.heroImageAlt} className="absolute inset-0" sizes="(max-width: 1024px) 100vw, 58vw" />
            </Parallax>
            <div className="pointer-events-none absolute inset-0 rounded-[18px_5px_5px_18px] bg-gradient-to-t from-[#061a36]/20 via-transparent to-transparent" aria-hidden />
          </div>
        </section>

        {benefits.length ? (
          <motion.section initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55 }}
            className="mt-6 grid divide-y divide-[#e7edf6] overflow-hidden rounded-xl border border-[#e2e9f3] bg-white sm:grid-cols-2 sm:divide-y-0 sm:divide-x lg:grid-cols-4"
            aria-label="Safety principles">
            {benefits.map((item, index) => (
              <div key={str(item.title) + '-' + index} className="flex items-center gap-3 px-4 py-4 sm:px-5">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#f3f7ff] text-[#0864f7]"><SafetyIcon name={item.icon} className="size-7" /></span>
                <span className="min-w-0"><span className="block text-[11px] font-bold">{str(item.title)}</span><span className="mt-1 block text-[10px] leading-[1.55] text-[#52617d]">{str(item.body)}</span></span>
              </div>
            ))}
          </motion.section>
        ) : null}

        <section className="mt-7 grid items-center gap-6 lg:grid-cols-[.88fr_1.12fr] lg:gap-9">
          <div className="h-[220px] overflow-hidden rounded-lg border border-[#e6ebf3] sm:h-[290px]">
            <CMSImage src={data.introImage} alt={data.introImageAlt} sizes="(max-width: 1024px) 100vw, 45vw" />
          </div>
          <div>
            <h2 className="max-w-[510px] text-[clamp(1.35rem,2.5vw,1.85rem)] font-semibold leading-[1.2] tracking-[-.03em]">{str(data.introHeading)}</h2>
            <p className="mt-2 max-w-[680px] text-[12px] leading-[1.7] text-[#52617d]">{str(data.introBody)}</p>
            <div className="mt-4 divide-y divide-[#e6ebf3]">
              {introItems.map((item, index) => (
                <div key={str(item.title) + '-' + index} className="flex items-center gap-3 py-3 first:pt-0">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f2f7ff] text-[#0864f7]"><SafetyIcon name={item.icon} /></span>
                  <span><span className="block text-[11px] font-bold">{str(item.title)}</span><span className="mt-1 block text-[10px] leading-[1.55] text-[#52617d]">{str(item.body)}</span></span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="safety-framework" className="scroll-mt-24 mt-7" aria-labelledby="safety-framework-title">
          <h2 id="safety-framework-title" className="mb-3 text-[17px] font-semibold tracking-[-.02em]">{str(data.frameworkHeading, 'Our safety framework')}</h2>
          <div className="grid gap-2.5 md:grid-cols-2">
            {framework.map((item, index) => (
              <motion.article key={str(item.number) + '-' + str(item.title)}
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.12 }}
                transition={{ duration: 0.45, delay: Math.min(index % 3, 2) * 0.045 }}
                className="grid min-h-[108px] grid-cols-[30px_42px_minmax(0,1fr)_112px] items-center gap-2 rounded-lg border border-[#e1e8f2] bg-white p-3 transition-shadow hover:shadow-md sm:grid-cols-[34px_48px_minmax(0,1fr)_140px] sm:gap-3">
                <span className="self-start pt-1 text-[13px] font-bold text-[#0864f7]">{str(item.number, String(index + 1).padStart(2, '0'))}</span>
                <span className="flex size-10 items-center justify-center rounded-full bg-[#f3f7ff] text-[#0864f7] sm:size-11"><SafetyIcon name={item.icon} className="size-6" /></span>
                <span className="min-w-0"><span className="block text-[11px] font-bold leading-snug">{str(item.title)}</span><span className="mt-1 block text-[9px] leading-[1.55] text-[#52617d] sm:text-[10px]">{str(item.body)}</span></span>
                <span className="h-[76px] overflow-hidden rounded-md bg-[#f2f5f9]"><CMSImage src={item.image} alt={item.imageAlt} sizes="140px" /></span>
              </motion.article>
            ))}
          </div>
        </section>

        {steps.length ? (
          <section className="mt-7" aria-labelledby="safety-steps-title">
            <h2 id="safety-steps-title" className="mb-3 text-center text-[17px] font-semibold tracking-[-.02em]">{str(data.stepsHeading, 'How an issue is handled')}</h2>
            <div className="relative grid gap-4 rounded-xl border border-[#e6ebf3] bg-white px-4 py-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-2">
              <div className="absolute left-[12%] right-[12%] top-5 hidden border-t border-dashed border-[#a9c8ff] lg:block" aria-hidden />
              {steps.map((item, index) => (
                <div key={str(item.title) + '-' + index} className="relative z-10 flex gap-3 lg:flex-col lg:items-center lg:px-3 lg:text-center">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-white bg-[#0864f7] text-[11px] font-bold text-white shadow-sm">{index + 1}</span>
                  <span className="lg:mt-1"><span className="block text-[11px] font-bold">{str(item.title)}</span><span className="mt-1 block max-w-[250px] text-[10px] leading-[1.6] text-[#52617d]">{str(item.body)}</span></span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {contexts.length ? (
          <section className="mt-7" aria-labelledby="safety-context-title">
            <h2 id="safety-context-title" className="mb-3 text-center text-[17px] font-semibold tracking-[-.02em]">{str(data.contextsHeading, 'Designed around the operating context')}</h2>
            <div className="grid gap-3 lg:grid-cols-2">
              {contexts.map((item, index) => (
                <motion.article key={str(item.title) + '-' + index}
                  whileHover={reduceMotion ? undefined : { y: -3 }} transition={{ duration: 0.22 }}
                  className={'grid overflow-hidden rounded-xl border border-[#e5ebf3] ' + (str(item.tone) === 'green' ? 'bg-[#eff8f2]' : 'bg-[#f0f5ff]') + ' sm:grid-cols-[minmax(140px,.72fr)_1fr]'}>
                  <div className="min-h-[180px] sm:min-h-[220px]"><CMSImage src={item.image} alt={item.imageAlt} /></div>
                  <div className="p-4 sm:p-5">
                    <h3 className="text-[14px] font-semibold leading-snug">{str(item.title)}</h3>
                    <p className="mt-2 text-[10px] leading-[1.6] text-[#52617d]">{str(item.body)}</p>
                    {tags(item.points).length ? (
                      <ul className="mt-3 space-y-1.5">{tags(item.points).map((point) => <li key={point} className="flex items-start gap-1.5 text-[10px] leading-[1.5] text-[#354665]"><CheckCircle2 className="mt-0.5 size-3 shrink-0 text-[#168bce]" aria-hidden />{point}</li>)}</ul>
                    ) : null}
                    <p className="mt-3 text-[10px] leading-[1.55] text-[#354665]">{str(item.note)}</p>
                  </div>
                </motion.article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-7 grid items-center gap-5 lg:grid-cols-[.78fr_1.22fr]">
          <div className="h-[190px] overflow-hidden rounded-lg border border-[#e6ebf3] sm:h-[230px]">
            <CMSImage src={data.technologyImage} alt={data.technologyImageAlt} sizes="(max-width: 1024px) 100vw, 40vw" />
          </div>
          <div>
            <h2 className="text-[clamp(1.25rem,2.4vw,1.7rem)] font-semibold leading-[1.2] tracking-[-.025em]">{str(data.technologyHeading)}</h2>
            <p className="mt-2 text-[11px] leading-[1.75] text-[#52617d]">{str(data.technologyBody)}</p>
            {str(data.technologyNotice) ? <div className="mt-4 flex items-center gap-2 rounded-lg border border-[#dce5f2] bg-[#f9fbfe] px-3 py-3 text-[10px] text-[#405071]"><Info className="size-4 shrink-0 text-[#0864f7]" aria-hidden />{str(data.technologyNotice)}</div> : null}
          </div>
        </section>

        {policies.length ? (
          <section className="mt-7" aria-labelledby="safety-policies-title">
            <h2 id="safety-policies-title" className="mb-3 text-[17px] font-semibold tracking-[-.02em]">{str(data.policiesHeading, 'Policies, records & accountability')}</h2>
            <div className="grid gap-3 md:grid-cols-3">
              {policies.map((item, index) => {
                const card = (
                  <>
                    <span className="flex size-10 shrink-0 items-center justify-center text-[#0864f7]"><SafetyIcon name={item.icon} className="size-8" /></span>
                    <span className="block text-[11px] font-bold leading-snug">{str(item.title)}</span>
                    <span className="mt-2 block text-[10px] leading-[1.6] text-[#52617d]">{str(item.body)}</span>
                    {str(item.status) ? <span className="mt-3 inline-flex max-w-full rounded-full border border-[#abd0ff] bg-[#f7fbff] px-2.5 py-1 text-[9px] font-medium leading-snug text-[#0864f7]">{str(item.status)}</span> : null}
                  </>
                )
                return str(item.href)
                  ? <Link key={str(item.title) + '-' + index} href={str(item.href)} className="rounded-xl border border-[#e1e8f2] bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0864f7]">{card}</Link>
                  : <article key={str(item.title) + '-' + index} className="rounded-xl border border-[#e1e8f2] bg-white p-4 transition-shadow hover:shadow-md">{card}</article>
              })}
            </div>
          </section>
        ) : null}

        {faqs.length ? (
          <ScrollReveal className="mt-7">
            <section data-scroll-reveal aria-labelledby="safety-faq-title">
              <h2 id="safety-faq-title" className="mb-3 text-[17px] font-semibold tracking-[-.02em]">{str(data.faqHeading, 'Frequently asked questions')}</h2>
              <SafetyFaq items={faqs} />
            </section>
          </ScrollReveal>
        ) : null}

        <ScrollReveal className="mt-5">
          <section data-scroll-reveal className="relative isolate overflow-hidden rounded-xl border border-[#cbdcff] bg-[#f0f6ff] px-5 py-5 sm:px-7">
            <div className="pointer-events-none absolute -right-10 -top-12 size-64 rounded-full border border-[#c4d9ff]/70" aria-hidden />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-full border border-[#8bbaff] bg-white text-[#0864f7] sm:size-16"><Users className="size-8" strokeWidth={1.35} aria-hidden /></span>
                <div><h2 className="text-[clamp(1.05rem,2vw,1.45rem)] font-semibold leading-snug">{str(data.ctaHeading)}</h2><p className="mt-1 max-w-[650px] text-[11px] leading-[1.65] text-[#52617d]">{str(data.ctaBody)}</p></div>
              </div>
              <Link href={str(data.ctaHref, '/contact')} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-[#0864f7] px-5 text-[11px] font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[#0753cf] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0864f7]">{str(data.ctaLabel, 'Discuss Your Requirements')} <ArrowRight className="size-3.5" aria-hidden /></Link>
            </div>
          </section>
        </ScrollReveal>

        {quickLinks.length ? (
          <nav aria-label="Related transportation pages" className="mt-3 grid overflow-hidden rounded-lg border border-[#dce5f2] sm:grid-cols-2 lg:grid-cols-4">
            {quickLinks.map((item, index) => (
              <Link key={str(item.label) + '-' + index} href={str(item.href, '/contact')} className="flex min-h-12 items-center justify-between gap-3 border-b border-[#e8edf5] px-4 py-3 text-[10px] font-semibold text-[#354665] transition-colors hover:bg-[#f5f8ff] hover:text-[#0864f7] focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#0864f7] sm:border-r sm:last:border-r-0 lg:border-b-0">
                <span className="flex items-center gap-2"><SafetyIcon name={item.icon} className="size-4 text-[#0864f7]" />{str(item.label)}</span>
                <ArrowRight className="size-3.5 shrink-0 text-[#0864f7]" aria-hidden />
              </Link>
            ))}
          </nav>
        ) : null}
      </div>
    </main>
  )
}
