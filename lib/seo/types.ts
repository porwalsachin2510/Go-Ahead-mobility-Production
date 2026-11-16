export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info'
export const SEVERITIES: Severity[] = ['critical', 'high', 'medium', 'low', 'info']

export type EntityType = 'page' | 'route' | 'post' | 'industry' | 'case_study' | 'resource' | 'job' | 'archive' | 'static'

export type TemplateKind = 'page' | 'post' | 'industry' | 'case_study' | 'resource' | 'job'

export type SeoTemplates = Record<TemplateKind, { title: string; description: string }>

export type SeoSettings = {
  siteUrl: string
  brandName: string
  tagline: string
  locale: string
  defaultTitle: string
  titleTemplate: string
  defaultDescription: string
  ogImage: string
  robotsMode: string
  extraDisallow: string[]
  templates: SeoTemplates
  indexing: { minWords: number; requireDescription: boolean }
  sitemap: { enabled: boolean; excludePaths: string[] }
  organization: { legalName: string; logo: string }
  integrations: { searchConsoleSiteUrl: string; bingSiteUrl: string; ga4PropertyId: string }
  contact: { email: string; phone: string }
  social: string[]
  verification?: { google: string; bing: string; yandex: string; pinterest: string; baidu: string }
  indexNow?: { enabled: boolean; key: string }
  llms?: { enabled: boolean; intro: string }
  imageSitemap?: boolean
}

export type HeadingRef = { level: number; text: string }
export type ImageRef = { src: string; alt: string }
export type LinkRef = { href: string; text: string }

/** One row per public-facing (or potentially public-facing) URL, built from real database records. */
export type InventoryEntry = {
  key: string
  entityType: EntityType
  entityId: string | null
  path: string
  label: string
  pageType: string
  status: string
  /** Live and reachable by anonymous visitors right now. */
  isPublic: boolean
  indexable: boolean
  nofollow: boolean
  noindexReason: string
  title: string
  titleSource: 'explicit' | 'template' | 'content'
  description: string
  descriptionSource: 'explicit' | 'template' | 'content' | 'none'
  explicitCanonical: string
  canonicalPath: string
  headings: HeadingRef[]
  wordCount: number
  images: ImageRef[]
  links: LinkRef[]
  schemaTypes: string[]
  schemaIssues: string[]
  ogImage: string
  updatedAt: string | null
  editable: boolean
  /** Content verified by app data only when true; some listing pages cannot be fully analysed. */
  analysed: boolean
}

export type RedirectRule = { sourcePath: string; targetUrl: string; statusCode: number; enabled: boolean }

export type AuditIssue = {
  code: string
  severity: Severity
  title: string
  path: string
  entityKey: string
  evidence: string
  fix: string
  /** `verified`: determined from the app's own code/data. `external`: needs a crawler or Search Console. */
  verification: 'verified' | 'external'
}
