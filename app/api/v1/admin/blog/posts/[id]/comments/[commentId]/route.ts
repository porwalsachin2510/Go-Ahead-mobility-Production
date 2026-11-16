import { z } from 'zod'
import { requireApiUser } from '@/lib/server/auth/session'
import { assertSameOrigin, badRequest, handler, ok, readJson } from '@/lib/server/http'
import { setCommentResolved } from '@/lib/server/services/blog-editor'

type P = { id: string; commentId: string }

export const PATCH = handler<P>(async (req, { params }) => {
  assertSameOrigin(req)
  const { id, commentId } = await params
  const user = await requireApiUser()
  const parsed = z.object({ resolved: z.boolean() }).safeParse(await readJson(req))
  if (!parsed.success) throw badRequest('Invalid request')
  return ok(await setCommentResolved(user, id, commentId, parsed.data.resolved))
})
