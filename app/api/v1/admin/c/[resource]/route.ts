import { requireApiUser } from '@/lib/server/auth/session'
import { handler, ok, readJson } from '@/lib/server/http'
import { listResource, saveResource } from '@/lib/server/services/admin-crud'

type P = { resource: string }

export const GET = handler<P>(async (req, { params }) => {
  const { resource } = await params
  const user = await requireApiUser()
  return ok(await listResource(resource, user, req.nextUrl.searchParams))
})

export const POST = handler<P>(async (req, { params }) => {
  const { resource } = await params
  const user = await requireApiUser()
  return ok(await saveResource(resource, user, await readJson(req)), { status: 201 })
})
