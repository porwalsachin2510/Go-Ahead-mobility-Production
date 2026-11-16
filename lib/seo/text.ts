import type { HeadingRef, ImageRef, LinkRef } from './types'

export function stripMarkdown(md: string): string {
  return (md ?? '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/[*_~|]/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Shortens at a word boundary and appends an ellipsis only when text was removed. */
export function truncate(text: string, max: number): string {
  const clean = (text ?? '').replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.-]+$/, '')}…`
}

/** Replaces %token% placeholders. Unknown tokens become empty; dangling separators are tidied. */
export function applyTemplate(template: string, vars: Record<string, string | undefined>): string {
  return (template ?? '')
    .replace(/%(\w+)%/g, (_, key: string) => vars[key] ?? '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s|\-–—:]+|[\s|\-–—:]+$/g, '')
    .trim()
}

export function countWords(text: string): number {
  const t = (text ?? '').trim()
  return t ? t.split(/\s+/).length : 0
}

export type ContentAnalysis = { headings: HeadingRef[]; links: LinkRef[]; images: ImageRef[]; wordCount: number }

export function analyzeMarkdown(md: string): ContentAnalysis {
  const source = md ?? ''
  const withoutFences = source.replace(/```[\s\S]*?```/g, '')
  const headings: HeadingRef[] = []
  for (const m of withoutFences.matchAll(/^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/gm)) headings.push({ level: m[1].length, text: stripMarkdown(m[2]) })
  const images: ImageRef[] = []
  for (const m of withoutFences.matchAll(/!\[([^\]]*)\]\(([^)\s]+)[^)]*\)/g)) images.push({ alt: m[1].trim(), src: m[2] })
  const links: LinkRef[] = []
  for (const m of withoutFences.matchAll(/(?<!!)\[([^\]]*)\]\(([^)\s]+)[^)]*\)/g)) links.push({ text: m[1].trim(), href: m[2] })
  return { headings, links, images, wordCount: countWords(stripMarkdown(source)) }
}

export const GENERIC_ANCHORS = new Set(['click here', 'here', 'read more', 'learn more', 'more', 'link', 'this page'])

export function isCleanSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 75
}

export function slugify(input: string): string {
  return (input ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 75)
    .replace(/-+$/, '')
}

export type LengthGuidance = { length: number; status: 'empty' | 'short' | 'good' | 'long'; message: string }

/** Editorial guidance only. These are display-truncation heuristics, not ranking rules. */
export function titleGuidance(title: string): LengthGuidance {
  const length = (title ?? '').trim().length
  if (!length) return { length, status: 'empty', message: 'Add a title so the page is described accurately in results.' }
  if (length < 25) return { length, status: 'short', message: 'Short titles may leave useful context unused.' }
  if (length > 60) return { length, status: 'long', message: 'Longer titles are often truncated in search results; lead with the key topic.' }
  return { length, status: 'good', message: 'Fits within the range that usually displays in full.' }
}

export function descriptionGuidance(description: string): LengthGuidance {
  const length = (description ?? '').trim().length
  if (!length) return { length, status: 'empty', message: 'Without a description, search engines will generate a snippet from page content.' }
  if (length < 70) return { length, status: 'short', message: 'A little more detail may help searchers decide to click.' }
  if (length > 160) return { length, status: 'long', message: 'Longer descriptions are often shortened in results; put the main point first.' }
  return { length, status: 'good', message: 'Fits within the range that usually displays in full.' }
}

export function normalizeForCompare(text: string): string {
  return (text ?? '').toLowerCase().replace(/\s+/g, ' ').trim()
}
