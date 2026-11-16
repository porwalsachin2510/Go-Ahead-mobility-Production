import { assertSameOrigin, clientIp, handler, ok } from '@/lib/server/http'
import { rateLimit } from '@/lib/server/security/guards'
import { recordJobView } from '@/lib/server/services/careers'

const BOT_UA = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|pingdom|monitor|curl|wget|python|axios/i

export const POST = handler<{ slug: string }>(async (req, { params }) => {
  assertSameOrigin(req)
  const { slug } = await params
  if (!/^[a-z0-9-]{1,120}$/.test(slug) || BOT_UA.test(req.headers.get('user-agent') ?? '')) return ok({ counted: false })
  try {
    await rateLimit(`jobview:${clientIp(req)}:${slug}`, 1, 1800)
  } catch {
    return ok({ counted: false })
  }
  return ok({ counted: await recordJobView(slug) })
})
