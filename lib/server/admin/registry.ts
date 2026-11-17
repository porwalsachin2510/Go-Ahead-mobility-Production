import 'server-only'
import type { Model } from 'mongoose'
import { randomUUID } from 'node:crypto'
import { RESOURCE_MAP, type ResourceConfig } from '@/lib/admin/resources'
import { can } from '@/lib/rbac'
import type { SessionUser } from '../auth/session'
import { AboutPageContent, WhyChooseUsPageContent, AccommodationPageContent, TransportationPageContent, FootprintPageContent, Author, CareersPageContent, CaseStudiesPageContent, HomePageContent, CaseStudy, Category, ClientLogo, ContactPageContent, Faq, FaqPageContent, Industry, Job, Location, Post, PostRevision, PostSeries, Resource, ResourceCentrePageContent, Tag, TeamMember, Testimonial } from '../models/editorial'
import { Navigation, Redirect } from '../models/content'
import { EmailTemplate, RoutingRule } from '../models/operations'
import { User } from '../models/identity'
import { ApiError, badRequest, forbidden } from '../http'
import { LIVE_EDIT_STATES } from '@/lib/blog/workflow'
import { revalidateBlog } from '../services/blog-workflow'
import { validateRedirectSource, validateRedirectTarget, wouldCreateLoop } from '@/lib/seo/redirects'
import { normalizePath } from '@/lib/seo/config'
import { revalidatePath } from 'next/cache'
import { recordSlugChange, type SlugKind } from '../services/blog-slugs'

type Hooks = {
  /** Mutates the parsed payload before persistence; can throw ApiError for business-rule violations. */
  beforeSave?: (data: Record<string, unknown>, ctx: { user: SessionUser; existing: Record<string, unknown> | null; config: ResourceConfig }) => Promise<void> | void
  afterSave?: (doc: Record<string, unknown>, ctx: { user: SessionUser; existing: Record<string, unknown> | null }) => Promise<void>
}

const PUBLISHED_VALUES = new Set(['published', 'approved', 'scheduled'])

function guardPublish(data: Record<string, unknown>, ctx: { user: SessionUser; existing: Record<string, unknown> | null; config: ResourceConfig }) {
  const field = ctx.config.statusField
  const perm = ctx.config.publishPermission
  if (!field || !perm) return
  const next = data[field] as string | undefined
  const prev = ctx.existing?.[field] as string | undefined
  if (next && next !== prev && PUBLISHED_VALUES.has(next) && !can(ctx.user.role, perm)) {
    throw new ApiError(403, 'publish_forbidden', 'Your role can save drafts but cannot publish. Submit for review instead.')
  }
}

function taxonomySlugHook(kind: SlugKind): NonNullable<Hooks['afterSave']> {
  return async (doc, ctx) => {
    if (ctx.existing?.slug && ctx.existing.slug !== doc.slug) {
      await recordSlugChange(kind, String(ctx.existing.slug), String(doc.slug), ctx.user.id)
      revalidatePath('/blog', 'layout')
    }
  }
}

