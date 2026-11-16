import 'server-only'
import { revalidatePath } from 'next/cache'
import { can } from '@/lib/rbac'
import { GATED_TARGETS, LIVE_STATES, checkTransition, isPostState, availableTransitions } from '@/lib/blog/workflow'
import { analysePost, hasBlockers } from '@/lib/blog/quality'
import type { SessionUser } from '../auth/session'
import { isValidObjectId } from '../db'
import { ApiError, badRequest, conflict, forbidden, notFound } from '../http'
import { Author, Category, ContentReview, Post, PostRevision, Tag } from '../models/editorial'
import { audit } from '../security/guards'

const plain = <T>(v: unknown): T => JSON.parse(JSON.stringify(v))

const perms = (user: SessionUser) => ({ canWrite: can(user.role, 'blog.write'), canPublish: can(user.role, 'blog.publish') })

function requireBlogAccess(user: SessionUser) {
  if (!can(user.role, 'content.read') && !can(user.role, 'blog.write')) throw forbidden()
}

async function loadPost(id: string) {
  if (!isValidObjectId(id)) throw notFound('Post')
  const post = await Post.findById(id).lean<any>()
  if (!post) throw notFound('Post')
  return post
}

export function revalidateBlog(slug?: string) {
  revalidatePath('/blog')
  revalidatePath('/sitemap.xml')
  if (slug) revalidatePath(`/blog/${slug}`)
}

async function snapshotRevision(post: any, userId: string | null, summary: string) {
  await PostRevision.create({ postId: post._id, version: post.revision, snapshot: post, changedById: userId, changeSummary: summary }).catch((e) => console.error('[blog] revision failed', e))
}

export type TransitionInput = { to: string; note?: string; publishAt?: string | null; expectedRevision?: number }

export async function transitionPost(user: SessionUser, id: string, input: TransitionInput) {
  const p = perms(user)
  if (!p.canWrite && !p.canPublish) throw forbidden()
  const post = await loadPost(id)
  if (input.expectedRevision !== undefined && input.expectedRevision !== post.revision) {
    throw conflict('This post was changed by someone else. Reload to see the latest version before continuing.', { revision: post.revision })
  }
  const publishAt = input.publishAt ? new Date(input.publishAt) : post.publishAt ? new Date(post.publishAt) : null
  const to = input.to
  const check = checkTransition(post.state, to, { ...p, publishAt })
  if (!check.ok) throw new ApiError(check.status, check.status === 403 ? 'forbidden' : 'invalid_transition', check.message)

  if (['changes_requested'].includes(to) && !input.note?.trim()) throw badRequest('Explain what needs to change.', { note: 'Required when requesting changes' })

  if (isPostState(to) && GATED_TARGETS.includes(to)) {
    const populated = { ...post }
    const issues = analysePost(populated)
    if (hasBlockers(issues)) {
      throw new ApiError(422, 'quality_gate', 'Resolve the blocking content issues before approving or publishing.', Object.fromEntries(issues.filter((i) => i.level === 'blocker').map((i) => [i.code, i.message])))
    }
  }
  if (to === 'published' || to === 'scheduled') {
    const [author] = await Promise.all([post.authorId ? Author.findOne({ _id: post.authorId, status: 'published' }).lean() : null])
    if (!author) throw new ApiError(422, 'quality_gate', 'The post needs a published author profile before it goes live.', { authorId: 'Select a published author' })
  }

  const now = new Date()
  const set: Record<string, unknown> = { state: to, lastEditedById: user.id, revision: post.revision + 1 }
  const unset: Record<string, unknown> = {}
  if (to === 'scheduled') set.publishAt = publishAt
  if (to === 'published') {
    if (!post.publishedAt) set.publishedAt = now
    else set.contentUpdatedAt = now
    set.publishAt = null
  }
  if (to === 'approved' && post.state === 'scheduled') set.publishAt = null
  if (to === 'archived') set.archivedFromState = post.state
  if (post.state === 'archived' && to === 'draft') set.archivedFromState = ''

  const updated = await Post.findOneAndUpdate({ _id: post._id, revision: post.revision }, { $set: set, ...(Object.keys(unset).length ? { $unset: unset } : {}) }, { returnDocument: 'after' }).lean<any>()
  if (!updated) throw conflict('This post was changed while you were working. Reload and try again.')

  await Promise.all([
    snapshotRevision(updated, user.id, `${post.state} → ${to}`),
    ContentReview.create({
      postId: post._id,
      kind: to === 'editorial_review' ? 'submitted' : to === 'approved' ? 'approved' : to === 'changes_requested' ? 'changes_requested' : to === 'published' ? 'published' : 'transition',
      body: input.note?.trim().slice(0, 4000) ?? '',
      fromState: post.state,
      toState: to,
      authorId: user.id,
      authorEmail: user.email,
    }),
    audit({ actor: user, action: `blog.${to}`, entityType: 'posts', entityId: String(post._id), summary: `"${post.title}": ${post.state} → ${to}` }),
  ])
  if (LIVE_STATES.includes(to as any) || LIVE_STATES.includes(post.state)) revalidateBlog(post.slug)
  return plain(updated)
}

