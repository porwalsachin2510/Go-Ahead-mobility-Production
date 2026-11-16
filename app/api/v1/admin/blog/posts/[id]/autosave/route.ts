import { z } from 'zod'
import { requireApiUser } from '@/lib/server/auth/session'
import { assertSameOrigin, badRequest, handler, ok, readJson } from '@/lib/server/http'
import { discardAutosave, getAutosave, saveAutosave } from '@/lib/server/services/blog-editor'

type P = { id: string }

const body = z.object({ baseRevision: z.number().int().nonnegative(), data: z.record(z.string(), z.unknown()) })

export const GET = handler<P>(async (_req, { params }) => {
  const { id } = await params
  const user = await requireApiUser()
  return ok(await getAutosave(user, id))
})

export const PUT = handler<P>(async (req, { params }) => {
  assertSameOrigin(req)
  const { id } = await params
  const user = await requireApiUser()
  const parsed = body.safeParse(await readJson(req))
  if (!parsed.success) throw badRequest('Invalid autosave payload')
  return ok(await saveAutosave(user, id, parsed.data.data, parsed.data.baseRevision))
})

export const DELETE = handler<P>(async (req, { params }) => {
  assertSameOrigin(req)
  const { id } = await params
  const user = await requireApiUser()
  return ok(await discardAutosave(user, id))
})
