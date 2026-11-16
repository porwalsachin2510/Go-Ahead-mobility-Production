import { requireApiUser } from '@/lib/server/auth/session'
import { assertSameOrigin, badRequest, handler, ok, readJson } from '@/lib/server/http'
import { audit, diffFields } from '@/lib/server/security/guards'
import { entitySeoSchema, getEntitySeo, updateEntitySeo } from '@/lib/server/services/seo-admin'

export const GET = handler(async (req) => {
  await requireApiUser('seo.write')
  const key = req.nextUrl.searchParams.get('key')
  if (!key) throw badRequest('Missing key')
  return ok(await getEntitySeo(key))
})

export const PATCH = handler(async (req) => {
  assertSameOrigin(req)
  const user = await requireApiUser('seo.write')
  const input = entitySeoSchema.parse(await readJson(req))
  const { entry, before, after } = await updateEntitySeo(input, user.id)
  await audit({
    actor: user,
    action: 'update',
    entityType: `seo_${entry.entityType}`,
    entityId: entry.entityId ?? undefined,
    summary: `Updated SEO for ${entry.path}`,
    diff: diffFields(before as Record<string, unknown>, after as Record<string, unknown>),
  } as any)
  return ok({ path: entry.path, seo: after })
})