function words(markdown: string) {
  return markdown.replace(/[#*_>`[\]()!-]/g, ' ').split(/\s+/).filter(Boolean).length
}


function withNavigationIds(input: unknown, previous: unknown): Record<string, unknown>[] {
  const items = Array.isArray(input) ? input as Record<string, unknown>[] : []
  const oldItems = Array.isArray(previous) ? previous as Record<string, unknown>[] : []
  return items.map((item, index) => {
    const match = oldItems.find((old) => old.label === item.label && old.href === item.href) ?? oldItems[index]
    return {
      ...item,
      id: typeof match?.id === 'string' && match.id ? match.id : randomUUID(),
      children: withNavigationIds(item.children, match?.children),
    }
  })
}

const HOOKS: Record<string, Hooks> = {
  navigation: {
    async beforeSave(data, ctx) {
      const menuKey = String(data.menuKey ?? ctx.existing?.menuKey ?? '')
      if (!menuKey) throw badRequest('Choose a menu location.', { menuKey: 'Required' })
      const duplicate = await Navigation.findOne({
        menuKey,
        ...(ctx.existing?._id ? { _id: { $ne: ctx.existing._id } } : {}),
      }).select('_id').lean()
      if (duplicate) throw badRequest('A menu already exists for this location.', { menuKey: 'Choose another location or edit the existing menu.' })
      data.menuKey = menuKey
      if (data.items !== undefined) data.items = withNavigationIds(data.items, ctx.existing?.items)
      data.updatedById = ctx.user.id
    },
    async afterSave() {
      revalidatePath('/', 'layout')
    },
  },

  'transportation-page': {
    beforeSave(data, ctx) {
      data.key = 'transportation-page'
      data.updatedById = ctx.user.id
    },
    async afterSave() {
      revalidatePath('/local-transportation')
    },
  },
  'footprint-page': {
    beforeSave(data, ctx) {
      data.key = 'footprint-page'
      data.updatedById = ctx.user.id
    },
    async afterSave() {
      revalidatePath('/our-footprint')
    },
  },
  'accommodation-page': {
    beforeSave(data, ctx) {
      data.key = 'accommodation-page'
      data.updatedById = ctx.user.id
    },
    async afterSave() {
      revalidatePath('/global-accommodation')
    },
  },
  'home-page': {
    beforeSave(data, ctx) {
      data.key = 'home-page'
      data.updatedById = ctx.user.id
    },
    async afterSave() {
      revalidatePath('/')
    },
  },
  'contact-page': {
    beforeSave(data, ctx) {
      guardPublish(data, ctx)
      data.key = 'contact-page'
      data.updatedById = ctx.user.id
    },
    async afterSave() {
      revalidatePath('/contact')
    },
  },
  'faq-page': {
    beforeSave(data, ctx) {
      guardPublish(data, ctx)
      data.key = 'faq-page'
      data.updatedById = ctx.user.id
    },
    async afterSave() {
      revalidatePath('/faq')
    },
  },
  faqs: {
    beforeSave: guardPublish,
    async afterSave(doc, ctx) {
      revalidatePath('/faq')
      revalidatePath('/')
      for (const path of [...((doc.relatedPaths as string[] | undefined) ?? []), ...((ctx.existing?.relatedPaths as string[] | undefined) ?? [])]) {
        if (typeof path === 'string' && path.startsWith('/') && !path.startsWith('//')) revalidatePath(path)
      }
    },
  },
  'resource-centre-page': {
    beforeSave(data, ctx) {
      guardPublish(data, ctx)
      data.key = 'resource-centre'
      data.updatedById = ctx.user.id
    },
    async afterSave() { revalidatePath('/resources'); revalidatePath('/learn') },
  },
  'why-choose-us-page': {
    beforeSave(data, ctx) {
      guardPublish(data, ctx)
      data.key = 'why-choose-us-page'
      data.updatedById = ctx.user.id
    },
    async afterSave() {
      revalidatePath('/company/why-choose-us')
    },
  },
  'about-page': {
    beforeSave(data, ctx) {
      guardPublish(data, ctx)
      data.key = 'about-us'
      data.updatedById = ctx.user.id
    },
    async afterSave() {
      revalidatePath('/about-us')
      revalidatePath('/company/about-us')
    },
  },
  posts: {
    beforeSave(data, ctx) {
      // Workflow state, schedule and publication dates are only changed through the workflow endpoint.
      delete data.state
      delete data.publishAt
      delete data.publishedAt
      delete data.unpublishAt
      const existingState = ctx.existing?.state as string | undefined
      if (existingState && LIVE_EDIT_STATES.includes(existingState as never) && !can(ctx.user.role, 'blog.publish')) {
        throw new ApiError(403, 'publish_forbidden', 'This post is live. Ask a publisher to edit it, or flag it for update.')
      }
      if (typeof data.content === 'string') data.readingMinutes = Math.max(1, Math.round(words(data.content) / 220))
      if (!ctx.existing) data.state = 'draft'
      else if (existingState && LIVE_EDIT_STATES.includes(existingState as never) && typeof data.content === 'string') data.contentUpdatedAt = new Date()
      data.cta = { label: data.ctaLabel ?? '', href: data.ctaHref ?? '' }
      delete data.ctaLabel
      delete data.ctaHref
      data.lastEditedById = ctx.user.id
      data.revision = Number(ctx.existing?.revision ?? 0) + 1
    },
    async afterSave(doc, ctx) {
      await PostRevision.create({ postId: doc._id, version: doc.revision, snapshot: doc, changedById: ctx.user.id, changeSummary: ctx.existing ? 'update' : 'create' })
      if (ctx.existing && LIVE_EDIT_STATES.includes(ctx.existing.state as never)) revalidateBlog(String(doc.slug))
      // Only URLs that were ever public need a redirect; never-published drafts have no inbound links.
      if (ctx.existing?.publishedAt && ctx.existing.slug !== doc.slug) {
        await recordSlugChange('post', String(ctx.existing.slug), String(doc.slug), ctx.user.id)
        revalidateBlog(String(ctx.existing.slug))
      }
    },
  },
  categories: { beforeSave: guardPublish, afterSave: taxonomySlugHook('category') },
  tags: { beforeSave: guardPublish, afterSave: taxonomySlugHook('tag') },
  authors: { beforeSave: guardPublish, afterSave: taxonomySlugHook('author') },
  series: {
    beforeSave: guardPublish,
    async afterSave() {
      revalidatePath('/blog', 'layout')
    },
  },
  'case-studies': {
    beforeSave(data, ctx) {
      guardPublish(data, ctx)
      const status = data.status ?? ctx.existing?.status
      const approved = data.clientApproved ?? ctx.existing?.clientApproved
      if (status === 'published' && !approved) throw badRequest('Record client approval before publishing a case study', { clientApproved: 'Required to publish' })
    },
    async afterSave(doc, ctx) {
      revalidatePath('/case-studies')
      revalidatePath(`/case-studies/${String(doc.slug)}`)
      if (ctx.existing?.slug && ctx.existing.slug !== doc.slug) revalidatePath(`/case-studies/${String(ctx.existing.slug)}`)
    },
  },
  'case-studies-page': {
    beforeSave(data, ctx) { guardPublish(data, ctx); data.key = 'case-studies-page'; data.updatedById = ctx.user.id },
    async afterSave() { revalidatePath('/case-studies') },
  },
  testimonials: {
    beforeSave(data, ctx) {
      guardPublish(data, ctx)
      const status = data.status ?? ctx.existing?.status
      const perm = data.permissionStatus ?? ctx.existing?.permissionStatus
      if (status === 'published' && perm !== 'granted') throw badRequest('Permission must be granted before publishing', { permissionStatus: 'Must be granted' })
    },
  },
  'client-logos': {
    beforeSave(data, ctx) {
      guardPublish(data, ctx)
      const status = data.status ?? ctx.existing?.status
      const perm = data.permissionStatus ?? ctx.existing?.permissionStatus
      if (status === 'published' && perm !== 'granted') throw badRequest('Logo permission must be granted before publishing', { permissionStatus: 'Must be granted' })
    },
  },
  redirects: {
    async beforeSave(data, ctx) {
      const rawSource = String(data.sourcePath ?? ctx.existing?.sourcePath ?? '')
      const source = validateRedirectSource(rawSource)
      if (!source.ok) throw badRequest(source.error, { sourcePath: source.error })
      data.sourcePath = source.source
      const statusCode = Number(data.statusCode ?? ctx.existing?.statusCode ?? 301)
      if (![301, 302, 410].includes(statusCode)) throw badRequest('Status must be 301, 302 or 410', { statusCode: 'Invalid status' })
      data.statusCode = statusCode
      if (statusCode === 410) {
        data.targetUrl = ''
        return
      }
      const target = validateRedirectTarget(String(data.targetUrl ?? ctx.existing?.targetUrl ?? ''), { allowExternal: true })
      if (!target.ok) throw badRequest(target.error, { targetUrl: target.error })
      data.targetUrl = target.target
      if (target.target.startsWith('/') && normalizePath(target.target) === source.source) throw badRequest('A redirect cannot point to itself', { targetUrl: 'Loop detected' })
      const existingId = ctx.existing?._id ? String(ctx.existing._id) : null
      const duplicate = await Redirect.findOne({ sourcePath: source.source, ...(existingId ? { _id: { $ne: existingId } } : {}) }, '_id').lean()
      if (duplicate) throw badRequest('Another redirect already uses this source path', { sourcePath: 'Duplicate source' })
      const rules = (await Redirect.find({ enabled: true, ...(existingId ? { _id: { $ne: existingId } } : {}) }, 'sourcePath targetUrl statusCode enabled').lean<any[]>()).map((r) => ({ sourcePath: r.sourcePath, targetUrl: r.targetUrl ?? '', statusCode: r.statusCode, enabled: true }))
      if (wouldCreateLoop(rules, source.source, target.target)) throw badRequest('This redirect would create a loop with existing redirects', { targetUrl: 'Loop detected' })
    },
  },
  'email-templates': {
    beforeSave(data, ctx) {
      data.version = Number(ctx.existing?.version ?? 0) + 1
    },
  },
  jobs: {
    beforeSave(data, ctx) {
      guardPublish(data, ctx)
      const workplace = (data.workplaceType ?? ctx.existing?.workplaceType ?? 'onsite') as string
      data.remote = workplace !== 'onsite'
      if (typeof data.country === 'string') data.country = data.country.toUpperCase()
      if (typeof data.salaryCurrency === 'string') data.salaryCurrency = data.salaryCurrency.toUpperCase()
      const min = (data.salaryMin ?? ctx.existing?.salaryMin) as number | null
      const max = (data.salaryMax ?? ctx.existing?.salaryMax) as number | null
      if (min && max && min > max) throw badRequest('Salary "from" cannot be higher than "to"', { salaryMin: 'Must be ≤ salary to' })
      const status = (data.status ?? ctx.existing?.status) as string
      if (status === 'published' && !ctx.existing?.publishedAt) data.publishedAt = new Date()
      delete data.viewCount
      delete data.applicationCount
    },
    async afterSave(doc, ctx) {
      revalidatePath('/careers', 'layout')
      const { getSeoSettings } = await import('../services/seo-inventory')
      const { site } = await getSeoSettings()
      const url = `${site.siteUrl}/careers/${doc.slug}`
      const statusChanged = ctx.existing?.status !== doc.status
      if (doc.status === 'published' && statusChanged) {
        const { notifyIndexNow } = await import('../services/indexnow')
        notifyIndexNow([url, `${site.siteUrl}/careers`])
        // Alerts go out only on the first publish, never on later re-publishes.
        if (!ctx.existing?.publishedAt) {
          const { notifyJobAlerts } = await import('../services/careers')
          await notifyJobAlerts(doc, site.siteUrl).catch((e) => console.error('[careers] alerts failed', e))
        }
      } else if (ctx.existing?.status === 'published' && statusChanged) {
        const { notifyIndexNow } = await import('../services/indexnow')
        notifyIndexNow([url])
      }
    },
  },
}

const MODELS: Record<string, Model<any>> = {
  navigation: Navigation,
  'home-page': HomePageContent,
  'accommodation-page': AccommodationPageContent,
  'transportation-page': TransportationPageContent,
  'footprint-page': FootprintPageContent,
  'contact-page': ContactPageContent,
  'faq-page': FaqPageContent,
  'about-page': AboutPageContent,
  'why-choose-us-page': WhyChooseUsPageContent,
  'resource-centre-page': ResourceCentrePageContent,
  'careers-page': CareersPageContent,
  'case-studies-page': CaseStudiesPageContent,
  posts: Post,
  authors: Author,
  categories: Category,
  tags: Tag,
  series: PostSeries,
  faqs: Faq,
  industries: Industry,
  locations: Location,
  'case-studies': CaseStudy,
  testimonials: Testimonial,
  'client-logos': ClientLogo,
  team: TeamMember,
  resources: Resource,
  jobs: Job,
  redirects: Redirect,
  'routing-rules': RoutingRule,
  'email-templates': EmailTemplate,
  users: User,
}

export function getResource(key: string) {
  const config = RESOURCE_MAP[key]
  const model = MODELS[key]
  if (!config || !model) throw new ApiError(404, 'not_found', 'Unknown collection')
  return { config, model, hooks: HOOKS[key] ?? { beforeSave: guardPublish } }
}

/** Reference lookup for `ref` fields; users are exposed as name-only options to permitted admins. */
export function getRefModel(key: string, user: SessionUser): { model: Model<any>; label: string } {
  if (key === 'users') {
    if (!can(user.role, 'leads.assign') && !can(user.role, 'leads.routing') && !can(user.role, 'users.manage')) throw forbidden()
    return { model: User, label: 'name' }
  }
  const { config, model } = getResource(key)
  if (!can(user.role, config.readPermission)) throw forbidden()
  return { model, label: config.titleField }
}
