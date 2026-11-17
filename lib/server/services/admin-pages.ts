import 'server-only'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { can } from '@/lib/rbac'
import type { SessionUser } from '../auth/session'
import { isValidObjectId } from '../db'
import { badRequest, escapeRegex, forbidden, notFound } from '../http'
import { PAGE_TYPES, Page, PageVersion } from '../models/content'
import { audit } from '../security/guards'
import { parseBlocks, parseFields } from '../validation/fields'
import { DEDICATED_PUBLIC_PATHS, isDedicatedPublicPath } from '@/lib/seo/route-ownership'
import { ensureSafetyTrustPage } from './safety-trust-provision'
import { ensureNewsletterPage } from './newsletter-provision'

const plain = <T>(v: unknown): T => JSON.parse(JSON.stringify(v))

const pathSchema = z
  .string()
  .trim()
  .max(160)
  .regex(/^\/([a-z0-9-]+(\/[a-z0-9-]+)*)?$/, 'Use a path like /services/hotels (lowercase, hyphens)')
  .refine((p) => !p.startsWith('/admin') && !p.startsWith('/api'), 'Reserved path')

function assertCmsPagePath(path: string) {
  if (isDedicatedPublicPath(path)) {
    throw badRequest('This URL is rendered by a dedicated page. Edit it from the matching Content section instead.', { path: 'This URL is managed by a dedicated page editor.' })
  }
}

function searchText(content: { title: string; blocks: { data: Record<string, unknown> }[] }) {
  const parts: string[] = [content.title]
  const walk = (v: unknown) => {
    if (typeof v === 'string') parts.push(v)
    else if (Array.isArray(v)) v.forEach(walk)
    else if (v && typeof v === 'object') Object.values(v).forEach(walk)
  }
  content.blocks.forEach((b) => walk(b.data))
  return parts.join(' ').replace(/\s+/g, ' ').slice(0, 20000)
}

function parseContent(input: unknown) {
  const body = z.object({ title: z.string().trim().min(1).max(200), blocks: z.unknown(), seo: z.unknown().optional() }).parse(input)
  const blocks = parseBlocks(body.blocks ?? [])
  const { seo } = parseFields([{ key: 'seo', label: 'SEO', kind: 'seo' }], { seo: body.seo ?? {} })
  return { title: body.title, blocks, seo: seo as Record<string, unknown> }
}

export async function listPages(user: SessionUser, sp: URLSearchParams) {
  if (!can(user.role, 'content.read')) throw forbidden()
  // Ensure the system Safety & Trust page is visible in admin even if a deploy-time
  // migration was skipped or the production database was initially empty.
  await Promise.all([ensureSafetyTrustPage(), ensureNewsletterPage()])
  const q = sp.get('q')?.trim().slice(0, 100)
  const filter: Record<string, unknown> = {
    path: { $nin: [...DEDICATED_PUBLIC_PATHS] },
    $nor: ['/blog/', '/careers/', '/industries/', '/case-studies/', '/resources/'].map((prefix) => ({ path: { $regex: `^${escapeRegex(prefix)}` } })),
  }
  if (q) filter.$or = [{ path: { $regex: escapeRegex(q), $options: 'i' } }, { 'draft.title': { $regex: escapeRegex(q), $options: 'i' } }]
  const items = await Page.find(filter).select('path pageType state draft.title published.title publishedAt updatedAt isSystem revision').sort({ path: 1 }).limit(500).lean()
  return plain<any[]>(items)
}

export async function getPage(user: SessionUser, id: string) {
  if (!can(user.role, 'content.read')) throw forbidden()
  if (!isValidObjectId(id)) throw notFound('Page')
  const page = await Page.findById(id).lean()
  if (!page) throw notFound('Page')
  assertCmsPagePath(page.path)
  const versions = await PageVersion.find({ pageId: id }).select('versionNumber kind changeNote createdAt').sort({ versionNumber: -1 }).limit(20).lean()
  return { page: plain<any>(page), versions: plain<any[]>(versions) }
}

