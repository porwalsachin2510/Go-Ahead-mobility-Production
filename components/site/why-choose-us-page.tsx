'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'motion/react'
import {
  ArrowRight, Building2, BusFront, CheckCircle2, ClipboardCheck,
  FileSearch, Headset, MapPin, Network, Route, ShieldCheck, Users,
  Workflow, type LucideIcon,
} from 'lucide-react'
import { Breadcrumbs } from '@/components/site/breadcrumbs'
import { SmartImage } from '@/components/site/primitives'
import { Parallax } from '@/components/motion/gsap-effects'

type Props = { content: Record<string, any> }

const icons: Record<string, LucideIcon> = {
  'shield-check': ShieldCheck,
  users: Users,
  'clipboard-check': ClipboardCheck,
  'file-search': FileSearch,
  'map-pin': MapPin,
  'building-2': Building2,
  bus: BusFront,
  route: Route,
  network: Network,
  headset: Headset,
  workflow: Workflow,
}
function CmsIcon({ name, className = 'size-6' }: { name?: string; className?: string }) {
  const Icon = icons[String(name || '').toLowerCase()] || ShieldCheck
  return <Icon className={className} strokeWidth={1.7} aria-hidden="true" />
}

export function WhyChooseUsPage({ content: c }: Props) {
  const reduceMotion = Boolean(useReducedMotion())
  const trustItems = Array.isArray(c.trustItems) ? c.trustItems.filter((item: any) => item?.title) : []
  const differentiators = Array.isArray(c.differentiators) ? c.differentiators.filter((item: any) => item?.title) : []
  const verticals = Array.isArray(c.verticals) ? c.verticals.filter((item: any) => item?.title) : []
  const steps = Array.isArray(c.workSteps) ? c.workSteps.filter((item: any) => item?.title) : []
  const evidenceCards = Array.isArray(c.evidenceCards) ? c.evidenceCards.filter((item: any) => item?.title) : []
  const reveal = reduceMotion
    ? { initial: false as const, animate: { opacity: 1, y: 0 }, transition: { duration: 0 } }
    : { initial: { opacity: 0, y: 16 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.16 }, transition: { duration: 0.48, ease: 'easeOut' as const } }

  return (
    <article data-page="why-choose-us" className="overflow-hidden bg-white text-[#101d42]">
      {c.showHero !== false ? (
        <section className="relative isolate overflow-hidden bg-white">
          <div className="relative mx-auto max-w-[1240px]">
            <div className="relative z-20 px-5 pt-4 sm:px-7 md:absolute md:left-0 md:top-3 md:px-7 md:pt-0 lg:px-10">
              <Breadcrumbs trail={[
                { name: 'Home', path: '/' },
                { name: 'Company', path: '/company/why-choose-us' },
                { name: 'Why Choose Us', path: '/company/why-choose-us' },
              ]} />
            </div>

            <div className="grid grid-cols-1 items-center gap-0 md:grid-cols-[41%_59%] md:pl-7 lg:pl-10">
              <div className="relative z-10 px-5 pb-7 pt-7 sm:px-7 md:px-0 md:pr-2 md:pt-14 md:pb-0">
                {c.heroEyebrow ? <p className="mb-3 text-[10px] font-bold uppercase tracking-[.2em] text-[#167be7]">{c.heroEyebrow}</p> : null}
                <motion.h1
                  initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.62, ease: 'easeOut' }}
                  className="max-w-[560px] text-balance text-[clamp(1.8rem,3.4vw,2.45rem)] font-semibold leading-[1.12] tracking-[-.045em] text-[#101d42]"
                >
                  <span className="block">{c.heroTitle || 'A clearer way to'}</span>
                  {c.heroHighlight ? <span className="text-[#0863f7]">{c.heroHighlight}</span> : null}
                </motion.h1>
                {c.heroDescription ? (
                  <motion.p
                    initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.58, delay: reduceMotion ? 0 : 0.1, ease: 'easeOut' }}
                    className="mt-4 max-w-[340px] text-[11px] leading-[1.75] text-[#4d5a75] sm:text-[11px]"
                  >
                    {c.heroDescription}
                  </motion.p>
                ) : null}
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.52, delay: reduceMotion ? 0 : 0.18, ease: 'easeOut' }}
                  className="mt-5 flex flex-wrap items-center gap-3"
                >
                  {c.heroPrimaryLabel ? (
                    <Link href={c.heroPrimaryHref || '/contact'} className="group inline-flex min-h-7 items-center justify-center gap-2 rounded-md bg-[#0863f7] px-3 py-1.5 text-[8px] font-semibold text-white shadow-[0_7px_20px_rgba(8,99,247,.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#064fca] hover:shadow-[0_10px_24px_rgba(8,99,247,.24)] motion-reduce:transform-none motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1677ef] focus-visible:ring-offset-2">
                      {c.heroPrimaryLabel}<ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden="true" />
                    </Link>
                  ) : null}
                  {c.heroSecondaryLabel ? (
                    <Link href={c.heroSecondaryHref || '#how-we-work'} className="group inline-flex min-h-7 items-center gap-2 rounded-md px-2 py-1.5 text-[8px] font-semibold text-[#0863f7] transition-colors hover:bg-[#edf5ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1677ef]">
                      {c.heroSecondaryLabel}<ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden="true" />
                    </Link>
                  ) : null}
                </motion.div>
              </div>

              <motion.div
                initial={reduceMotion ? false : { opacity: 0, x: 22 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.78, delay: reduceMotion ? 0 : 0.04, ease: 'easeOut' }}
                className="group relative mx-5 aspect-[1.78/1] overflow-hidden rounded-l-[26px] border-l-2 border-[#24a9ef] bg-[#dce8f4] shadow-[0_12px_32px_rgba(16,36,72,.11)] sm:mx-7 md:-ml-6 md:mr-0 md:aspect-[1.86/1] md:w-[calc(100%_+_1.5rem_+_max(0px,_50vw_-_620px))] md:rounded-none md:border-l-0 md:shadow-none"
              >
                <Parallax amount={2} scale={1.02} className="absolute inset-0">
                  {c.heroImage ? (
                    <SmartImage
                      src={c.heroImage}
                      alt={c.heroImageAlt || ''}
                      sizes="(min-width: 1024px) 59vw, (min-width: 768px) 59vw, 100vw"
                      priority
                      objectPosition={c.heroImagePosition || '50% 50%'}
                      className="object-cover"
                    />
                  ) : null}
                </Parallax>
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#06152b]/5 via-transparent to-[#06152b]/10 md:hidden" />
                <svg
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 z-10 hidden size-full md:block"
                  viewBox="0 0 1000 535"
                  fill="none"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0 0H360C280 50 130 70 130 145V318C130 360 110 382 70 410C50 430 54 455 54 490V535H0V0Z"
                    fill="#fff"
                  />
                  <path
                    d="M360 0C280 50 130 70 130 145V318C130 360 110 382 70 410C30 435 0 455 0 490V535"
                    stroke="#24a9ef"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
                <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 hidden w-[2px] bg-gradient-to-b from-transparent via-[#24a9ef] to-[#24a9ef]/80 md:hidden" />
              </motion.div>
            </div>
          </div>
        </section>
      ) : null}

      {c.showTrustStrip !== false && trustItems.length ? (
        <section aria-label="Our service commitments" className="mx-auto max-w-[1240px] px-5 py-3 sm:px-7 lg:px-10 lg:py-4">
          <div className="grid overflow-hidden rounded-xl border border-[#e2eaf4] bg-white shadow-[0_4px_18px_rgba(16,36,72,.035)] sm:grid-cols-3">
            {trustItems.map((item: any, index: number) => (
              <motion.div {...reveal} key={String(item.title || '') + '-' + index} className="group flex min-h-[88px] items-center gap-3 border-b border-[#edf1f6] px-4 py-4 last:border-0 sm:border-b-0 sm:border-r sm:px-5 sm:last:border-r-0 lg:px-7">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-[#e0eaff] bg-[#fbfdff] text-[#0863f7] transition-colors group-hover:bg-[#f0f6ff]"><CmsIcon name={item.icon} className="size-6" /></span>
                <span className="min-w-0"><strong className="block text-[10px] font-semibold text-[#1a2a4d] sm:text-[11px]">{item.title}</strong><span className="mt-1 block text-[9px] leading-4 text-[#65718a] sm:text-[10px]">{item.body}</span></span>
              </motion.div>
            ))}
          </div>
        </section>
      ) : null}

      {c.showDifferentiators !== false && differentiators.length ? (
        <section className="mx-auto max-w-[1240px] px-5 pb-8 pt-7 sm:px-7 lg:px-10 lg:pb-10 lg:pt-8">
          <motion.header {...reveal} className="mb-5 text-center sm:mb-7">
            {c.differentiatorsEyebrow ? <p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#167be7]">{c.differentiatorsEyebrow}</p> : null}
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-[#142449] sm:text-2xl">{c.differentiatorsTitle || 'Why organizations choose GoAhead'}</h2>
            {c.differentiatorsDescription ? <p className="mx-auto mt-2 max-w-3xl text-[10px] leading-5 text-[#69758d] sm:text-[11px]">{c.differentiatorsDescription}</p> : null}
          </motion.header>
          <div className="space-y-2">
            {differentiators.map((item: any, index: number) => {
              const reverse = index % 2 === 1
              return (
                <motion.article {...reveal} key={String(item.number || index) + '-' + String(item.title || '')} className={'group grid overflow-hidden rounded-md border border-[#e6edf6] bg-white shadow-[0_3px_12px_rgba(16,36,72,.025)] transition-all duration-300 hover:border-[#a9cbff] hover:shadow-[0_8px_24px_rgba(16,36,72,.08)] motion-reduce:transition-none md:min-h-[104px] md:grid-cols-2 ' + (reverse ? 'md:[&>div:first-child]:order-2' : '')}>
                  <div className="flex items-start gap-4 border-l-2 border-[#1678ef] px-4 py-4 sm:gap-5 sm:px-6 sm:py-5">
                    <span className="min-w-12 text-[25px] font-semibold leading-none tracking-[-.04em] text-[#0863f7] sm:min-w-14 sm:text-[30px]">{item.number || String(index + 1).padStart(2, '0')}</span>
                    <span className="pt-0.5"><h3 className="text-[11px] font-semibold text-[#17284d] sm:text-[12px]">{item.title}</h3><p className="mt-1.5 max-w-xl text-[9px] leading-[1.6] text-[#62708a] sm:text-[10px]">{item.body}</p></span>
                  </div>
                  <div className="relative min-h-[145px] overflow-hidden bg-[#edf2f8] sm:min-h-[155px]">
                    {item.image ? <SmartImage src={item.image} alt={item.imageAlt || item.title} sizes="(min-width: 768px) 50vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.035] motion-reduce:transition-none motion-reduce:group-hover:scale-100" /> : null}
                  </div>
                </motion.article>
              )
            })}
          </div>
        </section>
      ) : null}

      {c.showVerticals !== false && verticals.length ? (
        <section className="mx-auto max-w-[1240px] px-5 pb-7 pt-2 sm:px-7 lg:px-10 lg:pb-9">
          <motion.header {...reveal} className="mb-4 text-center">
            <h2 className="text-lg font-semibold tracking-tight text-[#142449] sm:text-xl">{c.verticalsTitle || 'Two service verticals, one coordinated conversation'}</h2>
            {c.verticalsDescription ? <p className="mt-1 text-[10px] text-[#6a7690]">{c.verticalsDescription}</p> : null}
          </motion.header>
          <div className="grid gap-4 md:grid-cols-2">
            {verticals.map((item: any, index: number) => (
              <motion.article {...reveal} key={String(item.title || '') + '-' + index} className="group grid overflow-hidden rounded-lg border border-[#e4eaf2] bg-[#041631] shadow-[0_8px_24px_rgba(12,33,68,.12)] sm:grid-cols-[1fr_.9fr]">
                <div className="relative min-h-[210px] overflow-hidden bg-[#dbe5f0] sm:min-h-[245px]">
                  {item.image ? <SmartImage src={item.image} alt={item.imageAlt || item.title} sizes="(min-width: 768px) 25vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.04] motion-reduce:transition-none" /> : null}
                </div>
                <div className="flex flex-col justify-center bg-[#041631] px-5 py-5 text-white sm:px-5">
                  <h3 className="text-[14px] font-semibold leading-tight">{item.title}</h3>
                  {item.subtitle ? <p className="mt-1.5 text-[9px] leading-4 text-white/70">{item.subtitle}</p> : null}
                  <p className="mt-3 text-[9px] font-semibold text-[#8bc4ff]">{item.eyebrow || 'Scope includes:'}</p>
                  {Array.isArray(item.features) && item.features.length ? <ul className="mt-2 space-y-1.5">
                    {item.features.map((feature: any, featureIndex: number) => <li key={String(feature.text || feature) + '-' + featureIndex} className="flex items-start gap-2 text-[9px] leading-4 text-white/90"><CheckCircle2 className="mt-0.5 size-3 shrink-0 text-[#91c7ff]" aria-hidden="true" />{feature.text || feature}</li>)}
                  </ul> : null}
                  {item.buttonLabel ? <Link href={item.buttonHref || '/contact'} className="mt-4 inline-flex w-fit items-center gap-2 text-[9px] font-semibold text-white transition-colors hover:text-[#91c7ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#91c7ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#041631]">{item.buttonLabel}<ArrowRight className="size-3 transition-transform group-hover:translate-x-1" aria-hidden="true" /></Link> : null}
                </div>
              </motion.article>
            ))}
          </div>
        </section>
      ) : null}

      {c.showProcess !== false && steps.length ? (
        <section id="how-we-work" className="scroll-mt-24 mx-auto max-w-[1240px] px-5 pb-8 pt-1 sm:px-7 lg:px-10 lg:pb-10">
          <motion.header {...reveal} className="mb-4 text-center">
            <h2 className="text-lg font-semibold tracking-tight text-[#142449] sm:text-xl">{c.processTitle || 'How we work'}</h2>
          </motion.header>
          <div className="relative grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
            <div aria-hidden="true" className="absolute left-[12%] right-[12%] top-5 hidden h-px bg-[#9bc5ff] lg:block" />
            {steps.map((step: any, index: number) => (
              <motion.article {...reveal} key={String(step.number || index) + '-' + String(step.title || '')} className="relative flex flex-col items-center text-center">
                <span className="relative z-10 flex size-10 items-center justify-center rounded-full border-4 border-white bg-[#0863f7] text-[11px] font-semibold text-white shadow-[0_0_0_1px_#a9ccff]">{step.number || index + 1}</span>
                <h3 className="mt-2 text-[10px] font-semibold text-[#1b2b4e]">{step.title}</h3>
                <p className="mt-1 max-w-[230px] text-[9px] leading-4 text-[#68758e]">{step.body}</p>
              </motion.article>
            ))}
          </div>
        </section>
      ) : null}

      {c.showEvidence !== false && evidenceCards.length ? (
        <section className="mx-auto max-w-[1240px] px-5 pb-4 pt-1 sm:px-7 lg:px-10 lg:pb-5">
          <motion.header {...reveal} className="mb-3 text-center">
            {c.evidenceEyebrow ? <p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#167be7]">{c.evidenceEyebrow}</p> : null}
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-[#142449] sm:text-xl">{c.evidenceTitle || 'Show the evidence, not just the promise'}</h2>
          </motion.header>
          <div className="grid gap-3 md:grid-cols-3">
            {evidenceCards.map((item: any, index: number) => (
              <motion.article {...reveal} key={String(item.title || '') + '-' + index} className="group flex min-h-[126px] gap-3 rounded-lg border border-[#e3eaf4] bg-white p-4 shadow-[0_3px_14px_rgba(16,36,72,.025)] transition-all hover:-translate-y-0.5 hover:border-[#aacbff] hover:shadow-[0_8px_22px_rgba(16,36,72,.07)] motion-reduce:transform-none motion-reduce:transition-none">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-full border border-[#d9e7ff] bg-[#fbfdff] text-[#0863f7] transition-colors group-hover:bg-[#f0f6ff]"><CmsIcon name={item.icon} className="size-7" /></span>
                <span className="flex min-w-0 flex-col">
                  <h3 className="text-[10px] font-semibold text-[#1b2b4e]">{item.title}</h3>
                  <p className="mt-1.5 text-[9px] leading-4 text-[#69758d]">{item.body}</p>
                  {item.buttonLabel ? <Link href={item.buttonHref || '/contact'} className="mt-auto inline-flex w-fit items-center gap-1 pt-2 text-[9px] font-semibold text-[#0863f7] hover:text-[#064fca] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1677ef]">{item.buttonLabel}<ArrowRight className="size-3 transition-transform group-hover:translate-x-1" aria-hidden="true" /></Link> : null}
                </span>
              </motion.article>
            ))}
          </div>
          {c.evidenceNote ? <div className="mt-3 flex items-center justify-center gap-2 rounded-md border border-[#e7eef8] bg-[#f3f7ff] px-3 py-3 text-center text-[9px] leading-4 text-[#526481] sm:text-[10px]"><ShieldCheck className="size-3.5 shrink-0 text-[#0863f7]" aria-hidden="true" />{c.evidenceNote}</div> : null}
        </section>
      ) : null}

      {c.showCta !== false ? (
        <section className="mx-auto max-w-[1240px] px-5 pb-5 pt-1 sm:px-7 lg:px-10 lg:pb-6">
          <motion.div {...reveal} className="relative isolate grid overflow-hidden rounded-lg border border-[#1d426f] bg-[#03132f] px-5 py-5 text-white shadow-[0_12px_28px_rgba(3,19,47,.2)] sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-5 sm:px-7 sm:py-6">
            <div className="flex size-14 items-center justify-center rounded-full border border-[#439be9]/70 bg-[#0a254c] text-[#8cc9ff]"><Users className="size-7" aria-hidden="true" /></div>
            <div className="relative z-10 mt-3 sm:mt-0">
              <h2 className="text-[14px] font-semibold tracking-tight sm:text-base">{c.ctaTitle || "Let's find the right operating model for your organisation."}</h2>
              {c.ctaBody ? <p className="mt-1 text-[10px] leading-5 text-white/70">{c.ctaBody}</p> : null}
            </div>
            <div className="relative z-10 mt-4 flex flex-wrap gap-2 sm:mt-0">
              {c.ctaPrimaryLabel ? <Link href={c.ctaPrimaryHref || '/contact'} className="group inline-flex min-h-9 items-center justify-center gap-2 rounded-md bg-[#0863f7] px-3.5 py-2 text-[9px] font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#064fca] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#91c7ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#03132f]">{c.ctaPrimaryLabel}<ArrowRight className="size-3 transition-transform group-hover:translate-x-1" aria-hidden="true" /></Link> : null}
              {c.ctaSecondaryLabel ? <Link href={c.ctaSecondaryHref || '/contact'} className="inline-flex min-h-9 items-center justify-center rounded-md border border-white/45 px-3.5 py-2 text-[9px] font-semibold text-white transition hover:border-[#91c7ff] hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#91c7ff]">{c.ctaSecondaryLabel}</Link> : null}
            </div>
            <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-20 size-64 rounded-full border-[20px] border-[#1769b4]/20" />
            <div aria-hidden="true" className="pointer-events-none absolute -right-2 -top-14 size-48 rounded-full border border-[#58a9ee]/20" />
          </motion.div>
        </section>
      ) : null}
    </article>
  )
}
