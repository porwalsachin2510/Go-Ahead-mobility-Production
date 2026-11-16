import { requireApiUser } from '@/lib/server/auth/session'
import { handler, ok, readJson } from '@/lib/server/http'
import { createPage, listPages } from '@/lib/server/services/admin-pages'

export const GET = handler(async (req) => {
  const user = await requireApiUser()
  return ok(await listPages(user, req.nextUrl.searchParams))
})

export const POST = handler(async (req) => {
  const user = await requireApiUser()
  return ok(await createPage(user, await readJson(req)), { status: 201 })
})
