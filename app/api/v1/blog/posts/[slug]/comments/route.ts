import { z } from 'zod'
import { assertSameOrigin, badRequest, clientIp, handler, ok, readJson } from '@/lib/server/http'
import { rateLimit } from '@/lib/server/security/guards'
import { commentsEnabled, listApprovedComments, submitComment } from '@/lib/server/services/blog-tools'

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().max(200),
  body: z.string().trim().min(2).max(4000),
  parentId: z.string().max(30).nullish(),
  website: z.string().max(200).optional(),
})

export const GET = handler<{ slug: string }>(async (_req, { params }) => {
  const { slug } = await params
  if (!(await commentsEnabled())) return ok({ enabled: false, items: [] })
  return ok({ enabled: true, items: await listApprovedComments(slug) })
})

export const POST = handler<{ slug: string }>(async (req, { params }) => {
  assertSameOrigin(req)
  const { slug } = await params
  const ip = clientIp(req)
  await rateLimit(`comment:${ip}`, 5, 600)
  const parsed = schema.safeParse(await readJson(req))
  if (!parsed.success) throw badRequest('Please add your name, a valid email and a comment.')
  // Honeypot: real visitors never see or fill the "website" field.
  if (parsed.data.website) return ok({ id: null, status: 'pending' })
  return ok(await submitComment({ slug, parentId: parsed.data.parentId, name: parsed.data.name, email: parsed.data.email, body: parsed.data.body, ip }))
})
