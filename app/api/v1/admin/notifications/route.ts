import { z } from 'zod'
import { requireApiUser } from '@/lib/server/auth/session'
import { assertSameOrigin, handler, ok, readJson } from '@/lib/server/http'
import { listNotifications, markNotificationsRead } from '@/lib/server/services/notifications'

export const dynamic = 'force-dynamic'

export const GET = handler(async () => {
  const user = await requireApiUser()
  const data = await listNotifications(user)
  return ok(data, { headers: { 'Cache-Control': 'no-store' } })
})

const patchSchema = z.object({ ids: z.union([z.literal('all'), z.array(z.string().max(30)).max(100)]) })

export const PATCH = handler(async (req) => {
  assertSameOrigin(req)
  const user = await requireApiUser()
  const { ids } = patchSchema.parse(await readJson(req))
  await markNotificationsRead(user, ids)
  return ok({ ok: true })
})
