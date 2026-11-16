import { z } from 'zod'
import { requireApiUser } from '@/lib/server/auth/session'
import { badRequest, handler, ok, readJson } from '@/lib/server/http'
import { bulkPostAction } from '@/lib/server/services/blog-workflow'

const schema = z.object({ ids: z.array(z.string().max(30)).min(1).max(100), action: z.enum(['archive', 'restore', 'delete', 'flag_update']) })

export const POST = handler(async (req) => {
  const user = await requireApiUser()
  const parsed = schema.safeParse(await readJson(req))
  if (!parsed.success) throw badRequest('Choose posts and a valid action')
  return ok(await bulkPostAction(user, parsed.data.ids, parsed.data.action))
})
