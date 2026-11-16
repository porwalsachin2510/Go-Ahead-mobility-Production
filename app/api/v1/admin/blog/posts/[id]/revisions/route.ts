import { z } from 'zod'
import { requireApiUser } from '@/lib/server/auth/session'
import { badRequest, handler, ok, readJson } from '@/lib/server/http'
import { listRevisions, restoreRevision } from '@/lib/server/services/blog-workflow'

type P = { id: string }

export const GET = handler<P>(async (_req, { params }) => {
  const { id } = await params
  const user = await requireApiUser()
  return ok(await listRevisions(user, id))
})

export const POST = handler<P>(async (req, { params }) => {
  const { id } = await params
  const user = await requireApiUser()
  const parsed = z.object({ version: z.number().int().positive() }).safeParse(await readJson(req))
  if (!parsed.success) throw badRequest('A revision version is required')
  return ok(await restoreRevision(user, id, parsed.data.version))
})