export async function addReviewComment(user: SessionUser, id: string, body: string) {
  requireBlogAccess(user)
  const text = body.trim()
  if (!text) throw badRequest('Write a comment first.', { body: 'Required' })
  if (text.length > 4000) throw badRequest('Comments are limited to 4,000 characters.')
  const post = await loadPost(id)
  const doc = await ContentReview.create({ postId: post._id, kind: 'comment', body: text, authorId: user.id, authorEmail: user.email })
  return plain(doc.toObject())
}

export async function listReviewTrail(user: SessionUser, id: string) {
  requireBlogAccess(user)
  const post = await loadPost(id)
  const items = await ContentReview.find({ postId: post._id }).sort({ createdAt: -1 }).limit(100).lean()
  return plain({ items, transitions: availableTransitions(post.state, perms(user)), state: post.state, revision: post.revision })
}

export async function listRevisions(user: SessionUser, id: string) {
  requireBlogAccess(user)
  const post = await loadPost(id)
  const items = await PostRevision.find({ postId: post._id }, { version: 1, changeSummary: 1, createdAt: 1, changedById: 1, 'snapshot.title': 1, 'snapshot.state': 1 }).sort({ version: -1 }).limit(50).lean()
  return plain({ items, current: post.revision })
}

const RESTORABLE = ['title', 'subtitle', 'excerpt', 'content', 'heroImage', 'heroAlt', 'heroCaption', 'readingMinutes', 'references', 'cta', 'seo'] as const

export async function restoreRevision(user: SessionUser, id: string, version: number) {
  const p = perms(user)
  if (!p.canWrite && !p.canPublish) throw forbidden()
  const post = await loadPost(id)
  if (LIVE_STATES.includes(post.state) && !p.canPublish) throw forbidden()
  const rev = await PostRevision.findOne({ postId: post._id, version }).lean<any>()
  if (!rev) throw notFound('Revision')
  const set: Record<string, unknown> = { lastEditedById: user.id, revision: post.revision + 1 }
  for (const key of RESTORABLE) if (rev.snapshot?.[key] !== undefined) set[key] = rev.snapshot[key]
  if (LIVE_STATES.includes(post.state)) set.contentUpdatedAt = new Date()
  const updated = await Post.findOneAndUpdate({ _id: post._id, revision: post.revision }, { $set: set }, { returnDocument: 'after' }).lean<any>()
  if (!updated) throw conflict('This post changed while restoring. Reload and try again.')
  await snapshotRevision(updated, user.id, `Restored version ${version}`)
  await audit({ actor: user, action: 'blog.restore_revision', entityType: 'posts', entityId: String(post._id), summary: `Restored version ${version} of "${post.title}"` })
  if (LIVE_STATES.includes(post.state)) revalidateBlog(post.slug)
  return plain(updated)
}

export async function duplicatePost(user: SessionUser, id: string) {
  if (!can(user.role, 'blog.write')) throw forbidden()
  const post = await loadPost(id)
  const base = `${post.slug}-copy`.slice(0, 90)
  let slug = base
  for (let n = 2; await Post.exists({ slug }); n++) slug = `${base}-${n}`
  const { _id, createdAt, updatedAt, __v, publishedAt, publishAt, contentUpdatedAt, views, ...rest } = post
  const copy = await Post.create({ ...rest, title: `${post.title} (copy)`.slice(0, 200), slug, state: 'draft', revision: 1, views: 0, featured: false, pinnedHome: false, publishedAt: null, publishAt: null, lastEditedById: user.id, isSample: false })
  await snapshotRevision(copy.toObject(), user.id, `Duplicated from ${post.slug}`)
  await audit({ actor: user, action: 'blog.duplicate', entityType: 'posts', entityId: String(copy._id), summary: `Duplicated "${post.title}"` })
  return plain(copy.toObject())
}

export type BulkAction = 'archive' | 'restore' | 'delete' | 'flag_update'

