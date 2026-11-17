'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion, useReducedMotion } from 'motion/react'
import {
  ArrowRight, ArrowUpRight, BedDouble, Building2, BusFront, ChartNoAxesCombined,
  LockKeyhole, ShieldCheck, type LucideIcon,
} from 'lucide-react'
import { NewsletterForm } from '@/components/site/newsletter-form'
import { Parallax, ScrollReveal } from '@/components/motion/gsap-effects'
import { DEFAULT_NEWSLETTER_PAGE } from '@/lib/newsletter/defaults'

type NewsletterPageRecord = {
  title: string
  path: string
  blocks: Array<{ id: string; type: string; hidden?: boolean; data?: Record<string, unknown> }>
}

type Data = Record<string, any>

const ICONS: Record<string, LucideIcon> = {
  'building-2': Building2,
  'bus-front': BusFront,
  'chart-no-axes-combined': ChartNoAxesCombined,
  'shield-check': ShieldCheck,
  'lock-keyhole': LockKeyhole,
  'bed-double': BedDouble,
}

const STATUS_MESSAGES: Record<string, { title: string; body: string }> = {
  confirmed: { title: 'You are subscribed', body: 'Thanks for confirming. Our next issue will land in your inbox.' },
  unsubscribed: { title: 'You have been unsubscribed', body: 'You will no longer receive our newsletter. You can resubscribe at any time.' },
  invalid: { title: 'That link has expired', body: 'The confirmation link is invalid or already used. Subscribe again below.' },
}

function value(data: Data, key: string, fallback = ''): string {
  const current = data[key]
  return typeof current === 'string' ? current : current == null ? fallback : String(current)
}

function items(data: Data, key: string): Data[] {
  return Array.isArray(data[key]) ? data[key].filter((entry: unknown) => entry && typeof entry === 'object') : []
}

function CmsImage({
  src,
  alt,
  className,
  priority = false,
}: {
  src?: string
  alt?: string
  className?: string
  priority?: boolean
}) {
  if (!src) return <div aria-hidden="true" className={className} />
  return (
    <Image
      src={src}
      alt={alt || ''}
      fill
      unoptimized
      priority={priority}
      sizes="(max-width: 768px) 100vw, 50vw"
      className={className}
    />
  )
}

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5 text-center">
      <h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-[28px]">{title}</h2>
      {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
    </div>
  )
}

