export type RobotsGroup = { userAgent: string; allow: string[]; disallow: string[] }
export type RobotsConfig = { siteUrl: string; mode: string; extraDisallow: string[]; sitemapEnabled?: boolean }
export type RobotsResult = { groups: RobotsGroup[]; sitemaps: string[]; blockAll: boolean }

/** Allow rules that must always win over broader Disallow rules because pages need them to render. */
export const ALWAYS_ALLOWED = ['/', '/api/v1/media/', '/_next/static/', '/_next/image']

export const BASE_DISALLOW = ['/admin', '/api/', '/preview', '/*?q=', '/*&q=']

const PROTECTED_PREFIXES = ['/api/v1/media', '/_next', '/images', '/brand']

export function isBlockAll(mode: string) {
  return mode === 'disallow_all' || mode === 'block'
}

/** Returns an error for each extra rule that is unsafe or malformed. */
export function validateExtraDisallow(lines: string[]): string[] {
  const errors: string[] = []
  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue
    if (!line.startsWith('/')) errors.push(`"${line}" must start with /`)
    else if (/\s/.test(line)) errors.push(`"${line}" must not contain spaces`)
    else if (line === '/') errors.push('Disallowing "/" blocks the whole site. Use the "Block all crawlers" mode instead.')
    else if (PROTECTED_PREFIXES.some((p) => line.startsWith(p) || p.startsWith(line.replace(/\*.*$/, '')))) errors.push(`"${line}" would block assets needed to render pages`)
  }
  return errors
}

export function buildRobots(config: RobotsConfig): RobotsResult {
  if (isBlockAll(config.mode)) return { groups: [{ userAgent: '*', allow: [], disallow: ['/'] }], sitemaps: [], blockAll: true }
  const extra = config.extraDisallow.map((l) => l.trim()).filter((l) => l && validateExtraDisallow([l]).length === 0)
  return {
    groups: [{ userAgent: '*', allow: ALWAYS_ALLOWED, disallow: [...BASE_DISALLOW, ...extra] }],
    sitemaps: config.sitemapEnabled === false ? [] : [`${config.siteUrl}/sitemap.xml`],
    blockAll: false,
  }
}

export function renderRobotsTxt(result: RobotsResult): string {
  const lines: string[] = []
  for (const g of result.groups) {
    lines.push(`User-agent: ${g.userAgent}`)
    for (const a of g.allow) lines.push(`Allow: ${a}`)
    for (const d of g.disallow) lines.push(`Disallow: ${d}`)
    lines.push('')
  }
  for (const s of result.sitemaps) lines.push(`Sitemap: ${s}`)
  return `${lines.join('\n').trim()}\n`
}

function toRegex(pattern: string) {
  const anchored = pattern.endsWith('$')
  const body = (anchored ? pattern.slice(0, -1) : pattern).replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')
  return new RegExp(`^${body}${anchored ? '$' : ''}`)
}

/** Implements Google's longest-match precedence (Allow wins ties). `pathWithQuery` should include the query string. */
export function isBlockedByRobots(pathWithQuery: string, result: RobotsResult, userAgent = '*'): boolean {
  const group = result.groups.find((g) => g.userAgent === userAgent) ?? result.groups.find((g) => g.userAgent === '*')
  if (!group) return false
  let best = { length: -1, allow: true }
  const consider = (rules: string[], allow: boolean) => {
    for (const rule of rules) {
      if (!rule) continue
      if (toRegex(rule).test(pathWithQuery) && (rule.length > best.length || (rule.length === best.length && allow))) best = { length: rule.length, allow }
    }
  }
  consider(group.disallow, false)
  consider(group.allow, true)
  return !best.allow
}
