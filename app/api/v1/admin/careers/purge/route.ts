import { requireApiUser } from '@/lib/server/auth/session'
import { assertSameOrigin, handler, ok } from '@/lib/server/http'
import { purgeExpiredApplications } from '@/lib/server/services/careers'

export const POST = handler(async (req) => {
  assertSameOrigin(req)
  const user = await requireApiUser('careers.manage')
  return ok(await purgeExpiredApplications(user))
})
