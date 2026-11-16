'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Parallax } from '@/components/motion/gsap-effects'
import { JobAlertForm } from '@/components/site/job-alert-form'
import { EMPLOYMENT_LABELS, LEVEL_LABELS, WORKPLACE_LABELS, formatSalary } from '@/lib/careers/labels'
import {
  ArrowRight, Award, BookOpen, BriefcaseBusiness, ChartNoAxesCombined, Code2,
  FileText, GraduationCap, Headset, HeartPulse, Lightbulb, MapPin, Sprout,
  Target, UserRound, Users, UsersRound, type LucideIcon,
} from 'lucide-react'

type CareerJob = {
  _id: string
  slug: string
  title: string
  department?: string
  location?: string
  employmentType?: string
  workplaceType?: string
  summary?: string
  openings?: number
  hiringManagerEmail?: string
  featured?: boolean
  experienceLevel?: string
  remote?: boolean
  salaryMin?: number | null
  salaryMax?: number | null
  salaryCurrency?: string
  salaryPeriod?: string
}
type CareerContent = Record<string, any> & {
  heroFeatures?: { icon?: string; title: string; body?: string }[]
  departments?: { slug: string; title: string; description?: string; icon?: string; visible?: boolean; sortOrder?: number }[]
  perks?: { icon?: string; title: string; body?: string }[]
  testimonials?: { quote: string; name: string; role?: string; photo?: string }[]
}
type Facet = { value: string; count: number }
type CareerFilters = { q?: string; department?: string; location?: string; type?: string; workplace?: string; level?: string }
type CareerFacets = { department: Facet[]; location: Facet[]; type: Facet[]; workplace: Facet[]; level: Facet[] }
type Props = { content: CareerContent | null; jobs: CareerJob[]; allJobs: CareerJob[]; totalOpen: number; filters: CareerFilters; facets: CareerFacets; alert?: string }

