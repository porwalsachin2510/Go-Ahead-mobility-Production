'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion, useReducedMotion } from 'motion/react'
import {
  ArrowRight, BusFront, CalendarDays, CircleHelp, FileText,
  Handshake, Headset, IndianRupee, LockKeyhole, MailCheck, MessageCircleQuestion,
  MessageSquareText, RefreshCw, Search, ShieldCheck, TabletSmartphone, type LucideIcon,
} from 'lucide-react'
import { Parallax } from '@/components/motion/gsap-effects'
import { Reveal } from '@/components/motion/reveal'
import { FaqAccordion, type FaqItem } from '@/components/motion/faq-accordion'
import { cn } from '@/lib/utils'

type FaqTopic = { category: string; title: string; description?: string; icon?: string; sortOrder?: number; visible?: boolean }
type FaqFeature = { icon?: string; title: string; body?: string }
type FaqContent = {
  [key: string]: any
  topics?: FaqTopic[]
  heroFeatures?: FaqFeature[]
  helpFeatures?: FaqFeature[]
}
type FaqContact = Record<string, string>
type Props = {
  content?: FaqContent | null
  questions: FaqItem[]
  total: number
  topicCounts: Record<string, number>
  query?: string
  category?: string
  showAll: boolean
  contact?: FaqContact
}

const defaultTopics: FaqTopic[] = [
  { category: 'services-solutions', title: 'Services & Solutions', description: 'Learn about our transportation services', icon: 'bus-front', sortOrder: 1, visible: true },
  { category: 'booking-operations', title: 'Booking & Operations', description: 'Booking process, scheduling & on-ground operations', icon: 'calendar-days', sortOrder: 2, visible: true },
  { category: 'safety-compliance', title: 'Safety & Compliance', description: 'Safety measures, policies and compliance standards', icon: 'shield-check', sortOrder: 3, visible: true },
  { category: 'technology-platform', title: 'Technology & Platform', description: 'Our technology, platform and integrations', icon: 'tablet-smartphone', sortOrder: 4, visible: true },
  { category: 'billing-payments', title: 'Billing & Payments', description: 'Invoices, payments and pricing related questions', icon: 'indian-rupee', sortOrder: 5, visible: true },
  { category: 'partnerships', title: 'Partnerships', description: 'Vendor registration, partnerships and collaborations', icon: 'handshake', sortOrder: 6, visible: true },
]
const defaultHeroFeatures: FaqFeature[] = [
  { icon: 'message-square-text', title: 'Quick Answers', body: 'Find answers fast' },
  { icon: 'headset', title: 'Expert Support', body: 'We’re here to help' },
  { icon: 'shield-check', title: 'Transparent Information', body: 'Clear & reliable details' },
  { icon: 'refresh-cw', title: 'Updated Frequently', body: 'Latest information always' },
]
const defaultHelpFeatures: FaqFeature[] = [
  { icon: 'headset', title: 'Talk to an Expert', body: 'Speak with our mobility experts for personalized assistance.' },
  { icon: 'mail-check', title: 'Email Support', body: 'We aim to respond to all emails within 24 hours.' },
  { icon: 'file-text', title: 'Submit a Request', body: 'Share your query and we’ll get back to you shortly.' },
]
const iconMap: Record<string, LucideIcon> = {
  bus: BusFront, 'bus-front': BusFront, calendar: CalendarDays, 'calendar-days': CalendarDays,
  shield: ShieldCheck, 'shield-check': ShieldCheck, smartphone: TabletSmartphone,
  'tablet-smartphone': TabletSmartphone, rupee: IndianRupee, 'indian-rupee': IndianRupee,
  handshake: Handshake, support: Headset, headset: Headset, 'headphones': Headset,
  'message-square-text': MessageSquareText, 'message-circle-question': MessageCircleQuestion,
  'mail-check': MailCheck, 'file-text': FileText, 'circle-help': CircleHelp,
  'lock-keyhole': LockKeyhole, 'refresh-cw': RefreshCw,
}
function Icon({ name, className }: { name?: string; className?: string }) {
  const Component = iconMap[(name || '').toLowerCase()] || CircleHelp
  return <Component className={className} strokeWidth={1.65} aria-hidden />
}
function faqHref(values: Record<string, string | undefined>) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(values)) if (value) params.set(key, value)
  const query = params.toString()
  return query ? '/faq?' + query : '/faq'
}
function HighlightedTitle({ title, highlight }: { title: string; highlight: string }) {
  const index = title.toLowerCase().indexOf(highlight.toLowerCase())
  if (!highlight || index < 0) return <>{title}</>
  return <>{title.slice(0, index)}<span className="text-[#079fe9]">{title.slice(index, index + highlight.length)}</span>{title.slice(index + highlight.length)}</>
}

