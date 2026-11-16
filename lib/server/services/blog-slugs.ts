import 'server-only'
import { permanentRedirect, redirect, notFound } from 'next/navigation'
import { connectDb } from '../db'
import { Redirect } from '../models/content'
import { findRedirect } from './public'
import { logNotFound } from './seo-monitor'

export type SlugKind = 'post' | 'category' | 'tag' | 'author'

const PREFIX: Record<SlugKind, string> = {
  post: '/blog/',
  category: '/blog/category/',
  tag: '/blog/tag/',
  author: '/blog/author/',
}

export function blogPath(kind: SlugKind, slug: string) {
  return `${PREFIX[kind]}${slug}`
}

/**
 * Records a permanent redirect when a public slug changes.
 * - Removes any rule whose source is the new path (it would shadow the live URL).
 * - Repoints rules that targeted the old path straight at the new one so chains never form.
 * - Upserts old → new as a 301.
 */
export async function recordSlugChange(kind: SlugKind, oldSlug: string, newSlug: string, userId?: string | null) {
  if (!oldSlug || !newSlug || oldSlug === newSlug) return null
  await connectDb()
  const from = blogPath(kind, oldSlug)
  const to = blogPath(kind, newSlug)

  await Redirect.deleteMany({ sourcePath: to })
  await Redirect.updateMany({ targetUrl: from }, { $set: { targetUrl: to } })
  await Redirect.deleteMany({ $expr: { $eq: ['$sourcePath', '$targetUrl'] } })

  return Redirect.findOneAndUpdate(
    { sourcePath: from },
    {
      $set: { targetUrl: to, statusCode: 301, enabled: true, reason: `Slug changed (${kind})` },
      $setOnInsert: { createdById: userId ?? null, hitCount: 0 },
    },
    { upsert: true, returnDocument: 'after' },
  ).lean()
}

/** For dynamic blog routes: follow a stored redirect for this path, otherwise 404. */
export async function redirectOrNotFound(path: string): Promise<never> {
  const rule = await findRedirect(path)
  if (rule?.targetUrl && rule.statusCode === 301) permanentRedirect(rule.targetUrl)
  if (rule?.targetUrl && rule.statusCode === 302) redirect(rule.targetUrl)
  await logNotFound(path)
  notFound()
}
