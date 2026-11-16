import 'server-only'
import mongoose from 'mongoose'
import { connectDb, isValidObjectId } from '@/lib/server/db'
import { badRequest, notFound } from '@/lib/server/http'
import { Author, BlogComment, Category, Post, Tag } from '@/lib/server/models/editorial'
import { SiteSettings } from '@/lib/server/models/content'
import { audit } from '@/lib/server/security/guards'
import { sha256 } from '@/lib/server/security/crypto'
import type { SessionUser } from '@/lib/server/auth/session'
import { recordSlugChange } from '@/lib/server/services/blog-slugs'

type Actor = SessionUser

/* ------------------------------------------------------------------ */
/* Category and tag merge                                              */
/* ------------------------------------------------------------------ */

export async function mergeTerms(actor: Actor, kind: 'category' | 'tag', sourceIds: string[], targetId: string) {
  const ids = [...new Set(sourceIds)].filter((id) => id !== targetId)
  if (!ids.length) throw badRequest('Choose at least one term to merge into the target')
  if (![targetId, ...ids].every(isValidObjectId)) throw badRequest('Invalid term id')
  await connectDb()
  const TermModel = kind === 'category' ? Category : Tag
  const field = kind === 'category' ? 'categoryIds' : 'tagIds'
  const target = await TermModel.findById(targetId).lean<any>()
  if (!target) throw notFound('Target term')
  const sources = await TermModel.find({ _id: { $in: ids } }).lean<any[]>()
  if (sources.length !== ids.length) throw notFound('One of the source terms')

  const sourceOids = sources.map((s) => s._id)
  const targetOid = new mongoose.Types.ObjectId(targetId)
  const affected = await Post.find({ [field]: { $in: sourceOids } }, { _id: 1, [field]: 1 }).lean<any[]>()
  // Replace in place to keep the target's position (the first category is the primary one).
  for (const p of affected) {
    const seen = new Set<string>()
    const next: mongoose.Types.ObjectId[] = []
    for (const id of p[field] as mongoose.Types.ObjectId[]) {
      const resolved = sourceOids.some((s) => s.equals(id)) ? targetOid : id
      if (seen.has(String(resolved))) continue
      seen.add(String(resolved))
      next.push(resolved)
    }
    await Post.updateOne({ _id: p._id }, { $set: { [field]: next } })
  }

  for (const s of sources) {
    if (s.slug !== target.slug) await recordSlugChange(kind, s.slug, target.slug, actor.id).catch(() => {})
  }
  await TermModel.deleteMany({ _id: { $in: sourceOids } })
  await audit({ actor, action: 'merge', entityType: kind, entityId: targetId, summary: `Merged ${sources.map((s) => s.name).join(', ')} into ${target.name} (${affected.length} posts)` })
  return { merged: sources.length, postsUpdated: affected.length, target: target.name }
}

export async function listTermsWithCounts(kind: 'category' | 'tag') {
  await connectDb()
  const TermModel = kind === 'category' ? Category : Tag
  const field = kind === 'category' ? '$categoryIds' : '$tagIds'
  const [terms, counts] = await Promise.all([
    TermModel.find({}, { name: 1, slug: 1 }).sort({ name: 1 }).lean<any[]>(),
    Post.aggregate([{ $unwind: field }, { $group: { _id: field, n: { $sum: 1 } } }]),
  ])
  const byId = new Map(counts.map((c: any) => [String(c._id), c.n as number]))
  return terms.map((t) => ({ _id: String(t._id), name: t.name, slug: t.slug, posts: byId.get(String(t._id)) ?? 0 }))
}

/* ------------------------------------------------------------------ */
/* Markdown / JSON import and export                                   */
/* ------------------------------------------------------------------ */

const EXPORT_FIELDS = ['title', 'slug', 'subtitle', 'excerpt', 'content', 'language', 'heroImage', 'heroAlt', 'heroCaption', 'vertical', 'industrySlugs', 'state', 'publishedAt', 'references', 'cta', 'seo'] as const

export async function exportPosts(ids?: string[]) {
  await connectDb()
  const filter = ids?.length ? { _id: { $in: ids.filter(isValidObjectId) } } : {}
  const posts = await Post.find(filter)
    .populate('authorId', 'slug name')
    .populate('categoryIds', 'slug name')
    .populate('tagIds', 'slug name')
    .sort({ updatedAt: -1 })
    .limit(2000)
    .lean<any[]>()
  return posts.map((p) => {
    const out: Record<string, unknown> = {}
    for (const f of EXPORT_FIELDS) out[f] = p[f]
    out.author = p.authorId?.slug ?? null
    out.categories = (p.categoryIds ?? []).map((c: any) => c.slug)
    out.tags = (p.tagIds ?? []).map((t: any) => t.slug)
    return out
  })
}