export function FaqPage({ content, questions, total, topicCounts, query, category, showAll, contact }: Props) {
  const reduce = useReducedMotion()
  const page = content ?? {}
  const topics = (Array.isArray(page.topics) ? page.topics : defaultTopics)
    .filter((item: FaqTopic) => item.visible !== false)
    .sort((a: FaqTopic, b: FaqTopic) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
  const heroFeatures = Array.isArray(page.heroFeatures) ? page.heroFeatures : defaultHeroFeatures
  const helpFeatures = Array.isArray(page.helpFeatures) ? page.helpFeatures : defaultHelpFeatures
  const currentTopic = topics.find((item: FaqTopic) => item.category === category)
  const heroTitle = page.heroTitle ?? 'Questions?'
  const heroHighlight = page.heroHighlight ?? 'We’ve Got Answers.'
  const currentTitle = query ? 'Search Results' : currentTopic?.title || page.questionsTitle || 'Popular Questions'
  const callNumber = contact?.phone?.trim() || ''
  const supportEmail = contact?.email?.trim() || contact?.salesEmail?.trim() || ''
  const showCount = (key: string) => Number(topicCounts?.[key] || 0)

  return (
    <div data-page="faq" className="overflow-hidden bg-white text-[#0b1b3b]">
      {page.showHero !== false ? <section className="relative isolate min-h-[370px] overflow-hidden bg-[#03132d] text-white sm:min-h-[410px]">
        <Parallax amount={7} className="absolute inset-0">
          <Image src={page.heroImage || '/images/site/transport-hero.png'} alt={page.heroImageAlt || ''} fill priority sizes="100vw" className="object-cover object-[58%_center] opacity-85" />
        </Parallax>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,12,31,.98)_0%,rgba(2,12,31,.91)_34%,rgba(2,12,31,.48)_62%,rgba(2,12,31,.10)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#03132d]/65 via-transparent to-[#03132d]/20" />
        <div className="relative mx-auto flex min-h-[370px] max-w-[1320px] items-center px-5 pb-8 pt-20 sm:min-h-[410px] sm:px-8 lg:px-12">
          <motion.div initial={reduce ? false : { opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .72, ease: [0.22, 1, .36, 1] }} className="w-full max-w-[570px]">
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#12b7f1]">{page.heroEyebrow ?? 'FAQs'}</p>
            <h1 className="mt-3 text-balance text-4xl font-semibold leading-[1.02] tracking-[-.045em] sm:text-5xl lg:text-[58px]"><span className="block">{heroTitle}</span><span className="mt-1 block text-[#079fe9]">{heroHighlight}</span></h1>
            <p className="mt-4 max-w-[470px] text-sm leading-relaxed text-white/85 sm:text-base">{page.heroDescription ?? 'Find quick answers to common questions about our services, solutions and how we work.'}</p>
            <form action="/faq" method="get" role="search" className="mt-5 flex max-w-[560px] items-center gap-2 rounded-lg border border-white/40 bg-[#06142d]/75 p-1.5 shadow-xl backdrop-blur-md">
              <label htmlFor="faq-hero-search" className="sr-only">Search questions, topics or keywords</label>
              <input id="faq-hero-search" type="search" name="q" defaultValue={query} placeholder={page.searchPlaceholder ?? 'Search questions, topics or keywords...'} className="h-9 min-w-0 flex-1 bg-transparent px-3 text-xs text-white outline-none placeholder:text-white/65 focus-visible:ring-2 focus-visible:ring-[#15baf5]" />
              {category ? <input type="hidden" name="category" value={category} /> : null}
              <button type="submit" aria-label="Search FAQs" className="flex size-9 shrink-0 items-center justify-center rounded-md text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"><Search className="size-5" aria-hidden /></button>
            </form>
          </motion.div>
        </div>
        <div className="relative mx-auto grid max-w-[1320px] grid-cols-2 gap-4 px-5 pb-7 sm:grid-cols-4 sm:px-8 lg:px-12">
          {heroFeatures.slice(0, 4).map((feature: FaqFeature, index: number) => <Reveal key={feature.title + index} delay={index * 55} className="flex items-center gap-2.5 border-white/15 sm:border-r sm:px-3 last:border-0">
            <Icon name={feature.icon} className="size-7 shrink-0 text-[#10b8f5]" />
            <span className="min-w-0"><strong className="block text-[10px] font-bold text-white">{feature.title}</strong><span className="mt-0.5 block text-[9px] leading-snug text-white/70">{feature.body}</span></span>
          </Reveal>)}
        </div>
      </section> : null}

      {page.showTopics !== false ? <section id="faq-topics" className="mx-auto max-w-[1320px] px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#1684cf]">{page.topicsEyebrow || ''}</p><h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">{page.topicsTitle ?? 'Browse by Topic'}</h2></div>
          <Link href="/faq#faq-topics" className="inline-flex items-center gap-2 text-xs font-semibold text-[#0768d4] transition-colors hover:text-[#079fe9]">{page.topicsLinkLabel ?? 'View All Topics'} <ArrowRight className="size-4" aria-hidden /></Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {topics.map((topic: FaqTopic, index: number) => <motion.article key={topic.category} initial={reduce ? false : { opacity: 0, y: 18 }} whileInView={reduce ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true, amount: .15 }} transition={{ duration: .42, delay: (index % 6) * .045 }} whileHover={reduce ? undefined : { y: -4 }} className={cn('min-w-0 rounded-xl border bg-white transition-shadow hover:shadow-[0_12px_28px_rgba(9,35,76,.09)] motion-reduce:transition-none', category === topic.category ? 'border-[#0877e8] bg-[#f4f9ff] shadow-md' : 'border-[#e3e9f1]')}>
            <Link href={faqHref({ category: topic.category, q: query, all: '1' })} aria-current={category === topic.category ? 'page' : undefined} className="flex h-full min-h-[178px] flex-col items-center px-3 py-4 text-center outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0877e8] sm:min-h-[190px] sm:px-4">
              <span className="flex size-12 items-center justify-center rounded-full bg-[#eef5ff] text-[#0876df]"><Icon name={topic.icon} className="size-7" /></span>
              <strong className="mt-3 text-[11px] font-bold leading-snug text-[#152449] sm:text-xs">{topic.title}</strong>
              <p className="mt-2 min-h-9 text-[9px] leading-relaxed text-[#69758b] sm:text-[10px]">{topic.description}</p>
              <span className="mt-auto pt-3 text-[10px] font-bold text-[#0768d4]">{showCount(topic.category)} Questions</span>
            </Link>
          </motion.article>)}
        </div>
      </section> : null}

      {page.showQuestions !== false || page.showHelp !== false || page.showResources !== false ? <section id="faq-questions" className="mx-auto max-w-[1320px] px-5 pb-8 sm:px-8 lg:px-12 lg:pb-10">
        <div className={cn('grid items-start gap-5 xl:gap-6', page.showQuestions !== false && (page.showHelp !== false || page.showResources !== false) ? 'lg:grid-cols-[minmax(0,1fr)_minmax(420px,1.04fr)]' : 'grid-cols-1')}>
          {page.showQuestions !== false ? <div className="min-w-0">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
              <div><p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#1684cf]">{page.questionsEyebrow || ''}</p><h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">{currentTitle}</h2>{query ? <p className="mt-1 text-[11px] text-[#67748a]">{total} matching question{total === 1 ? '' : 's'} for “{query}”</p> : null}</div>
              {category ? <Link href={faqHref({ q: query, all: showAll ? '1' : undefined })} className="text-[10px] font-semibold text-[#0768d4] hover:underline">Clear topic</Link> : null}
            </div>
            {questions.length ? <FaqAccordion key={`${query || ''}-${category || ''}-${questions[0]?._id || ''}`} items={questions} columns={1} defaultOpenFirst /> : <div className="rounded-xl border border-dashed border-[#cbd7e8] bg-white px-5 py-12 text-center"><MessageCircleQuestion className="mx-auto size-8 text-[#8ba1c0]" aria-hidden /><h3 className="mt-3 text-sm font-bold text-[#152449]">No matching questions found</h3><p className="mt-1 text-xs leading-relaxed text-[#66748a]">Try another keyword or choose a different topic. You can also contact our support team for help.</p><Link href="/faq" className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#0768d4]">Clear search and filters <ArrowRight className="size-3.5" aria-hidden /></Link></div>}
            {!showAll && total > questions.length ? <Link href={faqHref({ q: query, category, all: '1' })} className="mt-4 inline-flex items-center gap-2 text-[11px] font-bold text-[#0768d4] hover:text-[#079fe9]">{page.questionsViewAllLabel ?? 'View All Questions'} <ArrowRight className="size-4" aria-hidden /></Link> : null}
            {showAll && total > questions.length ? <p className="mt-3 text-[10px] text-[#6c7890]">Showing {questions.length} of {total} matching questions. Refine your search to narrow the results.</p> : null}
          </div> : null}

          {page.showHelp !== false || page.showResources !== false ? <div className="min-w-0 space-y-4">
            {page.showHelp !== false ? <Reveal className="relative isolate min-h-[315px] overflow-hidden rounded-xl bg-[#f0f5ff] px-5 py-6 sm:px-6">
              {page.helpImage ? <div className="absolute inset-y-0 right-0 w-[46%]"><Image src={page.helpImage} alt={page.helpImageAlt || ''} fill sizes="(max-width: 1024px) 45vw, 25vw" className="object-contain object-bottom" /></div> : null}
              <div className="absolute inset-0 bg-gradient-to-r from-[#f0f5ff] via-[#f0f5ff]/95 to-[#f0f5ff]/10" />
              <div className="relative z-10 max-w-[68%]">
                <p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#1684cf]">{page.helpEyebrow || ''}</p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-[#102044] sm:text-2xl">{page.helpTitle ?? 'Still Need Help?'}</h2>
                <p className="mt-2 text-[11px] leading-relaxed text-[#52617b]">{page.helpBody ?? 'Our support team is just a message away.'}</p>
                <div className="mt-5 space-y-4">
                  {helpFeatures.slice(0, 4).map((feature: FaqFeature, index: number) => <div key={feature.title + index} className="flex gap-2.5">
                    <Icon name={feature.icon} className="mt-0.5 size-5 shrink-0 text-[#0876df]" />
                    <span><strong className="block text-[10px] font-bold text-[#152449]">{feature.title}</strong><span className="mt-0.5 block text-[9px] leading-relaxed text-[#596982]">{feature.title.toLowerCase().includes('email') && supportEmail && !feature.body ? supportEmail : feature.title.toLowerCase().includes('call') && callNumber && !feature.body ? callNumber : feature.body}</span></span>
                  </div>)}
                </div>
                <Link href={page.helpButtonHref || '/contact'} className="mt-5 inline-flex min-h-10 items-center gap-3 rounded-md bg-[#061b43] px-4 text-[10px] font-bold text-white transition-colors hover:bg-[#0b3270] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0876df]">{page.helpButtonLabel ?? 'Contact Support'} <ArrowRight className="size-4" aria-hidden /></Link>
              </div>
            </Reveal> : null}

            {page.showResources !== false ? <Reveal delay={75} className="flex flex-col gap-3 rounded-xl border border-[#e4eaf3] bg-[#f5f8fe] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <span><strong className="block text-sm font-bold text-[#152449]">{page.resourceTitle ?? 'Download Helpful Resources'}</strong><span className="mt-1 block text-[10px] leading-relaxed text-[#66748a]">{page.resourceBody ?? 'Guides, policies and documents to help you better.'}</span></span>
              <Link href={page.resourceButtonHref || '/resources'} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-[#cbd9eb] bg-white px-4 text-[10px] font-bold text-[#0757c9] transition-all hover:border-[#0876df] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0876df]">{page.resourceButtonLabel ?? 'Visit Resource Center'} <FileText className="size-4" aria-hidden /></Link>
            </Reveal> : null}
          </div> : null}
        </div>
      </section> : null}

      {page.showCta !== false ? <Reveal className="mx-auto max-w-[1320px] px-5 pb-8 sm:px-8 lg:px-12 lg:pb-10">
        <section className="relative isolate overflow-hidden rounded-xl bg-[#041631] px-6 py-7 text-white sm:px-8 sm:py-8">
          <Parallax amount={3} className="absolute inset-0">{page.ctaBackgroundImage ? <Image src={page.ctaBackgroundImage} alt="" fill sizes="100vw" className="object-cover opacity-55" /> : null}</Parallax>
          <div className="absolute inset-0 bg-gradient-to-r from-[#03132d] via-[#03132d]/90 to-[#03132d]/45" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-[600px]"><h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{page.ctaTitle ?? 'Have a Question About Our Solutions?'}</h2><p className="mt-2 max-w-[440px] text-[11px] leading-relaxed text-white/80 sm:text-xs">{page.ctaBody ?? 'Let our experts help you find the right transportation solution for your business.'}</p></div>
            <Link href={page.ctaButtonHref || '/contact'} className="inline-flex min-h-12 shrink-0 items-center justify-center gap-5 rounded-lg bg-[#0869e8] px-5 text-xs font-bold text-white shadow-[0_8px_24px_rgba(0,92,225,.26)] transition-all hover:-translate-y-0.5 hover:bg-[#0057ca] hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">{page.ctaButtonLabel ?? 'Get a Free Proposal'} <ArrowRight className="size-4" aria-hidden /></Link>
          </div>
        </section>
      </Reveal> : null}
    </div>
  )
}
