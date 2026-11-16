import { z } from 'zod'
import { requireApiUser } from '@/lib/server/auth/session'
import { connectDb } from '@/lib/server/db'
import { ApiError, assertSameOrigin, handler, ok, readJson } from '@/lib/server/http'
import { Redirect } from '@/lib/server/models/content'
import { NotFoundLog } from '@/lib/server/models/seo'
import { audit } from '@/lib/server/security/guards'

const target = z
  .string()
  .trim()
  .max(500)
  .refine((v) => (v.startsWith('/') && !v.startsWith('//')) || /^https:\/\/[^\s]+$/i.test(v), 'Target must be a site path like /services or an https:// URL')

const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('redirect'), id: z.string().regex(/^[a-f0-9]{24}$/i), targetUrl: target }),
  z.object({ action: z.literal('gone'), id: z.string().regex(/^[a-f0-9]{24}$/i) }),
  z.object({ action: z.literal('dismiss'), id: z.string().regex(/^[a-f0-9]{24}$/i) }),
])

export const POST = handler(async (req) => {
  assertSameOrigin(req)
  const user = await requireApiUser('seo.write')
  const input = schema.parse(await readJson(req))
  await connectDb()
  const log = await NotFoundLog.findById(input.id).lean<any>()
  if (!log) throw new ApiError(404, 'not_found', 'That 404 entry no longer exists.')

  if (input.action === 'redirect' || input.action === 'gone') {
    const targetUrl = input.action === 'redirect' ? input.targetUrl.replace(/\/+$/, '') || '/' : ''
    if (targetUrl === log.path) throw new ApiError(400, 'loop', 'A URL cannot redirect to itself.')
    await Redirect.findOneAndUpdate(
      { sourcePath: log.path },
      {
        $set: { targetUrl, statusCode: input.action === 'gone' ? 410 : 301, enabled: true, reason: `Fixed from 404 monitor (${log.hits} hits)` },
        $setOnInsert: { createdById: user.id, hitCount: 0 },
      },
      { upsert: true },
    )
  }
  await NotFoundLog.updateOne({ _id: input.id }, { $set: { resolved: true } })
  await audit({
    actor: user,
    action: 'update',
    entityType: 'redirect',
    summary: input.action === 'dismiss' ? `Dismissed 404 ${log.path}` : input.action === 'gone' ? `Marked ${log.path} as 410 Gone` : `Redirected ${log.path} to ${input.targetUrl}`,
  })
  return ok({ ok: true })
})
