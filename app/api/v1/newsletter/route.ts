import { z } from 'zod'
import { clientIp, handler, ok, readJson } from '@/lib/server/http'
import { rateLimit } from '@/lib/server/security/guards'
import { randomToken, sha256 } from '@/lib/server/security/crypto'
import { ConsentEvent, Subscriber } from '@/lib/server/models/operations'
import { queueEmail } from '@/lib/server/services/email'
import { createNewsletterLead } from '@/lib/server/services/leads'

const CONSENT_TEXT = 'I agree to receive the GoAhead Mobility newsletter and can unsubscribe at any time.'

const schema = z.object({
  email: z.string().trim().email('Enter a valid email').max(254),
  consent: z.boolean().refine((v) => v, 'Please confirm you want to subscribe'),
  source: z.string().trim().max(60).optional().default('site'),
})

export const POST = handler(async (req) => {
  const body = (await readJson(req)) as Record<string, unknown>
  const done = { message: 'Thanks. Please check your inbox to confirm your subscription.' }
  if (typeof body?.website === 'string' && body.website.trim()) return ok(done)

  await rateLimit(`newsletter:${clientIp(req)}`, 5, 600)
  const input = schema.parse(body)
  const emailNormalized = input.email.toLowerCase()
  const existing = await Subscriber.findOne({ emailNormalized })
  if (existing?.status === 'confirmed') return ok({ message: 'You are already subscribed. Thank you!' })
  if (existing?.status === 'suppressed') return ok(done)

  const token = randomToken(24)
  const sub = await Subscriber.findOneAndUpdate(
    { emailNormalized },
    {
      $set: { email: input.email, status: 'pending', source: input.source, consentText: CONSENT_TEXT, consentVersion: 'v1', consentedAt: new Date(), unsubscribeTokenHash: sha256(token) },
    },
    { upsert: true, returnDocument: 'after' },
  )
  await createNewsletterLead(input.email, input.source).catch((e) => console.error('[newsletter] lead failed', e))
  await ConsentEvent.create({ subjectType: 'subscriber', subjectId: String(sub._id), event: 'newsletter_opt_in_requested', text: CONSENT_TEXT, source: input.source })
  await queueEmail({
    templateSlug: 'newsletter_confirm',
    to: input.email,
    vars: { confirmUrl: `${req.nextUrl.origin}/api/v1/newsletter/confirm?token=${token}` },
    relatedType: 'subscriber',
    relatedId: String(sub._id),
  }).catch((e) => console.error('[newsletter] email failed', e))
  return ok(done)
})
