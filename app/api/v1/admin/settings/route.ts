import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireApiUser } from '@/lib/server/auth/session'
import { handler, ok, readJson } from '@/lib/server/http'
import { SiteSettings } from '@/lib/server/models/content'
import { audit, diffFields } from '@/lib/server/security/guards'

const s = (max = 300) => z.string().trim().max(max).default('')
const email = z.union([z.literal(''), z.string().trim().email().max(254)]).default('')
const link = z.union([z.literal(''), z.string().trim().max(500).regex(/^(https:\/\/|\/|mailto:|tel:)/, 'Use an https:// or relative link')]).default('')

const schema = z.object({
  brandName: s(80),
  tagline: s(200),
  siteUrl: link,
  contact: z.object({ email, phone: s(40), address: s(300), hours: s(120), mapUrl: link, accommodationEmail: email, transportEmail: email, careersEmail: email }).partial(),
  social: z.object({ linkedin: link, x: link, instagram: link, youtube: link, facebook: link }).partial(),
  header: z.object({ primaryCtaLabel: s(40), primaryCtaHref: link }).partial(),
  footer: z.object({ blurb: s(400), newsletterHeading: s(120), newsletterCopy: s(300) }).partial(),
  seo: z.object({ defaultTitle: s(120), titleTemplate: s(120), defaultDescription: s(300), ogImage: link, robotsMode: z.enum(['allow', 'disallow_all']) }).partial(),
  notifications: z.object({ salesInbox: email, hrInbox: email, senderName: s(80), acknowledgementCopy: s(1000) }).partial(),
}).partial()

export const GET = handler(async () => {
  await requireApiUser('settings.write')
  const doc = await SiteSettings.findOne({ key: 'site' }).lean()
  return ok(JSON.parse(JSON.stringify(doc ?? {})))
})

export const PATCH = handler(async (req) => {
  const user = await requireApiUser('settings.write')
  const input = schema.parse(await readJson(req))
  const before = (await SiteSettings.findOne({ key: 'site' }).lean<Record<string, unknown>>()) ?? {}
  const $set: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(input)) {
    if (v && typeof v === 'object') for (const [k2, v2] of Object.entries(v)) $set[`${k}.${k2}`] = v2
    else $set[k] = v
  }
  const doc = await SiteSettings.findOneAndUpdate({ key: 'site' }, { $set }, { returnDocument: 'after', upsert: true }).lean()
  await audit({ actor: user, action: 'update', entityType: 'settings', summary: 'Updated site settings', diff: diffFields(before, input as Record<string, unknown>) })
  revalidatePath('/', 'layout')
  revalidatePath('/local-transportation')
  return ok(JSON.parse(JSON.stringify(doc)))
})
