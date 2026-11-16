import { z } from 'zod'
import { requireApiUser } from '@/lib/server/auth/session'
import { handler, ok, readJson } from '@/lib/server/http'
import { deletePage, getPage, saveDraft, setPageState } from '@/lib/server/services/admin-pages'

type P = { id: string }

export const GET = handler<P>(async (_req, { params }) => {
  const { id } = await params
  return ok(await getPage(await requireApiUser(), id))
})

export const PUT = handler<P>(async (req, { params }) => {
  const { id } = await params
  return ok(await saveDraft(await requireApiUser(), id, await readJson(req)))
})

const actionSchema = z.object({ action: z.enum(['publish', 'unpublish', 'submit', 'restore']), version: z.number().int().positive().optional() })

export const POST = handler<P>(async (req, { params }) => {
  const { id } = await params
  const { action, version } = actionSchema.parse(await readJson(req))
  return ok(await setPageState(await requireApiUser(), id, action, version))
})

export const DELETE = handler<P>(async (_req, { params }) => {
  const { id } = await params
  await deletePage(await requireApiUser(), id)
  return ok({ deleted: true })
})
