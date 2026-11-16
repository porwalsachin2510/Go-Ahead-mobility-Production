import { isAbsoluteHttpUrl, isPrivatePath, normalizePath } from './config'
import { analyzeRedirects } from './redirects'
import { isBlockedByRobots, isBlockAll, type RobotsResult } from './robots'
import { sitemapExclusion } from './sitemap'
import { GENERIC_ANCHORS, isCleanSlug, normalizeForCompare } from './text'
import type { AuditIssue, InventoryEntry, RedirectRule, SeoSettings, Severity } from './types'

export type AuditContext = {
  entries: InventoryEntry[]
  redirects: RedirectRule[]
  site: SeoSettings
  robots: RobotsResult
  /** Hrefs found in header/footer navigation menus. */
  navLinks: string[]
  siteUrlConfigured: boolean
  isProduction: boolean
}

type Draft = Omit<AuditIssue, 'path' | 'entityKey' | 'verification'> & { verification?: AuditIssue['verification'] }

/** Rule metadata used by the UI for filters and for the fix guidance. */
export const RULE_CATALOG: Record<string, { label: string; severity: Severity }> = {
  missing_title: { label: 'Missing page title', severity: 'high' },
  title_long: { label: 'Title likely truncated', severity: 'low' },
  title_short: { label: 'Very short title', severity: 'low' },
  duplicate_title: { label: 'Duplicate title', severity: 'medium' },
  missing_description: { label: 'Missing meta description', severity: 'medium' },
  description_long: { label: 'Description likely truncated', severity: 'low' },
  description_short: { label: 'Very short description', severity: 'low' },
  duplicate_description: { label: 'Duplicate description', severity: 'medium' },
  missing_h1: { label: 'No H1 heading', severity: 'high' },
  multiple_h1: { label: 'More than one H1', severity: 'medium' },
  heading_skip: { label: 'Skipped heading level', severity: 'low' },
  thin_content: { label: 'Thin content', severity: 'medium' },
  noindex_published: { label: 'Published page is noindex', severity: 'info' },
  canonical_invalid: { label: 'Invalid canonical', severity: 'high' },
  canonical_offsite: { label: 'Canonical points off-site', severity: 'medium' },
  canonical_other_page: { label: 'Canonical points to another page', severity: 'medium' },
  canonical_missing_target: { label: 'Canonical target does not exist', severity: 'high' },
  image_missing_alt: { label: 'Image without alt text', severity: 'medium' },
  image_generic_alt: { label: 'Alt text is a file name', severity: 'low' },
  broken_internal_link: { label: 'Broken internal link', severity: 'high' },
  link_to_redirect: { label: 'Internal link to a redirected URL', severity: 'low' },
  generic_anchor: { label: 'Generic link text', severity: 'low' },
  redirect_loop: { label: 'Redirect loop', severity: 'critical' },
  redirect_chain: { label: 'Redirect chain', severity: 'medium' },
  redirect_collision: { label: 'Redirect hides a live page', severity: 'high' },
  redirect_dead_target: { label: 'Redirect destination missing', severity: 'high' },
  orphan_page: { label: 'Orphan page', severity: 'medium' },
  robots_block_all: { label: 'Robots blocks the whole site', severity: 'critical' },
  robots_blocks_public: { label: 'Robots blocks an indexable page', severity: 'critical' },
  robots_blocks_assets: { label: 'Robots blocks page assets', severity: 'high' },
  sitemap_missing_url: { label: 'Indexable page not in sitemap', severity: 'medium' },
  sitemap_disabled: { label: 'Sitemap is disabled', severity: 'high' },
  schema_invalid: { label: 'Structured data problem', severity: 'medium' },
  slug_unclean: { label: 'URL is not clean', severity: 'low' },
  og_image_missing: { label: 'No social share image', severity: 'low' },
  site_url_unset: { label: 'Site URL not configured', severity: 'high' },
  site_url_insecure: { label: 'Site URL is not HTTPS', severity: 'high' },
}

const BASE_IMAGE_ASSET = '/api/v1/media/probe.jpg'

