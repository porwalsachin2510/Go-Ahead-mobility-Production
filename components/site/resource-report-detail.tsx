'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'motion/react'
import {
  ArrowDownToLine, ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Building2, CalendarDays,
  ChartNoAxesCombined, ClipboardList, FileCheck2, FileText, Handshake, Lightbulb, Settings, Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Breadcrumbs } from '@/components/site/breadcrumbs'
import { Markdown, SmartImage, formatDate } from '@/components/site/primitives'
import { ResourcePreviewCarousel, type ResourcePreviewSlide } from '@/components/site/resource-preview-carousel'

type Props = { resource: Record<string, any> }

const audienceIcons: Record<string, LucideIcon> = {
  users: Users,
  settings: Settings,
  handshake: Handshake,
  'building-2': Building2,
  'chart-no-axes-combined': ChartNoAxesCombined,
  lightbulb: Lightbulb,
}
const AudienceIcon = ({ name }: { name?: string }) => {
  const Component = audienceIcons[name || ''] || Users
  return <Component className="size-7" aria-hidden />
}
const safeImage = (value?: string) => typeof value === 'string' && value.trim() ? value : '/images/site/planning.png'

function InsightArtwork({ index }: { index: number }) {
  if (index % 3 === 1) {
    return (
      <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,#f4f8ff,#eef5ff)] p-4">
        <svg viewBox="0 0 420 190" className="h-full w-full" role="img" aria-label="Illustrative route and coverage diagram">
          <g fill="none" stroke="#c9d9ef" strokeWidth="1">
            <path d="M8 36H412M8 78H412M8 120H412M8 162H412M48 8V182M120 8V182M192 8V182M264 8V182M336 8V182" />
          </g>
          <g fill="none" stroke="#8bb8f4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M28 145L88 108L146 124L202 54L265 83L330 34L390 62" />
            <path d="M88 108L115 34L202 54L232 150L330 34" />
            <path d="M146 124L180 172L232 150L315 145L390 62" />
          </g>
          <g fill="#fff" stroke="#0874ef" strokeWidth="4">
            <circle cx="28" cy="145" r="7"/><circle cx="88" cy="108" r="7"/><circle cx="146" cy="124" r="7"/>
            <circle cx="202" cy="54" r="7"/><circle cx="265" cy="83" r="7"/><circle cx="330" cy="34" r="7"/>
            <circle cx="390" cy="62" r="7"/><circle cx="232" cy="150" r="7"/>
          </g>
        </svg>
      </div>
    )
  }
  if (index % 3 === 2) {
    return (
      <div className="flex h-full items-end justify-center gap-5 bg-[linear-gradient(135deg,#f6f9ff,#eef4fc)] px-7 pb-5 pt-7">
        <svg viewBox="0 0 420 190" className="h-full w-full" role="img" aria-label="Illustrative operations performance chart">
          <g stroke="#d9e3f1" strokeWidth="1"><path d="M10 30H410M10 70H410M10 110H410M10 150H410"/></g>
          <g fill="#70a9fa">
            <rect x="38" y="98" width="30" height="52" rx="4"/><rect x="91" y="68" width="30" height="82" rx="4"/>
            <rect x="144" y="87" width="30" height="63" rx="4"/><rect x="197" y="42" width="30" height="108" rx="4"/>
            <rect x="250" y="60" width="30" height="90" rx="4"/><rect x="303" y="24" width="30" height="126" rx="4"/>
            <rect x="356" y="12" width="30" height="138" rx="4" fill="#0874ef"/>
          </g>
          <path d="M18 165H402" stroke="#9db1cc" strokeWidth="2"/>
        </svg>
      </div>
    )
  }
  return (
    <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,#f5f9ff,#eaf3ff)] p-4">
      <svg viewBox="0 0 420 190" className="h-full w-full" role="img" aria-label="Illustrative demand trend chart">
        <g stroke="#dbe6f4" strokeWidth="1"><path d="M10 35H410M10 75H410M10 115H410M10 155H410"/></g>
        <path d="M10 157C40 151 43 105 78 111S119 34 155 43S204 143 244 121S296 55 328 69S371 118 410 82V174H10Z" fill="#a9ccff" opacity=".55"/>
        <path d="M10 157C40 151 43 105 78 111S119 34 155 43S204 143 244 121S296 55 328 69S371 118 410 82" fill="none" stroke="#0874ef" strokeWidth="4" strokeLinecap="round"/>
        <path d="M10 174H410" stroke="#9db1cc" strokeWidth="2"/>
      </svg>
    </div>
  )
}

