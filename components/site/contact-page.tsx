'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion, useReducedMotion } from 'motion/react'
import {
  ArrowRight, Building2, BusFront, CalendarClock, Clock3, Headphones, Mail,
  MapPin, Phone, ShieldCheck, UsersRound, type LucideIcon,
} from 'lucide-react'
import { Reveal } from '@/components/motion/reveal'
import { Parallax } from '@/components/motion/gsap-effects'
import { FaqAccordion, type FaqItem } from '@/components/motion/faq-accordion'
import { LeadForm } from '@/components/site/lead-form'
import { cn } from '@/lib/utils'

type Office = {
  _id: string
  city: string
  region?: string
  country?: string
  officeName?: string
  officeAddress?: string
  officePhone?: string
  officeEmail?: string
  officeHours?: string
  officeImage?: string
}
type Contact = Record<string, string>
type Feature = { icon?: string; title: string; body?: string }
type Metric = { icon?: string; value: string; label: string }
type ContactPageContent = {
  [key: string]: any
  heroFeatures?: Feature[]
  presenceMetrics?: Metric[]
}
type Props = {
  offices: Office[]
  locations: string[]
  faqs: FaqItem[]
  contact: Contact
  social: Contact
  content?: ContactPageContent | null
}

const defaultHeroFeatures: Feature[] = [
  { icon: 'clock-3', title: 'Quick Response', body: 'We respond to your enquiry promptly.' },
  { icon: 'users-round', title: 'Expert Support', body: 'Speak with our mobility team.' },
  { icon: 'shield-check', title: 'Tailored Solutions', body: 'Support shaped around your needs.' },
]
const defaultMetrics: Metric[] = [
  { icon: 'map-pin', value: '120+', label: 'Cities' },
  { icon: 'building-2', value: '20+', label: 'States' },
  { icon: 'users-round', value: '5000+', label: 'Corporate Clients' },
  { icon: 'bus-front', value: '6500+', label: 'Fleet Strength' },
]
const iconMap: Record<string, LucideIcon> = {
  'clock-3': Clock3, clock: Clock3, 'users-round': UsersRound, users: UsersRound,
  'shield-check': ShieldCheck, shield: ShieldCheck, phone: Phone, mail: Mail,
  'map-pin': MapPin, map: MapPin, 'building-2': Building2, building: Building2,
  'bus-front': BusFront, bus: BusFront, headphones: Headphones, headset: Headphones,
  'calendar-clock': CalendarClock,
}
function Icon({ name, className }: { name?: string; className?: string }) {
  const Component = iconMap[(name || '').toLowerCase()] || ShieldCheck
  return <Component className={className} strokeWidth={1.6} aria-hidden />
}
function Highlight({ text, phrase, className }: { text: string; phrase?: string; className?: string }) {
  if (!phrase) return <>{text}</>
  const index = text.toLowerCase().indexOf(phrase.toLowerCase())
  if (index < 0) return <>{text}</>
  return <>{text.slice(0, index)}<span className={className}>{text.slice(index, index + phrase.length)}</span>{text.slice(index + phrase.length)}</>
}

