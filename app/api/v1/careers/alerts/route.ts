import { z } from 'zod'
import { clientIp, handler, ok, readJson } from '@/lib/server/http'
import { rateLimit } from '@/lib/server/security/guards'
import { subscribeJobAlert } from '@/lib/server/services/careers'

const list = z.array(z.string().trim().min(1).max(80)).max(10).optional().default([])
const schema = z.object({
  email: z.string().trim().email('Enter a valid email').max(254),
  departments: list,
  locations: list,
  consent: z.boolean().refine((v) => v, 'Please confirm you want job alerts'),
})

export const POST = handler(async (req) => {
  const body = (await readJson(req)) as Record<string, unknown>
  if (typeof body?.website === 'string' && body.website.trim()) return ok({ message: 'Check your inbox to confirm your job alert.' })
  await rateLimit(`jobalert:${clientIp(req)}`, 5, 600)
  const input = schema.parse(body)
  return ok(await subscribeJobAlert(input, req.nextUrl.origin))
})