function yamlValue(v: unknown) {
  if (Array.isArray(v)) return `[${v.map((x) => JSON.stringify(String(x))).join(', ')}]`
  if (v instanceof Date) return v.toISOString()
  return JSON.stringify(v ?? '')
}

export function toMarkdown(post: Record<string, any>) {
  const front = ['title', 'slug', 'subtitle', 'excerpt', 'author', 'categories', 'tags', 'state', 'publishedAt', 'heroImage', 'heroAlt', 'vertical']
    .filter((k) => post[k] !== undefined && post[k] !== null && post[k] !== '')
    .map((k) => `${k}: ${yamlValue(post[k])}`)
  return `---\n${front.join('\n')}\n---\n\n${post.content ?? ''}\n`
}

/** Parses the simple front matter written by toMarkdown (and common hand-written variants). */
export function parseMarkdown(source: string): Record<string, any> {
  const match = source.replace(/^\uFEFF/, '').match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) return { content: source.trim() }
  const data: Record<string, any> = { content: match[2].trim() }
  for (const line of match[1].split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/)
    if (!m) continue
    const raw = m[2].trim()
    let value: unknown = raw
    if (raw.startsWith('[') && raw.endsWith(']')) {
      try {
        value = JSON.parse(raw)
      } catch {
        value = raw.slice(1, -1).split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean)
      }
    } else if (raw.startsWith('"')) {
      try {
        value = JSON.parse(raw)
      } catch {
        value = raw.slice(1, -1)
      }
    } else if (raw.startsWith("'") && raw.endsWith("'")) value = raw.slice(1, -1)
    data[m[1]] = value
  }
  return data
}

const slugify = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-').slice(0, 96)

async function resolveTerms(kind: 'category' | 'tag', values: unknown, create: boolean) {
  if (!Array.isArray(values)) return []
  const TermModel = kind === 'category' ? Category : Tag
  const ids: mongoose.Types.ObjectId[] = []
  for (const raw of values.slice(0, 20)) {
    const name = String(raw).trim()
    const slug = slugify(name)
    if (!slug) continue
    let term = await TermModel.findOne({ slug }).lean<any>()
    if (!term && create) term = (await TermModel.create({ slug, name })).toObject()
    if (term) ids.push(term._id)
  }
  return ids
}

export type ImportResult = { created: number; updated: number; skipped: { item: string; reason: string }[] }

/**
 * Imports posts. Imported content always lands as a draft (never auto-published)
 * so it goes through the editorial workflow. Existing slugs are updated only when `overwrite` is set.
 */
export async function importPosts(actor: Actor, items: Record<string, any>[], opts: { overwrite: boolean; createTerms: boolean }): Promise<ImportResult> {
  await connectDb()
  const result: ImportResult = { created: 0, updated: 0, skipped: [] }
  for (const [i, item] of items.slice(0, 500).entries()) {
    const title = String(item.title ?? '').trim().slice(0, 200)
    const label = title || `item ${i + 1}`
    if (!title) {
      result.skipped.push({ item: label, reason: 'Missing title' })
      continue
    }
    const slug = slugify(String(item.slug || title))
    if (!slug) {
      result.skipped.push({ item: label, reason: 'Could not derive a slug' })
      continue
    }
    const author = item.author ? await Author.findOne({ slug: slugify(String(item.author)) }, { _id: 1 }).lean<any>() : null
    const fields: Record<string, unknown> = {
      title,
      slug,
      subtitle: String(item.subtitle ?? '').slice(0, 240),
      excerpt: String(item.excerpt ?? '').slice(0, 500),
      content: String(item.content ?? ''),
      heroImage: String(item.heroImage ?? ''),
      heroAlt: String(item.heroAlt ?? '').slice(0, 200),
      categoryIds: await resolveTerms('category', item.categories, opts.createTerms),
      tagIds: await resolveTerms('tag', item.tags, opts.createTerms),
      authorId: author?._id ?? null,
      lastEditedById: actor.id,
      readingMinutes: Math.max(1, Math.round(String(item.content ?? '').split(/\s+/).filter(Boolean).length / 220)),
    }
    if (typeof item.language === 'string') fields.language = item.language.slice(0, 10)
    const existing = await Post.findOne({ slug }, { _id: 1, revision: 1 }).lean<any>()
    if (existing) {
      if (!opts.overwrite) {
        result.skipped.push({ item: label, reason: `Slug "${slug}" already exists` })
        continue
      }
      await Post.updateOne({ _id: existing._id }, { $set: fields, $inc: { revision: 1 } })
      result.updated++
    } else {
      try {
        await Post.create({ ...fields, state: 'draft' })
        result.created++
      } catch (e) {
        result.skipped.push({ item: label, reason: e instanceof Error ? e.message.slice(0, 160) : 'Validation failed' })
      }
    }
  }
  await audit({ actor, action: 'import', entityType: 'post', entityId: 'bulk', summary: `Imported posts: ${result.created} created, ${result.updated} updated, ${result.skipped.length} skipped` })
  return result
}