export function ResourceReportDetailPage({ resource: d }: Props) {
  const reduceMotion = Boolean(useReducedMotion())
  const title = String(d.title || 'Report')
  const tags: string[] = Array.isArray(d.tags) ? d.tags.filter(Boolean).slice(0, 4) : []
  const audiences = Array.isArray(d.audiences) ? d.audiences.filter((item: any) => item?.title) : []
  const questions = Array.isArray(d.keyQuestions) ? d.keyQuestions.filter((item: any) => item?.question) : []
  const contents = Array.isArray(d.paperSections) ? d.paperSections.filter((item: any) => item?.title) : []
  const insights = Array.isArray(d.keyInsights) ? d.keyInsights.filter((item: any) => item?.title) : []
  const previewImages = Array.isArray(d.previewImages) ? d.previewImages.filter((item: any) => item?.image) : []
  const slides: ResourcePreviewSlide[] = previewImages.length
    ? previewImages.map((item: any) => ({ image: item.image, alt: item.alt || title, caption: item.caption || '' }))
    : [{ image: safeImage(d.image), alt: title + ' report preview', caption: 'Report cover' }]
  const related = Array.isArray(d.relatedResources) ? d.relatedResources : []
  const canDownload = Boolean(d.fileMediaId || (typeof d.externalUrl === 'string' && /^https:\/\//i.test(d.externalUrl)))
  const downloadHref = d.gated
    ? '/contact?topic=resource&resource=' + encodeURIComponent(d.slug)
    : canDownload ? '/api/v1/resources/' + encodeURIComponent(d.slug) + '/download' : '/contact?topic=resource&resource=' + encodeURIComponent(d.slug)
  const fileFormat = d.fileFormat ? String(d.fileFormat).toUpperCase() : 'PDF report'
  const fileSize = d.fileSizeLabel || (d.fileMediaId ? 'From uploaded file' : 'Managed in resource details')
  const published = formatDate(d.publishedAt || d.updatedAt) || 'CMS managed'
  const details = [
    { icon: FileText, label: 'Format', value: fileFormat },
    { icon: FileCheck2, label: 'File size', value: fileSize },
    { icon: ChartNoAxesCombined, label: 'Page count', value: d.pageCount ? String(d.pageCount) : 'CMS managed' },
    { icon: BookOpen, label: 'Version', value: d.version ? 'v' + d.version : 'CMS managed' },
    { icon: CalendarDays, label: 'Published / Updated', value: published },
  ]
  const trail = [
    { name: 'Home', path: '/' },
    { name: 'Resources', path: '/resources' },
    { name: 'Reports & Insights', path: '/resources' },
    { name: title, path: '/resources/' + d.slug },
  ]
  const employeeMobility = /(transport|shuttle|commute|employee mobility)/i.test([title, d.summary, d.category, ...tags].filter(Boolean).join(' '))
  const audienceItems = audiences.length ? audiences : employeeMobility ? [
    { icon: 'users', title: 'HR & Transport Leaders' },
    { icon: 'settings', title: 'Operations Teams' },
    { icon: 'handshake', title: 'Procurement & Vendor Managers' },
    { icon: 'building-2', title: 'Workplace & Facility Leaders' },
  ] : []
  const metaRows = [
    { label: 'Format', value: fileFormat, icon: FileText },
    { label: 'File size', value: fileSize, icon: FileCheck2 },
    { label: 'Page count', value: d.pageCount ? String(d.pageCount) : 'CMS managed', icon: ChartNoAxesCombined },
    { label: 'Version', value: d.version ? 'v' + d.version : 'CMS managed', icon: BookOpen },
    { label: 'Published / Updated', value: published, icon: CalendarDays },
  ]
  const ctaHref = typeof d.bottomCtaButtonHref === 'string' && d.bottomCtaButtonHref ? d.bottomCtaButtonHref : '/contact?topic=resource'
  const navItems = [
    { label: d.overviewTabLabel || 'Overview', href: '#overview', icon: Users },
    { label: d.questionsTabLabel || 'Key Insights', href: '#key-insights', icon: Lightbulb },
    { label: d.contentsTabLabel || 'Inside the Report', href: '#inside-report', icon: ClipboardList },
    { label: d.previewTabLabel || 'Preview', href: '#report-preview', icon: BookOpen },
    { label: d.detailsTabLabel || 'Report Details', href: '#report-details', icon: CalendarDays },
  ]

  return (
    <article data-page="resource-report-detail" className="overflow-hidden bg-white text-[#101d42]">
      <section className="border-b border-[#e7edf5] bg-[linear-gradient(135deg,#f8fbff_0%,#ffffff_62%,#f3f8ff_100%)]">
        <div className="mx-auto max-w-[1240px] px-5 pb-9 pt-6 sm:px-7 lg:px-10 lg:pb-12">
          <Breadcrumbs trail={trail} />
          <div className="mt-7 grid items-center gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(220px,.78fr)_minmax(250px,.62fr)] lg:gap-9">
            <div className="max-w-[560px]">
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#167be7]">{d.eyebrow || 'Reports & Insights'}</p>
              <h1 className="mt-3 text-balance text-[clamp(2rem,4.1vw,3.1rem)] font-semibold leading-[1.08] tracking-[-.045em] text-[#101d42]">{title}</h1>
              {d.summary ? <p className="mt-4 max-w-[520px] text-sm leading-7 text-[#4c5872] sm:text-[15px]">{d.summary}</p> : null}
              {tags.length ? <div className="mt-6 flex flex-wrap gap-2">{tags.map((tag) => <span key={tag} className="inline-flex items-center gap-2 rounded-lg border border-[#e0e8f4] bg-white/90 px-3 py-2 text-[10px] font-medium text-[#25365c]"><span className="size-2 rounded-full bg-[#1682f6]"/>{tag}</span>)}</div> : null}
              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-[#74809a]">
                <span>{d.resourceType === 'tool' ? 'Report' : d.resourceType === 'article' ? 'Insight' : 'Report'}</span>
                {d.publishedAt ? <span>Published {formatDate(d.publishedAt)}</span> : null}
                {Number(d.downloadCount) > 0 ? <span>{Number(d.downloadCount).toLocaleString('en-IN')} downloads</span> : null}
              </div>
            </div>

            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 12, rotate: -1.2 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.38, ease: 'easeOut' }}
              className="relative mx-auto w-full max-w-[290px] [perspective:1100px]"
            >
              <div className="absolute -right-3 inset-y-2 w-4 rounded-r-md border border-[#cbd4e1] bg-[#dce2eb] shadow-md"/>
              <div className="relative aspect-[3/4] overflow-hidden rounded-sm border border-[#d9e0eb] bg-white shadow-[0_24px_55px_rgba(19,44,84,.20)] [transform:rotateY(-7deg)]">
                <SmartImage src={safeImage(d.image)} alt={title + ' cover'} sizes="(min-width: 1024px) 290px, 70vw" className="object-cover object-center"/>
              </div>
            </motion.div>

            <aside className="rounded-2xl border border-[#e1e8f2] bg-white p-5 shadow-[0_12px_35px_rgba(21,48,89,.08)] sm:p-6">
              <h2 className="text-lg font-semibold tracking-tight text-[#142449]">{d.downloadPanelTitle || 'Access the complete report'}</h2>
              <p className="mt-1.5 text-xs leading-relaxed text-[#69758d]">{d.downloadPanelBody || 'Download the full report to explore the frameworks, insights and practical guidance.'}</p>
              <Link href={downloadHref} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0863f7] px-4 py-3 text-xs font-semibold text-white shadow-sm transition hover:bg-[#064fca] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1677ee] focus-visible:ring-offset-2">
                <ArrowDownToLine className="size-4" aria-hidden/>
                {d.gated ? 'Request access' : canDownload ? (d.downloadButtonLabel || 'Download Report') : 'Request this report'}
              </Link>
              <div className="mt-5 space-y-3 border-t border-[#edf0f5] pt-4">
                {metaRows.map((item) => <div key={item.label} className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#f2f7ff] text-[#1678ec]"><item.icon className="size-4" aria-hidden/></span>
                  <span className="min-w-0"><strong className="block text-[10px] font-semibold text-[#27375d]">{item.label}</strong><span className="mt-0.5 block text-[10px] text-[#69758d]">{item.value}</span></span>
                </div>)}
              </div>
              {d.downloadPanelNote ? <p className="mt-4 border-t border-[#edf0f5] pt-3 text-[10px] leading-relaxed text-[#71809b]">{d.downloadPanelNote}</p> : null}
            </aside>
          </div>
        </div>
      </section>

      <nav aria-label="Report sections" className="sticky top-0 z-30 border-b border-[#e5eaf2] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1240px] gap-6 overflow-x-auto px-5 sm:px-7 lg:gap-10 lg:px-10">
          {navItems.map((item, index) => <a key={item.href} href={item.href} className={'relative flex shrink-0 items-center gap-2 py-4 text-[10px] font-semibold transition-colors hover:text-[#0863f7] focus-visible:outline-none focus-visible:text-[#0863f7] ' + (index === 0 ? 'text-[#0863f7]' : 'text-[#66738f')}>
            <span className="flex size-6 items-center justify-center rounded-md bg-[#f1f6ff] text-[#1678ec]"><item.icon className="size-3.5" aria-hidden/></span>
            {item.label}
            {index === 0 ? <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#0863f7]"/> : null}
          </a>)}
        </div>
      </nav>

      <div className="mx-auto max-w-[1240px] px-5 pb-8 sm:px-7 lg:px-10">
        <section id="overview" className={'scroll-mt-24 grid gap-8 border-b border-[#e8edf4] py-9 lg:gap-10 lg:py-10 ' + (audienceItems.length ? 'lg:grid-cols-[.85fr_1.15fr]' : '')}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#167be7]">{d.aboutEyebrow || 'About this report'}</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#142449]">{d.aboutHeading || 'About this report'}</h2>
            {d.body ? <div className="mt-4 text-[12px] leading-6 text-[#5e6a83]"><Markdown>{d.body}</Markdown></div> : <p className="mt-4 text-[12px] leading-6 text-[#5e6a83]">{d.summary || 'A practical report for mobility and operations teams.'}</p>}
          </div>
          {audienceItems.length ? <div>
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#167be7]">{d.audienceEyebrow || 'For your team'}</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#142449]">{d.audienceHeading || 'Who should read this'}</h2>
            <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
              {audienceItems.map((item: any, index: number) => <div key={item.title || index} className="flex flex-col items-center border-l border-[#e9eef5] px-2 text-center first:border-0">
                <span className="flex size-11 items-center justify-center text-[#1678f2]"><AudienceIcon name={item.icon}/></span>
                <strong className="mt-2 text-[10px] leading-4 text-[#17284d]">{item.title}</strong>
                {item.body ? <span className="mt-1 text-[9px] leading-4 text-[#6c7890]">{item.body}</span> : null}
              </div>)}
            </div>
          </div> : null}
        </section>

        <section className="grid gap-4 py-7 lg:grid-cols-[.82fr_1.18fr] lg:py-8">
          <div className="rounded-2xl border border-[#edf1f6] bg-white p-5 shadow-[0_5px_20px_rgba(20,43,80,.035)] sm:p-6">
            <h2 className="text-lg font-semibold tracking-tight text-[#142449]">{d.questionsHeading || 'Questions this report explores'}</h2>
            {questions.length ? <ol className="mt-4 divide-y divide-[#e7edf5]">
              {questions.map((item: any, index: number) => <li key={item.question || index} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[#cfe0fa] text-[11px] font-semibold text-[#0863f7]">{String(index + 1).padStart(2, '0')}</span>
                <span className="pt-1 text-[11px] leading-5 text-[#25365b]">{item.question}</span>
              </li>)}
            </ol> : <p className="mt-4 text-xs text-[#6b7891]">Add the report questions in Admin → Resources to show them here.</p>}
          </div>
          <div id="inside-report" className="scroll-mt-24 rounded-2xl border border-[#edf1f6] bg-white p-5 shadow-[0_5px_20px_rgba(20,43,80,.035)] sm:p-6">
            <h2 className="text-lg font-semibold tracking-tight text-[#142449]">{d.paperContentsHeading || 'Inside the report'}</h2>
            {contents.length ? <ol className="mt-4 divide-y divide-[#e7edf5] border-t border-[#e7edf5]">
              {contents.map((item: any, index: number) => <li key={item.title || index} className="flex items-center gap-3 py-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-[#e0e9f7] text-[11px] font-semibold text-[#0863f7]">{String(index + 1).padStart(2, '0')}</span>
                <span className="min-w-0 flex-1"><strong className="block text-[10px] leading-4 text-[#17284d]">{item.title}</strong>{item.body ? <span className="mt-0.5 block text-[9px] leading-4 text-[#69758c]">{item.body}</span> : null}</span>
                <ArrowRight className="size-4 shrink-0 text-[#1678ed]" aria-hidden/>
              </li>)}
            </ol> : <p className="mt-4 text-xs text-[#6b7891]">Add report chapters in Admin → Resources to show them here.</p>}
          </div>
        </section>

        <section id="key-insights" className="scroll-mt-24 py-3">
          <div className="rounded-2xl border border-[#e8eef6] bg-white p-4 shadow-[0_5px_20px_rgba(20,43,80,.03)] sm:p-5">
            <div className="mb-4 text-center">
              <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#167be7]">{d.keyInsightsEyebrow || 'Illustrative report preview'}</p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-[#142449]">{d.keyInsightsHeading || 'Key insights at a glance'}</h2>
            </div>
            {insights.length ? <div className="grid gap-3 md:grid-cols-3">
              {insights.map((item: any, index: number) => <motion.article
                key={item.title || index}
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.3, delay: reduceMotion ? 0 : index * 0.06 }}
                className="overflow-hidden rounded-xl border border-[#e2eaf4] bg-white transition duration-300 hover:-translate-y-1 hover:border-[#b8d2f8] hover:shadow-lg"
              >
                <div className="flex items-center gap-2 px-4 pt-4">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#2f80f7] text-xs font-bold text-white">{index + 1}</span>
                  <h3 className="text-[12px] font-semibold text-[#18294e]">{item.title}</h3>
                </div>
                <div className="mx-4 mt-3 h-36 overflow-hidden rounded-lg border border-[#e4ebf4] bg-[#f5f8fd]">
                  {item.image ? <SmartImage src={item.image} alt={item.imageAlt || item.title} sizes="(min-width: 768px) 330px, 90vw" className="object-cover"/> : <InsightArtwork index={index}/>}
                </div>
                {item.body ? <p className="px-4 pb-4 pt-3 text-[10px] leading-5 text-[#5e6a83]">{item.body}</p> : <div className="h-4"/>}
              </motion.article>)}
            </div> : <p className="rounded-lg border border-dashed border-[#dce5f1] p-5 text-center text-xs text-[#69758d]">Add Key insight cards in Admin → Resources to populate this section.</p>}
          </div>
        </section>

        <section id="report-preview" className="scroll-mt-24 py-6">
          <div className="rounded-2xl border border-[#e8eef6] bg-white p-5 shadow-[0_6px_24px_rgba(20,43,80,.035)] sm:p-6">
            <h2 className="text-lg font-semibold tracking-tight text-[#142449]">{d.previewHeading || 'Preview the report'}</h2>
            <div className="mt-5"><ResourcePreviewCarousel slides={slides} title={d.previewHeading || 'Report preview'} variant="gallery"/></div>
            <p className="mt-4 text-[11px] leading-relaxed text-[#68748c]">{d.previewDescription || 'This is a preview. The full report includes complete frameworks, detailed guidance and reference materials.'}</p>
          </div>
        </section>

        <section id="report-details" className="scroll-mt-24 py-5">
          <div className="rounded-2xl border border-[#e8eef6] bg-white p-5 shadow-[0_6px_22px_rgba(20,43,80,.035)] sm:p-6">
            <h2 className="text-lg font-semibold tracking-tight text-[#142449]">{d.detailsHeading || 'Report details'}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {details.map((item) => <div key={item.label} className="flex items-center gap-3 rounded-xl border border-[#e7edf6] bg-[#fbfdff] p-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#d8e7ff] bg-white text-[#1678ef]"><item.icon className="size-5" aria-hidden/></span>
                <span className="min-w-0"><strong className="block text-[10px] font-semibold text-[#24365b]">{item.label}</strong><span className="mt-1 block text-[10px] leading-4 text-[#64718a]">{item.value}</span></span>
              </div>)}
            </div>
            {d.updateNotes ? <p className="mt-3 text-[10px] leading-relaxed text-[#74809a]">{d.updateNotes}</p> : null}
            {d.detailsNote ? <p className="mt-2 text-[10px] leading-relaxed text-[#74809a]">{d.detailsNote}</p> : null}
          </div>
        </section>

        <section className="pb-7 pt-2">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#167be7]">{d.relatedEyebrow || 'Keep exploring'}</p><h2 className="mt-1 text-xl font-semibold tracking-tight text-[#142449]">{d.relatedHeading || 'Related reports and insights'}</h2></div>
            <Link href="/resources" className="hidden items-center gap-1 text-xs font-semibold text-[#0863f7] sm:inline-flex">All resources <ArrowRight className="size-4" aria-hidden/></Link>
          </div>
          {related.length ? <div className="grid gap-3 md:grid-cols-3">
            {related.map((item: any) => <Link key={item._id || item.slug} href={'/resources/' + item.slug} className="group grid min-h-[140px] grid-cols-[38%_1fr] overflow-hidden rounded-xl border border-[#e1e8f2] bg-white transition hover:-translate-y-0.5 hover:border-[#a8cafa] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1677ee]">
              <div className="relative min-h-[140px] bg-[#f1f5fb]"><SmartImage src={safeImage(item.image)} alt={item.title || ''} sizes="(min-width: 768px) 160px, 40vw" className="object-cover"/></div>
              <span className="flex min-w-0 flex-col p-3">
                <span className="w-fit rounded-full border border-[#dce9fa] bg-[#f8fbff] px-2 py-0.5 text-[8px] font-semibold text-[#1678ed]">REPORT</span>
                <strong className="mt-2 line-clamp-2 text-[11px] leading-4 text-[#17284d] group-hover:text-[#0863f7]">{item.title}</strong>
                <span className="mt-1 line-clamp-2 text-[9px] leading-4 text-[#69758d]">{item.summary}</span>
                <span className="mt-auto pt-2 text-[9px] font-semibold text-[#0863f7]">View report <ArrowUpRight className="inline size-3" aria-hidden/></span>
              </span>
            </Link>)}
          </div> : <p className="rounded-xl border border-dashed border-[#dce5f1] p-5 text-xs text-[#69758d]">Related reports will appear here as they are published.</p>}
        </section>

        <section className="relative isolate mb-7 grid overflow-hidden rounded-2xl border border-[#dce9ff] bg-[linear-gradient(110deg,#f3f7ff,#f9fbff)] p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-5 sm:p-7">
          <div className="flex size-16 items-center justify-center rounded-full border border-[#84b5ff] bg-white text-[#0863f7] sm:size-20"><Users className="size-9" aria-hidden/></div>
          <div className="relative z-10 mt-4 sm:mt-0"><h2 className="max-w-xl text-xl font-semibold leading-tight tracking-tight text-[#142449]">{d.bottomCtaTitle || 'Turn mobility insights into an operating plan'}</h2><p className="mt-2 max-w-xl text-xs leading-relaxed text-[#64718a]">{d.bottomCtaBody || 'Let our mobility experts help you design, implement and operate programmes that are safe, reliable and people-centric.'}</p></div>
          <Link href={ctaHref} className="relative z-10 mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-[#0863f7] px-5 py-3 text-[11px] font-semibold text-white transition hover:bg-[#064fca] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1677ee] focus-visible:ring-offset-2 sm:mt-0">{d.bottomCtaButtonLabel || 'Discuss your requirements'} <ArrowRight className="size-4" aria-hidden/></Link>
          <div className="pointer-events-none absolute -right-8 -bottom-20 size-64 rounded-full border-[24px] border-[#dce9ff]/65"/>
        </section>

        <nav aria-label="Resource navigation" className="flex items-center justify-between gap-4 pb-6">
          {d.previousResource ? <Link href={'/resources/' + d.previousResource.slug} className="inline-flex items-center gap-2 rounded-xl border border-[#e2eaf5] px-3 py-2 text-[10px] font-semibold text-[#405274] transition hover:border-[#9fc6ff] hover:text-[#0863f7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1677ee]"><ArrowLeft className="size-4"/><span><strong className="block">Previous resource</strong><span className="block max-w-40 truncate font-normal">{d.previousResource.title}</span></span></Link> : <span/>}
          <Link href="/resources" className="inline-flex items-center gap-2 rounded-xl border border-[#e2eaf5] px-3 py-2 text-[10px] font-semibold text-[#405274] transition hover:border-[#9fc6ff] hover:text-[#0863f7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1677ee]"><span className="text-right"><strong className="block">Back to Resource Centre</strong><span className="block font-normal">Browse all resources</span></span><ArrowRight className="size-4"/></Link>
          {d.nextResource ? <Link href={'/resources/' + d.nextResource.slug} className="hidden items-center gap-2 rounded-xl border border-[#e2eaf5] px-3 py-2 text-[10px] font-semibold text-[#405274] transition hover:border-[#9fc6ff] hover:text-[#0863f7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1677ee] md:inline-flex"><span><strong className="block">Next resource</strong><span className="block max-w-40 truncate font-normal">{d.nextResource.title}</span></span><ArrowRight className="size-4"/></Link> : null}
        </nav>
      </div>
    </article>
  )
}
