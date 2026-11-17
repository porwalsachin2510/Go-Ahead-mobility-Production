import 'server-only'
import { cache } from 'react'
import { connectDb, isValidObjectId } from '../db'
import { Navigation, Page, Redirect, SiteSettings } from '../models/content'
import { AboutPageContent, AccommodationPageContent, TransportationPageContent, FootprintPageContent, Author, CareersPageContent, CaseStudiesPageContent, HomePageContent, CaseStudy, Category, ClientLogo, ContactPageContent, Faq, FaqPageContent, Industry, Job, Location, Post, PostSeries, Resource, ResourceCentrePageContent, Tag, TeamMember, Testimonial } from '../models/editorial'
import { escapeRegex } from '../http'
import type { Block } from '@/lib/blocks'
import { canonicalizeNavigationItems } from '@/lib/seo/about-url'
import { DEFAULT_HOME_PAGE_CONTENT } from '@/lib/homepage/defaults'
import { DEFAULT_ACCOMMODATION_PAGE_CONTENT } from '@/lib/accommodation/defaults'
import { DEFAULT_TRANSPORTATION_PAGE_CONTENT } from '@/lib/transportation/defaults'
import { DEFAULT_FOOTPRINT_PAGE_CONTENT } from '@/lib/footprint/defaults'
import { DEFAULT_INDUSTRY_PAGE_CONTENT } from '@/lib/industries/defaults'

/** Converts lean Mongo docs into plain JSON-safe objects for Server → Client component props. */
export function plain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

export type NavItem = { id: string; label: string; href: string; description?: string; newTab?: boolean; visible?: boolean; device?: string; children?: NavItem[] }

export type Settings = {
  brandName: string
  tagline: string
  siteUrl: string
  contact: Record<string, string>
  social: Record<string, string>
  header: { primaryCtaLabel: string; primaryCtaHref: string }
  footer: { blurb: string; newsletterHeading: string; newsletterCopy: string }
  seo: { defaultTitle: string; titleTemplate: string; defaultDescription: string; ogImage: string; robotsMode: string; extraDisallow: string[] }
  verticals: { accommodation: boolean; transport: boolean }
  maintenanceNotice: string
  analytics: { gaMeasurementId: string }
}

const FALLBACK_SETTINGS: Settings = {
  brandName: 'GoAhead Mobility',
  tagline: 'Global accommodation and local transportation for organisations.',
  siteUrl: '',
  contact: {},
  social: {},
  header: { primaryCtaLabel: 'Request a Proposal', primaryCtaHref: '/contact' },
  footer: { blurb: '', newsletterHeading: '', newsletterCopy: '' },
  seo: { defaultTitle: 'GoAhead Mobility', titleTemplate: '%s | GoAhead Mobility', defaultDescription: '', ogImage: '/og-default.png', robotsMode: 'allow', extraDisallow: [] },
  verticals: { accommodation: true, transport: true },
  maintenanceNotice: '',
  analytics: { gaMeasurementId: '' },
}

export const getSettings = cache(async (): Promise<Settings> => {
  try {
    await connectDb()
    const doc = await SiteSettings.findOne({ key: 'site' }).lean()
    return doc ? plain({ ...FALLBACK_SETTINGS, ...doc }) : FALLBACK_SETTINGS
  } catch (error) {
    console.error('[settings] falling back to defaults', error)
    return FALLBACK_SETTINGS
  }
})

export const getMenu = cache(async (menuKey: 'primary' | 'footer' | 'utility' | 'legal'): Promise<NavItem[]> => {
  try {
    await connectDb()
    const doc = await Navigation.findOne({ menuKey }).lean<{ _id?: unknown; updatedAt?: Date; items: NavItem[] }>()
    const sourceItems = doc?.items ?? []
    const normalizedItems = canonicalizeNavigationItems(sourceItems) as NavItem[]

    // Repair legacy hrefs in MongoDB as well as in the rendered response. This is
    // idempotent and conditional on updatedAt so a concurrent admin edit is not lost.
    if (doc?._id && JSON.stringify(normalizedItems) !== JSON.stringify(sourceItems)) {
      try {
        await Navigation.updateOne(
          { _id: doc._id, ...(doc.updatedAt ? { updatedAt: doc.updatedAt } : {}) },
          { $set: { items: normalizedItems } },
          { runValidators: true },
        )
      } catch (writeError) {
        // Keep the public navigation usable with canonical hrefs even if the
        // application DB role is temporarily read-only.
        console.error('[nav] failed to persist canonical About Us hrefs; rendered normalized menu', writeError)
      }
    }

    const filter = (items: NavItem[]): NavItem[] =>
      items.filter((i) => i.visible !== false).map((i) => ({ ...i, children: filter(i.children ?? []) }))
    return plain(filter(normalizedItems))
  } catch (error) {
    console.error('[nav] unavailable', error)
    return []
  }
})

