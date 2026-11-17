import 'server-only'
import { cache } from 'react'
import { connectDb } from '../db'
import { Navigation, Page, Redirect, SiteSettings } from '../models/content'
import { AboutPageContent, WhyChooseUsPageContent, Author, CareersPageContent, CaseStudiesPageContent, CaseStudy, Category, ContactPageContent, FaqPageContent, HomePageContent, Industry, Job, Post, PostSeries, Resource, ResourceCentrePageContent, Tag } from '../models/editorial'
import { archiveIndexable, MIN_INDEXABLE_ARCHIVE_POSTS } from './blog-archive'
import { NotFoundLog, RouteSeo, SeoAuditRun, SeoIssueState } from '../models/seo'
import { isPrivatePath, mergeSeoSettings, normalizePath, resolveCanonical } from '@/lib/seo/config'
import { articleSchema, jobPostingSchema, validateJsonLd, webPageSchema } from '@/lib/seo/jsonld'
import { resolveEffectiveSeo } from '@/lib/seo/metadata'
import { buildRobots } from '@/lib/seo/robots'
import { analyzeMarkdown, countWords, stripMarkdown } from '@/lib/seo/text'
import { healthScore, runAuditRules } from '@/lib/seo/audit-rules'
import type { Block } from '@/lib/blocks'
import type { AuditIssue, HeadingRef, ImageRef, InventoryEntry, LinkRef, RedirectRule, SeoSettings, TemplateKind } from '@/lib/seo/types'
import { isDedicatedPublicPath } from '@/lib/seo/route-ownership'

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
const iso = (v: unknown) => (v ? new Date(v as string | number | Date).toISOString() : null)
const idOf = (v: any) => String(v?._id ?? v)

export const getSeoSettings = cache(async () => {
  await connectDb()
  const raw = await SiteSettings.findOne({ key: 'site' }).lean<any>()
  return { site: mergeSeoSettings(raw), siteUrlConfigured: Boolean(raw?.siteUrl || process.env.NEXT_PUBLIC_SITE_URL), raw }
})

/* ------------------------------- Block analysis ------------------------------- */

type Dynamic = { industries: any[]; caseStudies: any[]; resources: any[]; posts: any[] }
type Analysis = { headings: HeadingRef[]; images: ImageRef[]; links: LinkRef[]; wordCount: number; summary: string }

function analyzeBlocks(blocks: Block[], dyn: Dynamic): Analysis {
  const out: Analysis = { headings: [], images: [], links: [], wordCount: 0, summary: '' }
  const words = (...texts: unknown[]) => {
    for (const t of texts) out.wordCount += countWords(stripMarkdown(str(t)))
  }
  const heading = (level: number, text: unknown) => {
    const t = str(text)
    if (t) {
      out.headings.push({ level, text: t })
      words(t)
    }
  }
  const link = (href: unknown, text: unknown) => {
    const h = str(href)
    if (h) out.links.push({ href: h, text: str(text) })
  }
  const image = (src: unknown, alt: unknown) => {
    const s = str(src)
    if (s) out.images.push({ src: s, alt: str(alt) })
  }
  const summarise = (t: unknown) => {
    if (!out.summary && str(t)) out.summary = str(t)
  }
  const markdown = (md: unknown) => {
    const a = analyzeMarkdown(str(md))
    out.headings.push(...a.headings)
    out.images.push(...a.images)
    out.links.push(...a.links)
    out.wordCount += a.wordCount
    summarise(a.wordCount ? stripMarkdown(str(md)) : '')
  }

  for (const block of blocks) {
    if (block.hidden) continue
    const d = (block.data ?? {}) as Record<string, any>
    const items: any[] = Array.isArray(d.items) ? d.items : []
    switch (block.type) {
      case 'hero':
        heading(1, d.title)
        words(d.eyebrow, d.subtitle)
        summarise(d.subtitle)
        image(d.image, d.imageAlt)
        link(d.primaryHref, d.primaryLabel)
        link(d.secondaryHref, d.secondaryLabel)
        for (const r of Array.isArray(d.routes) ? d.routes : []) {
          words(r.label, r.description)
          link(r.href, r.label)
        }
        break
      case 'richText':
        heading(2, d.heading)
        words(d.eyebrow, d.aside)
        markdown(d.body)
        break
      case 'imageText':
        heading(2, d.heading)
        words(d.eyebrow)
        markdown(d.body)
        image(d.image, d.imageAlt)
        link(d.ctaHref, d.ctaLabel)
        break
      case 'features':
      case 'serviceCards':
      case 'steps':
      case 'verticals':
        heading(2, d.heading)
        words(d.eyebrow, d.intro, d.note)
        summarise(d.intro)
        for (const it of items) {
          heading(3, it.title)
          words(it.body, it.eyebrow, ...(Array.isArray(it.points) ? it.points : []))
          image(it.image, it.imageAlt)
          link(it.href, it.ctaLabel || it.title)
        }
        break
      case 'challenges':
        heading(2, d.heading)
        words(d.intro)
        summarise(d.intro)
        for (const it of items) {
          heading(3, it.problem)
          words(it.detail, it.solution)
          link(it.href, it.problem)
        }
        break
      case 'stats':
        heading(2, d.heading)
        words(d.intro)
        for (const it of items) words(it.value, it.label)
        break
      case 'ctaBand':
        heading(2, d.heading)
        words(d.body)
        link(d.primaryHref, d.primaryLabel)
        link(d.secondaryHref, d.secondaryLabel)
        break
      case 'form':
        heading(2, d.heading)
        words(d.intro)
        markdown(d.sideNote)
        break
      case 'newsletter':
        heading(2, d.heading)
        words(d.intro)
        break
      case 'industries':
        heading(2, d.heading)
        words(d.intro)
        summarise(d.intro)
        for (const it of dyn.industries.slice(0, Number(d.limit) || 24)) {
          heading(3, it.title)
          words(it.summary)
          link(`/industries/${it.slug}`, it.title)
        }
        break
      case 'proof':
        heading(2, d.heading)
        words(d.intro)
        for (const c of dyn.caseStudies.slice(0, 3)) {
          heading(3, c.title)
          words(c.summary)
          link(`/case-studies/${c.slug}`, c.title)
        }
        break
      case 'posts':
        heading(2, d.heading)
        words(d.intro)
        for (const p of dyn.posts.slice(0, Number(d.limit) || 3)) {
          heading(3, p.title)
          words(p.excerpt)
          link(`/blog/${p.slug}`, p.title)
        }
        break
      case 'resources':
        heading(2, d.heading)
        words(d.intro)
        for (const r of dyn.resources.slice(0, Number(d.limit) || 3)) {
          heading(3, r.title)
          words(r.summary)
          link(`/resources/${r.slug}`, r.title)
        }
        break
      default:
        heading(2, d.heading)
        words(d.intro, d.eyebrow)
    }
  }
  return out
}

