import { requireApiUser } from '@/lib/server/auth/session'
import { badRequest, handler, ok } from '@/lib/server/http'
import { compareRevisions } from '@/lib/server/services/blog-editor'

type P = { id: string }

export const GET = handler<P>(async (req, { params }) => {
  const { id } = await params
  const user = await requireApiUser()
  const sp = req.nextUrl.searchParams
  const from = Number(sp.get('from'))
  const toRaw = sp.get('to') ?? 'current'
  const to = toRaw === 'current' ? 'current' : Number(toRaw)
  if (!Number.isInteger(from) || from < 1 || (to !== 'current' && (!Number.isInteger(to) || to < 1))) throw badRequest('Pick two valid revisions to compare')
  return ok(await compareRevisions(user, id, from, to))
})
