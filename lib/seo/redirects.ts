import { isPrivatePath, normalizePath } from './config'
import type { RedirectRule } from './types'

export const MAX_REDIRECT_HOPS = 10

export type TargetCheck = { ok: true; target: string } | { ok: false; error: string }

/**
 * Accepts only same-site paths or absolute http(s) URLs. Blocks protocol-relative URLs, other schemes,
 * credentials, backslashes and control characters to prevent open-redirect abuse.
 */
export function validateRedirectTarget(raw: string, opts: { siteHost?: string; allowExternal?: boolean } = {}): TargetCheck {
  const target = (raw ?? '').trim()
  if (!target) return { ok: false, error: 'Destination is required' }
  if (/[\u0000-\u001f\u007f\\]/.test(target)) return { ok: false, error: 'Destination contains invalid characters' }
  if (target.startsWith('//')) return { ok: false, error: 'Protocol-relative URLs are not allowed' }
  if (target.startsWith('/')) {
    if (isPrivatePath(target)) return { ok: false, error: 'Destination cannot be an admin, API or preview path' }
    return { ok: true, target }
  }
  let url: URL
  try {
    url = new URL(target)
  } catch {
    return { ok: false, error: 'Use a site path like /new-page or a full https:// URL' }
  }
  if (!/^https?:$/.test(url.protocol)) return { ok: false, error: 'Only http and https destinations are allowed' }
  if (url.username || url.password) return { ok: false, error: 'Destination must not contain credentials' }
  if (opts.siteHost && url.host === opts.siteHost) {
    if (isPrivatePath(url.pathname)) return { ok: false, error: 'Destination cannot be an admin, API or preview path' }
    return { ok: true, target: `${url.pathname}${url.search}` }
  }
  if (!opts.allowExternal) return { ok: false, error: 'External destinations are disabled. Use a path on this site.' }
  return { ok: true, target: url.toString() }
}

export function validateRedirectSource(raw: string): { ok: true; source: string } | { ok: false; error: string } {
  const value = (raw ?? '').trim()
  if (!value.startsWith('/') || value.startsWith('//')) return { ok: false, error: 'Source must be a path starting with /' }
  if (/[?#\s]/.test(value)) return { ok: false, error: 'Source cannot contain a query string, fragment or spaces' }
  const source = normalizePath(value)
  if (source === '/') return { ok: false, error: 'The home page cannot be redirected' }
  if (isPrivatePath(source)) return { ok: false, error: 'Admin, API and preview paths cannot be redirected' }
  return { ok: true, source }
}

const targetPath = (rule: RedirectRule) => (rule.statusCode === 410 || !rule.targetUrl ? null : rule.targetUrl.startsWith('/') ? normalizePath(rule.targetUrl) : null)

export type ChainResult = { final: string | null; hops: string[]; loop: boolean }

/** Follows internal redirects from `start` and reports hops and loops. */
export function followRedirects(rules: RedirectRule[], start: string): ChainResult {
  const map = new Map(rules.filter((r) => r.enabled).map((r) => [normalizePath(r.sourcePath), r]))
  const hops: string[] = []
  const seen = new Set<string>([normalizePath(start)])
  let current = normalizePath(start)
  for (let i = 0; i < MAX_REDIRECT_HOPS; i++) {
    const rule = map.get(current)
    if (!rule) return { final: current, hops, loop: false }
    const next = targetPath(rule)
    if (!next) return { final: null, hops, loop: false }
    hops.push(next)
    if (seen.has(next)) return { final: null, hops, loop: true }
    seen.add(next)
    current = next
  }
  return { final: current, hops, loop: false }
}

export type RedirectProblem = { sourcePath: string; kind: 'loop' | 'chain' | 'collision' | 'dead_target'; message: string }

/** Whole-graph analysis for the redirect manager and audit engine. */
export function analyzeRedirects(rules: RedirectRule[], livePaths: Set<string>): RedirectProblem[] {
  const problems: RedirectProblem[] = []
  const enabled = rules.filter((r) => r.enabled)
  const sources = new Set(enabled.map((r) => normalizePath(r.sourcePath)))
  for (const rule of enabled) {
    const source = normalizePath(rule.sourcePath)
    if (livePaths.has(source)) problems.push({ sourcePath: source, kind: 'collision', message: `${source} is a live page, so this redirect conflicts with real content.` })
    const next = targetPath(rule)
    if (!next) continue
    const chain = followRedirects(enabled, source)
    if (chain.loop) problems.push({ sourcePath: source, kind: 'loop', message: `Redirect loop: ${[source, ...chain.hops].join(' → ')}` })
    else if (chain.hops.length > 1) problems.push({ sourcePath: source, kind: 'chain', message: `Redirect chain of ${chain.hops.length} hops: ${[source, ...chain.hops].join(' → ')}. Point ${source} directly to ${chain.final}.` })
    else if (!livePaths.has(next) && !sources.has(next) && !isKnownAsset(next)) problems.push({ sourcePath: source, kind: 'dead_target', message: `Destination ${next} does not match any live page.` })
  }
  return problems
}

const isKnownAsset = (path: string) => /^\/(images|brand|api\/v1\/media)\//.test(path)

/** Checks whether adding source→target would create a loop given existing rules. */
export function wouldCreateLoop(rules: RedirectRule[], source: string, target: string): boolean {
  const candidate: RedirectRule = { sourcePath: source, targetUrl: target, statusCode: 301, enabled: true }
  const without = rules.filter((r) => normalizePath(r.sourcePath) !== normalizePath(source))
  return followRedirects([...without, candidate], source).loop
}
