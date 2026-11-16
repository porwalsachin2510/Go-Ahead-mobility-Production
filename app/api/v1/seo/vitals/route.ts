import { z } from 'zod'
import { connectDb } from '@/lib/server/db'
import { clientIp, handler } from '@/lib/server/http'
import { WebVital } from '@/lib/server/models/seo'
import { rateLimit } from '@/lib/server/security/guards'
import { rateVital } from '@/lib/seo/vitals'

const schema = z.object({
  name: z.enum(['LCP', 'INP', 'CLS', 'FCP', 'TTFB']),
  value: z.number().finite().min(0).max(120000),
  path: z.string().trim().min(1).max(300).regex(/^\/[^\s]*$/),
  device: z.enum(['mobile', 'desktop']).default('desktop'),
})

export const POST = handler(async (req) => {
  const origin = req.headers.get('origin')
  if (origin && origin !== new URL(req.url).origin) return new Response(null, { status: 204 })

  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return new Response(null, { status: 204 })
  const { name, value, device } = parsed.data
  const path = parsed.data.path.split('?')[0].replace(/\/+$/, '') || '/'
  if (path.startsWith('/admin') || path.startsWith('/api')) return new Response(null, { status: 204 })

  await rateLimit(`vitals:${clientIp(req)}`, 60, 60)
  await connectDb()
  await WebVital.create({ name, value, rating: rateVital(name, value), path, device })
  return new Response(null, { status: 204 })
})