/* ------------------------------------------------------------------ */
/* Comments                                                            */
/* ------------------------------------------------------------------ */

export async function commentsEnabled() {
  await connectDb()
  const s = await SiteSettings.findOne({}, { 'features.comments': 1 }).lean<any>()
  return Boolean(s?.features?.comments)
}

function scoreSpam(body: string, name: string) {
  let score = 0
  const links = (body.match(/https?:\/\//gi) ?? []).length
  score += Math.min(links, 5) * 2
  if (/\b(viagra|casino|crypto ?airdrop|loan|seo services|backlinks?|porn)\b/i.test(body)) score += 5
  if (/https?:\/\//i.test(name)) score += 5
  if (body.length < 4) score += 2
  if (/(.)\1{9,}/.test(body)) score += 2
  return score
}

export async function submitComment(input: { slug: string; parentId?: string | null; name: string; email: string; body: string; ip: string }) {
  if (!(await commentsEnabled())) throw badRequest('Comments are disabled')
  await connectDb()
  const post = await Post.findOne({ slug: input.slug, state: 'published' }, { _id: 1 }).lean<any>()
  if (!post) throw notFound('Post')
  let parentId: mongoose.Types.ObjectId | null = null
  if (input.parentId) {
    if (!isValidObjectId(input.parentId)) throw badRequest('Invalid reply target')
    const parent = await BlogComment.findOne({ _id: input.parentId, postId: post._id, status: 'approved' }, { _id: 1 }).lean<any>()
    if (!parent) throw badRequest('The comment you replied to is unavailable')
    parentId = parent._id
  }
  const spamScore = scoreSpam(input.body, input.name)
  const comment = await BlogComment.create({
    postId: post._id,
    parentId,
    authorName: input.name.trim(),
    authorEmail: input.email.trim().toLowerCase(),
    body: input.body.trim(),
    status: spamScore >= 5 ? 'spam' : 'pending',
    spamScore,
    ipHash: sha256(input.ip),
  })
  return { id: String(comment._id), status: 'pending' as const }
}

export async function listApprovedComments(slug: string) {
  await connectDb()
  const post = await Post.findOne({ slug, state: 'published' }, { _id: 1 }).lean<any>()
  if (!post) return []
  const rows = await BlogComment.find({ postId: post._id, status: 'approved' }, { authorName: 1, body: 1, parentId: 1, createdAt: 1 }).sort({ createdAt: 1 }).limit(500).lean<any[]>()
  return rows.map((c) => ({ id: String(c._id), parentId: c.parentId ? String(c.parentId) : null, authorName: c.authorName, body: c.body, createdAt: c.createdAt }))
}

export async function listCommentsForModeration(status: string, page: number) {
  await connectDb()
  const filter = status === 'all' ? {} : { status }
  const limit = 25
  const [rows, total, counts] = await Promise.all([
    BlogComment.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('postId', 'title slug').lean<any[]>(),
    BlogComment.countDocuments(filter),
    BlogComment.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
  ])
  return {
    items: rows.map((c) => ({
      id: String(c._id),
      authorName: c.authorName,
      authorEmail: c.authorEmail,
      body: c.body,
      status: c.status,
      spamScore: c.spamScore,
      isReply: Boolean(c.parentId),
      createdAt: c.createdAt,
      post: c.postId ? { title: c.postId.title, slug: c.postId.slug } : null,
    })),
    total,
    pages: Math.max(1, Math.ceil(total / limit)),
    counts: Object.fromEntries(counts.map((c: any) => [c._id, c.n])) as Record<string, number>,
  }
}

export async function moderateComments(actor: Actor, ids: string[], action: 'approve' | 'reject' | 'spam' | 'delete') {
  const valid = ids.filter(isValidObjectId)
  if (!valid.length) throw badRequest('Choose comments to moderate')
  await connectDb()
  let changed: number
  if (action === 'delete') {
    // Deleting a parent also removes its replies so no orphans remain.
    const res = await BlogComment.deleteMany({ $or: [{ _id: { $in: valid } }, { parentId: { $in: valid } }] })
    changed = res.deletedCount ?? 0
  } else {
    const status = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'spam'
    const res = await BlogComment.updateMany({ _id: { $in: valid } }, { $set: { status, moderatedById: actor.id, moderatedAt: new Date() } })
    changed = res.modifiedCount
  }
  await audit({ actor, action: `comment_${action}`, entityType: 'comment', entityId: valid.length === 1 ? valid[0] : 'bulk', summary: `${action} ${changed} comment(s)` })
  return { changed }
}