/* --------------------------------- Inventory --------------------------------- */

const blank = (): Omit<InventoryEntry, 'key' | 'entityType' | 'entityId' | 'path' | 'label'> => ({
  pageType: '',
  status: 'published',
  isPublic: true,
  indexable: true,
  nofollow: false,
  noindexReason: '',
  title: '',
  titleSource: 'content',
  description: '',
  descriptionSource: 'none',
  explicitCanonical: '',
  canonicalPath: '',
  headings: [],
  wordCount: 0,
  images: [],
  links: [],
  schemaTypes: [],
  schemaIssues: [],
  ogImage: '',
  updatedAt: null,
  editable: true,
  analysed: true,
})

function canonicalPathOf(site: SeoSettings, path: string, explicit: string) {
  const resolved = resolveCanonical(site.siteUrl, path, explicit)
  const url = new URL(resolved)
  return url.host === new URL(site.siteUrl).host ? normalizePath(url.pathname) : resolved
}

function seoFlags(seo: any) {
  const noindex = Boolean(seo?.noindex)
  return { indexable: !noindex, nofollow: Boolean(seo?.nofollow), noindexReason: noindex ? 'Marked noindex in its SEO settings.' : '' }
}

function pageIsLive(doc: any, now: Date) {
  if (!doc.published) return false
  const live = ['published', 'in_review', 'approved'].includes(doc.state) || (doc.state === 'scheduled' && doc.publishAt && new Date(doc.publishAt) <= now)
  return Boolean(live) && (!doc.expireAt || new Date(doc.expireAt) > now)
}

function templateKindFor(pageType: string): TemplateKind {
  return pageType === 'industry' ? 'industry' : pageType === 'case_study' ? 'case_study' : 'page'
}

export type SeoSnapshot = {
  site: SeoSettings
  siteUrlConfigured: boolean
  entries: InventoryEntry[]
  redirects: RedirectRule[]
  navLinks: string[]
  generatedAt: string
}

