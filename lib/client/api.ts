export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string; details?: Record<string, string> } }

/** Thin fetch wrapper for the `{ ok, data | error }` envelope the API returns. */
export async function api<T = unknown>(url: string, init: RequestInit & { json?: unknown } = {}): Promise<ApiResult<T>> {
  const { json, headers, ...rest } = init
  try {
    const res = await fetch(url, {
      ...rest,
      credentials: 'same-origin',
      headers: json !== undefined ? { 'Content-Type': 'application/json', ...headers } : headers,
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    })
    const body = (await res.json().catch(() => null)) as ApiResult<T> | null
    if (body && typeof body === 'object' && 'ok' in body) return body
    return { ok: false, error: { code: 'bad_response', message: `Unexpected response (${res.status})` } }
  } catch {
    return { ok: false, error: { code: 'network', message: 'Network error. Check your connection and try again.' } }
  }
}

export const fetcher = async <T>(url: string): Promise<T> => {
  const r = await api<T>(url)
  if (!r.ok) throw Object.assign(new Error(r.error.message), { code: r.error.code })
  return r.data
}

export function collectAttribution() {
  if (typeof window === 'undefined') return {}
  const p = new URLSearchParams(window.location.search)
  const stored = (() => {
    try {
      return JSON.parse(sessionStorage.getItem('ga_attr') || '{}') as Record<string, string>
    } catch {
      return {}
    }
  })()
  return {
    landingPage: stored.landingPage || window.location.pathname,
    referrer: stored.referrer || document.referrer.slice(0, 300),
    utmSource: p.get('utm_source') || stored.utmSource || '',
    utmMedium: p.get('utm_medium') || stored.utmMedium || '',
    utmCampaign: p.get('utm_campaign') || stored.utmCampaign || '',
    utmContent: p.get('utm_content') || stored.utmContent || '',
    utmTerm: p.get('utm_term') || stored.utmTerm || '',
    gclid: p.get('gclid') || stored.gclid || '',
    submittedFrom: window.location.pathname,
  }
}
