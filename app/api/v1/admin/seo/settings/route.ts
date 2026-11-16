import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireApiUser } from '@/lib/server/auth/session'
import { connectDb } from '@/lib/server/db'
import { ApiError, assertSameOrigin, handler, ok, readJson } from '@/lib/server/http'
import { SiteSettings } from '@/lib/server/models/content'
import { audit } from '@/lib/server/security/guards'
import { validateExtraDisallow } from '@/lib/seo/robots'
import { generateIndexNowKey } from '@/lib/server/services/indexnow'

const text = (max: number) => z.string().trim().max(max)
const token = text(200).regex(/^[A-Za-z0-9_\-:=.]*$/, 'Paste only the content value of the verification meta tag')
const pathList = z.array(text(300)).max(200)

const schema = z.object({
  defaultTitle: text(70),
  titleTemplate: text(90).refine((v) => !v || v.includes('%s'), 'Title template must contain %s'),
  defaultDescription: text(170),
  ogImage: text(500),
  robotsMode: z.enum(['allow', 'disallow_all']),
  extraDisallow: pathList,
  indexing: z.object({ minWords: z.number().int().min(0).max(2000), requireDescription: z.boolean() }),
  sitemap: z.object({ enabled: z.boolean(), excludePaths: pathList }),
  imageSitemap: z.boolean(),
  organization: z.object({ legalName: text(160), logo: text(500) }),
  integrations: z.object({ searchConsoleSiteUrl: text(300), bingSiteUrl: text(300), ga4PropertyId: text(40) }),
  verification: z.object({ google: token, bing: token, yandex: token, pinterest: token, baidu: token }),
  indexNow: z.object({ enabled: z.boolean(), regenerateKey: z.boolean().optional() }),
  llms: z.object({ enabled: z.boolean(), intro: text(2000) }),
})

export const GET = handler(async () => {
  await requireApiUser('seo.write')
  await connectDb()
  const raw = await SiteSettings.findOne({ key: 'site' }, { seo: 1 }).lean<any>()
  return ok({ seo: raw?.seo ?? {} })
})

export const PATCH = handler(async (req) => {
  assertSameOrigin(req)
  const user = await requireApiUser('seo.write')
  const input = schema.parse(await readJson(req))
  const badRobots = validateExtraDisallow(input.extraDisallow.filter(Boolean))
  if (badRobots.length) throw new ApiError(422, 'invalid_robots', badRobots.join(' '))

  await connectDb()
  const current = await SiteSettings.findOne({ key: 'site' }, { 'seo.indexNow': 1 }).lean<any>()
  let key: string = current?.seo?.indexNow?.key ?? ''
  if (input.indexNow.enabled && (!key || input.indexNow.regenerateKey)) key = generateIndexNowKey()

  const clean = (list: string[]) => [...new Set(list.map((l) => l.trim()).filter(Boolean))]
  const set: Record<string, unknown> = {
    'seo.defaultTitle': input.defaultTitle,
    'seo.titleTemplate': input.titleTemplate,
    'seo.defaultDescription': input.defaultDescription,
    'seo.ogImage': input.ogImage,
    'seo.robotsMode': input.robotsMode,
    'seo.extraDisallow': clean(input.extraDisallow),
    'seo.indexing': input.indexing,
    'seo.sitemap.enabled': input.sitemap.enabled,
    'seo.sitemap.excludePaths': clean(input.sitemap.excludePaths),
    'seo.imageSitemap': input.imageSitemap,
    'seo.organization': input.organization,
    'seo.integrations': input.integrations,
    'seo.verification': input.verification,
    'seo.indexNow.enabled': input.indexNow.enabled,
    'seo.indexNow.key': key,
    'seo.llms': input.llms,
  }
  await SiteSettings.updateOne({ key: 'site' }, { $set: set }, { upsert: true })
  await audit({
    actor: user,
    action: 'update',
    entityType: 'settings',
    summary: `Updated SEO settings (robots: ${input.robotsMode}, IndexNow: ${input.indexNow.enabled ? 'on' : 'off'}, llms.txt: ${input.llms.enabled ? 'on' : 'off'})`,
  })
  revalidatePath('/', 'layout')
  return ok({ saved: true, indexNowKey: key })
})