export type PublicPage = { id: string; path: string; pageType: string; title: string; blocks: Block[]; seo: Record<string, any>; updatedAt: string }

function normalizePath(path: string) {
  const p = `/${path}`.replace(/\/+/g, '/').replace(/\/$/, '')
  return p === '' ? '/' : p.toLowerCase()
}

/** Published page resolution honouring scheduled publish/expiry windows (spec 7.4). */
export const getPublishedPage = cache(async (rawPath: string): Promise<PublicPage | null> => {
  await connectDb()
  const path = normalizePath(rawPath)
  const now = new Date()
  const doc = await Page.findOne({
    path,
    published: { $ne: null },
    // A page already has a live published snapshot; submitting a new draft for review
    // must not take that existing snapshot offline.
    $or: [{ state: { $in: ['published', 'in_review', 'approved'] } }, { state: 'scheduled', publishAt: { $lte: now } }],
    $and: [{ $or: [{ expireAt: null }, { expireAt: { $gt: now } }] }],
  }).lean<any>()
  if (!doc) return null
  return plain({
    id: String(doc._id),
    path: doc.path,
    pageType: doc.pageType,
    title: doc.published.title,
    blocks: (doc.published.blocks ?? []).filter((b: Block) => !b.hidden),
    seo: doc.published.seo ?? {},
    updatedAt: doc.updatedAt,
  })
})

export async function getDraftPageForPreview(id: string): Promise<PublicPage | null> {
  if (!isValidObjectId(id)) return null
  await connectDb()
  const doc = await Page.findById(id).lean<any>()
  if (!doc) return null
  return plain({ id: String(doc._id), path: doc.path, pageType: doc.pageType, title: doc.draft.title, blocks: (doc.draft.blocks ?? []).filter((b: Block) => !b.hidden), seo: doc.draft.seo ?? {}, updatedAt: doc.updatedAt })
}

export async function findRedirect(rawPath: string) {
  await connectDb()
  const path = normalizePath(rawPath)
  const rule = await Redirect.findOneAndUpdate({ sourcePath: path, enabled: true }, { $inc: { hitCount: 1 }, $set: { lastHitAt: new Date() } }, { returnDocument: 'after' }).lean<any>()
  return rule ? { targetUrl: rule.targetUrl as string, statusCode: rule.statusCode as number } : null
}

export async function listPublishedPagePaths() {
  await connectDb()
  const docs = await Page.find({ state: 'published', 'published.seo.noindex': { $ne: true } }, { path: 1, updatedAt: 1 }).lean<any[]>()
  return docs.map((d) => ({ path: d.path as string, updatedAt: d.updatedAt as Date }))
}

/* ----------------------------- Editorial collections ----------------------------- */

const verticalFilter = (v?: string) => (v ? { vertical: { $in: [v, 'both', 'general'] } } : {})

export const listIndustries = cache(async (limit = 24) => {
  await connectDb()
  return plain(await Industry.find({ status: 'published' }).sort({ sortOrder: 1 }).limit(limit).lean<any[]>())
})

export async function getIndustry(slug: string) {
  await connectDb()
  const doc = await Industry.findOne({ slug, status: 'published' }).lean<any>()
  return doc ? plain({ ...DEFAULT_INDUSTRY_PAGE_CONTENT, ...doc }) : null
}

export const listFaqs = cache(async (opts: { category?: string; vertical?: string; limit?: number; q?: string; path?: string } = {}) => {
  await connectDb()
  const filter: Record<string, unknown> = { status: 'published', ...verticalFilter(opts.vertical) }
  if (opts.category) filter.category = opts.category
  if (opts.path) filter.relatedPaths = opts.path
  if (opts.q) filter.$text = { $search: opts.q.slice(0, 100) }
  return plain(await Faq.find(filter).sort({ category: 1, sortOrder: 1 }).limit(Math.min(opts.limit ?? 100, 200)).lean<any[]>())
})