export async function createPage(user: SessionUser, input: unknown) {
  if (!can(user.role, 'content.write')) throw forbidden()
  const body = z.object({ path: pathSchema, title: z.string().trim().min(1).max(200), pageType: z.enum(PAGE_TYPES).default('landing') }).parse(input)
  assertCmsPagePath(body.path)
  const page = await Page.create({ path: body.path, pageType: body.pageType, draft: { title: body.title, blocks: [], seo: {} }, state: 'draft', authorId: user.id, updatedById: user.id })
  await audit({ actor: user, action: 'create', entityType: 'page', entityId: String(page._id), summary: `Created page ${body.path}` })
  return plain<any>(page.toObject())
}

export async function saveDraft(user: SessionUser, id: string, input: unknown) {
  if (!can(user.role, 'content.write')) throw forbidden()
  if (!isValidObjectId(id)) throw notFound('Page')
  const page = await Page.findById(id)
  if (!page) throw notFound('Page')
  assertCmsPagePath(page.path)
  const content = parseContent(input)
  page.set('draft', content)
  page.searchText = searchText(content)
  page.revision = (page.revision ?? 1) + 1
  page.set('updatedById', user.id)
  if (page.state === 'published') page.state = 'published'
  await page.save()
  await PageVersion.create({ pageId: page._id, versionNumber: page.revision, snapshot: content, kind: 'save', authorId: user.id })
  await audit({ actor: user, action: 'update', entityType: 'page', entityId: id, summary: `Saved draft of ${page.path}` })
  return getPage(user, id)
}

export async function setPageState(user: SessionUser, id: string, action: 'publish' | 'unpublish' | 'submit' | 'restore', version?: number) {
  if (!isValidObjectId(id)) throw notFound('Page')
  const page = await Page.findById(id)
  if (!page) throw notFound('Page')
  assertCmsPagePath(page.path)

  if (action === 'submit') {
    if (!can(user.role, 'content.write')) throw forbidden()
    page.state = 'in_review'
  } else if (action === 'restore') {
    if (!can(user.role, 'content.write')) throw forbidden()
    const v = await PageVersion.findOne({ pageId: id, versionNumber: version }).lean<any>()
    if (!v) throw notFound('Version')
    page.set('draft', v.snapshot)
    page.revision = (page.revision ?? 1) + 1
    await PageVersion.create({ pageId: page._id, versionNumber: page.revision, snapshot: v.snapshot, kind: 'restore', restoredFromVersion: version, authorId: user.id })
  } else {
    if (!can(user.role, 'content.publish')) throw forbidden()
    if (action === 'publish') {
      const draft = plain<any>(page.toObject().draft)
      if (!draft?.title) throw badRequest('Add a page title before publishing')
      page.set('published', draft)
      page.state = 'published'
      page.publishedAt = new Date()
      page.set('reviewerId', user.id)
      page.revision = (page.revision ?? 1) + 1
      await PageVersion.create({ pageId: page._id, versionNumber: page.revision, snapshot: draft, kind: 'publish', authorId: user.id })
    } else {
      if (page.isSystem && page.path === '/') throw badRequest('The homepage cannot be unpublished')
      page.state = 'unpublished'
    }
  }
  page.set('updatedById', user.id)
  await page.save()
  await audit({ actor: user, action, entityType: 'page', entityId: id, summary: `${action} ${page.path}` })
  if (action === 'publish' || action === 'unpublish') revalidatePath(page.path)
  return getPage(user, id)
}

export async function deletePage(user: SessionUser, id: string) {
  if (!can(user.role, 'content.publish')) throw forbidden()
  if (!isValidObjectId(id)) throw notFound('Page')
  const page = await Page.findById(id)
  if (!page) throw notFound('Page')
  assertCmsPagePath(page.path)
  if (page.isSystem) throw badRequest('System pages cannot be deleted. Unpublish it instead.')
  await page.deleteOne()
  await PageVersion.deleteMany({ pageId: id })
  await audit({ actor: user, action: 'delete', entityType: 'page', entityId: id, summary: `Deleted page ${page.path}` })
  revalidatePath(page.path)
}
