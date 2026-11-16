import 'server-only'
import { randomBytes } from 'node:crypto'
import { connectDb } from '../db'
import { SiteSettings } from '../models/content'
import { getSeoSettings } from './seo-inventory'

export const INDEXNOW_KEY_PATH = '/indexnow-key.txt'
const ENDPOINT = 'https://api.indexnow.org/indexnow'
const MAX_URLS = 10000

export function generateIndexNowKey() {
  return randomBytes(16).toString('hex')
}

export type IndexNowResult = { submitted: number; status: number; message: string }

/**
 * Notifies Bing, Yandex, Seznam, Naver and other IndexNow engines that URLs changed. Only URLs on the
 * configured site host are sent; the engines reject anything else and may distrust the key.
 */
export async function submitIndexNow(urls: string[]): Promise<IndexNowResult> {
  const { site } = await getSeoSettings()
  if (!site.indexNow?.enabled || !site.indexNow.key) return { submitted: 0, status: 0, message: 'IndexNow is turned off in SEO settings.' }
  const host = new URL(site.siteUrl).host
  if (/^(localhost|127\.|0\.0\.0\.0)/.test(host) || host.endsWith('.vusercontent.net')) {
    return { submitted: 0, status: 0, message: `IndexNow needs the production domain; the site URL is ${host}.` }
  }
  const urlList = [...new Set(urls)].filter((u) => {
    try {
      return new URL(u).host === host
    } catch {
      return false
    }
  }).slice(0, MAX_URLS)
  if (!urlList.length) return { submitted: 0, status: 0, message: 'No URLs to submit.' }

  let status = 0
  let message = ''
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host, key: site.indexNow.key, keyLocation: `${site.siteUrl}${INDEXNOW_KEY_PATH}`, urlList }),
      signal: AbortSignal.timeout(15000),
    })
    status = res.status
    message =
      status === 200 || status === 202
        ? `Accepted ${urlList.length} URL${urlList.length === 1 ? '' : 's'}.`
        : status === 403
          ? 'Key rejected: the key file is not reachable on the live domain yet.'
          : status === 422
            ? 'URLs do not match the host or key.'
            : status === 429
              ? 'Rate limited by IndexNow; try again later.'
              : `IndexNow responded with HTTP ${status}.`
  } catch (e) {
    message = `Could not reach IndexNow: ${(e as Error).message}`
  }
  await connectDb()
  await SiteSettings.updateOne({ key: 'site' }, { $set: { 'seo.indexNow.lastSubmittedAt': new Date(), 'seo.indexNow.lastStatus': message } })
  return { submitted: status === 200 || status === 202 ? urlList.length : 0, status, message }
}

/** Fire-and-forget hook for publish events; never throws into the caller. */
export function notifyIndexNow(urls: string[]) {
  submitIndexNow(urls).catch(() => {})
}
