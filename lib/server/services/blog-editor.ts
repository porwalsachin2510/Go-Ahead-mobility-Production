import 'server-only'
import { can } from '@/lib/rbac'
import type { SessionUser } from '../auth/session'
import { isValidObjectId } from '../db'
import { badRequest, forbidden, notFound } from '../http'
import { ContentReview, Post, PostAutosave, PostRevision } from '../models/editorial'

const plain = <T>(v: unknown): T => JSON.parse(JSON.stringify(v))

export const AUTOSAVE_FIELDS = ['title', 'subtitle', 'excerpt', 'content', 'heroImage', 'heroAlt', 'heroCaption', 'readingMinutes'] as const
const DIFF_FIELDS = ['title', 'subtitle', 'excerpt', 'content', 'heroImage', 'heroAlt', 'heroCaption', 'readingMinutes', 'seo', 'cta', 'references'] as const

function canRead(user: SessionUser) {
  return can(user.role, 'content.read') || can(user.role, 'blog.write')
}

async function loadPost(id: string) {
  if (!isValidObjectId(id)) throw notFound('Post')
  const post = await Post.findById(id).lean<any>()
  if (!post) throw notFound('Post')
  return post
}

export async function getAutosave(user: SessionUser, id: string) {
  if (!can(user.role, 'blog.write')) throw forbidden()
  const post = await loadPost(id)
  const doc = await PostAutosave.findOne({ postId: post._id, userId: user.id }).lean<any>()
  if (!doc) return { autosave: null, currentRevision: post.revision }
  return plain({ autosave: doc, currentRevision: post.revision, stale: doc.baseRevision !== post.revision })
}

export async function saveAutosave(user: SessionUser, id: string, data: Record<string, unknown>, baseRevision: number) {
  if (!can(user.role, 'blog.write')) throw forbidden()
  const post = await loadPost(id)
  const clean: Record<string, unknown> = {}
  for (const key of AUTOSAVE_FIELDS) if (data[key] !== undefined) clean[key] = data[key]
  if (typeof clean.content === 'string' && clean.content.length > 400_000) throw badRequest('Content is too long to autosave.')
  const doc = await PostAutosave.findOneAndUpdate(
    { postId: post._id, userId: user.id },
    { $set: { data: clean, baseRevision } },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  ).lean<any>()
  return plain({ savedAt: doc.updatedAt, stale: baseRevision !== post.revision, currentRevision: post.revision })
}

export async function discardAutosave(user: SessionUser, id: string) {
  if (!isValidObjectId(id)) throw notFound('Post')
  await PostAutosave.deleteOne({ postId: id, userId: user.id })
  return { ok: true }
}

export async function clearAutosavesForPost(postId: string, userId: string) {
  await PostAutosave.deleteOne({ postId, userId }).catch(() => undefined)
}

export type DiffLine = { type: 'same' | 'add' | 'remove'; text: string }

export function lineDiff(before: string, after: string): DiffLine[] {
  const a = before.split('\n')
  const b = after.split('\n')
  if (a.length * b.length > 4_000_000) {
    return [...a.map((text) => ({ type: 'remove' as const, text })), ...b.map((text) => ({ type: 'add' as const, text }))]
  }
  const dp: Uint32Array[] = Array.from({ length: a.length + 1 }, () => new Uint32Array(b.length + 1))
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
  }
  const out: DiffLine[] = []
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      out.push({ type: 'same', text: a[i] })
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) out.push({ type: 'remove', text: a[i++] })
    else out.push({ type: 'add', text: b[j++] })
  }
  while (i < a.length) out.push({ type: 'remove', text: a[i++] })
  while (j < b.length) out.push({ type: 'add', text: b[j++] })
  return out
}

const asText = (v: unknown) => (v === undefined || v === null ? '' : typeof v === 'string' ? v : JSON.stringify(v, null, 2))

export async function compareRevisions(user: SessionUser, id: string, from: number, to: number | 'current') {
  if (!canRead(user)) throw forbidden()
  const post = await loadPost(id)
  const older = await PostRevision.findOne({ postId: post._id, version: from }).lean<any>()
  if (!older) throw notFound(`Revision ${from}`)
  let newer: any = post
  if (to !== 'current') {
    const rev = await PostRevision.findOne({ postId: post._id, version: to }).lean<any>()
    if (!rev) throw notFound(`Revision ${to}`)
    newer = rev.snapshot
  }
  const fields = DIFF_FIELDS.flatMap((field) => {
    const before = asText(older.snapshot?.[field])
    const after = asText(newer?.[field])
    if (before === after) return []
    const lines = lineDiff(before, after)
    return [{ field, added: lines.filter((l) => l.type === 'add').length, removed: lines.filter((l) => l.type === 'remove').length, lines }]
  })
  return plain({ from, to, fields })
}

export async function addAnchoredComment(user: SessionUser, id: string, input: { body: string; anchorField?: string; anchorQuote?: string }) {
  if (!canRead(user)) throw forbidden()
  const text = input.body.trim()
  if (!text) throw badRequest('Write a comment first.', { body: 'Required' })
  const post = await loadPost(id)
  const anchorField = input.anchorField && (DIFF_FIELDS as readonly string[]).includes(input.anchorField) ? input.anchorField : ''
  const doc = await ContentReview.create({
    postId: post._id,
    kind: 'comment',
    body: text.slice(0, 4000),
    authorId: user.id,
    authorEmail: user.email,
    anchorField,
    anchorQuote: (input.anchorQuote ?? '').trim().slice(0, 500),
  })
  return plain(doc.toObject())
}

export async function setCommentResolved(user: SessionUser, postId: string, commentId: string, resolved: boolean) {
  if (!canRead(user)) throw forbidden()
  if (!isValidObjectId(commentId) || !isValidObjectId(postId)) throw notFound('Comment')
  const comment = await ContentReview.findOne({ _id: commentId, postId, kind: 'comment' }).lean<any>()
  if (!comment) throw notFound('Comment')
  const isAuthor = String(comment.authorId) === user.id
  if (!isAuthor && !can(user.role, 'blog.publish') && !can(user.role, 'blog.write')) throw forbidden()
  const updated = await ContentReview.findByIdAndUpdate(
    commentId,
    { $set: { resolved, resolvedById: resolved ? user.id : null, resolvedAt: resolved ? new Date() : null } },
    { returnDocument: 'after' },
  ).lean()
  return plain(updated)
}