export function runAuditRules(ctx: AuditContext): AuditIssue[] {
  const issues: AuditIssue[] = []
  const add = (entry: InventoryEntry | null, code: string, draft: Omit<Draft, 'code' | 'title' | 'severity'> & { severity?: Severity }) => {
    const meta = RULE_CATALOG[code]
    issues.push({
      code,
      title: meta?.label ?? code,
      severity: draft.severity ?? meta?.severity ?? 'low',
      path: entry?.path ?? '/',
      entityKey: entry?.key ?? 'site',
      evidence: draft.evidence,
      fix: draft.fix,
      verification: draft.verification ?? 'verified',
    })
  }

  const publicEntries = ctx.entries.filter((e) => e.isPublic)
  const indexable = publicEntries.filter((e) => e.indexable)
  const livePaths = new Set(publicEntries.map((e) => e.path))
  const redirectMap = new Map(ctx.redirects.filter((r) => r.enabled).map((r) => [normalizePath(r.sourcePath), r]))
  const knownTargets = new Set([...livePaths, ...redirectMap.keys()])

  // Site-level
  if (!ctx.siteUrlConfigured) add(null, 'site_url_unset', { evidence: 'No site URL is saved, so the default domain is used for canonicals, sitemap and Open Graph.', fix: 'Set the production URL in SEO > Settings (or NEXT_PUBLIC_SITE_URL).' })
  if (ctx.isProduction && !ctx.site.siteUrl.startsWith('https://')) add(null, 'site_url_insecure', { evidence: `Site URL is ${ctx.site.siteUrl}.`, fix: 'Use an https:// production URL.' })
  if (isBlockAll(ctx.site.robotsMode)) add(null, 'robots_block_all', { evidence: 'Robots mode is "Block all crawlers", so no page can be crawled.', fix: 'Switch robots mode to Allow before launch in SEO > Settings.', severity: ctx.isProduction ? 'critical' : 'info' })
  if (!ctx.site.sitemap.enabled) add(null, 'sitemap_disabled', { evidence: 'Sitemap generation is switched off.', fix: 'Enable the sitemap in SEO > Settings.' })
  if (!ctx.robots.blockAll && isBlockedByRobots(BASE_IMAGE_ASSET, ctx.robots)) add(null, 'robots_blocks_assets', { evidence: 'Robots rules block /api/v1/media/, where CMS images are served.', fix: 'Allow /api/v1/media/ so images can be rendered and indexed.' })

  // Page-level
  const titles = new Map<string, InventoryEntry[]>()
  const descriptions = new Map<string, InventoryEntry[]>()
  for (const e of indexable) {
    const t = normalizeForCompare(e.title)
    if (t) titles.set(t, [...(titles.get(t) ?? []), e])
    const d = normalizeForCompare(e.description)
    if (d) descriptions.set(d, [...(descriptions.get(d) ?? []), e])
  }

  const inbound = new Map<string, number>()
  const countInbound = (from: string, href: string) => {
    if (!href.startsWith('/') || href.startsWith('//')) return
    const target = normalizePath(href)
    if (target !== from) inbound.set(target, (inbound.get(target) ?? 0) + 1)
  }
  for (const href of ctx.navLinks) countInbound('', href)
  for (const e of publicEntries) for (const l of e.links) countInbound(e.path, l.href)

  for (const e of publicEntries) {
    if (e.indexable) {
      if (!e.title.trim()) add(e, 'missing_title', { evidence: 'No explicit, templated or content-derived title is available.', fix: 'Add an SEO title in the page editor.' })
      else if (e.title.length > 60) add(e, 'title_long', { evidence: `Title is ${e.title.length} characters: "${e.title}".`, fix: 'Shorten to about 60 characters and lead with the main topic.' })
      else if (e.title.length < 25 && e.entityType !== 'static') add(e, 'title_short', { evidence: `Title is only ${e.title.length} characters: "${e.title}".`, fix: 'Add descriptive context such as the service, audience or location.' })

      const dupT = titles.get(normalizeForCompare(e.title))
      if (e.title && dupT && dupT.length > 1) add(e, 'duplicate_title', { evidence: `Shares the title "${e.title}" with ${dupT.filter((x) => x !== e).map((x) => x.path).slice(0, 4).join(', ')}.`, fix: 'Write a unique title that distinguishes this page.' })

      if (e.descriptionSource === 'none' || !e.description.trim()) add(e, 'missing_description', { evidence: 'No explicit description and no content to derive one from.', fix: 'Write a 70-160 character summary of the page.', severity: ctx.site.indexing.requireDescription ? 'high' : 'medium' })
      else if (e.description.length > 160) add(e, 'description_long', { evidence: `Description is ${e.description.length} characters.`, fix: 'Trim to about 155 characters and put the main point first.' })
      else if (e.description.length < 70) add(e, 'description_short', { evidence: `Description is only ${e.description.length} characters.`, fix: 'Add concrete detail that helps searchers decide to visit.' })

      const dupD = descriptions.get(normalizeForCompare(e.description))
      if (e.description && dupD && dupD.length > 1) add(e, 'duplicate_description', { evidence: `Shares its description with ${dupD.filter((x) => x !== e).map((x) => x.path).slice(0, 4).join(', ')}.`, fix: 'Write a unique description for each page.' })

      if (e.analysed && e.wordCount > 0 && e.wordCount < ctx.site.indexing.minWords && e.entityType !== 'static' && e.pageType !== 'home') add(e, 'thin_content', { evidence: `Only ${e.wordCount} words of indexable text (threshold ${ctx.site.indexing.minWords}).`, fix: 'Add substantive, original content or set the page to noindex.' })

      if (!e.ogImage && !ctx.site.ogImage) add(e, 'og_image_missing', { evidence: 'No page image or site default share image is configured.', fix: 'Set a default Open Graph image in SEO > Settings, or add one on the page.' })
      if (!sitemapExclusion(e, { redirectSources: new Set(redirectMap.keys()), excludePaths: ctx.site.sitemap.excludePaths }) && !ctx.site.sitemap.enabled) {
        add(e, 'sitemap_missing_url', { evidence: 'Eligible for the sitemap, but sitemap generation is off.', fix: 'Enable the sitemap in SEO > Settings.' })
      }
      if (!ctx.robots.blockAll && isBlockedByRobots(e.path, ctx.robots)) add(e, 'robots_blocks_public', { evidence: 'Current robots rules disallow this indexable URL.', fix: 'Remove the matching Disallow rule.' })
      if (e.path !== '/' && !inbound.get(e.path)) add(e, 'orphan_page', { evidence: 'No navigation menu or other page links to this URL.', fix: 'Link to it from a relevant page or add it to the navigation.' })
    } else if (e.status === 'published' && e.noindexReason && e.entityType !== 'static') {
      add(e, 'noindex_published', { evidence: e.noindexReason, fix: 'Confirm this is intentional. Remove noindex if the page should rank.' })
    }

    if (e.analysed) {
      const h1 = e.headings.filter((h) => h.level === 1).length
      if (h1 === 0 && e.indexable) add(e, 'missing_h1', { evidence: 'The rendered page has no H1.', fix: 'Add a single descriptive H1 (a hero block or page title).' })
      if (h1 > 1) add(e, 'multiple_h1', { evidence: `${h1} H1 headings: ${e.headings.filter((h) => h.level === 1).map((h) => `"${h.text}"`).join(', ')}.`, fix: 'Keep one H1 and demote the others to H2.' })
      for (let i = 1; i < e.headings.length; i++) {
        if (e.headings[i].level - e.headings[i - 1].level > 1) {
          add(e, 'heading_skip', { evidence: `H${e.headings[i - 1].level} "${e.headings[i - 1].text}" is followed by H${e.headings[i].level} "${e.headings[i].text}".`, fix: 'Step headings down one level at a time.' })
          break
        }
      }
    }

    if (e.explicitCanonical) {
      if (!isAbsoluteHttpUrl(e.explicitCanonical) && !e.explicitCanonical.startsWith('/')) add(e, 'canonical_invalid', { evidence: `"${e.explicitCanonical}" is neither a path nor an absolute URL.`, fix: 'Use /path or https://domain/path.' })
      else if (isAbsoluteHttpUrl(e.explicitCanonical) && new URL(e.explicitCanonical).host !== new URL(ctx.site.siteUrl).host) add(e, 'canonical_offsite', { evidence: `Canonical points to ${e.explicitCanonical}.`, fix: 'Confirm cross-domain canonicalisation is intentional; otherwise clear it.' })
      else if (e.canonicalPath !== e.path) {
        add(e, 'canonical_other_page', { evidence: `Canonical is ${e.canonicalPath}, not ${e.path}.`, fix: 'Clear the canonical unless this page is a deliberate duplicate.' })
        if (!knownTargets.has(e.canonicalPath)) add(e, 'canonical_missing_target', { evidence: `${e.canonicalPath} is not a live page.`, fix: 'Point the canonical to an existing indexable URL.' })
      }
    }

    for (const img of e.images) {
      if (!img.alt.trim()) add(e, 'image_missing_alt', { evidence: `Image ${img.src} has no alt text.`, fix: 'Describe the image, or use empty alt only for decorative images.' })
      else if (/\.(jpe?g|png|webp|gif|avif)$/i.test(img.alt.trim())) add(e, 'image_generic_alt', { evidence: `Alt text "${img.alt}" looks like a file name.`, fix: 'Write a short human description.' })
    }

    const reported = new Set<string>()
    for (const l of e.links) {
      if (!l.href.startsWith('/') || l.href.startsWith('//')) continue
      const target = normalizePath(l.href)
      if (isPrivatePath(target) && !target.startsWith('/api/v1/media')) continue
      if (/^\/(images|brand|api)\//.test(target) || /\.[a-z0-9]{2,4}$/i.test(target)) continue
      if (reported.has(target)) continue
      reported.add(target)
      if (redirectMap.has(target)) add(e, 'link_to_redirect', { evidence: `Links to ${target}, which redirects to ${redirectMap.get(target)!.targetUrl}.`, fix: 'Update the link to the final URL.' })
      else if (!livePaths.has(target)) add(e, 'broken_internal_link', { evidence: `Links to ${target}${l.text ? ` ("${l.text}")` : ''}, which is not a live page.`, fix: 'Fix the link or create the page.' })
      if (GENERIC_ANCHORS.has(normalizeForCompare(l.text))) add(e, 'generic_anchor', { evidence: `Link text "${l.text}" to ${target} says nothing about the destination.`, fix: 'Use descriptive anchor text.' })
    }

    const lastSegment = e.path.split('/').pop() ?? ''
    if (e.path !== '/' && !isCleanSlug(lastSegment)) add(e, 'slug_unclean', { evidence: `Last URL segment "${lastSegment}" is not a lowercase hyphenated slug of 75 characters or fewer.`, fix: 'Rename the slug and add a redirect from the old URL.' })
    for (const problem of e.schemaIssues) add(e, 'schema_invalid', { evidence: problem, fix: 'Complete the missing content fields so valid structured data can be emitted.' })
  }

  for (const nav of ctx.navLinks) {
    if (!nav.startsWith('/') || nav.startsWith('//')) continue
    const target = normalizePath(nav)
    if (isPrivatePath(target) || livePaths.has(target) || redirectMap.has(target)) continue
    add(null, 'broken_internal_link', { evidence: `A navigation menu links to ${target}, which is not a live page.`, fix: 'Edit the menu in Navigation.' })
  }

  for (const problem of analyzeRedirects(ctx.redirects, livePaths)) {
    const code = { loop: 'redirect_loop', chain: 'redirect_chain', collision: 'redirect_collision', dead_target: 'redirect_dead_target' }[problem.kind]
    add(null, code, { evidence: problem.message, fix: problem.kind === 'collision' ? 'Delete the redirect or unpublish the page.' : 'Edit the redirect in SEO > Redirects.' })
    issues[issues.length - 1].path = problem.sourcePath
    issues[issues.length - 1].entityKey = `redirect:${problem.sourcePath}`
  }

  const order: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }
  return issues.sort((a, b) => order[a.severity] - order[b.severity] || a.path.localeCompare(b.path))
}

/** Calculates a 0-100 health score weighted by severity and share of affected pages. */
export function healthScore(issues: AuditIssue[], pageCount: number): number {
  const weight: Record<Severity, number> = { critical: 12, high: 5, medium: 2, low: 0.5, info: 0 }
  const penalty = issues.reduce((sum, i) => sum + weight[i.severity], 0)
  const normaliser = Math.max(pageCount, 5)
  return Math.max(0, Math.round(100 - (penalty / normaliser) * 10))
}

export function groupByCode(issues: AuditIssue[]) {
  const map = new Map<string, AuditIssue[]>()
  for (const i of issues) map.set(i.code, [...(map.get(i.code) ?? []), i])
  return map
}