export async function bulkPostAction(user: SessionUser, ids: string[], action: BulkAction) {
  if (!Array.isArray(ids) || ids.length === 0) throw badRequest('Select at least one post.')
  if (ids.length > 100) throw badRequest('Bulk actions are limited to 100 posts at a time.')
  const results: { id: string; ok: boolean; message?: string }[] = []
  for (const id of ids) {
    try {
      if (action === 'delete') {
        if (!can(user.role, 'blog.write')) throw forbidden()
        const post = await loadPost(id)
        if (LIVE_STATES.includes(post.state)) throw badRequest('Live posts cannot be deleted. Archive them first.')
        await Post.deleteOne({ _id: post._id })
        await ContentReview.deleteMany({ postId: post._id })
        await audit({ actor: user, action: 'delete', entityType: 'posts', entityId: id, summary: `Deleted "${post.title}"` })
      } else {
        const to = action === 'archive' ? 'archived' : action === 'restore' ? 'draft' : 'update_needed'
        await transitionPost(user, id, { to })
      }
      results.push({ id, ok: true })
    } catch (e) {
      results.push({ id, ok: false, message: e instanceof ApiError ? e.message : 'Failed' })
    }
  }
  revalidateBlog()
  return { results, succeeded: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length }
}

/** Runs from a server cron: makes due scheduled posts public and expires posts with an unpublish time. */
export async function runScheduledPublishing(now = new Date()) {
  const due = await Post.find({ state: 'scheduled', publishAt: { $lte: now } }).lean<any[]>()
  let published = 0
  for (const post of due) {
    const res = await Post.updateOne(
      { _id: post._id, state: 'scheduled', revision: post.revision },
      { $set: { state: 'published', publishedAt: post.publishedAt ?? post.publishAt ?? now, publishAt: null, revision: post.revision + 1 } },
    )
    if (res.modifiedCount) {
      published++
      await ContentReview.create({ postId: post._id, kind: 'published', fromState: 'scheduled', toState: 'published', body: 'Published by schedule', authorEmail: 'system' })
      await audit({ action: 'blog.published', entityType: 'posts', entityId: String(post._id), summary: `Scheduled publication of "${post.title}"` })
      revalidateBlog(post.slug)
    }
  }
  const expiring = await Post.find({ state: 'published', unpublishAt: { $lte: now, $ne: null } }).lean<any[]>()
  let archived = 0
  for (const post of expiring) {
    const res = await Post.updateOne({ _id: post._id, state: 'published' }, { $set: { state: 'archived', archivedFromState: 'published', revision: post.revision + 1 } })
    if (res.modifiedCount) {
      archived++
      await audit({ action: 'blog.archived', entityType: 'posts', entityId: String(post._id), summary: `Scheduled unpublish of "${post.title}"` })
      revalidateBlog(post.slug)
    }
  }
  return { published, archived, checkedAt: now.toISOString() }
}

export async function blogDashboard(user: SessionUser, days = 90) {
  requireBlogAccess(user)
  const since = new Date(Date.now() - Math.min(Math.max(days, 7), 730) * 86400000)
  const now = new Date()
  const [byState, categories, tags, authors, perMonth, topViewed, recent, scheduled, review, activity, attention] = await Promise.all([
    Post.aggregate([{ $group: { _id: '$state', n: { $sum: 1 } } }]),
    Category.countDocuments(),
    Tag.countDocuments(),
    Author.countDocuments(),
    Post.aggregate([
      { $match: { publishedAt: { $gte: since }, state: { $in: ['published', 'update_needed'] } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$publishedAt' } }, n: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Post.find({ state: { $in: ['published', 'update_needed'] } }, 'title slug views').sort({ views: -1 }).limit(5).lean(),
    Post.find({}, 'title slug state updatedAt').sort({ updatedAt: -1 }).limit(6).lean(),
    Post.find({ state: 'scheduled', publishAt: { $gt: now } }, 'title slug publishAt').sort({ publishAt: 1 }).limit(6).lean(),
    Post.find({ state: { $in: ['editorial_review', 'seo_review', 'changes_requested'] } }, 'title slug state updatedAt').sort({ updatedAt: 1 }).limit(8).lean(),
    ContentReview.find({}).sort({ createdAt: -1 }).limit(8).populate('postId', 'title').lean(),
    Post.find({ state: { $in: ['published', 'update_needed'] } }, 'title slug excerpt heroImage heroAlt authorId categoryIds seo content publishedAt contentUpdatedAt updatedAt').limit(500).lean<any[]>(),
  ])
  const counts = Object.fromEntries(byState.map((r: any) => [r._id, r.n]))
  const needsAttention = attention
    .map((p) => ({ id: String(p._id), title: p.title, slug: p.slug, issues: analysePost(p).filter((i) => i.level !== 'info') }))
    .filter((p) => p.issues.length)
    .slice(0, 8)
  return plain({
    counts: { ...counts, total: byState.reduce((a: number, r: any) => a + r.n, 0) },
    taxonomy: { categories, tags, authors },
    perMonth: perMonth.map((r: any) => ({ month: r._id, posts: r.n })),
    viewsNote: 'Views are an internal server-side counter, not an external analytics measurement.',
    topViewed,
    recent,
    scheduled,
    review,
    activity,
    needsAttention,
    since,
  })
}