export function NewsletterPage({ page, status }: { page: NewsletterPageRecord | null; status?: string }) {
  const reduce = useReducedMotion()
  const defaultBlock = DEFAULT_NEWSLETTER_PAGE.blocks[0]
  const block = page?.blocks.find((entry) => entry.type === 'newsletterPage' && !entry.hidden)
  const data: Data = block?.data ?? defaultBlock.data
  const statusMessage = STATUS_MESSAGES[status || '']

  const benefits = items(data, 'benefits')
  const previewCards = items(data, 'previewCards')
  const insights = items(data, 'insights')
  const choicePoints = items(data, 'choicePoints').length
    ? items(data, 'choicePoints').map((entry) => String(entry))
    : Array.isArray(data.choicePoints) ? data.choicePoints.map(String) : []
  const manageLinks = items(data, 'manageLinks')

  const heroTitle = value(data, 'heroTitle', 'Business mobility,')
  const heroHighlight = value(data, 'heroHighlight', 'thoughtfully delivered.')
  const formLabel = value(data, 'formLabel', 'Work email address')
  const formPlaceholder = value(data, 'formPlaceholder', 'name@company.com')
  const subscribeLabel = value(data, 'formButtonLabel', 'Subscribe to Newsletter')
  const consentCopy = value(data, 'consentCopy', 'I would like to receive the GoAhead Mobility newsletter. I understand I can unsubscribe at any time.')
  const privacyCopy = value(data, 'privacyCopy', 'We respect your privacy. Please see our Privacy Policy.')
  const unsubscribeNote = value(data, 'unsubscribeNote', 'You can unsubscribe at any time via the link in our emails.')

  return (
    <div className="overflow-hidden bg-white text-[#101f49]" data-page="newsletter">
      <div className="container-x pt-5 sm:pt-7">
        <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-azure focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure">Home</Link>
          <span aria-hidden="true">›</span>
          <Link href="/resources" className="transition-colors hover:text-azure focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure">Resources</Link>
          <span aria-hidden="true">›</span>
          <span aria-current="page" className="font-semibold text-ink">Newsletter</span>
        </nav>

        <section className="grid items-center gap-7 pb-8 lg:grid-cols-[.84fr_1.16fr] lg:gap-8 lg:pb-10" aria-labelledby="newsletter-hero-title">
          <div className="relative z-10">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[.12em] text-azure">{value(data, 'eyebrow', 'Newsletter')}</p>
            <h1 id="newsletter-hero-title" className="max-w-xl font-display text-[34px] font-bold leading-[1.12] tracking-[-.04em] text-ink sm:text-[42px] lg:text-[46px]">
              <span className="block">{heroTitle}</span>
              <span className="block text-azure">{heroHighlight}</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-[#344364] sm:text-[15px] sm:leading-7">
              {value(data, 'heroIntro')}
            </p>

            {statusMessage ? (
              <div role="status" className="mt-5 rounded-xl border border-[#b9d7ff] bg-[#f1f7ff] p-4">
                <p className="font-semibold text-ink">{statusMessage.title}</p>
                <p className="mt-1 text-sm leading-6 text-[#344364]">{statusMessage.body}</p>
              </div>
            ) : null}

            <div id="newsletter-signup" className="mt-5 max-w-[470px] rounded-xl border border-[#d6e0f0] bg-white p-4 shadow-[0_10px_35px_rgba(15,39,86,.06)] sm:p-5">
              <NewsletterForm
                source="newsletter_page"
                variant="card"
                emailLabel={formLabel}
                placeholder={formPlaceholder}
                buttonLabel={subscribeLabel}
                consentCopy={consentCopy}
              />
              <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
                {privacyCopy}{' '}
                <Link href="/privacy" className="font-semibold text-azure underline-offset-2 hover:underline">Privacy Policy</Link>.
              </p>
            </div>
            <p className="mt-3 flex items-center gap-2 pl-2 text-[11px] text-[#4b5b7b]">
              <LockKeyhole aria-hidden className="size-3.5 shrink-0 text-azure" />
              {unsubscribeNote}
            </p>
          </div>

          <div className="relative mx-auto min-h-[330px] w-full max-w-[680px] sm:min-h-[430px] lg:min-h-[485px]">
            {value(data, 'heroDecorationImage') ? (
              <div className="absolute inset-0 opacity-45">
                <CmsImage src={value(data, 'heroDecorationImage')} alt="" className="object-contain object-center" />
              </div>
            ) : null}
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 18, rotate: 3 }}
              animate={{ opacity: 1, y: 0, rotate: 2 }}
              transition={{ duration: reduce ? 0 : 0.7, ease: 'easeOut' }}
              className="absolute right-[12%] top-[4%] h-[72%] w-[61%] overflow-hidden rounded-xl border border-[#e0e8f5] bg-white p-4 shadow-[0_22px_55px_rgba(11,34,82,.16)] sm:right-[14%] sm:w-[57%] sm:p-5"
            >
              <div className="flex items-center justify-between border-b border-[#e6edf7] pb-3">
                <span className="font-display text-lg font-bold text-ink">{value(data, 'previewBrand', 'GoAhead')}</span>
                <span className="text-xs font-semibold text-ink">{value(data, 'previewEdition', 'Newsletter')}</span>
              </div>
              <p className="mt-3 text-[9px] font-semibold uppercase tracking-[.12em] text-azure">Insights for business mobility leaders</p>
              <div className="relative mt-3 h-[57%] overflow-hidden rounded-lg bg-[#edf3fb]">
                <CmsImage src={value(data, 'heroSecondaryImage')} alt={value(data, 'heroSecondaryImageAlt')} className="object-cover" />
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-[9px] font-medium text-muted-foreground">{value(data, 'previewDate', 'LATEST ISSUE')}</span>
                <span className="rounded-full bg-[#eaf2ff] px-2 py-1 text-[9px] font-semibold text-azure">Read the issue</span>
              </div>
            </motion.div>

            <Parallax amount={7} scale={1.02} className="absolute bottom-[3%] left-[1%] z-10 w-[77%] sm:bottom-[1%] sm:w-[75%]">
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 24, rotate: -4 }}
                animate={{ opacity: 1, y: 0, rotate: -3 }}
                transition={{ duration: reduce ? 0 : 0.8, delay: reduce ? 0 : 0.12, ease: 'easeOut' }}
                className="overflow-hidden rounded-2xl border-[7px] border-[#172642] bg-[#172642] shadow-[0_26px_65px_rgba(8,24,54,.28)] sm:border-[10px]"
              >
                <div className="grid min-h-[190px] grid-cols-[.9fr_1.1fr] bg-white sm:min-h-[245px]">
                  <div className="flex flex-col justify-center p-3 sm:p-5">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-azure sm:text-[10px]">{value(data, 'featuredStoryLabel', 'FEATURED STORY')}</p>
                    <h2 className="mt-2 font-display text-[13px] font-bold leading-tight text-ink sm:text-lg">{value(data, 'featuredStoryTitle')}</h2>
                    <p className="mt-2 hidden text-[10px] leading-4 text-[#44516c] sm:block">{value(data, 'featuredStoryBody')}</p>
                    <span className="mt-3 inline-flex w-fit items-center gap-1 text-[9px] font-semibold text-azure sm:text-[11px]">
                      {value(data, 'featuredStoryCta', 'Read the story')} <ArrowRight aria-hidden className="size-3" />
                    </span>
                  </div>
                  <div className="relative min-h-[190px] sm:min-h-[245px]">
                    <CmsImage src={value(data, 'heroImage')} alt={value(data, 'heroImageAlt')} priority className="object-cover" />
                  </div>
                </div>
              </motion.div>
            </Parallax>

            <motion.div
              initial={reduce ? false : { opacity: 0, y: 12, x: 10 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              transition={{ duration: reduce ? 0 : 0.6, delay: reduce ? 0 : 0.25 }}
              className="absolute bottom-[2%] right-[1%] z-20 flex items-center gap-2 rounded-xl border border-[#e0e8f5] bg-white/95 px-3 py-3 shadow-xl sm:bottom-[1%] sm:right-[2%] sm:px-4"
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-[#eaf2ff] text-azure">
                <ChartNoAxesCombined aria-hidden className="size-5" />
              </span>
              <span className="flex gap-1.5 items-end" aria-hidden="true">
                {[16, 25, 12, 30, 21].map((height, index) => <span key={index} style={{ height }} className="w-2 rounded-t-sm bg-azure/80" />)}
              </span>
            </motion.div>
          </div>
        </section>

        <ScrollReveal className="mb-8 rounded-2xl bg-[#f5f8fd] px-4 py-6 sm:px-7 sm:py-7">
          <SectionHeading title={value(data, 'benefitsHeading', 'What you’ll receive')} />
          <div className="grid gap-5 md:grid-cols-3 md:gap-0">
            {benefits.map((benefit, index) => {
              const Icon = ICONS[String(benefit.icon)] ?? ShieldCheck
              return (
                <motion.article
                  key={index}
                  initial={reduce ? false : { opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: reduce ? 0 : 0.45, delay: reduce ? 0 : index * 0.08 }}
                  className="relative flex flex-col items-center px-4 text-center md:px-6"
                >
                  {index > 0 ? <span aria-hidden="true" className="absolute -left-px top-6 hidden h-[78px] w-px bg-[#d8e2f2] md:block" /> : null}
                  <span className="flex size-14 items-center justify-center rounded-full border border-[#d9e5f6] bg-white text-azure">
                    <Icon aria-hidden className="size-8" strokeWidth={1.6} />
                  </span>
                  <h3 className="mt-3 font-display text-sm font-bold text-ink">{String(benefit.title || '')}</h3>
                  <p className="mt-2 max-w-sm text-xs leading-5 text-[#53617d]">{String(benefit.body || '')}</p>
                </motion.article>
              )
            })}
          </div>
        </ScrollReveal>

        <ScrollReveal className="mb-8 border-t border-[#e7edf5] pt-6">
          <SectionHeading title={value(data, 'previewHeading', 'A look inside the newsletter')} subtitle={value(data, 'previewSubheading', 'Sample issue preview')} />
          <div className="mx-auto grid max-w-[1180px] gap-4 rounded-2xl border border-[#d7e2f1] bg-white p-4 shadow-[0_12px_38px_rgba(13,44,92,.04)] lg:grid-cols-[1.15fr_1fr_.72fr] sm:p-5">
            <article className="flex flex-col">
              <div className="flex items-center justify-between border-b border-[#e8edf5] pb-3">
                <div>
                  <p className="font-display text-lg font-bold text-ink">{value(data, 'previewBrand', 'GoAhead')}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">Insights for global accommodation and transportation leaders</p>
                </div>
                <span className="text-[9px] text-muted-foreground">{value(data, 'previewDate', 'LATEST ISSUE')}</span>
              </div>
              <div className="grid flex-1 gap-3 pt-4 sm:grid-cols-[.78fr_1.22fr]">
                <div className="flex flex-col">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-azure">{value(data, 'featuredStoryLabel', 'FEATURED STORY')}</p>
                  <h3 className="mt-2 font-display text-lg font-bold leading-tight text-ink">{value(data, 'featuredStoryTitle')}</h3>
                  <p className="mt-2 text-xs leading-5 text-[#53617d]">{value(data, 'featuredStoryBody')}</p>
                  <Link href={value(data, 'featuredStoryHref', '/blog')} className="mt-3 inline-flex w-fit items-center gap-2 text-xs font-semibold text-azure transition-colors hover:text-azure-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure">
                    {value(data, 'featuredStoryCta', 'Read the story')} <ArrowRight aria-hidden className="size-3.5" />
                  </Link>
                </div>
                <Link href={value(data, 'featuredStoryHref', '/blog')} className="group relative min-h-[185px] overflow-hidden rounded-xl bg-[#edf3fb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure">
                  <CmsImage src={value(data, 'featuredStoryImage')} alt={value(data, 'featuredStoryImageAlt')} className="object-cover transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transition-none" />
                </Link>
              </div>
            </article>

            <div className="flex flex-col gap-3">
              {previewCards.map((entry, index) => (
                <motion.article
                  key={index}
                  whileHover={reduce ? undefined : { y: -3 }}
                  transition={{ duration: reduce ? 0 : 0.2 }}
                  className="grid min-h-[132px] grid-cols-[35%_1fr] overflow-hidden rounded-xl border border-[#e1e9f4] bg-white"
                >
                  <Link href={String(entry.href || '/resources')} className="relative min-h-[132px] overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-azure">
                    <CmsImage src={String(entry.image || '')} alt={String(entry.imageAlt || '')} className="object-cover transition-transform duration-500 hover:scale-105 motion-reduce:transition-none" />
                  </Link>
                  <div className="flex flex-col justify-center p-3">
                    <p className="text-[8px] font-bold uppercase tracking-wider text-azure">{String(entry.label || '')}</p>
                    <h3 className="mt-1 font-display text-xs font-bold leading-snug text-ink">{String(entry.title || '')}</h3>
                    <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-[#53617d]">{String(entry.body || '')}</p>
                    <Link href={String(entry.href || '/resources')} className="mt-2 inline-flex w-fit items-center gap-1 text-[10px] font-semibold text-azure hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure">
                      {String(entry.cta || 'Read more')} <ArrowRight aria-hidden className="size-3" />
                    </Link>
                  </div>
                </motion.article>
              ))}
            </div>

            <motion.article
              whileHover={reduce ? undefined : { y: -3 }}
              transition={{ duration: reduce ? 0 : 0.2 }}
              className="flex flex-col rounded-xl bg-[#f6f8fc] p-3"
            >
              <p className="text-[8px] font-bold uppercase tracking-wider text-azure">{value(data, 'resourceLabel', 'RESOURCE HIGHLIGHT')}</p>
              <h3 className="mt-2 font-display text-sm font-bold leading-snug text-ink">{value(data, 'resourceTitle')}</h3>
              <p className="mt-2 text-[10px] leading-4 text-[#53617d]">{value(data, 'resourceBody')}</p>
              <Link href={value(data, 'resourceHref', '/resources')} className="group relative mt-3 block min-h-[120px] overflow-hidden rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure">
                <CmsImage src={value(data, 'resourceImage')} alt={value(data, 'resourceImageAlt')} className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none" />
              </Link>
              <Link href={value(data, 'resourceHref', '/resources')} className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold text-azure hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure">
                {value(data, 'resourceCta', 'Download now')} <ArrowRight aria-hidden className="size-3" />
              </Link>
            </motion.article>
          </div>
        </ScrollReveal>

        <ScrollReveal className="mb-8">
          <SectionHeading title={value(data, 'insightsHeading', 'Explore recent insights')} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {insights.map((entry, index) => (
              <motion.article
                key={index}
                initial={reduce ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                whileHover={reduce ? undefined : { y: -4 }}
                transition={{ duration: reduce ? 0 : 0.35, delay: reduce ? 0 : index * 0.07 }}
                className="group flex h-full flex-col overflow-hidden rounded-xl border border-[#dce5f2] bg-white shadow-[0_6px_24px_rgba(12,43,91,.035)]"
              >
                <Link href={String(entry.href || '/resources')} className="relative block aspect-[16/7] overflow-hidden bg-[#edf3fb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-azure">
                  <CmsImage src={String(entry.image || '')} alt={String(entry.imageAlt || '')} className="object-cover transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transition-none" />
                </Link>
                <div className="flex flex-1 flex-col p-4">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-azure">{String(entry.label || '')}</p>
                  <h3 className="mt-2 font-display text-sm font-bold leading-snug text-ink">{String(entry.title || '')}</h3>
                  <p className="mt-2 flex-1 text-xs leading-5 text-[#53617d]">{String(entry.body || '')}</p>
                  <Link href={String(entry.href || '/resources')} className="mt-4 inline-flex w-fit items-center gap-2 text-xs font-semibold text-azure transition-colors hover:text-azure-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure">
                    {String(entry.cta || 'Read more')} <ArrowRight aria-hidden className="size-3.5 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal className="mb-8 grid gap-4 md:grid-cols-2">
          <section className="flex gap-4 rounded-2xl bg-[#f0f6ff] p-5 sm:gap-6 sm:p-7" aria-labelledby="newsletter-choice-heading">
            <span className="flex size-16 shrink-0 items-center justify-center rounded-full border border-azure/60 bg-white/80 text-azure sm:size-[76px]">
              {(() => { const Icon = ICONS[value(data, 'choicesIcon', 'shield-check')] ?? ShieldCheck; return <Icon aria-hidden className="size-9" strokeWidth={1.5} /> })()}
            </span>
            <div>
              <h2 id="newsletter-choice-heading" className="font-display text-base font-bold text-ink">{value(data, 'choicesHeading', 'Your choices stay yours')}</h2>
              <ul className="mt-3 flex flex-col gap-2">
                {choicePoints.map((point, index) => (
                  <li key={index} className="flex gap-2 text-xs leading-5 text-[#42516f]">
                    <span aria-hidden="true" className="font-bold text-azure">✓</span>{point}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="flex gap-4 rounded-2xl bg-[#f0f7f3] p-5 sm:gap-6 sm:p-7" aria-labelledby="newsletter-manage-heading">
            <span className="flex size-16 shrink-0 items-center justify-center rounded-full border border-azure/50 bg-white/80 text-azure sm:size-[76px]">
              <LockKeyhole aria-hidden className="size-9" strokeWidth={1.5} />
            </span>
            <div>
              <h2 id="newsletter-manage-heading" className="font-display text-base font-bold text-ink">{value(data, 'manageHeading', 'Manage your subscription')}</h2>
              <p className="mt-2 text-xs leading-5 text-[#42516f]">{value(data, 'manageBody')}</p>
              <div className="mt-3 flex flex-col items-start gap-2.5">
                {manageLinks.map((entry, index) => (
                  <Link key={index} href={String(entry.href || '/contact')} className="inline-flex items-center gap-3 text-xs font-semibold text-azure transition-colors hover:text-azure-deep hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure">
                    {String(entry.label || '')} <ArrowRight aria-hidden className="size-3.5" />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal className="mb-8 overflow-hidden rounded-2xl bg-[#06183c] px-5 py-7 text-white shadow-[0_14px_36px_rgba(4,20,54,.18)] sm:px-8 lg:px-9">
          <div className="grid items-center gap-7 lg:grid-cols-[1fr_1.2fr]">
            <div>
              <h2 className="max-w-xl font-display text-2xl font-bold leading-tight tracking-tight sm:text-[30px]">{value(data, 'ctaHeading', 'Let’s simplify business mobility for your organization.')}</h2>
              <p className="mt-3 max-w-lg text-sm leading-6 text-white/75">{value(data, 'ctaBody')}</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 sm:gap-0">
              <div className="flex items-center gap-3 sm:border-r sm:border-white/20 sm:pr-5">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-full border border-white/35 text-white">
                  <BedDouble aria-hidden className="size-7" strokeWidth={1.5} />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold leading-5">{value(data, 'accommodationHeading')}</h3>
                  <Link href={value(data, 'accommodationHref', '/contact')} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-azure px-4 py-2.5 text-xs font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-azure-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                    {value(data, 'accommodationCta', 'Get in touch')} <ArrowRight aria-hidden className="size-3.5" />
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:pl-5">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-full border border-white/35 text-white">
                  <BusFront aria-hidden className="size-7" strokeWidth={1.5} />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold leading-5">{value(data, 'transportHeading')}</h3>
                  <Link href={value(data, 'transportHref', '/contact')} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-azure px-4 py-2.5 text-xs font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-azure-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                    {value(data, 'transportCta', 'Request a proposal')} <ArrowRight aria-hidden className="size-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  )
}
