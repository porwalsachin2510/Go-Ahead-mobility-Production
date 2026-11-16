import { requireApiUser } from '@/lib/server/auth/session'
import { handler, ok, readJson } from '@/lib/server/http'
import { deleteResource, getResourceDoc, saveResource } from '@/lib/server/services/admin-crud'

type P = { resource: string; id: string }

export const GET = handler<P>(async (_req, { params }) => {
  const { resource, id } = await params
  const user = await requireApiUser()
  return ok(await getResourceDoc(resource, user, id))
})

export const PATCH = handler<P>(async (req, { params }) => {
  const { resource, id } = await params
  const user = await requireApiUser()
  return ok(await saveResource(resource, user, await readJson(req), id))
})

export const DELETE = handler<P>(async (_req, { params }) => {
  const { resource, id } = await params
  const user = await requireApiUser()
  await deleteResource(resource, user, id)
  return ok({ deleted: true })
})