export async function buildInventory(): Promise<SeoSnapshot> {
  const { site, siteUrlConfigured } = await getSeoSettings()
  const now = new Date()
  const liveFilter = { $or: [{ state: 'published' }, { state: 'scheduled', publishAt: { $lte: now } }] }
  const [pages, posts, jobs, industries, caseStudies, resources, redirectDocs, navDocs, routeSeoDocs, homeContent, aboutContent, whyChooseUsContent, contactContent, faqContent, caseStudiesContent, resourceCentreContent, careersContent] = await Promise.all([
    Page.find({}).lean<any[]>(),
    Post.find({ state: { $nin: ['idea', 'brief', 'archived'] } }, 'title slug excerpt content heroImage heroAlt state publishAt publishedAt contentUpdatedAt updatedAt seo authorId vertical categoryIds tagIds')
      .populate('authorId', 'name slug')
      .lean<any[]>(),
    Job.find({ status: { $in: ['published', 'closed'] } }).lean<any[]>(),
    Industry.find({ status: 'published' }).sort({ sortOrder: 1 }).lean<any[]>(),
    CaseStudy.find({ status: 'published' }).sort({ updatedAt: -1 }).lean<any[]>(),
    Resource.find({ status: 'published' }).sort({ featured: -1, sortOrder: 1 }).lean<any[]>(),
    Redirect.find({}).lean<any[]>(),
    Navigation.find({ menuKey: { $in: ['primary', 'footer', 'utility', 'legal'] } }).lean<any[]>(),
    RouteSeo.find({}).lean<any[]>(),
    HomePageContent.findOne({ key: 'home-page' }).lean<any>(),
    AboutPageContent.findOne({ key: 'about-us', status: 'published' }).lean<any>(),
    WhyChooseUsPageContent.findOne({ key: 'why-choose-us-page', status: 'published' }).lean<any>(),
    ContactPageContent.findOne({ key: 'contact-page', status: 'published' }).lean<any>(),
    FaqPageContent.findOne({ key: 'faq-page', status: 'published' }).lean<any>(),
    CaseStudiesPageContent.findOne({ key: 'case-studies-page', status: 'published' }).lean<any>(),
    ResourceCentrePageContent.findOne({ key: 'resource-centre', status: 'published' }).lean<any>(),
    CareersPageContent.findOne({ key: 'careers-page', status: 'published' }).lean<any>(),
  ])
  const dyn: Dynamic = {
    industries,
    caseStudies: caseStudies.filter((c) => c.clientApproved),
    resources,
    posts: posts.filter((p) => p.state === 'published' || (p.state === 'scheduled' && p.publishAt && new Date(p.publishAt) <= now)).sort((a, b) => +new Date(b.publishedAt ?? 0) - +new Date(a.publishedAt ?? 0)),
  }
  void liveFilter

  const routeSeoByPath = new Map(routeSeoDocs.map((doc: any) => [String(doc.path), doc]))
  const entries: InventoryEntry[] = []
  const finish = (e: InventoryEntry): InventoryEntry => ({ ...e, canonicalPath: canonicalPathOf(site, e.path, e.explicitCanonical) })

  for (const doc of pages) {
    if (isDedicatedPublicPath(doc.path)) continue
    const live = pageIsLive(doc, now)
    const content = live ? doc.published : doc.draft
    const seo = content.seo ?? {}
    const a = analyzeBlocks(content.blocks ?? [], dyn)
    const kind = templateKindFor(doc.pageType)
    const eff = resolveEffectiveSeo(kind, site, { name: content.title, summary: a.summary, explicitTitle: seo.title, explicitDescription: seo.description })
    const schemaTypes = [doc.pageType === 'home' ? 'Organization' : '', 'WebPage'].filter(Boolean)
    const page = webPageSchema(site, { path: doc.path, name: eff.title, description: eff.description, modified: iso(doc.updatedAt) })
    entries.push(
      finish({
        ...blank(),
        key: `page:${idOf(doc)}`,
        entityType: 'page',
        entityId: idOf(doc),
        path: doc.path,
        label: content.title,
        pageType: doc.pageType,
        status: live ? 'published' : doc.state,
        isPublic: live,
        ...seoFlags(seo),
        title: eff.title,
        titleSource: eff.titleSource,
        description: eff.description,
        descriptionSource: eff.descriptionSource,
        explicitCanonical: str(seo.canonical),
        headings: a.headings,
        wordCount: a.wordCount,
        images: a.images,
        links: a.links,
        schemaTypes: [...schemaTypes, 'BreadcrumbList'],
        schemaIssues: validateJsonLd(page),
        ogImage: str(seo.ogImage) || a.images[0]?.src || '',
        updatedAt: iso(doc.updatedAt),
      }),
    )
  }

  for (const p of posts) {
    const live = p.state === 'published' || (p.state === 'scheduled' && p.publishAt && new Date(p.publishAt) <= now)
    const seo = p.seo ?? {}
    const md = analyzeMarkdown(p.content ?? '')
    const eff = resolveEffectiveSeo('post', site, { name: p.title, summary: p.excerpt || md.headings.length ? p.excerpt || stripMarkdown(p.content ?? '') : stripMarkdown(p.content ?? ''), explicitTitle: seo.title, explicitDescription: seo.description })
    const path = `/blog/${p.slug}`
    const schema = articleSchema(site, { path, headline: p.title, description: eff.description, image: p.heroImage, published: iso(p.publishedAt), modified: iso(p.contentUpdatedAt ?? p.updatedAt), authorName: p.authorId?.name })
    entries.push(
      finish({
        ...blank(),
        key: `post:${idOf(p)}`,
        entityType: 'post',
        entityId: idOf(p),
        path,
        label: p.title,
        pageType: 'post',
        status: live ? 'published' : p.state,
        isPublic: Boolean(live),
        ...seoFlags(seo),
        title: eff.title,
        titleSource: eff.titleSource,
        description: eff.description,
        descriptionSource: eff.descriptionSource,
        explicitCanonical: str(seo.canonical),
        headings: [{ level: 1, text: p.title }, ...md.headings.map((h) => ({ ...h, level: Math.max(h.level, 2) }))],
        wordCount: md.wordCount,
        images: [...(p.heroImage ? [{ src: p.heroImage, alt: p.heroAlt ?? '' }] : []), ...md.images],
        links: md.links,
        schemaTypes: ['BlogPosting', 'BreadcrumbList'],
        schemaIssues: validateJsonLd(schema),
        ogImage: str(seo.ogImage) || str(p.heroImage),
        updatedAt: iso(p.contentUpdatedAt ?? p.updatedAt),
      }),
    )
  }

  const [categories, tags, authors, seriesList] = await Promise.all([
    Category.find({}).lean<any[]>(),
    Tag.find({}).lean<any[]>(),
    Author.find({ status: 'published' }).lean<any[]>(),
    PostSeries.find({ status: 'published' }).lean<any[]>(),
  ])
  const archiveStats = (match: (p: any) => boolean) => {
    const list = dyn.posts.filter(match)
    const latest = list.reduce<number>((m, p) => Math.max(m, +new Date(p.contentUpdatedAt ?? p.updatedAt ?? 0)), 0)
    return { total: list.length, latest }
  }
  const hasId = (ids: unknown[] | undefined, id: string) => (ids ?? []).some((x) => String(x) === id)
  const archives = [
    ...categories.map((c) => ({ kind: 'category', doc: c, path: `/blog/category/${c.slug}`, label: `Category: ${c.name}`, summary: c.description, noindex: Boolean(c.noindex), ...archiveStats((p) => hasId(p.categoryIds, idOf(c))) })),
    ...tags.map((t) => ({ kind: 'tag', doc: t, path: `/blog/tag/${t.slug}`, label: `Tag: ${t.name}`, summary: t.description, noindex: Boolean(t.noindex), ...archiveStats((p) => hasId(p.tagIds, idOf(t))) })),
    ...authors.map((a) => ({ kind: 'author', doc: a, path: `/blog/author/${a.slug}`, label: `Author: ${a.name}`, summary: a.bio, noindex: false, ...archiveStats((p) => String(p.authorId?._id ?? p.authorId ?? '') === idOf(a)) })),
    ...seriesList.map((s) => ({ kind: 'series', doc: s, path: `/blog/series/${s.slug}`, label: `Series: ${s.title}`, summary: s.seo?.description || s.description, noindex: Boolean(s.seo?.noindex), ...archiveStats((p) => String(p.seriesId ?? '') === idOf(s)) })),
  ]
  for (const ar of archives) {
    const eligible = ar.kind === 'series' ? !ar.noindex && ar.total >= 2 : archiveIndexable({ total: ar.total, page: 1, termNoindex: ar.noindex })
    const override = (routeSeoByPath.get(ar.path) as any)?.seo ?? null
    const name = String(ar.doc.name ?? ar.doc.title)
    const description = str(ar.summary) || `Articles ${ar.kind === 'author' ? 'by' : 'about'} ${name} from ${site.siteName}.`
    const eff = resolveEffectiveSeo('page', site, {
      name,
      summary: description,
      explicitTitle: override ? str(override.title) : `${name} | ${site.siteName}`,
      explicitDescription: override ? str(override.description) : description,
    })
    const noindex = !eligible || Boolean(override?.noindex)
    entries.push(
      finish({
        ...blank(),
        key: `route:${ar.path}`,
        entityType: 'route',
        entityId: ar.path,
        path: ar.path,
        label: ar.label,
        pageType: ar.kind,
        status: ar.total > 0 ? 'published' : 'empty',
        isPublic: ar.total > 0,
        indexable: !noindex,
        nofollow: Boolean(override?.nofollow),
        noindexReason: noindex
          ? !eligible
            ? ar.noindex
              ? 'Marked noindex on the term.'
              : `Only ${ar.total} live post(s); archives need at least ${MIN_INDEXABLE_ARCHIVE_POSTS} to be indexed.`
            : 'Marked noindex in its route SEO settings.'
          : '',
        title: eff.title,
        titleSource: override?.title ? 'explicit' : eff.titleSource,
        description: eff.description,
        descriptionSource: override?.description ? 'explicit' : eff.descriptionSource,
        explicitCanonical: str(override?.canonical),
        headings: [{ level: 1, text: name }],
        wordCount: countWords(description),
        schemaTypes: ['CollectionPage', 'BreadcrumbList'],
        ogImage: str(override?.ogImage) || str(ar.doc.avatar) || str(ar.doc.heroImage) || '',
        updatedAt: iso((routeSeoByPath.get(ar.path) as any)?.updatedAt ?? (ar.latest ? new Date(ar.latest) : ar.doc.updatedAt)),
        editable: true,
      }),
    )
  }

  for (const j of jobs) {
    const open = j.status === 'published' && (!j.closeAt || new Date(j.closeAt) > now)
    const path = `/careers/${j.slug}`
    const md = analyzeMarkdown(`${j.description ?? ''}\n\n${j.requirements ?? ''}`)
    const seo = j.seo ?? {}
    const eff = resolveEffectiveSeo('job', site, { name: j.title, summary: j.description || j.summary, explicitTitle: seo.title, explicitDescription: seo.description, vars: { location: j.location } })
    const schema = jobPostingSchema(site, { ...j, id: idOf(j), path, description: j.description ?? '', datePosted: iso(j.publishedAt ?? j.createdAt) ?? '', validThrough: iso(j.closeAt) })
    entries.push(
      finish({
        ...blank(),
        key: `job:${idOf(j)}`,
        entityType: 'job',
        entityId: idOf(j),
        path,
        label: j.title,
        pageType: 'job',
        status: open ? 'published' : j.status === 'published' ? 'expired' : j.status,
        isPublic: open,
        ...seoFlags({ ...seo, noindex: Boolean(seo.noindex) || !open }),
        explicitCanonical: str(seo.canonical),
        title: eff.title,
        titleSource: eff.titleSource,
        description: eff.description,
        descriptionSource: eff.descriptionSource,
        headings: [{ level: 1, text: j.title }, ...md.headings.map((h) => ({ ...h, level: Math.max(h.level, 2) }))],
        wordCount: md.wordCount,
        links: md.links,
        schemaTypes: ['JobPosting'],
        schemaIssues: schema ? validateJsonLd(schema) : ['JobPosting needs a location and a description before structured data can be emitted.'],
        ogImage: str(seo.ogImage),
        updatedAt: iso(j.updatedAt),
      }),
    )
  }

  const detail = (type: 'industry' | 'case_study' | 'resource', base: string, docs: any[], name: (d: any) => string, body: (d: any) => string) => {
    for (const d of docs) {
      const seo = d.seo ?? {}
      const path = `${base}/${d.slug}`
      const text = body(d)
      const md = analyzeMarkdown(text)
      const eff = resolveEffectiveSeo(type, site, { name: name(d), summary: d.summary, explicitTitle: seo.title, explicitDescription: seo.description })
      const flags = seoFlags(seo)
      const words = md.wordCount + countWords(name(d))
      const minWords = site.indexing?.minWords ?? 0
      if (flags.indexable && minWords > 0 && words < minWords) {
        flags.indexable = false
        flags.noindexReason = `Only ${words} words; the publication rule requires at least ${minWords} before this page is indexable.`
      }
      entries.push(
        finish({
          ...blank(),
          key: `${type}:${idOf(d)}`,
          entityType: type,
          entityId: idOf(d),
          path,
          label: name(d),
          pageType: type,
          ...flags,
          title: eff.title,
          titleSource: eff.titleSource,
          description: eff.description,
          descriptionSource: eff.descriptionSource,
          explicitCanonical: str(seo.canonical),
          headings: [{ level: 1, text: name(d) }, ...md.headings.map((h) => ({ ...h, level: Math.max(h.level, 2) }))],
          wordCount: words,
          images: d.image ? [{ src: d.image, alt: name(d) }] : [],
          links: md.links,
          schemaTypes: ['WebPage', 'BreadcrumbList'],
          ogImage: str(seo.ogImage) || str(d.image),
          updatedAt: iso(d.updatedAt),
          isPublic: type === 'case_study' ? Boolean(d.clientApproved) : true,
          status: type === 'case_study' && !d.clientApproved ? 'awaiting_client_approval' : 'published',
        }),
      )
    }
  }
  detail('industry', '/industries', industries, (d) => d.title, (d) => [d.summary, d.context, d.governance, ...(d.accommodationNeeds ?? []), ...(d.mobilityNeeds ?? [])].filter(Boolean).join('\n\n'))
  detail('case_study', '/case-studies', caseStudies, (d) => d.title, (d) => [d.summary, d.challenge, d.approach, d.outcome].filter(Boolean).join('\n\n'))
  detail('resource', '/resources', resources, (d) => d.title, (d) => [d.summary, d.body].filter(Boolean).join('\n\n'))


  // Dedicated Next.js routes use their own content collections/components. Store SEO overrides
  // by canonical path so the SEO inventory edits the metadata those routes actually serve.
  const cmsRouteDocs = new Map(pages.filter((doc: any) => ['/global-accommodation', '/local-transportation', '/industries'].includes(doc.path)).map((doc: any) => [doc.path, doc]))
  const addRoute = (input: {
    path: string
    label: string
    summary: string
    nativeTitle?: string
    nativeDescription?: string
    nativeImage?: string
    nativeNoindex?: boolean
    forceNoindex?: boolean
    updatedAt?: unknown
    headings?: HeadingRef[]
    wordCount?: number
    links?: LinkRef[]
  }) => {
    const override = (routeSeoByPath.get(input.path) as any)?.seo ?? null
    const titleValue = str(override?.title) || str(input.nativeTitle)
    const descriptionValue = str(override?.description) || str(input.nativeDescription)
    const eff = resolveEffectiveSeo('page', site, {
      name: input.label,
      summary: input.summary,
      explicitTitle: titleValue,
      explicitDescription: descriptionValue,
    })
    const noindex = Boolean(input.forceNoindex) || (override ? Boolean(override.noindex) : Boolean(input.nativeNoindex))
    const nofollow = Boolean(override?.nofollow)
    const pageSchema = webPageSchema(site, { path: input.path, name: eff.title, description: eff.description, modified: iso(input.updatedAt) })
    entries.push(finish({
      ...blank(),
      key: `route:${input.path}`,
      entityType: 'route',
      entityId: input.path,
      path: input.path,
      label: input.label,
      pageType: 'dedicated route',
      status: 'published',
      isPublic: true,
      indexable: !noindex,
      nofollow,
      noindexReason: noindex ? 'Marked noindex in its SEO settings.' : '',
      title: eff.title,
      titleSource: titleValue ? 'explicit' : eff.titleSource,
      description: eff.description,
      descriptionSource: descriptionValue ? 'explicit' : eff.descriptionSource,
      explicitCanonical: str(override?.canonical),
      headings: input.headings?.length ? input.headings : [{ level: 1, text: input.label }],
      wordCount: input.wordCount ?? countWords(input.summary),
      images: input.nativeImage || override?.ogImage ? [{ src: str(override?.ogImage) || str(input.nativeImage), alt: input.label }] : [],
      links: input.links ?? [],
      schemaTypes: ['WebPage', 'BreadcrumbList'],
      schemaIssues: validateJsonLd(pageSchema),
      ogImage: str(override?.ogImage) || str(input.nativeImage),
      updatedAt: iso((routeSeoByPath.get(input.path) as any)?.updatedAt ?? input.updatedAt),
      editable: true,
      analysed: Boolean(input.summary),
    }))
  }

  const routeFallbacks = [
    {
      path: '/',
      label: 'Home',
      summary: homeContent?.seoDescription || site.defaultDescription || 'Corporate accommodation and local transportation, coordinated around the way your teams work.',
      nativeTitle: homeContent?.seoTitle || site.defaultTitle,
      nativeDescription: homeContent?.seoDescription || site.defaultDescription,
      nativeImage: homeContent?.ogImage || site.ogImage,
      nativeNoindex: homeContent?.seoNoindex,
      updatedAt: homeContent?.updatedAt,
    },
    {
      path: '/about-us',
      label: 'About GoAhead Mobility',
      summary: aboutContent?.seoDescription || 'Discover the people, values, milestones and trusted partnerships behind GoAhead Mobility’s connected corporate accommodation and transportation services.',
      nativeTitle: aboutContent?.seoTitle || 'About GoAhead Mobility | Moving Businesses Forward, Together',
      nativeDescription: aboutContent?.seoDescription || 'Discover the people, values, milestones and trusted partnerships behind GoAhead Mobility’s connected corporate accommodation and transportation services.',
      nativeImage: aboutContent?.ogImage || aboutContent?.heroImage,
      nativeNoindex: aboutContent?.seoNoindex,
      updatedAt: aboutContent?.updatedAt,
    },
    {
      path: '/company/why-choose-us',
      label: 'Why Choose Us',
      summary: whyChooseUsContent?.seoDescription || 'Discover how GoAhead Mobility coordinates accommodation and local transportation with clear governance, verified coverage and accountable service.',
      nativeTitle: whyChooseUsContent?.seoTitle || 'Why Choose GoAhead Mobility | A Coordinated Mobility Partner',
      nativeDescription: whyChooseUsContent?.seoDescription || 'Discover how GoAhead Mobility coordinates accommodation and local transportation with clear governance, verified coverage and accountable service.',
      nativeImage: whyChooseUsContent?.ogImage || whyChooseUsContent?.heroImage || '/images/site/transport-hero.png',
      nativeNoindex: whyChooseUsContent?.seoNoindex,
      updatedAt: whyChooseUsContent?.updatedAt,
    },
    {
      path: '/contact',
      label: 'Contact GoAhead Mobility',
      summary: contactContent?.seoDescription || 'Talk to GoAhead Mobility about corporate accommodation, employee transportation and mobility solutions. Send your enquiry or connect with our team.',
      nativeTitle: contactContent?.seoTitle || 'Contact GoAhead Mobility | Let’s Move Forward Together',
      nativeDescription: contactContent?.seoDescription || 'Talk to GoAhead Mobility about corporate accommodation, employee transportation and mobility solutions. Send your enquiry or connect with our team.',
      nativeImage: contactContent?.ogImage || contactContent?.heroImage,
      nativeNoindex: contactContent?.seoNoindex,
      updatedAt: contactContent?.updatedAt,
    },
    {
      path: '/faq',
      label: 'FAQs',
      summary: faqContent?.seoDescription || 'Find answers to common questions about GoAhead Mobility services, booking, safety, technology, billing and partnerships.',
      nativeTitle: faqContent?.seoTitle || 'FAQs | GoAhead Mobility',
      nativeDescription: faqContent?.seoDescription || 'Find answers to common questions about GoAhead Mobility services, booking, safety, technology, billing and partnerships.',
      nativeImage: faqContent?.ogImage || faqContent?.heroImage,
      nativeNoindex: faqContent?.seoNoindex,
      updatedAt: faqContent?.updatedAt,
    },
    {
      path: '/case-studies',
      label: 'Case Studies',
      summary: caseStudiesContent?.seoDescription || 'Explore how organisations partner with GoAhead Mobility to solve complex transportation challenges and deliver measurable, sustainable results.',
      nativeTitle: caseStudiesContent?.seoTitle || 'Case Studies | Real Challenges. Proven Impact. | GoAhead Mobility',
      nativeDescription: caseStudiesContent?.seoDescription || 'Explore how organisations partner with GoAhead Mobility to solve complex transportation challenges and deliver measurable, sustainable results.',
      nativeImage: caseStudiesContent?.ogImage || caseStudiesContent?.heroImage,
      nativeNoindex: caseStudiesContent?.seoNoindex,
      updatedAt: caseStudiesContent?.updatedAt,
    },
    {
      path: '/resources',
      label: 'Resource Centre',
      summary: resourceCentreContent?.seoDescription || 'Explore practical guides, whitepapers, case studies, templates and insights for smarter corporate transportation and mobility operations.',
      nativeTitle: resourceCentreContent?.seoTitle || 'Resource Centre | Mobility Guides, Reports & Case Studies | GoAhead Mobility',
      nativeDescription: resourceCentreContent?.seoDescription || 'Explore practical guides, whitepapers, case studies, templates and insights for smarter corporate transportation and mobility operations.',
      nativeImage: resourceCentreContent?.ogImage || resourceCentreContent?.heroImage,
      nativeNoindex: resourceCentreContent?.seoNoindex,
      updatedAt: resourceCentreContent?.updatedAt,
    },
    {
      path: '/careers',
      label: 'Careers & open jobs',
      summary: careersContent?.seoDescription || 'Explore open roles at GoAhead Mobility — corporate transport, fleet operations, engineering and customer roles. Apply online in minutes.',
      nativeTitle: careersContent?.seoTitle || 'Careers & open jobs',
      nativeDescription: careersContent?.seoDescription || 'Explore open roles at GoAhead Mobility — corporate transport, fleet operations, engineering and customer roles. Apply online in minutes.',
      nativeImage: careersContent?.ogImage || careersContent?.heroImage,
      nativeNoindex: careersContent?.seoNoindex,
      updatedAt: careersContent?.updatedAt,
    },
    {
      path: '/blog',
      label: 'Blog & Insights',
      summary: 'Explore the latest mobility trends, expert insights and practical ideas on corporate transportation, employee mobility and sustainable travel.',
      nativeTitle: 'Blog & Insights | Ideas. Insights. Impact.',
      nativeDescription: 'Explore the latest mobility trends, expert insights and practical ideas on corporate transportation, employee mobility and sustainable travel.',
      nativeImage: '/images/site/transport-hero.png',
      forceNoindex: dyn.posts.length < MIN_INDEXABLE_ARCHIVE_POSTS,
    },
    {
      path: '/blog/authors',
      label: 'Our authors',
      summary: 'The specialists behind Go Ahead Mobility insights.',
      nativeTitle: 'Our authors',
      nativeDescription: 'The specialists behind Go Ahead Mobility insights.',
      forceNoindex: archives.filter((archive) => archive.kind === 'author' && archive.total > 0).length < 2,
    },
    {
      path: '/blog/series',
      label: 'Guide series',
      summary: 'Multi-part guides on corporate accommodation, employee transportation and mobility operations, in reading order.',
      nativeTitle: 'Guide series',
      nativeDescription: 'Multi-part guides on corporate accommodation, employee transportation and mobility operations, in reading order.',
    },
    {
      path: '/newsletter',
      label: 'Newsletter',
      summary: 'Subscribe to GoAhead Mobility updates.',
      nativeTitle: 'Newsletter',
      nativeDescription: 'Subscribe to GoAhead Mobility updates.',
      forceNoindex: true,
    },
  ] as const
  for (const route of routeFallbacks) {
    addRoute({ ...route, wordCount: countWords(route.summary) })
  }

  for (const path of ['/global-accommodation', '/local-transportation', '/industries']) {
    const doc = cmsRouteDocs.get(path) as any
    const content = doc?.published ?? doc?.draft
    const cmsSeo = content?.seo ?? {}
    const analysis = analyzeBlocks(content?.blocks ?? [], dyn)
    const labels: Record<string, string> = {
      '/global-accommodation': 'Global Accommodation',
      '/local-transportation': 'Local Transportation',
      '/industries': 'Industries',
    }
    const label = labels[path]
    const effective = resolveEffectiveSeo('page', site, {
      name: content?.title || label,
      summary: analysis.summary,
      explicitTitle: cmsSeo.title,
      explicitDescription: cmsSeo.description,
    })
    addRoute({
      path,
      label,
      summary: effective.description || analysis.summary,
      nativeTitle: cmsSeo.title || effective.title,
      nativeDescription: cmsSeo.description || effective.description,
      nativeImage: cmsSeo.ogImage || analysis.images[0]?.src,
      nativeNoindex: cmsSeo.noindex,
      updatedAt: doc?.updatedAt,
      headings: analysis.headings,
      wordCount: analysis.wordCount,
      links: analysis.links,
    })
  }

  // Listing routes that are implemented in code rather than stored as CMS pages.
  const known = new Set(entries.map((e) => e.path))
  const statics: { path: string; label: string; description: string; words: number }[] = [
    { path: '/blog', label: 'Insights', description: 'Articles on global accommodation, local transportation and mobility operations.', words: dyn.posts.length * 25 },
    { path: '/resources', label: 'Resource Centre', description: 'Guides, whitepapers, case studies, templates, reports and mobility insights for business teams.', words: dyn.resources.length * 30 + dyn.caseStudies.filter((item: any) => item.clientApproved).length * 30 },
    { path: '/faq', label: 'FAQs', description: 'Answers about GoAhead Mobility services, booking, operations, safety, technology, billing and partnerships.', words: 220 },
    { path: '/careers', label: 'Careers', description: 'Open roles at GoAhead Mobility.', words: jobs.length * 15 },
    { path: '/newsletter', label: 'Newsletter', description: 'Subscribe to GoAhead Mobility updates.', words: 40 },
  ]
  for (const s of statics) {
    if (known.has(s.path)) continue
    const eff = resolveEffectiveSeo('page', site, { name: s.label, summary: s.description })
    entries.push(
      finish({
        ...blank(),
        key: `static:${s.path}`,
        entityType: 'static',
        entityId: null,
        path: s.path,
        label: s.label,
        pageType: 'listing',
        title: eff.title,
        titleSource: eff.titleSource,
        description: eff.description,
        descriptionSource: eff.descriptionSource,
        headings: [{ level: 1, text: s.label }],
        wordCount: s.words,
        links: s.path === '/blog' ? dyn.posts.slice(0, 24).map((p) => ({ href: `/blog/${p.slug}`, text: p.title })) : s.path === '/careers' ? jobs.filter((j) => j.status === 'published').map((j) => ({ href: `/careers/${j.slug}`, text: j.title })) : s.path === '/resources' ? [...dyn.resources.map((r) => ({ href: `/resources/${r.slug}`, text: r.title })), ...dyn.caseStudies.filter((item: any) => item.clientApproved).map((item: any) => ({ href: `/case-studies/${item.slug}`, text: item.title }))] : [],
        schemaTypes: ['CollectionPage'],
        editable: false,
        analysed: false,
      }),
    )
  }

  const flatten = (items: any[]): string[] => items.flatMap((i) => [i.href, ...flatten(i.children ?? [])]).filter((h): h is string => typeof h === 'string' && h.length > 0)
  const navLinks = navDocs.flatMap((n) => flatten((n.items ?? []).filter((i: any) => i.visible !== false)))
  const redirects: RedirectRule[] = redirectDocs.map((r) => ({ sourcePath: r.sourcePath, targetUrl: r.targetUrl, statusCode: r.statusCode, enabled: r.enabled !== false }))

  return { site, siteUrlConfigured, entries, redirects, navLinks, generatedAt: now.toISOString() }
}

