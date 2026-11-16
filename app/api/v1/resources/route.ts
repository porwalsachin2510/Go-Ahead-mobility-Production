import { clientIp, errorResponse, ok } from '@/lib/server/http'
import { rateLimit } from '@/lib/server/security/guards'
import { listResourceCentreItems } from '@/lib/server/services/public'

export async function GET(req: Request) {
  try {
    await rateLimit(`resource-search:${clientIp(req)}`, 60, 600)
    const url = new URL(req.url)
    const q = (url.searchParams.get('q') || '').trim().slice(0, 80)
    const category = (url.searchParams.get('category') || '').trim().slice(0, 40)
    const type = (url.searchParams.get('type') || '').trim().slice(0, 30)
    const fileType = (url.searchParams.get('fileType') || '').trim().slice(0, 20)
    const resources = await listResourceCentreItems({ q, category, type, fileType, limit: 100 })
    return ok(resources, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    return errorResponse(error)
  }
}
