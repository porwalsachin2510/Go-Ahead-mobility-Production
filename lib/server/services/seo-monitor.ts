import 'server-only'
import { headers } from 'next/headers'
import { connectDb } from '../db'
import { NotFoundLog } from '../models/seo'

const IGNORED = /^\/(?:_next|api|admin|wp-|\.well-known)|\.(?:php|asp|aspx|env|map|js|css|png|jpe?g|gif|svg|ico|webp|xml|txt|json)$/i
const BOT = /bot|crawl|spider|slurp|curl|wget|python|headless/i

/** Records a real 404 so editors can add redirects for URLs visitors actually hit. Never throws. */
export async function logNotFound(rawPath: string) {
  try {
    const path = (rawPath || '/').split(/[?#]/)[0].slice(0, 500).replace(/\/+$/, '') || '/'
    if (IGNORED.test(path)) return
    const h = await headers()
    const ua = h.get('user-agent') ?? ''
    if (!ua || (BOT.test(ua) && !/googlebot|bingbot/i.test(ua))) return
    let referrer = ''
    try {
      const ref = h.get('referer')
      if (ref) referrer = new URL(ref).toString().slice(0, 500)
    } catch {}
    await connectDb()
    await NotFoundLog.updateOne(
      { path },
      { $inc: { hits: 1 }, $set: { lastSeenAt: new Date(), resolved: false, ...(referrer ? { lastReferrer: referrer } : {}) }, $setOnInsert: { path } },
      { upsert: true },
    )
  } catch (e) {
    console.error('[seo] failed to log 404', e)
  }
}
