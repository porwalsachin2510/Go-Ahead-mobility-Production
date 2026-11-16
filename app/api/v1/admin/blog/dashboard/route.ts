import { requireApiUser } from '@/lib/server/auth/session'
import { handler, ok } from '@/lib/server/http'
import { blogDashboard } from '@/lib/server/services/blog-workflow'

export const GET = handler(async (req) => {
  const user = await requireApiUser('content.read')
  const days = Number(req.nextUrl.searchParams.get('days') ?? 90)
  return ok(await blogDashboard(user, Number.isFinite(days) ? days : 90))
})
