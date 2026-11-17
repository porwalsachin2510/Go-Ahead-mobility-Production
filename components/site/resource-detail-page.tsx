import Link from 'next/link'
import {
  ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Building2, CalendarDays, ChartNoAxesCombined,
  ClipboardList, FileCheck2, FileText, Handshake, Lightbulb, Route, Settings, ShieldCheck, Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Parallax } from '@/components/motion/gsap-effects'
import { Reveal } from '@/components/motion/reveal'
import { Breadcrumbs } from '@/components/site/breadcrumbs'
import { Markdown, SmartImage, formatDate } from '@/components/site/primitives'
import { ResourcePreviewCarousel, type ResourcePreviewSlide } from '@/components/site/resource-preview-carousel'
import { ResourceReportDetailPage } from '@/components/site/resource-report-detail'
import { ResourceWebinarDetailPage } from '@/components/site/resource-webinar-detail'

type ResourceDetailProps = { resource: Record<string, any> }

const iconMap: Record<string, LucideIcon> = {
  users: Users, 'building-2': Building2, handshake: Handshake, settings: Settings, route: Route,
  'shield-check': ShieldCheck, 'chart-no-axes-combined': ChartNoAxesCombined, clipboard: ClipboardList,
  'clipboard-list': ClipboardList, 'file-check': FileCheck2, 'file-text': FileText, 'book-open': BookOpen,
  'calendar-days': CalendarDays, lightbulb: Lightbulb,
}
const Icon = ({ name, className = 'size-5' }: { name?: string; className?: string }) => {
  const Component = iconMap[name || ''] || FileCheck2
  return <Component className={className} aria-hidden />
}
const fallbackAudiences = [
  { icon: 'users', title: 'HR & Transport Managers', body: 'Teams responsible for employee mobility programmes and commuter experience.' },
  { icon: 'settings', title: 'Operations & Admin Teams', body: 'People coordinating daily services, schedules and on-ground delivery.' },
  { icon: 'handshake', title: 'Procurement & Vendor Managers', body: 'Teams assessing suppliers, service levels and commercial terms.' },
  { icon: 'building-2', title: 'Workplace & Facility Leaders', body: 'Leaders aligning workplace access, facilities and employee journeys.' },
]
const fallbackLearning = [
  { title: 'Map operating context & shift windows', body: 'Understand people movement patterns, shift timings, locations and peak demand across sites.' },
  { title: 'Structure pickup, drop & route requirements', body: 'Define catchment areas, service levels, routes, stops and service coverage.' },
  { title: 'Coordinate fleet, drivers & vendors', body: 'Align vehicle types, capacities, driver expectations, SLAs and vendor governance.' },
  { title: 'Define safety, communication & reporting', body: 'Establish safety standards, communication plans and reporting metrics for continuous improvement.' },
]
const fallbackContents = [
  { icon: 'clipboard-list', title: 'Define the operating brief', body: 'Capture objectives, policies, sites, shifts and service expectations.' },
  { icon: 'users', title: 'Map people, shifts and locations', body: 'Assess demand, employee distribution and commute patterns.' },
  { icon: 'route', title: 'Plan routes and service coverage', body: 'Design routes, stops, schedules and service levels.' },
  { icon: 'settings', title: 'Align fleet and vendor responsibilities', body: 'Set vehicle standards, capacity plans, SLAs and contract terms.' },
  { icon: 'shield-check', title: 'Establish safety and escalation processes', body: 'Safety protocols, emergency response and compliance checks.' },
  { icon: 'chart-no-axes-combined', title: 'Review performance and improve', body: 'Measure KPIs, review feedback and drive continuous improvement.' },
]
const typeLabel = (value?: string) => {
  const labels: Record<string, string> = { whitepaper: 'White Paper', guide: 'Guide & Playbook', checklist: 'Checklist', case_study: 'Case Study', webinar: 'Webinar', template: 'Template', article: 'Insight', tool: 'Report', event: 'Event' }
  return labels[value || ''] || 'Resource'
}
const safeImage = (value?: string) => typeof value === 'string' && value.trim() ? value : '/images/site/planning.png'

