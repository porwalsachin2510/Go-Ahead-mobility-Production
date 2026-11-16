import { requireApiUser } from '@/lib/server/auth/session'
import { handler, ok } from '@/lib/server/http'
import { duplicatePost } from '@/lib/server/services/blog-workflow'

export const POST = handler<{ id: string }>(async (_req, { params }) => {
  const { id } = await params
  const user = await requireApiUser()
  return ok(await duplicatePost(user, id), { status: 201 })
})
