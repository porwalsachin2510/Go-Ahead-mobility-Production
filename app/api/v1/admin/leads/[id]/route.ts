import { requireApiUser } from '@/lib/server/auth/session'
import { handler, ok, readJson } from '@/lib/server/http'
import { getLead, leadUpdateSchema, updateLead } from '@/lib/server/services/admin-leads'

type P = { id: string }

export const GET = handler<P>(async (_req, { params }) => {
  const { id } = await params
  const user = await requireApiUser()
  return ok(await getLead(user, id))
})

export const PATCH = handler<P>(async (req, { params }) => {
  const { id } = await params
  const user = await requireApiUser()
  return ok(await updateLead(user, id, leadUpdateSchema.parse(await readJson(req))))
})
