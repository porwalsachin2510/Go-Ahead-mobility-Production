import { clientIp, handler, ok, readJson } from '@/lib/server/http'
import { getIdempotent, rateLimit, saveIdempotent } from '@/lib/server/security/guards'
import { createLead, leadInputSchema } from '@/lib/server/services/leads'

export const POST = handler(async (req) => {
  const body = (await readJson(req)) as Record<string, unknown>
  // Honeypot: bots fill the hidden "website" field. Pretend success without storing anything.
  if (typeof body?.website === 'string' && body.website.trim()) return ok({ reference: 'GEN-RECEIVED' }, { status: 201 })

  const idemKey = req.headers.get('idempotency-key')?.slice(0, 80) || null
  const scopedKey = idemKey ? `lead:${idemKey}` : null
  const cached = await getIdempotent<{ reference: string }>(scopedKey)
  if (cached) return ok(cached, { status: 201 })

  await rateLimit(`lead:${clientIp(req)}`, 8, 600)
  const input = leadInputSchema.parse(body)
  const { reference } = await createLead(input, req.nextUrl.origin)
  const response = { reference }
  await saveIdempotent(scopedKey, response)
  return ok(response, { status: 201 })
})
