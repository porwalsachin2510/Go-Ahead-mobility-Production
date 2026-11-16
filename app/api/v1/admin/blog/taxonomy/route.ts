import { z } from 'zod'
import { requireApiUser } from '@/lib/server/auth/session'
import { assertSameOrigin, badRequest, handler, ok, readJson } from '@/lib/server/http'
import { listTermsWithCounts, mergeTerms } from '@/lib/server/services/blog-tools'

const kindSchema = z.enum(['category', 'tag'])
const mergeSchema = z.object({ kind: kindSchema, sourceIds: z.array(z.string().max(30)).min(1).max(50), targetId: z.string().max(30) })

export const GET = handler(async (req) => {
  await requireApiUser('blog.write')
  const kind = kindSchema.safeParse(req.nextUrl.searchParams.get('kind') ?? 'category')
  if (!kind.success) throw badRequest('Unknown term type')
  return ok({ items: await listTermsWithCounts(kind.data) })
})

export const POST = handler(async (req) => {
  assertSameOrigin(req)
  const user = await requireApiUser('blog.publish')
  const parsed = mergeSchema.safeParse(await readJson(req))
  if (!parsed.success) throw badRequest('Choose a target and at least one term to merge')
  return ok(await mergeTerms(user, parsed.data.kind, parsed.data.sourceIds, parsed.data.targetId))
})