export function ContactPage({ offices, locations, faqs, contact, social, content }: Props) {
  const reduce = useReducedMotion()
  const page = content ?? {}
  const heroFeatures = Array.isArray(page.heroFeatures) ? page.heroFeatures : defaultHeroFeatures
  const metrics = Array.isArray(page.presenceMetrics) ? page.presenceMetrics : defaultMetrics
  const phone = contact.phone || ''
  const email = contact.email || contact.salesEmail || ''
  const address = [page.contactOfficeName || 'GoAhead Mobility Pvt. Ltd.', page.contactOfficeAddress || contact.address || 'Gurugram, Haryana, India'].filter(Boolean).join(', ')
  const socialLinks = [
    ['linkedin', 'LinkedIn', 'in'], ['facebook', 'Facebook', 'f'], ['x', 'X', '𝕏'], ['youtube', 'YouTube', '▶'],
  ].filter(([key]) => Boolean(social[key]))
  const officesLimit = Math.max(1, Math.min(12, Number(page.officesLimit) || 4))
  const officeList = offices.slice(0, officesLimit)
  const faqLimit = Math.max(1, Math.min(12, Number(page.faqLimit) || 6))
  const questions = faqs.slice(0, faqLimit)
  const heroTitle = page.heroTitle ?? 'Let’s Move Forward Together'
  const ctaTitle = page.ctaTitle ?? 'Ready to Transform Your Transportation?'
  const ctaHighlight = page.ctaHighlight ?? 'Transform'

  return (
    <div data-page="contact" className="overflow-hidden bg-[#f7f9fc] text-[#101b37]">
      {page.showHero !== false ? <section className="relative isolate min-h-[390px] overflow-hidden bg-[#020d24] text-white sm:min-h-[430px]">
        <Parallax amount={5} className="absolute inset-0"><Image src={page.heroImage || '/images/site/transport-hero.png'} alt={page.heroImageAlt || ''} fill priority sizes="100vw" className="object-cover object-[65%_center] opacity-80" /></Parallax>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#020b20_0%,rgba(2,11,32,.95)_30%,rgba(2,11,32,.55)_60%,rgba(2,11,32,.12)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(2,11,32,.6),transparent_45%)]" />
        <div className="relative mx-auto flex min-h-[390px] max-w-[1240px] items-center px-6 pb-12 pt-28 sm:min-h-[430px] lg:px-10">
          <motion.div initial={reduce ? false : { opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .72, ease: [0.22, 1, .36, 1] }} className="max-w-[610px]">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[.22em] text-[#27c6f5]">{page.heroEyebrow ?? 'Contact us'}</p>
            <h1 className="max-w-[460px] text-balance text-4xl font-semibold leading-[1.08] tracking-[-.045em] sm:text-5xl lg:text-5xl">{heroTitle}</h1>
            <p className="mt-5 max-w-[470px] text-sm leading-relaxed text-white/80 sm:text-base">{page.heroDescription ?? 'Have questions about our solutions or ready to elevate your transportation experience? Our team is here to help.'}</p>
            <div className="mt-7 flex flex-wrap gap-6">
              {heroFeatures.slice(0, 4).map((feature: Feature, index: number) => <motion.div key={feature.title + index} initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .2 + index * .08, duration: .45 }} className="flex items-center gap-2.5">
                <Icon name={feature.icon} className="size-6 text-[#19b9ef]" />
                <span className="max-w-28 text-[10px] font-semibold leading-snug">{feature.title}<span className="block font-normal text-white/70">{feature.body}</span></span>
              </motion.div>)}
            </div>
          </motion.div>
        </div>
      </section> : null}

      {page.showForm !== false || page.showContactCard !== false ? <section id="contact" className={cn('mx-auto grid max-w-[1240px] gap-5 px-5 py-7 sm:px-6 lg:px-10 lg:py-8', page.showForm !== false && page.showContactCard !== false ? 'lg:grid-cols-[1.55fr_1fr]' : 'grid-cols-1')}>
        {page.showForm !== false ? <Reveal className="rounded-2xl border border-[#e3e8f0] bg-white p-5 shadow-[0_8px_28px_rgba(12,34,68,.06)] sm:p-7">
          <div className="mb-5">
            <h2 className="text-xl font-bold tracking-tight">{page.formTitle ?? 'Send Us a Message'}</h2>
            <span className="mt-2 block h-0.5 w-8 rounded bg-[#078bea]" />
            <p className="mt-3 text-xs text-[#66738b]">{page.formDescription ?? 'Fill out the form and our team will get back to you within 24 hours.'}</p>
          </div>
          <LeadForm variant="contact" compact locations={locations} contactContent={page} />
        </Reveal> : null}

        {page.showContactCard !== false ? <Reveal delay={90} className="flex flex-col overflow-hidden rounded-2xl bg-[#031431] text-white shadow-[0_8px_28px_rgba(12,34,68,.12)]">
          <div className="flex-1 p-6 sm:p-7">
            <h2 className="text-xl font-bold">{page.contactCardTitle ?? 'Get In Touch'}</h2>
            <div className="mt-6 space-y-5">
              <a href={phone ? 'tel:' + phone : '#contact'} className="flex gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[#16b9f1]">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#1b9fe0]/40 text-[#18b8ef]"><Phone className="size-5" /></span>
                <span><span className="block text-[10px] text-white/65">{page.contactPhoneLabel ?? 'Phone'}</span><strong className="mt-1 block text-sm">{phone || 'Contact our team'}</strong><span className="mt-1 block text-[10px] text-white/65">{page.contactPhoneDetail ?? contact.hours ?? 'Mon - Sat: 9:00 AM - 7:00 PM'}</span></span>
              </a>
              <a href={email ? 'mailto:' + email : '#contact'} className="flex gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[#16b9f1]">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#1b9fe0]/40 text-[#18b8ef]"><Mail className="size-5" /></span>
                <span><span className="block text-[10px] text-white/65">{page.contactEmailLabel ?? 'Email'}</span><strong className="mt-1 block break-all text-sm">{email || 'Email our team'}</strong><span className="mt-1 block text-[10px] text-white/65">{page.contactEmailDetail ?? 'We reply within 24 hours'}</span></span>
              </a>
              <div className="flex gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#1b9fe0]/40 text-[#18b8ef]"><MapPin className="size-5" /></span>
                <span><span className="block text-[10px] text-white/65">{page.contactOfficeLabel ?? 'Head Office'}</span><strong className="mt-1 block text-sm">{page.contactOfficeName ?? 'GoAhead Mobility Pvt. Ltd.'}</strong><span className="mt-1 block text-[10px] text-white/65">{page.contactOfficeAddress ?? contact.address ?? 'Gurugram, Haryana, India'}</span></span>
              </div>
            </div>
            {socialLinks.length ? <div className="mt-6"><p className="mb-3 text-[10px] text-white/65">{page.contactSocialLabel ?? 'Follow Us'}</p><div className="flex gap-2">{socialLinks.map(([key, label, short]) => <a key={key} href={social[key]} target="_blank" rel="noreferrer" aria-label={label} className="flex size-8 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold transition-colors hover:bg-[#078bea] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#18b8ef]">{short}</a>)}</div></div> : null}
          </div>
          <div className="border-t border-white/10 bg-white/[.035] p-6 sm:p-7">
            <h3 className="font-bold text-[#19baf1]">{page.contactAssistanceTitle ?? 'Need Immediate Assistance?'}</h3>
            <p className="mt-2 text-xs text-white/70">{page.contactAssistanceBody ?? 'Connect with our expert right now.'}</p>
            <a href={phone ? 'tel:' + phone : email ? 'mailto:' + email : '#contact'} className="mt-4 flex min-h-11 items-center gap-3 rounded-lg border border-[#258bd2]/70 px-4 text-sm font-semibold transition-colors hover:bg-[#078bea]/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#18b8ef]"><Headphones className="size-4 text-[#1cbaf0]" />{page.contactAssistanceButton ?? 'Talk to an Expert'} <ArrowRight className="ml-auto size-4 text-[#1cbaf0]" /></a>
          </div>
        </Reveal> : null}
      </section> : null}

      {page.showOffices !== false ? <section className="mx-auto max-w-[1240px] px-5 pb-8 sm:px-6 lg:px-10">
        <div className="mb-5 text-center"><p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#1684cf]">{page.officesEyebrow || ''}</p><h2 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">{page.officesTitle ?? 'Our Offices'}</h2><span className="mx-auto mt-2 block h-0.5 w-8 rounded bg-[#078bea]" />{page.officesDescription ? <p className="mt-2 text-xs text-[#66738b]">{page.officesDescription}</p> : null}</div>
        {officeList.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{officeList.map((office, index) => <motion.article key={office._id} initial={reduce ? false : { opacity: 0, y: 18 }} whileInView={reduce ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true, amount: .15 }} transition={{ duration: .42, delay: index * .055 }} whileHover={reduce ? undefined : { y: -4 }} className="group overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-sm transition-shadow hover:shadow-lg motion-reduce:transition-none">
          <div className="relative aspect-[1.8] overflow-hidden bg-[#e9eff7]">{office.officeImage ? <Image src={office.officeImage} alt={office.officeName || office.city} fill sizes="(max-width:640px) 100vw,25vw" className="object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none" /> : <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#dceaf9] to-[#a9c9e7] text-[#326ba5]"><Building2 className="size-12" aria-hidden /></div>}</div>
          <div className="p-4"><h3 className="flex items-center gap-1.5 text-sm font-bold"><MapPin className="size-4 text-[#078bea]" />{office.officeName || office.city}</h3><p className="mt-2 min-h-12 text-[10px] leading-relaxed text-[#64718a]">{office.officeAddress || [office.city, office.region, office.country].filter(Boolean).join(', ')}</p>{office.officePhone ? <a href={'tel:' + office.officePhone} className="mt-3 inline-flex items-center gap-2 text-[10px] font-semibold text-[#1a3b69]"><Phone className="size-3 text-[#078bea]" />{office.officePhone}</a> : null}{office.officeHours ? <p className="mt-1 text-[9px] text-[#7a8498]">{office.officeHours}</p> : null}</div>
        </motion.article>)}</div> : <div className="rounded-xl border border-dashed border-[#cbd6e5] bg-white px-5 py-8 text-center text-sm text-[#66738b]">Office locations will appear here once published by the GoAhead team.</div>}
      </section> : null}

      {page.showPresence !== false ? <section className="mx-auto max-w-[1240px] px-5 pb-8 sm:px-6 lg:px-10">
        <Reveal className="relative isolate overflow-hidden rounded-2xl bg-[#031431] px-6 py-7 text-white sm:px-8 sm:py-9">
          {page.presenceImage ? <Image src={page.presenceImage} alt={page.presenceImageAlt || ''} fill sizes="100vw" className="object-contain object-right opacity-55" /> : null}
          <div className="absolute inset-0 bg-gradient-to-r from-[#031431] via-[#031431]/95 to-[#031431]/35" />
          <div className="relative max-w-[520px]">
            <p className="text-[9px] font-bold uppercase tracking-[.2em] text-[#18baf1]">{page.presenceEyebrow ?? 'Our presence'}</p>
            <h2 className="mt-2 text-2xl font-bold leading-tight sm:text-3xl"><Highlight text={page.presenceTitle ?? 'Pan India Presence, Global Standards'} phrase={page.presenceHighlight ?? 'Global Standards'} className="text-[#18baf1]" /></h2>
            <p className="mt-3 text-xs leading-relaxed text-white/75">{page.presenceBody ?? 'Delivering safe, reliable and technology-driven transportation solutions across India with a commitment to global excellence.'}</p>
            <div className="mt-6 grid max-w-[480px] grid-cols-2 gap-4 sm:grid-cols-4">{metrics.slice(0, 6).map((metric: Metric, index: number) => <motion.div key={metric.label + index} initial={reduce ? false : { opacity: 0, y: 10 }} whileInView={reduce ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * .06 }} className="border-l border-[#1ba9e6]/50 pl-3"><Icon name={metric.icon} className="mb-1 size-4 text-[#19baf1]" /><strong className="block text-lg text-[#19baf1]">{metric.value}</strong><span className="text-[9px] text-white/70">{metric.label}</span></motion.div>)}</div>
          </div>
        </Reveal>
      </section> : null}

      {page.showFaqs !== false ? <section className="mx-auto max-w-[1240px] px-5 pb-10 sm:px-6 lg:px-10">
        <Reveal className="mb-5 text-center"><p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#1684cf]">{page.faqEyebrow || ''}</p><h2 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">{page.faqTitle ?? 'Frequently Asked Questions'}</h2><span className="mx-auto mt-2 block h-0.5 w-8 rounded bg-[#078bea]" /></Reveal>
        {questions.length ? <FaqAccordion items={questions} columns={2} /> : <p className="rounded-xl border border-dashed border-[#d3dce9] bg-white px-5 py-8 text-center text-sm text-[#68758c]">Frequently asked questions will appear here when published.</p>}
        <div className="mt-4 text-center"><Link href="/faq" className="inline-flex items-center gap-2 text-xs font-semibold text-[#0768d4] hover:text-[#079fe9]">View all FAQs <ArrowRight className="size-4" aria-hidden /></Link></div>
      </section> : null}

      {page.showCta !== false ? <Reveal className="mx-auto max-w-[1240px] px-5 pb-8 sm:px-6 lg:px-10">
        <section className="relative isolate flex flex-col items-start justify-between gap-5 overflow-hidden rounded-xl bg-[#031431] px-6 py-7 text-white sm:flex-row sm:items-center sm:px-8">
          {page.ctaBackgroundImage ? <Parallax amount={3} className="absolute inset-0"><Image src={page.ctaBackgroundImage} alt="" fill sizes="100vw" className="object-cover opacity-30" /></Parallax> : null}
          <div className="absolute inset-0 bg-gradient-to-r from-[#031431] via-[#031431]/90 to-[#031431]/45" />
          <div className="relative"><h2 className="text-xl font-bold sm:text-2xl"><Highlight text={ctaTitle} phrase={ctaHighlight} className="text-[#18baf1]" /></h2><p className="mt-2 text-xs text-white/75">{page.ctaBody ?? 'Let’s discuss how GoAhead Mobility can help your business move ahead.'}</p></div>
          <Link href={page.ctaButtonHref || '#contact'} className="relative inline-flex min-h-11 w-full items-center justify-between gap-6 rounded-full bg-[#087cf0] px-6 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[#1599ff] motion-reduce:transition-none motion-reduce:hover:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto">{page.ctaButtonLabel ?? 'Get a Free Proposal'} <ArrowRight className="size-5" aria-hidden /></Link>
        </section>
      </Reveal> : null}
    </div>
  )
}
