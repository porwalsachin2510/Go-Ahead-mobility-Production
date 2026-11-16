import { timingSafeEqual } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { connectDb } from '@/lib/server/db'
import { runScheduledPublishing } from '@/lib/server/services/blog-workflow'

export const dynamic = 'force-dynamic'

function authorised(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const given = req.headers.get('authorization') ?? ''
  const expected = `Bearer ${secret}`
  return given.length === expected.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected))
}

/** Invoked by Vercel Cron (see vercel.json). Requires CRON_SECRET; refuses all calls when it is unset. */
export async function GET(req: NextRequest) {
  if (!authorised(req)) return NextResponse.json({ ok: false, error: { code: 'unauthorized', message: 'Unauthorized' } }, { status: 401 })
  await connectDb()
  return NextResponse.json({ ok: true, data: await runScheduledPublishing() })
}