const iconMap: Record<string, LucideIcon> = {
  target: Target, users: Users, 'users-round': UsersRound, code: Code2, 'code-2': Code2,
  headset: Headset, 'chart-no-axes-combined': ChartNoAxesCombined, 'file-text': FileText,
  'graduation-cap': GraduationCap, 'book-open': BookOpen, 'user-round': UserRound,
  award: Award, 'heart-pulse': HeartPulse, sprout: Sprout, lightbulb: Lightbulb,
  'briefcase-business': BriefcaseBusiness,
}
const iconFor = (name?: string): LucideIcon => iconMap[String(name || '').toLowerCase()] || BriefcaseBusiness
const fallbackDepartments = [
  { slug: 'technology', title: 'Technology', description: 'Build scalable platforms and intelligent mobility solutions.', icon: 'code', visible: true },
  { slug: 'operations', title: 'Operations', description: 'Ensure safe, reliable and efficient transportation operations.', icon: 'users', visible: true },
  { slug: 'customer-experience', title: 'Customer Experience', description: 'Deliver exceptional experiences to our clients and passengers.', icon: 'headset', visible: true },
  { slug: 'sales-business-development', title: 'Sales & Business Development', description: 'Drive growth and build lasting client partnerships.', icon: 'chart-no-axes-combined', visible: true },
  { slug: 'corporate-functions', title: 'Corporate Functions', description: 'Power our mission through people, finance and strategy.', icon: 'file-text', visible: true },
  { slug: 'internships', title: 'Internships', description: 'Kickstart your career with real-world learning and mentorship.', icon: 'graduation-cap', visible: true },
]
const fallbackFeatures = [
  { icon: 'target', title: 'Purpose Driven', body: 'Making mobility smarter and more sustainable' },
  { icon: 'users', title: 'People First', body: 'Empowering talent and nurturing growth' },
  { icon: 'lightbulb', title: 'Innovation Led', body: 'Solving real-world problems with technology' },
  { icon: 'users-round', title: 'Inclusive Culture', body: 'Diversity, respect and equal opportunity for all' },
  { icon: 'chart-no-axes-combined', title: 'Impact at Scale', body: 'Millions of journeys. Countless possibilities.' },
]
const fallbackPerks = [
  { icon: 'book-open', title: 'Learning & Growth', body: 'Continuous learning with training, certifications and mentorship.' },
  { icon: 'user-round', title: 'Work–Life Balance', body: 'Flexible schedules and wellness initiatives for a balanced life.' },
  { icon: 'award', title: 'Recognition & Rewards', body: 'Celebrate achievements and contributions that create impact.' },
  { icon: 'heart-pulse', title: 'Health & Wellbeing', body: 'Comprehensive health coverage and wellness programs.' },
  { icon: 'users-round', title: 'Diversity & Inclusion', body: 'An inclusive culture that values diverse perspectives and backgrounds.' },
  { icon: 'sprout', title: 'Purpose & Impact', body: 'Be part of a mission that drives sustainable mobility for a better tomorrow.' },
]
const fallbackStories = [
  { quote: 'GoAhead has given me the platform to solve meaningful problems and work with an amazing team that feels like family.', name: 'Neha Sharma', role: 'Product Manager' },
  { quote: 'The learning opportunities and supportive leadership here help me push my limits and grow every day.', name: 'Arjun Mehta', role: 'Software Engineer' },
  { quote: 'I love the purpose behind what we do. Knowing our work impacts millions of journeys is truly motivating.', name: 'Priya Nair', role: 'Operations Manager' },
]
const employmentLabel = (value?: string) => ({ full_time: 'Full time', part_time: 'Part time', contract: 'Contract', internship: 'Internship' }[String(value || '')] || 'Opportunity')
const normal = (value?: string) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export function CareersPage({ content, jobs, allJobs, totalOpen, filters, facets, alert }: Props) {
  const reduceMotion = useReducedMotion()
  const [department, setDepartment] = useState(filters.department || '')
  useEffect(() => setDepartment(filters.department || ''), [filters.department])
  const data = content ?? {}
  const departments = (data.departments?.length ? data.departments : fallbackDepartments)
    .filter((item: any) => item.visible !== false)
    .sort((a: any, b: any) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
  const features = data.heroFeatures?.length ? data.heroFeatures : fallbackFeatures
  const perks = data.perks?.length ? data.perks : fallbackPerks
  const stories = data.testimonials?.length ? data.testimonials : fallbackStories
  const visibleJobs = useMemo(() => department
    ? jobs.filter((job) => { const dep = normal(job.department); const key = normal(department); return Boolean(dep && key && (dep === key || dep.includes(key) || key.includes(dep))) })
    : jobs, [jobs, department])
  const countFor = (slug: string) => allJobs.filter((job) => { const dep = normal(job.department); const key = normal(slug); return Boolean(dep && key && (dep.includes(key) || key.includes(dep))) }).reduce((sum, job) => sum + Math.max(1, Number(job.openings || 1)), 0)
  const scrollToJobs = (slug = '') => {
    setDepartment(slug)
    document.getElementById('open-positions')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
  }
  const reveal = reduceMotion ? {} : { initial: { opacity: 0, y: 28 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.16 }, transition: { duration: 0.65, ease: 'easeOut' as const } }
  const heroTitle = String(data.heroTitle || 'Drive Your Career. Move the Future.')
  const heroHighlight = String(data.heroHighlight || 'Move the Future.')
  const highlightAt = heroHighlight ? heroTitle.indexOf(heroHighlight) : -1

  return (
    <main className="overflow-hidden bg-white text-slate-950">
      {data.showHero !== false && (
        <section className="relative isolate min-h-[540px] overflow-hidden bg-[#03132d] text-white md:min-h-[570px]">
          <Parallax amount={5} className="absolute inset-0 -z-20"><div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${data.heroImage || '/images/site/home-hero.png'}")` }} role="img" aria-label={data.heroImageAlt || 'GoAhead Mobility team and transport fleet'} /></Parallax>
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#020d22] via-[#03132de8] to-[#03132d30]" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#03132d] via-transparent to-[#03132d45]" />
          <div className="mx-auto flex min-h-[440px] max-w-[1440px] flex-col justify-center px-5 pb-12 pt-16 sm:px-8 lg:min-h-[475px] lg:px-12">
            <motion.div {...reveal} className="max-w-[610px]">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[.18em] text-cyan-400">{data.heroEyebrow || 'Careers'}</p>
              <h1 className="max-w-[600px] whitespace-pre-line text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-[58px]">
                {data.heroTitle || 'Drive Your Career. Move the Future.'}
              </h1>
              {data.heroHighlight && <span className="sr-only">{data.heroHighlight}</span>}
              <p className="mt-5 max-w-[510px] text-base leading-7 text-slate-200 sm:text-lg">{data.heroDescription || 'Join a team that’s transforming mobility through innovation, safety and service excellence.'}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a href={data.heroPrimaryHref || '#open-positions'} onClick={data.heroPrimaryHref === '#open-positions' || !data.heroPrimaryHref ? (e) => { e.preventDefault(); scrollToJobs() } : undefined} className="group inline-flex min-h-12 items-center gap-4 rounded-md bg-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-950/30 transition hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300">
                  {data.heroPrimaryLabel || 'View Open Positions'} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </a>
                <a href={data.heroSecondaryHref || '#why-work'} className="inline-flex min-h-12 items-center gap-3 rounded-md border border-white/60 px-5 text-sm font-semibold text-white transition hover:border-cyan-300 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300">
                  {data.heroSecondaryLabel || 'Life at GoAhead'} <ArrowRight className="size-4" />
                </a>
              </div>
            </motion.div>
          </div>
          <div className="border-t border-white/10 bg-[#04152ee8]">
            <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-4 px-5 py-6 sm:grid-cols-3 sm:px-8 lg:grid-cols-5 lg:px-12">
              {features.map((item: any, index: number) => {
                const Icon = iconFor(item.icon)
                return <motion.div key={item.title + index} initial={reduceMotion ? false : { opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * .06, duration: .4 }} className="flex items-center gap-3">
                  <Icon className="size-8 shrink-0 text-sky-400" strokeWidth={1.5} />
                  <div><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 text-xs leading-5 text-slate-300">{item.body}</p></div>
                </motion.div>
              })}
            </div>
          </div>
        </section>
      )}

      {data.showDepartments !== false && (
        <section className="mx-auto max-w-[1440px] px-5 py-14 sm:px-8 lg:px-12 lg:py-16">
          <motion.div {...reveal} className="mb-8 text-center">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-blue-600">{data.departmentsEyebrow || 'Find your place'}</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{data.departmentsTitle || 'Explore Opportunities'}</h2>
            <p className="mt-2 text-sm text-slate-600 sm:text-base">{data.departmentsSubtitle || 'Find the right role to accelerate your career'}</p>
          </motion.div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {departments.map((item: any, index: number) => {
              const Icon = iconFor(item.icon)
              const openings = countFor(item.slug || item.title)
              return <motion.button type="button" key={item.slug || item.title} initial={reduceMotion ? false : { opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * .05, duration: .45 }} whileHover={reduceMotion ? undefined : { y: -6 }} aria-pressed={department === (item.slug || item.title)} onClick={() => scrollToJobs(item.slug || item.title)} className="group flex min-h-[250px] flex-col items-center rounded-xl border border-slate-200 bg-white px-5 py-6 text-center shadow-sm transition hover:border-blue-200 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                <span className="grid size-14 place-items-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-200 transition group-hover:scale-110"><Icon className="size-6" /></span>
                <h3 className="mt-4 text-base font-bold">{item.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{item.description}</p>
                <span className="mt-4 text-sm font-semibold text-blue-700">{openings} {openings === 1 ? 'Opening' : 'Openings'}</span>
                <span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-700">{data.departmentCardButtonLabel || 'View Openings'} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
              </motion.button>
            })}
          </div>
          <div className="mt-7 text-center">
            <button type="button" onClick={() => scrollToJobs('')} className="inline-flex min-h-11 items-center gap-3 rounded-md bg-[#061735] px-6 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">{data.departmentsButtonLabel || 'View All Departments'} <ArrowRight className="size-4" /></button>
          </div>
        </section>
      )}

      {data.showOpenings !== false && (
        <section id="open-positions" className="scroll-mt-20 bg-slate-50 px-5 py-14 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-[1440px]">
            <motion.div {...reveal} className="mb-7 flex flex-wrap items-end justify-between gap-4">
              <div><p className="text-xs font-bold uppercase tracking-[.16em] text-blue-600" >{data.openingsEyebrow || 'Join our team'}</p><h2 className="mt-2 text-2xl font-bold sm:text-3xl">{data.openingsTitle || 'Current Open Positions'}</h2><p className="mt-2 text-sm text-slate-600">{data.openingsDescription || 'Live vacancies published by our hiring team.'}</p></div>
              {department && <button type="button" onClick={() => setDepartment('')} className="text-sm font-semibold text-blue-700 underline underline-offset-4">Clear department filter</button>}
            </motion.div>
            <div className="mb-7 grid gap-5 lg:grid-cols-[1fr_320px]">
              <form method="get" action="/careers" role="search" aria-label="Filter open positions" className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 xl:grid-cols-3">
                <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">Keyword<input name="q" type="search" defaultValue={filters.q || ''} placeholder={data.openingsSearchPlaceholder || "Title, skill or team"} className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-normal text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-blue-500" /></label>
                {facets.department.length > 0 && <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">Department<select name="department" defaultValue={filters.department || ''} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900"><option value="">All departments</option>{facets.department.map((x) => <option key={x.value} value={x.value}>{x.value} ({x.count})</option>)}</select></label>}
                {facets.location.length > 0 && <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">Location<select name="location" defaultValue={filters.location || ''} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900"><option value="">All locations</option>{facets.location.map((x) => <option key={x.value} value={x.value}>{x.value} ({x.count})</option>)}</select></label>}
                {facets.workplace.length > 0 && <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">Workplace<select name="workplace" defaultValue={filters.workplace || ''} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900"><option value="">All workplaces</option>{facets.workplace.map((x) => <option key={x.value} value={x.value}>{WORKPLACE_LABELS[x.value] || x.value} ({x.count})</option>)}</select></label>}
                {facets.type.length > 0 && <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">Employment type<select name="type" defaultValue={filters.type || ''} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900"><option value="">All types</option>{facets.type.map((x) => <option key={x.value} value={x.value}>{EMPLOYMENT_LABELS[x.value] || x.value} ({x.count})</option>)}</select></label>}
                {facets.level.length > 0 && <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">Experience<select name="level" defaultValue={filters.level || ''} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900"><option value="">All levels</option>{facets.level.map((x) => <option key={x.value} value={x.value}>{LEVEL_LABELS[x.value] || x.value} ({x.count})</option>)}</select></label>}
                <div className="flex items-end gap-2"><button type="submit" className="h-10 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-500">{data.openingsSearchButtonLabel || "Search roles"}</button><Link href="/careers#open-positions" className="inline-flex h-10 items-center rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700">Reset</Link></div>
              </form>
              <div className="rounded-xl border border-slate-200 bg-white p-4"><h3 className="font-bold">{data.jobAlertsTitle || "Get job alerts"}</h3><p className="mt-1 text-xs leading-5 text-slate-600">{data.jobAlertsDescription || "Be first to hear when a matching role opens."}</p>{alert && <p role="status" className="mt-3 rounded-lg bg-blue-50 p-2 text-xs text-blue-800">{alert}</p>}<div className="mt-3"><JobAlertForm departments={facets.department.map((x) => x.value)} locations={facets.location.map((x) => x.value)} /></div></div>
            </div>
            <p className="mb-4 text-sm text-slate-500" aria-live="polite">{jobs.length === totalOpen ? 'Showing all ' + jobs.length + ' open roles' : jobs.length + ' of ' + totalOpen + ' roles match your filters'}</p>
            {visibleJobs.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleJobs.map((job, index) => <motion.article key={job._id} initial={reduceMotion ? false : { opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * .04 }} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <div className="flex flex-wrap gap-2 text-xs font-semibold"><span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">{job.department || 'GoAhead Mobility'}</span><span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{employmentLabel(job.employmentType)}</span></div>
                <h3 className="mt-4 text-lg font-bold">{job.title}</h3>
                <p className="mt-2 flex items-center gap-2 text-sm text-slate-500"><MapPin className="size-4" />{job.location || 'Location shared during hiring'}</p>
                <p className="mt-2 text-xs text-slate-500">{[WORKPLACE_LABELS[String(job.workplaceType)] || (job.remote ? 'Remote' : ''), EMPLOYMENT_LABELS[String(job.employmentType)], LEVEL_LABELS[String(job.experienceLevel)], formatSalary(job)].filter(Boolean).join(' · ')}</p>
                {job.summary && <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{job.summary}</p>}
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4"><span className="text-xs text-slate-500">{Math.max(1, Number(job.openings || 1))} {Number(job.openings || 1) === 1 ? 'vacancy' : 'vacancies'}</span><Link href={'/careers/' + job.slug} className="inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-900">View role <ArrowRight className="size-4" /></Link></div>
              </motion.article>)}
            </div> : <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center"><BriefcaseBusiness className="mx-auto size-9 text-blue-600" /><h3 className="mt-3 text-lg font-bold">{jobs.length ? 'No openings in this department right now' : data.openingsEmptyTitle || 'No open positions at the moment'}</h3><p className="mt-2 text-sm text-slate-600">{jobs.length ? 'Try another department or clear the filter to see all available roles.' : data.openingsEmptyDescription || 'Please check back soon or contact our team to share your interest.'}</p><button type="button" onClick={() => setDepartment('')} className="mt-4 text-sm font-semibold text-blue-700 underline underline-offset-4">View all opportunities</button></div>}
          </div>
        </section>
      )}

      {data.showWhyWork !== false && (
        <section id="why-work" className="mx-auto grid max-w-[1440px] items-center gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1.15fr_.85fr] lg:px-12 lg:py-20">
          <motion.div {...reveal}>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-blue-600">{data.whyEyebrow || 'Life at GoAhead'}</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{data.whyTitle || 'Why Work at GoAhead?'}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">{data.whyDescription || 'We believe our people are our greatest strength. We empower you to learn, grow and make a meaningful impact every day.'}</p>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {perks.map((item: any, index: number) => { const Icon = iconFor(item.icon); return <motion.div key={item.title + index} whileHover={reduceMotion ? undefined : { x: 4 }} className="flex gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-700"><Icon className="size-5" /></span><div><h3 className="text-sm font-bold">{item.title}</h3><p className="mt-1 text-xs leading-5 text-slate-600">{item.body}</p></div></motion.div> })}
            </div>
          </motion.div>
          <motion.div {...reveal} className="relative min-h-[330px] overflow-hidden rounded-2xl bg-slate-200 shadow-xl">
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${data.whyImage || '/images/site/about-hero.png'}")` }} role="img" aria-label={data.whyImageAlt || 'A welcoming GoAhead Mobility workplace'} />
            <div className="absolute inset-x-4 bottom-4 rounded-xl bg-[#041633]/95 p-5 text-white shadow-2xl sm:inset-x-auto sm:right-4 sm:max-w-[330px]"><span className="text-3xl font-bold text-blue-400">“</span><p className="text-sm leading-6">{data.whyQuote || 'At GoAhead, every journey we enable begins with our people. We grow together, innovate together and lead together.'}</p><p className="mt-3 text-xs font-semibold text-cyan-300">— {data.whyQuoteAuthor || 'Team GoAhead'}</p></div>
          </motion.div>
        </section>
      )}

      {data.showTestimonials !== false && stories.length > 0 && (
        <section className="bg-slate-50 px-5 py-14 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-[1440px]">
            <motion.div {...reveal} className="mb-8 text-center"><p className="text-xs font-bold uppercase tracking-[.16em] text-blue-600">{data.testimonialsEyebrow || 'Team stories'}</p><h2 className="mt-2 text-2xl font-bold sm:text-3xl">{data.testimonialsTitle || 'Hear From Our People'}</h2></motion.div>
            <div className="grid gap-5 lg:grid-cols-3">
              {stories.map((story: any, index: number) => <motion.article key={story.name + index} {...reveal} whileHover={reduceMotion ? undefined : { y: -5 }} className="flex gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="size-16 shrink-0 overflow-hidden rounded-full bg-blue-100">
                  {story.photo ? <div className="size-full bg-cover bg-center" style={{ backgroundImage: `url("${story.photo}")` }} role="img" aria-label={story.name} /> : <div className="grid size-full place-items-center text-lg font-bold text-blue-700">{String(story.name || 'G').split(' ').map((v: string) => v[0]).slice(0,2).join('')}</div>}
                </div>
                <div><p className="text-sm leading-6 text-slate-700">“{story.quote}”</p><p className="mt-4 text-sm font-bold">{story.name}</p><p className="text-xs text-slate-500">{story.role}</p></div>
              </motion.article>)}
            </div>
          </div>
        </section>
      )}

      {data.showCta !== false && (
        <section className="px-5 py-12 sm:px-8 lg:px-12">
          <motion.div {...reveal} className="relative mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-6 overflow-hidden rounded-2xl bg-[#041633] bg-cover bg-center px-7 py-9 text-white shadow-xl sm:flex-row sm:items-center sm:px-10" style={{ backgroundImage: `linear-gradient(90deg,rgba(2,13,33,.98),rgba(2,13,33,.78)),url("${data.ctaImage || '/images/site/transport-hero.png'}")` }}>
            <div className="max-w-2xl"><h2 className="text-2xl font-bold sm:text-3xl">{data.ctaTitle || 'Ready to Accelerate Your Career?'}</h2><p className="mt-2 text-sm leading-6 text-slate-200 sm:text-base">{data.ctaDescription || 'Explore opportunities and be part of a team that’s shaping the future of mobility.'}</p></div>
            <a href={data.ctaButtonHref || '#open-positions'} onClick={data.ctaButtonHref === '#open-positions' || !data.ctaButtonHref ? (e) => { e.preventDefault(); scrollToJobs() } : undefined} className="group inline-flex min-h-12 shrink-0 items-center gap-5 rounded-md bg-blue-600 px-6 text-sm font-bold text-white transition hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300">{data.ctaButtonLabel || 'View Open Positions'} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></a>
          </motion.div>
        </section>
      )}
    </main>
  )
}