export function ResourceDetailPage({ resource: d }: ResourceDetailProps) {
  if (d.resourceType === 'webinar') return <ResourceWebinarDetailPage resource={d} />
  const reportTerms = [d.category, ...(Array.isArray(d.tags) ? d.tags : [])].filter(Boolean).join(' ').toLowerCase()
  const isReport = ['tool', 'article'].includes(d.resourceType) || /report|insight/.test(reportTerms)
  if (isReport) return <ResourceReportDetailPage resource={d} />
  const resourceTerms = [d.resourceType, d.category, ...(Array.isArray(d.tags) ? d.tags : [])].filter(Boolean).join(' ').toLowerCase()
  const normalizedResourceTerms = resourceTerms.split(' ').join('').split('-').join('').split('_').join('')
  const isWhitePaper = normalizedResourceTerms.includes('whitepaper')
  const isTemplate = !isWhitePaper && normalizedResourceTerms.includes('template')
  const isGuide = !isWhitePaper && !isTemplate && ['guide', 'checklist'].includes(d.resourceType)
  const transportContext = [d.title, d.summary, d.category, ...(Array.isArray(d.tags) ? d.tags : [])].filter(Boolean).join(' ').toLowerCase()
  const hasEmployeeMobilityContext = /(transport|shuttle|commute|employee mobility)/.test(transportContext)
  const hasTransportPlaybookDefaults = isGuide && hasEmployeeMobilityContext
  const hasTemplateAudienceDefaults = isTemplate && hasEmployeeMobilityContext
  const audiences = Array.isArray(d.audiences) && d.audiences.length ? d.audiences : hasTransportPlaybookDefaults || hasTemplateAudienceDefaults ? fallbackAudiences : []
  const learning = Array.isArray(d.learningOutcomes) && d.learningOutcomes.length ? d.learningOutcomes : hasTransportPlaybookDefaults ? fallbackLearning : []
  const contents = Array.isArray(d.playbookSections) && d.playbookSections.length ? d.playbookSections : hasTransportPlaybookDefaults ? fallbackContents : []
  const keyQuestions = Array.isArray(d.keyQuestions) ? d.keyQuestions.filter((item: any) => item?.question) : []
  const paperContents = Array.isArray(d.paperSections) ? d.paperSections.filter((item: any) => item?.title) : []
  const templateFiles = Array.isArray(d.templateFiles) ? d.templateFiles.filter((item: any) => item?.title) : []
  const templateSteps = Array.isArray(d.templateSteps) ? d.templateSteps.filter((item: any) => item?.title) : []
  const slides: ResourcePreviewSlide[] = Array.isArray(d.previewImages) && d.previewImages.length
    ? d.previewImages.filter((item: any) => item?.image).map((item: any) => ({ image: item.image, alt: item.alt || d.title, caption: item.caption || '' }))
    : [{ image: safeImage(d.image), alt: `${d.title} preview`, caption: 'Resource cover' }]
  const tags = Array.isArray(d.tags) ? d.tags.filter(Boolean).slice(0, 4) : []
  const related = Array.isArray(d.relatedResources) ? d.relatedResources : []
  const downloadHref = `/api/v1/resources/${encodeURIComponent(d.slug)}/download`
  const canDownload = Boolean(d.fileMediaId || (typeof d.externalUrl === 'string' && /^https:\/\//i.test(d.externalUrl)))
  const accessHref = d.gated
    ? `/contact?topic=resource&resource=${encodeURIComponent(d.slug)}`
    : canDownload ? downloadHref : `/contact?topic=resource&resource=${encodeURIComponent(d.slug)}`
  const format = d.fileFormat ? String(d.fileFormat).toUpperCase() : isTemplate ? 'Managed in resource details' : typeLabel(d.resourceType)
  const detailItems = isTemplate
    ? [
        { icon: FileText, title: 'File format', value: format },
        { icon: FileCheck2, title: 'File size', value: d.fileSizeLabel || 'Managed in resource details' },
        { icon: ClipboardList, title: 'Included files', value: templateFiles.length ? `${templateFiles.length} files` : 'Managed in resource details' },
        { icon: BookOpen, title: 'Version', value: d.version ? `v${d.version}` : 'CMS managed' },
        { icon: CalendarDays, title: 'Published / updated', value: formatDate(d.publishedAt || d.updatedAt) || 'CMS managed' },
        { icon: ShieldCheck, title: 'Access', value: d.gated ? 'Registration required' : 'Direct download (if enabled)' },
      ]
    : [
        { icon: FileText, title: 'Format', value: format },
        { icon: FileCheck2, title: 'File size', value: d.fileSizeLabel || (d.fileMediaId ? 'Provided with uploaded file' : 'Managed in resource details') },
        { icon: ChartNoAxesCombined, title: 'Page count', value: d.pageCount ? `${d.pageCount} pages` : 'Managed in resource details' },
        { icon: BookOpen, title: 'Version', value: d.version ? `v${d.version}` : 'CMS managed' },
        ...(isWhitePaper
          ? [
              { icon: CalendarDays, title: 'Published', value: formatDate(d.publishedAt) || 'CMS managed' },
              { icon: CalendarDays, title: 'Updated', value: formatDate(d.updatedAt) || 'CMS managed' },
            ]
          : [{ icon: CalendarDays, title: 'Published / updated', value: formatDate(d.updatedAt || d.publishedAt) || 'CMS managed' }]),
      ]
  const resourceDetailItems = isTemplate
    ? [
        { icon: FileText, title: 'File format', value: format },
        { icon: FileCheck2, title: 'File size', value: d.fileSizeLabel || 'Managed in resource details' },
        { icon: ChartNoAxesCombined, title: 'Number of files / pages', value: templateFiles.length ? `${templateFiles.length} files` : d.pageCount ? `${d.pageCount} pages` : 'Managed in resource details' },
        { icon: BookOpen, title: 'Version', value: d.version ? `v${d.version}` : 'CMS managed' },
        { icon: CalendarDays, title: 'Published', value: formatDate(d.publishedAt) || 'CMS managed' },
        { icon: CalendarDays, title: 'Updated', value: formatDate(d.updatedAt) || 'CMS managed' },
      ]
    : detailItems
  const categoryName = isWhitePaper ? 'White Papers' : isTemplate ? 'Templates' : isGuide ? 'Guides & Playbooks' : (d.category || typeLabel(d.resourceType))
  const trail = [
    { name: 'Home', path: '/' },
    { name: 'Resources', path: '/resources' },
    { name: categoryName, path: '/resources' },
    { name: d.title, path: `/resources/${d.slug}` },
  ]
  const ctaHref = typeof d.bottomCtaButtonHref === 'string' && d.bottomCtaButtonHref ? d.bottomCtaButtonHref : '/contact?topic=resource'
  const navItems = isTemplate
    ? [[d.overviewTabLabel || 'Overview', '#about-guide', 'users'], [d.audienceTabLabel || "Who's it for", '#who-its-for', 'users'], [d.templateTabLabel || 'Templates Included', '#templates-included', 'clipboard-list'], [d.previewTabLabel || 'Preview', '#preview-guide', 'file-text'], [d.detailsTabLabel || 'Resource Details', '#resource-details', 'calendar-days']]
    : isWhitePaper
      ? [[d.overviewTabLabel || 'Overview', '#about-guide', 'users'], [d.questionsTabLabel || 'Key Questions', '#key-questions', 'lightbulb'], [d.contentsTabLabel || 'Inside the Paper', '#inside-paper', 'clipboard-list'], [d.previewTabLabel || 'Preview', '#preview-guide', 'file-text'], [d.detailsTabLabel || 'Resource Details', '#resource-details', 'calendar-days']]
      : [[d.overviewTabLabel || 'About', '#about-guide', 'users'], [d.audienceHeading || "Who it's for", '#who-its-for', 'users'], [d.learningHeading || "What you'll learn", '#what-youll-learn', 'lightbulb'], [d.contentsHeading || "What's inside", '#inside-playbook', 'clipboard-list'], [d.previewTabLabel || 'Preview', '#preview-guide', 'file-text'], [d.detailsTabLabel || 'Details', '#resource-details', 'calendar-days']]

  return (
    <article data-page="resource-detail" className="overflow-hidden bg-white text-[#101d42]">
      <section className="relative border-b border-[#e8edf5] bg-[linear-gradient(135deg,#f8fbff_0%,#ffffff_62%,#f3f8ff_100%)]">
        <div className="mx-auto max-w-[1240px] px-5 pb-10 pt-6 sm:px-7 lg:px-10 lg:pb-14">
          <Breadcrumbs trail={trail} />
          <div className="mt-7 grid items-center gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(220px,.78fr)_minmax(250px,.62fr)] lg:gap-10">
            <div className="max-w-[560px]">
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#167be7]">{d.eyebrow || (isWhitePaper ? 'WHITE PAPER' : isTemplate ? 'TEMPLATE PACK' : typeLabel(d.resourceType).toUpperCase())}</p>
              <h1 className="mt-3 text-balance text-[clamp(2rem,4.1vw,3.15rem)] font-semibold leading-[1.08] tracking-[-.045em] text-[#101d42]">{d.title}</h1>
              {d.summary ? <p className="mt-4 max-w-[520px] text-sm leading-7 text-[#4c5872] sm:text-[15px]">{d.summary}</p> : null}
              {tags.length ? <div className="mt-6 flex flex-wrap gap-2">{tags.map((tag: string) => <span key={tag} className="inline-flex items-center gap-2 rounded-lg border border-[#e0e8f4] bg-white/85 px-3 py-2 text-[10px] font-medium text-[#25365c] shadow-[0_1px_3px_rgba(13,34,72,.04)]"><span className="size-2 rounded-full bg-[#1682f6]" />{tag}</span>)}</div> : null}
              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-[#74809a]">
                <span>{typeLabel(d.resourceType)}</span>
                {d.publishedAt ? <span>Published {formatDate(d.publishedAt)}</span> : null}
                {d.downloadCount ? <span>{Number(d.downloadCount).toLocaleString('en-IN')} downloads</span> : null}
              </div>
            </div>

            {isTemplate ? (
              <Parallax amount={1.5} className="mx-auto w-full max-w-[350px]">
                <div className="relative aspect-[1.12] w-full">
                  {slides.slice(0, 3).map((slide, index) => (
                    <div key={slide.image + index} className="absolute overflow-hidden rounded-sm border border-[#d9e0eb] bg-white shadow-[0_15px_32px_rgba(19,44,84,.16)]" style={{ left: `${index * 20}%`, top: `${index === 1 ? 1 : index === 2 ? 14 : 8}%`, width: '62%', height: '84%', zIndex: index + 1, transform: `rotate(${index === 0 ? -3 : index === 1 ? 2 : -1}deg)` }}>
                      <SmartImage src={slide.image} alt={slide.alt || d.title} sizes="(min-width: 1024px) 220px, 55vw" className="object-contain p-1.5" />
                    </div>
                  ))}
                </div>
              </Parallax>
            ) : (
              <Parallax amount={2} className="mx-auto w-full max-w-[290px]">
                <div className="relative [perspective:1100px]">
                  <div className="absolute -right-3 inset-y-2 w-4 rounded-r-md border border-[#cbd4e1] bg-[#dce2eb] shadow-md" />
                  <div className="relative aspect-[3/4] overflow-hidden rounded-sm border border-[#d9e0eb] bg-white shadow-[0_24px_55px_rgba(19,44,84,.20)] [transform:rotateY(-7deg)]">
                    <div className="absolute inset-x-0 top-0 z-10 h-[52%] bg-[linear-gradient(180deg,rgba(255,255,255,.99),rgba(255,255,255,.9)_78%,rgba(255,255,255,0))] p-5 sm:p-6">
                      <p className="text-[9px] font-bold tracking-tight text-[#12264c]">GoAhead<span className="text-[#0a8ef5]">»</span></p>
                      <h2 className="mt-5 max-w-[190px] text-[clamp(1rem,1.8vw,1.25rem)] font-semibold leading-tight tracking-tight text-[#122044]">{d.title}</h2>
                      <p className="mt-2 line-clamp-3 max-w-[190px] text-[9px] leading-relaxed text-[#52617b]">{d.summary || 'A practical guide from GoAhead Mobility.'}</p>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 h-[58%]">
                      <SmartImage src={safeImage(d.image)} alt={d.title} sizes="(min-width: 1024px) 290px, 70vw" priority className="object-cover object-center" />
                    </div>
                    <div className="absolute inset-x-0 bottom-0 z-10 h-3 bg-[#117be5]/85" />
                  </div>
                </div>
              </Parallax>
            )}

            <aside className="rounded-2xl border border-[#e1e8f2] bg-white p-5 shadow-[0_12px_35px_rgba(21,48,89,.08)] sm:p-6">
              <h2 className="text-lg font-semibold tracking-tight text-[#142449]">{d.downloadPanelTitle || (isTemplate ? 'Get the template pack' : isWhitePaper ? 'Access the white paper' : isGuide ? 'Get the playbook' : 'Get this resource')}</h2>
              <p className="mt-1.5 text-xs leading-relaxed text-[#69758d]">{d.downloadPanelBody || (isTemplate ? 'Download the complete pack of editable templates and start using them today.' : isWhitePaper ? 'Download the full white paper to explore the framework and detailed considerations.' : canDownload ? 'Download the complete resource and keep it handy for your team.' : 'Contact our team to request this resource.')}</p>
              <Link href={accessHref} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0863f7] px-4 py-3 text-xs font-semibold text-white shadow-sm transition hover:bg-[#064fca] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1677ee] focus-visible:ring-offset-2">
                {d.gated ? 'Request access' : canDownload ? (d.downloadButtonLabel || (isTemplate ? 'Download Template Pack' : isWhitePaper && format === 'PDF' ? 'Download PDF' : isWhitePaper ? 'Download white paper' : isGuide ? 'Download guide' : 'Download resource')) : 'Request this resource'}
                {d.gated || !canDownload ? <ArrowUpRight className="size-4" aria-hidden /> : <ArrowRight className="size-4" aria-hidden />}
              </Link>
              <div className="mt-5 space-y-3 border-t border-[#edf0f5] pt-4">
                {detailItems.map((item) => <div key={item.title} className="flex items-center gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#f2f7ff] text-[#1678ec]"><item.icon className="size-4" aria-hidden /></span><span className="min-w-0"><strong className="block text-[10px] font-semibold text-[#27375d]">{item.title}</strong><span className="mt-0.5 block text-[10px] text-[#69758d]">{item.value}</span></span></div>)}
              </div>
              {d.downloadPanelNote || d.gated ? <p className="mt-4 border-t border-[#edf0f5] pt-3 text-[10px] leading-relaxed text-[#71809b]">{d.downloadPanelNote || (isTemplate ? 'Details reflect the approved uploaded asset in resource details.' : 'Access is reviewed by our team. We will confirm the next steps for this resource.')}</p> : null}
            </aside>
          </div>
        </div>
      </section>

      <nav aria-label="Resource sections" className="sticky top-0 z-30 border-b border-[#e5eaf2] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1240px] gap-6 overflow-x-auto px-5 sm:px-7 lg:gap-10 lg:px-10">
          {navItems.map(([label, href, icon], index) => <a key={href} href={href} className={`relative flex shrink-0 items-center gap-2 py-4 text-[10px] font-semibold transition-colors hover:text-[#0863f7] focus-visible:outline-none focus-visible:text-[#0863f7] ${index === 0 ? 'text-[#0863f7]' : 'text-[#66738f]'}`}><span className="flex size-6 items-center justify-center rounded-md bg-[#f1f6ff] text-[#1678ec]"><Icon name={icon} className="size-3.5" /></span>{label}{index === 0 ? <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#0863f7]" /> : null}</a>)}
        </div>
      </nav>

      <div className="mx-auto max-w-[1240px] px-5 pb-8 sm:px-7 lg:px-10">
        <section id="about-guide" className={`grid scroll-mt-24 gap-8 border-b border-[#e8edf4] py-9 ${audiences.length ? 'lg:grid-cols-[.85fr_1.15fr]' : ''} lg:gap-10 lg:py-10`}>
          <Reveal>
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#167be7]">{d.aboutEyebrow || (isTemplate ? 'About this template pack' : isWhitePaper ? 'About this white paper' : 'About this resource')}</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#142449]">{d.aboutHeading || (isTemplate ? 'About this template pack' : isWhitePaper ? 'About this white paper' : 'About this guide')}</h2>
            {d.body ? <div className="mt-4 text-[12px] leading-6 text-[#5e6a83]"><Markdown>{d.body}</Markdown></div> : <p className="mt-4 text-[12px] leading-6 text-[#5e6a83]">{d.summary || 'A practical resource to help teams plan and manage employee transportation.'}</p>}
          </Reveal>
          {audiences.length ? <Reveal id="who-its-for">
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#167be7]">{d.audienceEyebrow || 'For your team'}</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#142449]">{d.audienceHeading || (isWhitePaper ? 'Who should read it' : "Who should use it")}</h2>
            <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
              {audiences.map((item: any, index: number) => <div key={item.title || index} className="flex flex-col items-center border-l border-[#e9eef5] px-2 text-center first:border-0">
                <span className="flex size-11 items-center justify-center text-[#1678f2]"><Icon name={item.icon} className="size-7" /></span>
                <strong className="mt-2 text-[10px] leading-4 text-[#17284d]">{item.title}</strong>
                {item.body ? <span className="mt-1 text-[9px] leading-4 text-[#6c7890]">{item.body}</span> : null}
              </div>)}
            </div>
          </Reveal> : null}
        </section>

        {isTemplate ? <section className="grid gap-4 py-8 lg:grid-cols-[1.06fr_.94fr] lg:py-9">
          <Reveal id="templates-included" className="scroll-mt-24 rounded-2xl border border-[#e8edf5] bg-white p-4 shadow-[0_5px_20px_rgba(20,43,80,.035)] sm:p-5">
            {d.templatesEyebrow ? <p className="mb-1 text-[9px] font-bold uppercase tracking-[.16em] text-[#167be7]">{d.templatesEyebrow}</p> : null}
            <h2 className="text-lg font-semibold tracking-tight text-[#142449]">{d.templatesHeading || "What's included in this pack"}</h2>
            {templateFiles.length ? <ul className="mt-4 space-y-1.5">
              {templateFiles.map((file: any, index: number) => {
                const fileFormat = String(file.format || 'File').trim()
                const normalizedFormat = fileFormat.toUpperCase()
                const isPdf = normalizedFormat.includes('PDF')
                const isSpreadsheet = /XLS|EXCEL|CSV/.test(normalizedFormat)
                return <li key={file.title || index} className="flex items-center gap-3 rounded-lg border border-[#e7edf5] bg-white px-3 py-2.5">
                  <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${isPdf ? 'bg-red-50 text-red-500' : isSpreadsheet ? 'bg-emerald-50 text-emerald-600' : 'bg-[#f0f6ff] text-[#1678ed]'}`}><FileText className="size-4" aria-hidden /></span>
                  <span className="min-w-0 flex-1"><strong className="block text-[10px] leading-4 text-[#192a50]">{file.title}</strong>{file.body ? <span className="mt-0.5 block text-[9px] leading-4 text-[#69758c]">{file.body}</span> : null}</span>
                  <span className="shrink-0 rounded-md border border-[#e2eaf5] bg-[#fbfdff] px-2 py-1 text-[9px] font-medium text-[#415274]">{fileFormat}</span>
                </li>
              })}
            </ul> : <p className="mt-4 rounded-lg border border-dashed border-[#dce5f1] p-4 text-xs text-[#6b7891]">Included template files will appear here when added in the resource editor.</p>}
            <p className="mt-3 rounded-lg bg-[#f4f7fc] px-3 py-2.5 text-[9px] leading-4 text-[#62708a]">{d.templateNote || 'File contents, formats and names are managed in resource details and reflect the approved uploaded asset. The above is an example structure.'}</p>
          </Reveal>
          <Reveal id="how-to-use" className="scroll-mt-24 rounded-2xl border border-[#e8edf5] bg-white p-4 shadow-[0_5px_20px_rgba(20,43,80,.035)] sm:p-5">
            {d.usageEyebrow ? <p className="mb-1 text-[9px] font-bold uppercase tracking-[.16em] text-[#167be7]">{d.usageEyebrow}</p> : null}
            <h2 className="text-lg font-semibold tracking-tight text-[#142449]">{d.usageHeading || 'How to use this pack'}</h2>
            {templateSteps.length ? <ol className="mt-4 space-y-4">
              {templateSteps.map((step: any, index: number) => <li key={step.title || index} className="flex gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[#cfe0fa] text-[11px] font-semibold text-[#0863f7]">{index + 1}</span>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#dce9ff] bg-white text-[#1678ed]"><Icon name={step.icon || 'clipboard-list'} className="size-5" /></span>
                <span className="min-w-0 pt-0.5"><strong className="block text-[10px] leading-4 text-[#192a50]">{step.title}</strong>{step.body ? <span className="mt-1 block text-[9px] leading-4 text-[#69758c]">{step.body}</span> : null}</span>
              </li>)}
            </ol> : <p className="mt-4 rounded-lg border border-dashed border-[#dce5f1] p-4 text-xs text-[#6b7891]">Usage steps will appear here when added in the resource editor.</p>}
          </Reveal>
        </section> : null}

        {isWhitePaper ? <section className="grid gap-4 py-8 lg:grid-cols-[.82fr_1.18fr] lg:py-9">
          <Reveal id="key-questions" className="rounded-2xl border border-[#edf1f6] bg-white p-5 shadow-[0_5px_20px_rgba(20,43,80,.035)] sm:p-6">
            {d.questionsEyebrow ? <p className="mb-1 text-[9px] font-bold uppercase tracking-[.16em] text-[#167be7]">{d.questionsEyebrow}</p> : null}
            <h2 className="text-lg font-semibold tracking-tight text-[#142449]">{d.questionsHeading || 'Key questions explored'}</h2>
            {keyQuestions.length ? <ol className="mt-4 divide-y divide-[#e7edf5]">
              {keyQuestions.map((item: any, index: number) => <li key={item.question || index} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[#cfe0fa] text-[11px] font-semibold text-[#0863f7]">{String(index + 1).padStart(2, '0')}</span>
                <span className="pt-1 text-[11px] leading-5 text-[#25365b]">{item.question}</span>
              </li>)}
            </ol> : <p className="mt-4 rounded-lg border border-dashed border-[#dce5f1] p-4 text-xs text-[#6b7891]">Key questions will appear here when added in the resource editor.</p>}
          </Reveal>
          <Reveal id="inside-paper" className="rounded-2xl border border-[#edf1f6] bg-white p-5 shadow-[0_5px_20px_rgba(20,43,80,.035)] sm:p-6">
            {d.paperContentsEyebrow ? <p className="mb-1 text-[9px] font-bold uppercase tracking-[.16em] text-[#167be7]">{d.paperContentsEyebrow}</p> : null}
            <h2 className="text-lg font-semibold tracking-tight text-[#142449]">{d.paperContentsHeading || 'Inside the paper'}</h2>
            {paperContents.length ? <ol className="mt-4 divide-y divide-[#e7edf5] border-t border-[#e7edf5]">
              {paperContents.map((item: any, index: number) => <li key={item.title || index} className="flex items-center gap-3 py-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-[#e0e9f7] text-[11px] font-semibold text-[#0863f7]">{String(index + 1).padStart(2, '0')}</span>
                <span className="min-w-0 flex-1"><strong className="block text-[10px] leading-4 text-[#17284d]">{item.title}</strong>{item.body ? <span className="mt-0.5 block text-[9px] leading-4 text-[#69758c]">{item.body}</span> : null}</span>
                <ArrowRight className="size-4 shrink-0 text-[#1678ed]" aria-hidden />
              </li>)}
            </ol> : <p className="mt-4 rounded-lg border border-dashed border-[#dce5f1] p-4 text-xs text-[#6b7891]">Paper sections will appear here when added in the resource editor.</p>}
          </Reveal>
        </section> : null}

        {(learning.length || contents.length) ? <section className={`grid gap-5 py-8 lg:py-9 ${learning.length && contents.length ? 'lg:grid-cols-[.78fr_1.22fr]' : 'lg:grid-cols-1'}`}>
          {learning.length ? <Reveal id="what-youll-learn" className="rounded-2xl border border-[#edf1f6] bg-white p-5 shadow-[0_5px_20px_rgba(20,43,80,.035)] sm:p-6">
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#167be7]">Key outcomes</p>
            <h2 className="mt-2 text-lg font-semibold tracking-tight text-[#142449]">{d.learningHeading || "What you'll learn"}</h2>
            <span className="mt-3 block h-0.5 w-7 bg-[#1678f2]" />
            <ol className="mt-4 space-y-4">
              {learning.map((item: any, index: number) => <li key={item.title || index} className="flex gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[#cfe0fa] text-[11px] font-semibold text-[#0863f7]">{String(index + 1).padStart(2, '0')}</span>
                <span><strong className="block text-[10px] leading-4 text-[#192a50]">{item.title}</strong>{item.body ? <span className="mt-1 block text-[9px] leading-4 text-[#66728a]">{item.body}</span> : null}</span>
              </li>)}
            </ol>
          </Reveal> : null}
          {contents.length ? <Reveal id="inside-playbook" className="rounded-2xl border border-[#edf1f6] bg-white p-5 shadow-[0_5px_20px_rgba(20,43,80,.035)] sm:p-6">
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#167be7]">A practical framework</p>
            <h2 className="mt-2 text-lg font-semibold tracking-tight text-[#142449]">{d.contentsHeading || 'Inside the playbook'}</h2>
            <ol className="mt-4 overflow-hidden rounded-xl border border-[#e3eaf4]">
              {contents.map((item: any, index: number) => <li key={item.title || index} className="flex items-center gap-3 border-b border-[#e9eef5] px-3 py-3 last:border-0">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-[#e0e9f7] text-[11px] font-semibold text-[#0863f7]">{String(index + 1).padStart(2, '0')}</span>
                <span className="min-w-0 flex-1"><strong className="block text-[10px] leading-4 text-[#17284d]">{item.title}</strong>{item.body ? <span className="mt-0.5 block text-[9px] leading-4 text-[#69758c]">{item.body}</span> : null}</span>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#f2f7ff] text-[#1678ed]"><Icon name={item.icon} className="size-4" /></span>
              </li>)}
            </ol>
          </Reveal> : null}
        </section> : null}

        <Reveal id="preview-guide" className="scroll-mt-24 rounded-2xl border border-[#e9eef5] bg-white p-5 shadow-[0_6px_24px_rgba(20,43,80,.035)] sm:p-6">
          {d.previewEyebrow ? <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#167be7]">{d.previewEyebrow}</p> : null}
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#142449]">{d.previewHeading || (isTemplate ? 'Preview of templates' : isWhitePaper ? 'Preview the paper' : isGuide ? 'Preview the guide' : 'Preview the resource')}</h2>
          <div className="mt-5"><ResourcePreviewCarousel slides={slides} title={d.previewHeading || (isTemplate ? 'Preview of templates' : isWhitePaper ? 'Preview the white paper' : isGuide ? 'Preview the guide' : 'Preview the resource')} variant={isTemplate ? 'template' : isWhitePaper ? 'gallery' : 'showcase'} /></div>
          <p className="mt-4 text-[11px] leading-relaxed text-[#68748c]">{d.previewDescription || (isTemplate ? 'Preview the editable worksheets and forms included in this pack. The download contains the full template files.' : isWhitePaper ? 'This is a preview. The downloaded paper includes the full content, frameworks and reference materials.' : 'This is a preview. The downloadable resource includes the complete content, checklists and templates.')}</p>
        </Reveal>

        <section id="resource-details" className="scroll-mt-24 py-8">
          <div className="rounded-2xl border border-[#e8eef6] bg-white p-5 shadow-[0_6px_22px_rgba(20,43,80,.035)] sm:p-6">
            <h2 className="text-lg font-semibold tracking-tight text-[#142449]">{d.detailsHeading || 'Resource details'}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
              {resourceDetailItems.map((item) => <div key={item.title} className="flex items-center gap-3 rounded-xl border border-[#e7edf6] bg-[#fbfdff] p-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#d8e7ff] bg-white text-[#1678ef]"><item.icon className="size-5" aria-hidden /></span>
                <span className="min-w-0"><strong className="block text-[10px] font-semibold text-[#24365b]">{item.title}</strong><span className="mt-1 block text-[10px] leading-4 text-[#64718a]">{item.value}</span></span>
              </div>)}
            </div>
            {d.updateNotes ? <p className="mt-3 text-[10px] leading-relaxed text-[#74809a]">{d.updateNotes}</p> : null}
            {d.detailsNote ? <p className="mt-2 text-[10px] leading-relaxed text-[#74809a]">{d.detailsNote}</p> : null}
          </div>
        </section>

        <section className="pb-8">
          <div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#167be7]">{d.relatedEyebrow || 'Keep exploring'}</p><h2 className="mt-1 text-xl font-semibold tracking-tight text-[#142449]">{d.relatedHeading || (isTemplate ? 'Related templates and resources' : isWhitePaper ? 'Related white papers and resources' : isGuide ? 'More guides & playbooks' : 'Related resources')}</h2></div><Link href="/resources" className="hidden items-center gap-1 text-xs font-semibold text-[#0863f7] sm:inline-flex">All resources <ArrowRight className="size-4" /></Link></div>
          {related.length ? <div className="grid gap-3 md:grid-cols-3">
            {related.map((item: any) => <Link key={item._id || item.slug} href={`/resources/${item.slug}`} className="group grid min-h-[140px] grid-cols-[38%_1fr] overflow-hidden rounded-xl border border-[#e1e8f2] bg-white transition hover:-translate-y-0.5 hover:border-[#a8cafa] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1677ee]">
              <div className="relative min-h-[140px] bg-[#f1f5fb]"><SmartImage src={safeImage(item.image)} alt={item.title || ''} sizes="(min-width: 768px) 160px, 40vw" className="object-cover" /></div>
              <span className="flex min-w-0 flex-col p-3">
                <span className="w-fit rounded-full border border-[#dce9fa] bg-[#f8fbff] px-2 py-0.5 text-[8px] font-semibold text-[#1678ed]">{typeLabel(item.resourceType)}</span>
                <strong className="mt-2 line-clamp-2 text-[11px] leading-4 text-[#17284d] group-hover:text-[#0863f7]">{item.title}</strong>
                <span className="mt-1 line-clamp-2 text-[9px] leading-4 text-[#69758d]">{item.summary}</span>
                <span className="mt-auto pt-2 text-[9px] font-semibold text-[#0863f7]">{isTemplate ? 'View template' : isWhitePaper ? 'View resource' : isGuide ? 'View guide' : 'View resource'} <ArrowUpRight className="inline size-3" /></span>
              </span>
            </Link>)}
          </div> : <p className="rounded-xl border border-dashed border-[#dce5f1] p-5 text-xs text-[#69758d]">More resources will appear here as they are published.</p>}
        </section>

        <section className={`relative isolate mb-8 grid overflow-hidden rounded-2xl border p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-5 sm:p-7 ${isTemplate ? 'border-[#173c70] bg-[#061b43] text-white' : 'border-[#dce9ff] bg-[linear-gradient(110deg,#f3f7ff,#f9fbff)]'}`}>
          <div className={`flex size-16 items-center justify-center rounded-full border bg-white sm:size-20 ${isTemplate ? 'border-white/50 text-[#0863f7]' : 'border-[#84b5ff] text-[#0863f7]'}`}><Users className="size-9" aria-hidden /></div>
          <div className="relative z-10 mt-4 sm:mt-0"><h2 className={`max-w-xl text-xl font-semibold leading-tight tracking-tight ${isTemplate ? 'text-white' : 'text-[#142449]'}`}>{d.bottomCtaTitle || (isTemplate ? 'Building a more coordinated employee transport programme?' : hasEmployeeMobilityContext ? 'Planning an employee transport programme?' : 'Need help putting this resource into practice?')}</h2><p className={`mt-2 max-w-xl text-xs leading-relaxed ${isTemplate ? 'text-white/75' : 'text-[#64718a]'}`}>{d.bottomCtaBody || (isTemplate || hasEmployeeMobilityContext ? 'Our mobility experts can help you design, implement and operate a programme that is safe, reliable and people-centric.' : 'Talk with our mobility team about the right next step for your organisation.')}</p></div>
          <Link href={ctaHref} className="relative z-10 mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-[#0863f7] px-5 py-3 text-[11px] font-semibold text-white transition hover:bg-[#064fca] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1677ee] focus-visible:ring-offset-2 sm:mt-0">{d.bottomCtaButtonLabel || 'Discuss your requirements'} <ArrowRight className="size-4" aria-hidden /></Link>
          <div className={`pointer-events-none absolute -right-8 -bottom-20 size-64 rounded-full border-[24px] ${isTemplate ? 'border-white/10' : 'border-[#dce9ff]/65'}`} />
        </section>

        <nav aria-label="Resource navigation" className="flex items-center justify-between gap-4 pb-6">
          {d.previousResource ? <Link href={`/resources/${d.previousResource.slug}`} className="inline-flex items-center gap-2 rounded-xl border border-[#e2eaf5] px-3 py-2 text-[10px] font-semibold text-[#405274] transition hover:border-[#9fc6ff] hover:text-[#0863f7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1677ee]"><ArrowLeft className="size-4" /><span><strong className="block">{isWhitePaper || isTemplate ? 'Previous resource' : 'Previous Results'}</strong><span className="block max-w-40 truncate font-normal">{d.previousResource.title}</span></span></Link> : <span />}
          <Link href="/resources" className="inline-flex items-center gap-2 rounded-xl border border-[#e2eaf5] px-3 py-2 text-[10px] font-semibold text-[#405274] transition hover:border-[#9fc6ff] hover:text-[#0863f7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1677ee]"><span className="text-right"><strong className="block">Back to Resource Centre</strong><span className="block font-normal">View all resources</span></span><ArrowRight className="size-4" /></Link>
          {d.nextResource ? <Link href={`/resources/${d.nextResource.slug}`} className="hidden items-center gap-2 rounded-xl border border-[#e2eaf5] px-3 py-2 text-[10px] font-semibold text-[#405274] transition hover:border-[#9fc6ff] hover:text-[#0863f7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1677ee] md:inline-flex"><span><strong className="block">{isWhitePaper || isTemplate ? 'Next resource' : 'Next Result'}</strong><span className="block max-w-40 truncate font-normal">{d.nextResource.title}</span></span><ArrowRight className="size-4" /></Link> : null}
        </nav>
      </div>
    </article>
  )
}
