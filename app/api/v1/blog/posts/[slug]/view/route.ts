import { assertSameOrigin, clientIp, handler, ok } from '@/lib/server/http'
import { rateLimit } from '@/lib/server/security/guards'
import { recordPostView } from '@/lib/server/services/public'

const BOT_UA = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|pingdom|monitor|curl|wget|python|axios/i

/**
 * Counted from the browser after the reader has stayed on the page, so crawlers, link
 * prefetches and server renders never inflate the number. One view per IP per post per 30 minutes.
 */
export const POST = handler<{ slug: string }>(async (req, { params }) => {
  assertSameOrigin(req)
  const { slug } = await params
  if (!/^[a-z0-9-]{1,120}$/.test(slug)) return ok({ counted: false })
  if (BOT_UA.test(req.headers.get('user-agent') ?? '')) return ok({ counted: false })
  try {
    await rateLimit(`view:${clientIp(req)}:${slug}`, 1, 1800)
  } catch {
    return ok({ counted: false })
  }
  return ok({ counted: await recordPostView(slug) })
})