/* ----------------------------------- Audit ----------------------------------- */

export type AuditResult = { snapshot: SeoSnapshot; issues: AuditIssue[]; score: number; ignored: AuditIssue[] }

function evidenceHash(i: AuditIssue) {
  let h = 0
  for (const c of i.evidence) h = (h * 31 + c.charCodeAt(0)) | 0
  return String(h)
}

export async function runAudit(): Promise<AuditResult> {
  const snapshot = await buildInventory()
  const { site, entries, redirects, navLinks, siteUrlConfigured } = snapshot
  const robots = buildRobots({ siteUrl: site.siteUrl, mode: site.robotsMode, extraDisallow: site.extraDisallow, sitemapEnabled: site.sitemap.enabled })
  const all = runAuditRules({ entries, redirects, site, robots, navLinks, siteUrlConfigured, isProduction: process.env.NODE_ENV === 'production' })
  const states = await SeoIssueState.find({ status: 'ignored' }).lean<any[]>()
  const ignoredMap = new Map(states.map((s) => [`${s.entityKey}|${s.code}`, s.evidenceHash]))
  const issues: AuditIssue[] = []
  const ignored: AuditIssue[] = []
  for (const issue of all) {
    const stored = ignoredMap.get(`${issue.entityKey}|${issue.code}`)
    if (stored !== undefined && stored === evidenceHash(issue)) ignored.push(issue)
    else issues.push(issue)
  }
  const indexable = entries.filter((e) => e.isPublic && e.indexable).length
  return { snapshot, issues, ignored, score: healthScore(issues, indexable) }
}

export { evidenceHash }

export async function saveAuditRun(result: AuditResult, userId: string | null, trigger: 'manual' | 'publish' | 'schedule' = 'manual') {
  const counts: Record<string, number> = {}
  for (const i of result.issues) counts[i.severity] = (counts[i.severity] ?? 0) + 1
  const doc = await SeoAuditRun.create({
    score: result.score,
    pageCount: result.snapshot.entries.filter((e) => e.isPublic).length,
    indexableCount: result.snapshot.entries.filter((e) => e.isPublic && e.indexable).length,
    counts,
    issues: result.issues.slice(0, 1000),
    triggeredById: userId,
    trigger,
  })
  return doc
}

export async function listAuditRuns(limit = 20) {
  await connectDb()
  return SeoAuditRun.find({}, 'score pageCount indexableCount counts trigger createdAt').sort({ createdAt: -1 }).limit(limit).lean<any[]>()
}

export async function listNotFound(limit = 100) {
  await connectDb()
  return NotFoundLog.find({ resolved: false }).sort({ hits: -1 }).limit(limit).lean<any[]>()
}

export { isPrivatePath }
