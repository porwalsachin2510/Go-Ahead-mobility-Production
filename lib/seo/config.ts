import type { SeoSettings, SeoTemplates } from './types'

export const DEFAULT_SITE_URL = 'https://goaheadmobility.com'

export const PRIVATE_PREFIXES = ['/admin', '/api', '/preview'] as const

export const DEFAULT_TEMPLATES: SeoTemplates = {
  page: { title: '%title%', description: '' },
  post: { title: '%title%', description: '' },
  industry: { title: '%title% accommodation and transport', description: '' },
  case_study: { title: '%title%', description: '' },
  resource: { title: '%title%', description: '' },
  job: { title: '%title% careers', description: '' },
}

export const DEFAULT_SEO_SETTINGS: SeoSettings = {
  siteUrl: '',
  brandName: 'GoAhead Mobility',
  tagline: 'Global accommodation and local transportation for organisations.',
  locale: 'en',
  defaultTitle: 'GoAhead Mobility',
  titleTemplate: '%s | GoAhead Mobility',
  defaultDescription: '',
  ogImage: '',
  robotsMode: 'allow',
  extraDisallow: [],
  templates: DEFAULT_TEMPLATES,
  indexing: { minWords: 120, requireDescription: false },
  sitemap: { enabled: true, excludePaths: [] },
  organization: { legalName: '', logo: '/brand/goahead-logo.png' },
  integrations: { searchConsoleSiteUrl: '', bingSiteUrl: '', ga4PropertyId: '' },
  contact: { email: '', phone: '' },
  social: [],
}

/** Resolves the production origin: settings, then env, then default. Always an origin without a path. */
export function resolveSiteUrl(configured?: string | null, envUrl?: string | null, isProduction = process.env.NODE_ENV === 'production'): string {
  for (const candidate of [configured, envUrl, DEFAULT_SITE_URL]) {
    if (!candidate) continue
    try {
      const url = new URL(candidate.trim())
      if (!/^https?:$/.test(url.protocol) || !url.hostname) continue
      const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1'
      if (isProduction && !local) url.protocol = 'https:'
      return url.origin
    } catch {
      continue
    }
  }
  return DEFAULT_SITE_URL
}

/** Canonical path form: leading slash, lowercase, no query, no hash, no trailing slash (except root). */
export function normalizePath(input: string): string {
  let p = (input ?? '').split('#')[0].split('?')[0].trim()
  try {
    p = decodeURI(p)
  } catch {
    // keep as is when the sequence is malformed
  }
  p = `/${p}`.replace(/\/+/g, '/')
  if (p.length > 1) p = p.replace(/\/$/, '')
  return p.toLowerCase()
}

export function isPrivatePath(path: string): boolean {
  const p = normalizePath(path)
  return PRIVATE_PREFIXES.some((prefix) => p === prefix || p.startsWith(`${prefix}/`))
}

export function isAbsoluteHttpUrl(value: string): boolean {
  try {
    return /^https?:$/.test(new URL(value).protocol)
  } catch {
    return false
  }
}

/** Absolute canonical URL for a site path. Root keeps a single trailing slash so it matches the browser form. */
export function canonicalUrl(base: string, path: string): string {
  const p = normalizePath(path)
  return p === '/' ? `${base}/` : `${base}${p}`
}

/** Makes any site path or absolute URL absolute (used for images and Open Graph). */
export function absoluteUrl(base: string, pathOrUrl: string): string {
  if (!pathOrUrl) return ''
  if (isAbsoluteHttpUrl(pathOrUrl)) return pathOrUrl
  return `${base}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`
}

/** Explicit canonical wins when valid; otherwise the page path. Query strings and fragments are always removed. */
export function resolveCanonical(base: string, path: string, explicit?: string | null): string {
  const value = (explicit ?? '').trim()
  if (value) {
    if (isAbsoluteHttpUrl(value)) {
      const u = new URL(value)
      return u.pathname === '/' ? `${u.origin}/` : `${u.origin}${u.pathname.replace(/\/$/, '')}`
    }
    if (value.startsWith('/') && !value.startsWith('//')) return canonicalUrl(base, value)
  }
  return canonicalUrl(base, path)
}

export function toOgLocale(locale: string): string {
  const l = (locale || 'en').replace('-', '_')
  if (l.includes('_')) return l
  return l === 'en' ? 'en_US' : l
}

/** Merges stored settings (possibly partial or from an older schema) with safe defaults. */
export function mergeSeoSettings(raw: any): SeoSettings {
  const seo = raw?.seo ?? {}
  const social = raw?.social && typeof raw.social === 'object' ? (Object.values(raw.social) as unknown[]).filter((v): v is string => typeof v === 'string' && isAbsoluteHttpUrl(v)) : []
  const templates = { ...DEFAULT_TEMPLATES } as SeoTemplates
  for (const key of Object.keys(DEFAULT_TEMPLATES) as (keyof SeoTemplates)[]) {
    templates[key] = { ...DEFAULT_TEMPLATES[key], ...(seo.templates?.[key] ?? {}) }
  }
  const brandName = raw?.brandName || DEFAULT_SEO_SETTINGS.brandName
  return {
    siteUrl: resolveSiteUrl(raw?.siteUrl, process.env.NEXT_PUBLIC_SITE_URL),
    brandName,
    tagline: raw?.tagline || DEFAULT_SEO_SETTINGS.tagline,
    locale: raw?.locale || 'en',
    defaultTitle: seo.defaultTitle || brandName,
    titleTemplate: seo.titleTemplate || `%s | ${brandName}`,
    defaultDescription: seo.defaultDescription || raw?.tagline || DEFAULT_SEO_SETTINGS.tagline,
    ogImage: seo.ogImage || '',
    robotsMode: seo.robotsMode || 'allow',
    extraDisallow: Array.isArray(seo.extraDisallow) ? seo.extraDisallow : [],
    templates,
    indexing: { minWords: seo.indexing?.minWords ?? 120, requireDescription: Boolean(seo.indexing?.requireDescription) },
    sitemap: { enabled: seo.sitemap?.enabled !== false, excludePaths: Array.isArray(seo.sitemap?.excludePaths) ? seo.sitemap.excludePaths : [] },
    organization: { legalName: seo.organization?.legalName || '', logo: seo.organization?.logo || DEFAULT_SEO_SETTINGS.organization.logo },
    integrations: {
      searchConsoleSiteUrl: seo.integrations?.searchConsoleSiteUrl || '',
      bingSiteUrl: seo.integrations?.bingSiteUrl || '',
      ga4PropertyId: seo.integrations?.ga4PropertyId || '',
    },
    contact: { email: raw?.contact?.email || '', phone: raw?.contact?.phone || '' },
    social,
    verification: {
      google: String(seo.verification?.google ?? '').trim(),
      bing: String(seo.verification?.bing ?? '').trim(),
      yandex: String(seo.verification?.yandex ?? '').trim(),
      pinterest: String(seo.verification?.pinterest ?? '').trim(),
      baidu: String(seo.verification?.baidu ?? '').trim(),
    },
    indexNow: { enabled: Boolean(seo.indexNow?.enabled), key: String(seo.indexNow?.key ?? '').trim() },
    llms: { enabled: seo.llms?.enabled !== false, intro: String(seo.llms?.intro ?? '') },
    imageSitemap: seo.imageSitemap !== false,
  }
}