export async function getFaqPageData(opts: { q?: string; category?: string; topicCategories?: string[]; limit?: number } = {}) {
  await connectDb()
  const filter: Record<string, any> = { status: 'published' }
  const query = opts.q?.trim().slice(0, 100)
  if (query) {
    const pattern = { $regex: escapeRegex(query), $options: 'i' }
    filter.$or = [{ question: pattern }, { answer: pattern }, { keywords: pattern }]
  }
  if (opts.category) filter.category = opts.category

  const limit = Math.max(1, Math.min(opts.limit ?? 7, 200))
  const topicCategories = [...new Set((opts.topicCategories ?? []).filter((value) => typeof value === 'string' && value.length > 0))].slice(0, 30)
  const countPipeline = topicCategories.length ? [
    { $match: { status: 'published', category: { $in: topicCategories } } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ] : []

  const [items, total, counts] = await Promise.all([
    Faq.find(filter).sort({ isPopular: -1, sortOrder: 1, updatedAt: -1 }).limit(limit).lean<any[]>(),
    Faq.countDocuments(filter),
    countPipeline.length ? Faq.aggregate(countPipeline) : Promise.resolve([]),
  ])
  const topicCounts = Object.fromEntries(counts.map((item: any) => [String(item._id), Number(item.count)]))
  return plain({ items, total, topicCounts, limit })
}

export const getFaqPageContent = cache(async () => {
  await connectDb()
  const doc = await FaqPageContent.findOne({ key: 'faq-page', status: 'published' }).lean<any>()
  return doc ? plain(doc) : null
})

export const listLocations = cache(async (vertical?: string) => {
  await connectDb()
  const filter: Record<string, unknown> = { status: 'published' }
  if (vertical) filter.vertical = { $in: [vertical, 'both'] }
  return plain(await Location.find(filter).sort({ country: 1, sortOrder: 1, city: 1 }).lean<any[]>())
})

export const getContactPageContent = cache(async () => {
  await connectDb()
  const doc = await ContactPageContent.findOne({ key: 'contact-page', status: 'published' }).lean<any>()
  return doc ? plain(doc) : null
})

export async function listOfficeLocations() {
  await connectDb()
  return plain(await Location.find({ status: 'published', officeEnabled: true, city: { $ne: '' } }).sort({ sortOrder: 1, city: 1 }).limit(12).lean<any[]>())
}

export const getHomePageContent = cache(async () => {
  await connectDb()
  const existing = await HomePageContent.findOne({ key: 'home-page' }).select('-updatedById -__v').lean<any>()
  if (existing) return plain(existing)

  try {
    const created = await HomePageContent.create(DEFAULT_HOME_PAGE_CONTENT)
    return plain(created.toObject())
  } catch (error) {
    // Another first request may have created the singleton concurrently.
    if ((error as { code?: number })?.code !== 11000) throw error
    const raced = await HomePageContent.findOne({ key: 'home-page' }).select('-updatedById -__v').lean<any>()
    if (raced) return plain(raced)
    throw error
  }
})

export const getAccommodationPageContent = cache(async () => {
  await connectDb()
  const existing = await AccommodationPageContent.findOne({ key: 'accommodation-page' }).select('-updatedById -__v').lean<any>()
  if (existing) return plain({ ...DEFAULT_ACCOMMODATION_PAGE_CONTENT, ...existing })

  try {
    const created = await AccommodationPageContent.create(DEFAULT_ACCOMMODATION_PAGE_CONTENT)
    return plain({ ...DEFAULT_ACCOMMODATION_PAGE_CONTENT, ...created.toObject() })
  } catch (error) {
    // Another first request or the admin editor may have created the singleton concurrently.
    if ((error as { code?: number })?.code !== 11000) throw error
    const raced = await AccommodationPageContent.findOne({ key: 'accommodation-page' }).select('-updatedById -__v').lean<any>()
    if (raced) return plain({ ...DEFAULT_ACCOMMODATION_PAGE_CONTENT, ...raced })
    throw error
  }
})

export const getTransportationPageContent = cache(async () => {
  await connectDb()
  const existing = await TransportationPageContent.findOne({ key: 'transportation-page' }).select('-updatedById -__v').lean<any>()
  if (existing) return plain({ ...DEFAULT_TRANSPORTATION_PAGE_CONTENT, ...existing })

  try {
    const created = await TransportationPageContent.create(DEFAULT_TRANSPORTATION_PAGE_CONTENT)
    return plain({ ...DEFAULT_TRANSPORTATION_PAGE_CONTENT, ...created.toObject() })
  } catch (error) {
    // Concurrent first reads/admin saves are safe because the singleton key is unique.
    if ((error as { code?: number })?.code !== 11000) throw error
    const raced = await TransportationPageContent.findOne({ key: 'transportation-page' }).select('-updatedById -__v').lean<any>()
    if (raced) return plain({ ...DEFAULT_TRANSPORTATION_PAGE_CONTENT, ...raced })
    throw error
  }
})

export const getFootprintPageContent = cache(async () => {
  await connectDb()
  const existing = await FootprintPageContent.findOne({ key: 'footprint-page' }).select('-updatedById -__v').lean<any>()
  if (existing) return plain({ ...DEFAULT_FOOTPRINT_PAGE_CONTENT, ...existing })

  try {
    const created = await FootprintPageContent.create(DEFAULT_FOOTPRINT_PAGE_CONTENT)
    return plain({ ...DEFAULT_FOOTPRINT_PAGE_CONTENT, ...created.toObject() })
  } catch (error) {
    // The singleton key makes parallel first reads and admin writes safe.
    if ((error as { code?: number })?.code !== 11000) throw error
    const raced = await FootprintPageContent.findOne({ key: 'footprint-page' }).select('-updatedById -__v').lean<any>()
    if (raced) return plain({ ...DEFAULT_FOOTPRINT_PAGE_CONTENT, ...raced })
    throw error
  }
})

export const getAboutPageContent = cache(async () => {
  await connectDb()
  const doc = await AboutPageContent.findOne({ key: 'about-us', status: 'published' }).lean<any>()
  return doc ? plain(doc) : null
})

export const listTeam = cache(async () => {
  await connectDb()
  return plain(await TeamMember.find({ status: 'published' }).sort({ sortOrder: 1 }).lean<any[]>())
})

export const listProof = cache(async (vertical?: string) => {
  await connectDb()
  const now = new Date()
  const permission = { permissionStatus: 'granted', $or: [{ reviewAt: null }, { reviewAt: { $gt: now } }] }
  const [testimonials, caseStudies] = await Promise.all([
    Testimonial.find({ status: 'published', ...permission, ...verticalFilter(vertical) }).limit(6).lean<any[]>(),
    CaseStudy.find({ status: 'published', clientApproved: true, ...verticalFilter(vertical) }).sort({ updatedAt: -1 }).limit(3).lean<any[]>(),
  ])
  return plain({ testimonials, caseStudies })
})

export const listLogos = cache(async () => {
  await connectDb()
  const now = new Date()
  return plain(await ClientLogo.find({ status: 'published', permissionStatus: 'granted', $or: [{ reviewAt: null }, { reviewAt: { $gt: now } }] }).sort({ sortOrder: 1 }).lean<any[]>())
})

export async function listIndustryTestimonials(industrySlug: string) {
  await connectDb()
  const now = new Date()
  const filter = {
    status: 'published',
    permissionStatus: 'granted',
    $and: [
      { $or: [{ reviewAt: null }, { reviewAt: { $gt: now } }] },
      { $or: [{ industrySlugs: industrySlug }, { industrySlugs: { $exists: false } }, { industrySlugs: { $size: 0 } }] },
    ],
  }
  return plain(await Testimonial.find(filter).sort({ updatedAt: -1 }).limit(6).lean<any[]>())
}

export async function listIndustryLogos(industrySlug: string) {
  await connectDb()
  const now = new Date()
  const filter = {
    status: 'published',
    permissionStatus: 'granted',
    $and: [
      { $or: [{ reviewAt: null }, { reviewAt: { $gt: now } }] },
      { $or: [{ industrySlugs: industrySlug }, { industrySlugs: { $exists: false } }, { industrySlugs: { $size: 0 } }] },
    ],
  }
  return plain(await ClientLogo.find(filter).sort({ sortOrder: 1 }).limit(16).lean<any[]>())
}

export async function listCaseStudies() {
  await connectDb()
  const fields = 'slug title summary image vertical category cardLabel locationLabel fleetSize projectDuration employeesImpacted industrySlugs results disclaimer featured sortOrder'
  return plain(await CaseStudy.find({ status: 'published', clientApproved: true }).select(fields).sort({ featured: -1, sortOrder: 1, updatedAt: -1 }).lean<any[]>())
}

export async function listIndustryCaseStudies(industrySlug: string, limit = 3) {
  await connectDb()
  const safeLimit = Math.min(12, Math.max(0, Math.floor(limit)))
  if (!safeLimit || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(industrySlug)) return []
  const fields = 'slug title summary image vertical category cardLabel results disclaimer industrySlugs'
  return plain(await CaseStudy.find({
    status: 'published',
    clientApproved: true,
    industrySlugs: industrySlug,
  }).select(fields).sort({ featured: -1, sortOrder: 1, updatedAt: -1 }).limit(safeLimit).lean<any[]>())
}


export const getCaseStudiesPageContent = cache(async () => {
  await connectDb()
  const doc = await CaseStudiesPageContent.findOne({ key: 'case-studies-page', status: 'published' }).select('-updatedById -__v').lean<any>()
  return doc ? plain(doc) : null
})

export async function getCaseStudy(slug: string) {
  await connectDb()
  return plain(await CaseStudy.findOne({ slug, status: 'published', clientApproved: true }).lean<any>())
}

/* ----------------------------------- Blog ---------------------------------------- */

/** Scheduled posts become visible once publishAt passes, without needing a cron job. */
function livePostFilter() {
  const now = new Date()
  return { $or: [{ state: 'published' }, { state: 'scheduled', publishAt: { $lte: now } }] }
}

const POST_LIST_FIELDS = 'title slug excerpt heroImage heroAlt authorId categoryIds tagIds vertical publishedAt publishAt readingMinutes featured pinnedHome'

export async function listPosts(opts: { page?: number; limit?: number; category?: string; tag?: string; author?: string; vertical?: string; q?: string; sort?: 'latest' | 'popular' } = {}) {
  await connectDb()
  const limit = Math.min(Math.max(opts.limit ?? 9, 1), 24)
  const page = Math.max(opts.page ?? 1, 1)
  const filter: Record<string, unknown> = { ...livePostFilter(), ...verticalFilter(opts.vertical) }
  if (opts.category) {
    const cat = await Category.findOne({ slug: opts.category }).lean<any>()
    if (!cat) return { items: [], total: 0, page, pages: 0, term: null }
    filter.categoryIds = cat._id
  }
  if (opts.tag) {
    const tag = await Tag.findOne({ slug: opts.tag }).lean<any>()
    if (!tag) return { items: [], total: 0, page, pages: 0, term: null }
    filter.tagIds = tag._id
  }
  if (opts.author) {
    const author = await Author.findOne({ slug: opts.author, status: 'published' }).lean<any>()
    if (!author) return { items: [], total: 0, page, pages: 0, term: null }
    filter.authorId = author._id
  }
  if (opts.q) {
    const rx = { $regex: escapeRegex(opts.q.trim().slice(0, 80)), $options: 'i' }
    filter.$and = [{ $or: [{ title: rx }, { excerpt: rx }, { subtitle: rx }, { content: rx }] }]
  }
  const [items, total] = await Promise.all([
    Post.find(filter, POST_LIST_FIELDS).sort(opts.sort === 'popular' ? { views: -1, publishedAt: -1, publishAt: -1 } : { publishedAt: -1, publishAt: -1 }).skip((page - 1) * limit).limit(limit).populate('authorId', 'name slug avatar').populate('categoryIds', 'name slug').lean<any[]>(),
    Post.countDocuments(filter),
  ])
  return plain({ items, total, page, pages: Math.ceil(total / limit) })
}

export const listHomePosts = cache(async (limit = 3, vertical?: string) => {
  await connectDb()
  const base = { ...livePostFilter(), ...verticalFilter(vertical) }
  const pinned = await Post.find({ ...base, pinnedHome: true }, POST_LIST_FIELDS).sort({ publishedAt: -1 }).limit(limit).populate('categoryIds', 'name slug').lean<any[]>()
  if (pinned.length >= limit) return plain(pinned)
  const rest = await Post.find({ ...base, _id: { $nin: pinned.map((p) => p._id) } }, POST_LIST_FIELDS).sort({ publishedAt: -1 }).limit(limit - pinned.length).populate('categoryIds', 'name slug').lean<any[]>()
  return plain([...pinned, ...rest])
})

export async function getPost(slug: string) {
  await connectDb()
  const post = await Post.findOne({ slug, ...livePostFilter() }).populate('authorId').populate('categoryIds', 'name slug').populate('tagIds', 'name slug').lean<any>()
  if (!post) return null
  const [related, series] = await Promise.all([relatedPosts(post), seriesContext(post)])
  const when = post.publishedAt ?? post.publishAt
  const [older, newer] = when
    ? await Promise.all([
        Post.findOne({ ...livePostFilter(), _id: { $ne: post._id }, publishedAt: { $lt: when } }, 'title slug').sort({ publishedAt: -1 }).lean<any>(),
        Post.findOne({ ...livePostFilter(), _id: { $ne: post._id }, publishedAt: { $gt: when } }, 'title slug').sort({ publishedAt: 1 }).lean<any>(),
      ])
    : [null, null]
  return plain({ post, related, older, newer, series })
}

const RELATED_LIMIT = 3

/** Hand-picked posts first, then the strongest topical matches: shared tags weigh most, then categories, then vertical. */
async function relatedPosts(post: any) {
  const live = livePostFilter()
  const manual = post.relatedPostIds?.length
    ? await Post.find({ ...live, _id: { $in: post.relatedPostIds, $ne: post._id } }, POST_LIST_FIELDS).populate('categoryIds', 'name slug').lean<any[]>()
    : []
  const manualOrdered = (post.relatedPostIds ?? []).map((id: any) => manual.find((m) => String(m._id) === String(id))).filter(Boolean).slice(0, RELATED_LIMIT)
  const need = RELATED_LIMIT - manualOrdered.length
  if (need <= 0) return manualOrdered
  const tagIds = (post.tagIds ?? []).map((t: any) => t._id)
  const catIds = (post.categoryIds ?? []).map((c: any) => c._id)
  const overlap = (field: string, ids: unknown[], weight: number) => ({ $multiply: [{ $size: { $setIntersection: [{ $ifNull: [`$${field}`, []] }, ids] } }, weight] })
  const scored = await Post.aggregate([
    { $match: { $and: [live, { _id: { $nin: [post._id, ...manualOrdered.map((m: any) => m._id)] } }, { $or: [{ tagIds: { $in: tagIds } }, { categoryIds: { $in: catIds } }, { vertical: post.vertical }] }] } },
    { $addFields: { _score: { $add: [overlap('tagIds', tagIds, 3), overlap('categoryIds', catIds, 2), { $cond: [{ $eq: ['$vertical', post.vertical] }, 1, 0] }] } } },
    { $sort: { _score: -1, publishedAt: -1 } },
    { $limit: need },
    { $project: { _id: 1 } },
  ])
  const ids = scored.map((s) => String(s._id))
  const docs = ids.length ? await Post.find({ _id: { $in: ids } }, POST_LIST_FIELDS).populate('categoryIds', 'name slug').lean<any[]>() : []
  return [...manualOrdered, ...ids.map((id) => docs.find((d) => String(d._id) === id)).filter(Boolean)]
}

async function seriesContext(post: any) {
  if (!post.seriesId) return null
  const series = await PostSeries.findOne({ _id: post.seriesId, status: 'published' }, 'title slug description').lean<any>()
  if (!series) return null
  const parts = await Post.find({ ...livePostFilter(), seriesId: series._id }, 'title slug seriesOrder').sort({ seriesOrder: 1, publishedAt: 1 }).lean<any[]>()
  return { ...series, parts }
}

export async function getSeries(slug: string) {
  await connectDb()
  const series = await PostSeries.findOne({ slug, status: 'published' }).lean<any>()
  if (!series) return null
  const posts = await Post.find({ ...livePostFilter(), seriesId: series._id }, `${POST_LIST_FIELDS} seriesOrder`).sort({ seriesOrder: 1, publishedAt: 1 }).populate('categoryIds', 'name slug').lean<any[]>()
  return plain({ series, posts })
}

export const listPublicSeries = cache(async () => {
  await connectDb()
  const [series, counts] = await Promise.all([
    PostSeries.find({ status: 'published' }, 'title slug description heroImage updatedAt seo').sort({ sortOrder: 1, title: 1 }).lean<any[]>(),
    Post.aggregate([{ $match: { $and: [livePostFilter(), { seriesId: { $ne: null } }] } }, { $group: { _id: '$seriesId', n: { $sum: 1 }, last: { $max: '$publishedAt' } } }]),
  ])
  const byId = new Map(counts.map((c) => [String(c._id), c]))
  return plain(series.map((s) => ({ ...s, postCount: byId.get(String(s._id))?.n ?? 0, lastPublishedAt: byId.get(String(s._id))?.last ?? null })).filter((s) => s.postCount > 0))
})

export const listPopularPosts = cache(async (limit = 5) => {
  await connectDb()
  return plain(await Post.find({ ...livePostFilter(), views: { $gt: 0 } }, 'title slug publishedAt readingMinutes views').sort({ views: -1 }).limit(Math.min(limit, 10)).lean<any[]>())
})

/** Full posts for RSS and the news sitemap; noindexed posts are excluded so feeds never advertise hidden pages. */
export async function listFeedPosts(opts: { limit?: number; since?: Date } = {}) {
  await connectDb()
  const filter: Record<string, unknown> = { $and: [livePostFilter(), { 'seo.noindex': { $ne: true } }, ...(opts.since ? [{ publishedAt: { $gte: opts.since } }] : [])] }
  return plain(
    await Post.find(filter, 'title slug excerpt content heroImage heroAlt publishedAt contentUpdatedAt updatedAt authorId categoryIds tagIds language')
      .sort({ publishedAt: -1 })
      .limit(Math.min(opts.limit ?? 50, 1000))
      .populate('authorId', 'name')
      .populate('categoryIds', 'name')
      .populate('tagIds', 'name')
      .lean<any[]>(),
  )
}

export async function recordPostView(slug: string) {
  await connectDb()
  const res = await Post.updateOne({ slug, ...livePostFilter() }, { $inc: { views: 1 } })
  return res.matchedCount > 0
}

/** Counts only live posts per term so archive pages and the sitemap never advertise empty listings. */
export async function livePostCounts(field: 'categoryIds' | 'tagIds' | 'authorId'): Promise<Map<string, number>> {
  await connectDb()
  const rows = await Post.aggregate([{ $match: livePostFilter() }, ...(field === 'authorId' ? [] : [{ $unwind: `$${field}` }]), { $group: { _id: `$${field}`, n: { $sum: 1 } } }])
  return new Map(rows.filter((r) => r._id).map((r) => [String(r._id), r.n as number]))
}

export const listPublicAuthors = cache(async () => {
  await connectDb()
  const [authors, counts] = await Promise.all([Author.find({ status: 'published' }, 'slug name jobTitle bio avatar expertise').sort({ name: 1 }).lean<any[]>(), livePostCounts('authorId')])
  return plain(authors.map((a) => ({ ...a, postCount: counts.get(String(a._id)) ?? 0 })).filter((a) => a.postCount > 0))
})

export const listTermsWithCounts = cache(async (kind: 'category' | 'tag') => {
  await connectDb()
  const M = kind === 'category' ? Category : Tag
  const [terms, counts] = await Promise.all([M.find({}, 'slug name description noindex sortOrder updatedAt').sort({ sortOrder: 1, name: 1 }).lean<any[]>(), livePostCounts(kind === 'category' ? 'categoryIds' : 'tagIds')])
  return plain(terms.map((t) => ({ ...t, postCount: counts.get(String(t._id)) ?? 0 })))
})

export async function getTaxonomy(kind: 'category' | 'tag' | 'author', slug: string) {
  await connectDb()
  const M = kind === 'category' ? Category : kind === 'tag' ? Tag : Author
  return plain(await M.findOne({ slug }).lean<any>())
}

export const listCategories = cache(async () => {
  await connectDb()
  return plain(await Category.find({}).sort({ sortOrder: 1, name: 1 }).lean<any[]>())
})

/* --------------------------------- Resources ------------------------------------- */

export async function listResources(opts: { type?: string; vertical?: string; limit?: number; q?: string; category?: string; fileType?: string } = {}) {
  await connectDb()
  const filter: Record<string, any> = {
    status: 'published',
    ...verticalFilter(opts.vertical),
  }
  if (opts.type) filter.resourceType = opts.type
  if (opts.q) {
    const query = { $regex: escapeRegex(opts.q.slice(0, 80)), $options: 'i' }
    filter.$and ??= []
    filter.$and.push({ $or: [{ title: query }, { summary: query }, { body: query }, { category: query }, { tags: query }, { fileFormat: query }] })
  }
  if (opts.fileType) filter.fileFormat = { $regex: escapeRegex(opts.fileType.slice(0, 20)), $options: 'i' }
  if (opts.category) {
    const categoryRules: Record<string, any> = {
      'guides-playbooks': { $or: [{ resourceType: { $in: ['guide', 'checklist'] } }, { category: /guide|playbook/i }, { tags: /guide|playbook/i }] },
      whitepapers: { $or: [{ resourceType: 'whitepaper' }, { category: /white.?paper/i }, { tags: /white.?paper/i }] },
      'case-studies': { $or: [{ resourceType: 'case_study' }, { category: /case study/i }] },
      templates: { $or: [{ resourceType: 'template' }, { category: /template/i }, { tags: /template/i }] },
      'reports-insights': { $or: [{ resourceType: { $in: ['article', 'tool'] } }, { category: /report|insight/i }, { tags: /report|insight/i }] },
      'videos-webinars': { $or: [{ resourceType: 'webinar' }, { category: /video|webinar/i }, { tags: /video|webinar/i }] },
    }
    const rule = categoryRules[opts.category]
    filter.$and ??= []
    if (rule) filter.$and.push(rule)
    else {
      const term = escapeRegex(opts.category.replace(/-/g, ' ').trim())
      const matcher = { $regex: term, $options: 'i' }
      filter.$and.push({ $or: [{ category: matcher }, { tags: matcher }] })
    }
  }
  return plain(await Resource.find(filter).sort({ featured: -1, sortOrder: 1, publishedAt: -1 }).limit(Math.min(opts.limit ?? 48, 100)).lean<any[]>())
}

export async function listResourceCentreItems(opts: { type?: string; vertical?: string; limit?: number; q?: string; category?: string; fileType?: string } = {}) {
  const limit = Math.min(opts.limit ?? 100, 100)
  const resources = await listResources({ ...opts, limit })
  const includeCaseStudies = (!opts.category || opts.category === 'case-studies') && !opts.fileType && (!opts.type || opts.type === 'case_study')
  if (!includeCaseStudies) return resources

  await connectDb()
  const caseFilter: Record<string, any> = { status: 'published', clientApproved: true }
  if (opts.q) {
    const query = { $regex: escapeRegex(opts.q.slice(0, 80)), $options: 'i' }
    caseFilter.$or = [{ title: query }, { summary: query }, { challenge: query }, { approach: query }, { outcome: query }]
  }
  const studies = await CaseStudy.find(caseFilter).sort({ updatedAt: -1 }).limit(limit).lean<any[]>()
  const studyItems = studies.map((item) => ({
    _id: String(item._id),
    slug: item.slug,
    title: item.title,
    summary: item.summary,
    image: item.image,
    resourceType: 'case_study',
    category: 'case study',
    href: `/case-studies/${item.slug}`,
    featured: false,
    gated: false,
    publishedAt: item.updatedAt,
    updatedAt: item.updatedAt,
    tags: item.industrySlugs ?? [],
  }))
  return plain([...resources, ...studyItems].sort((a: any, b: any) => Number(Boolean(b.featured)) - Number(Boolean(a.featured))).slice(0, limit))
}

export const getResourceCentrePageContent = cache(async () => {
  await connectDb()
  const doc = await ResourceCentrePageContent.findOne({ key: 'resource-centre', status: 'published' }).lean<any>()
  return doc ? plain(doc) : null
})

export async function getResource(slug: string) {
  await connectDb()
  return plain(await Resource.findOne({ slug, status: 'published' }).lean<any>())
}

export async function getResourceDetail(slug: string) {
  await connectDb()
  const resource = await Resource.findOne({ slug, status: 'published' }).lean<any>()
  if (!resource) return null

  const explicitIds = Array.isArray(resource.relatedResourceIds)
    ? resource.relatedResourceIds.map((id: unknown) => String(id)).filter((id: string) => isValidObjectId(id))
    : []
  const explicitDocs = explicitIds.length
    ? await Resource.find({ _id: { $in: explicitIds, $ne: resource._id }, status: 'published' }).lean<any[]>()
    : []
  const explicitById = new Map(explicitDocs.map((item: any) => [String(item._id), item]))
  const related: any[] = explicitIds.map((id: string) => explicitById.get(id)).filter(Boolean)

  const terms = [resource.resourceType, resource.category, ...(resource.tags ?? [])].filter(Boolean).join(' ').toLowerCase()
  const normalizedTerms = terms.split(' ').join('').split('-').join('').split('_').join('')
  const isWhitePaper = normalizedTerms.includes('whitepaper')
  const isTemplate = !isWhitePaper && normalizedTerms.includes('template')
  const isWebinar = resource.resourceType === 'webinar'
  const isReport = !isWhitePaper && !isTemplate && !isWebinar && (['tool', 'article'].includes(resource.resourceType) || /report|insight/.test(normalizedTerms))
  const preferredTypes = isWebinar ? ['webinar'] : isReport ? ['tool', 'article'] : isTemplate ? ['template'] : isWhitePaper ? ['whitepaper'] : ['guide', 'checklist']

  if (related.length < 3) {
    const excluded = [resource._id, ...related.map((item: any) => item._id)]
    const relatedFilter: Record<string, any> = { status: 'published', _id: { $nin: excluded } }
    if (resource.category) {
      relatedFilter.$or = [
        { category: resource.category },
        ...(Array.isArray(resource.tags) && resource.tags.length ? [{ tags: { $in: resource.tags } }] : []),
        { resourceType: { $in: preferredTypes } },
      ]
    } else {
      relatedFilter.resourceType = { $in: preferredTypes }
    }
    let more = await Resource.find(relatedFilter)
      .sort({ featured: -1, sortOrder: 1, publishedAt: -1 })
      .limit(3 - related.length)
      .lean<any[]>()
    if (more.length < 3 - related.length) {
      const moreIds = [...excluded, ...more.map((item: any) => item._id)]
      const fallbackTypes = isWebinar ? ['webinar'] : isReport ? ['tool', 'article'] : isTemplate ? ['template'] : isWhitePaper ? ['whitepaper', 'guide', 'checklist'] : ['guide', 'checklist']
      const fallback = await Resource.find({
        status: 'published',
        resourceType: { $in: fallbackTypes },
        _id: { $nin: moreIds },
      }).sort({ featured: -1, sortOrder: 1, publishedAt: -1 })
        .limit(3 - related.length - more.length)
        .lean<any[]>()
      more = [...more, ...fallback]
    }
    related.push(...more)
  }

  const navigationFilter: Record<string, any> = { status: 'published' }
  if (isWhitePaper) {
    navigationFilter.$or = [{ resourceType: 'whitepaper' }, { category: /white.?paper/i }, { tags: /white.?paper/i }]
  } else if (isTemplate) {
    navigationFilter.$or = [{ resourceType: 'template' }, { category: /template/i }, { tags: /template/i }]
  } else if (isWebinar) {
    navigationFilter.$or = [{ resourceType: 'webinar' }, { category: /video|webinar/i }, { tags: /video|webinar/i }]
  } else if (isReport) {
    navigationFilter.$or = [{ resourceType: { $in: ['tool', 'article'] } }, { category: /report|insight/i }, { tags: /report|insight/i }]
  } else if (['guide', 'checklist'].includes(resource.resourceType)) {
    navigationFilter.resourceType = { $in: ['guide', 'checklist'] }
  }
  const navigation = await Resource.find(navigationFilter)
    .sort({ sortOrder: 1, publishedAt: -1, title: 1 })
    .select('slug title')
    .limit(200)
    .lean<any[]>()
  const currentIndex = navigation.findIndex((item: any) => item.slug === resource.slug)

  return plain({
    ...resource,
    relatedResources: related.slice(0, 3),
    previousResource: currentIndex > 0 ? navigation[currentIndex - 1] : null,
    nextResource: currentIndex >= 0 && currentIndex < navigation.length - 1 ? navigation[currentIndex + 1] : null,
  })
}

export const getCareersPageContent = cache(async () => {
  await connectDb()
  const doc = await CareersPageContent.findOne({ key: 'careers-page', status: 'published' }).lean<any>()
  return doc ? plain(doc) : null
})

/* ---------------------------------- Careers -------------------------------------- */

function openJobFilter() {
  const now = new Date()
  return { status: 'published', $or: [{ closeAt: null }, { closeAt: { $gt: now } }] }
}

export async function listOpenJobs() {
  await connectDb()
  return plain(await Job.find(openJobFilter()).sort({ createdAt: -1 }).lean<any[]>())
}

export async function getOpenJob(slug: string) {
  await connectDb()
  return plain(await Job.findOne({ slug, ...openJobFilter() }).lean<any>())
}
