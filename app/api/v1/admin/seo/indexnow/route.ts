import { z } from 'zod'
import { requireApiUser } from '@/lib/server/auth/session'
import { assertSameOrigin, handler, ok, readJson } from '@/lib/server/http'
import { audit, rateLimit } from '@/lib/server/security/guards'
import { submitIndexNow } from '@/lib/server/services/indexnow'
import { sitemapEligibleEntries } from '@/lib/server/services/seo-feeds'

const schema = z.object({ scope: z.enum(['recent', 'all']) })

export const POST = handler(async (req) => {
  assertSameOrigin(req)
  const user = await requireApiUser('seo.write')
  const { scope } = schema.parse(await readJson(req))
  await rateLimit(`indexnow:${user.id}`, 10, 3600)
  const { eligible } = await sitemapEligibleEntries()
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
  const urls = eligible.filter(({ entry }) => scope === 'all' || (entry.updatedAt && Date.parse(entry.updatedAt) >= cutoff)).map((e) => e.url)
  const result = await submitIndexNow(urls)
  await audit({ actor: user, action: 'update', entityType: 'settings', summary: `IndexNow ${scope} submission: ${result.message}` })
  return ok({ ...result, candidates: urls.length })
})
