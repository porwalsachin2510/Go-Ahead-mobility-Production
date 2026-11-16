import { z } from 'zod'
import { requireApiUser } from '@/lib/server/auth/session'
import { assertSameOrigin, badRequest, handler, ok, readJson } from '@/lib/server/http'
import { listCommentsForModeration, moderateComments } from '@/lib/server/services/blog-tools'

const statusSchema = z.enum(['pending', 'approved', 'spam', 'rejected', 'all'])
const actionSchema = z.object({ ids: z.array(z.string().max(30)).min(1).max(100), action: z.enum(['approve', 'reject', 'spam', 'delete']) })

export const GET = handler(async (req) => {
  await requireApiUser('blog.publish')
  const status = statusSchema.safeParse(req.nextUrl.searchParams.get('status') ?? 'pending')
  if (!status.success) throw badRequest('Unknown status')
  const page = Math.max(1, Math.min(500, Number(req.nextUrl.searchParams.get('page')) || 1))
  return ok(await listCommentsForModeration(status.data, page))
})

export const PATCH = handler(async (req) => {
  assertSameOrigin(req)
  const user = await requireApiUser('blog.publish')
  const parsed = actionSchema.safeParse(await readJson(req))
  if (!parsed.success) throw badRequest('Choose comments and a valid action')
  return ok(await moderateComments(user, parsed.data.ids, parsed.data.action))
})
