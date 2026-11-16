import { getSeoSettings } from '@/lib/server/services/seo-inventory'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { site } = await getSeoSettings()
  if (!site.indexNow?.enabled || !site.indexNow.key) return new Response('Not found', { status: 404 })
  return new Response(site.indexNow.key, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' } })
}
