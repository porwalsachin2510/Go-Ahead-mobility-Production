export type TocItem = { id: string; text: string; depth: 2 | 3 }

/** Slugs that /blog/* static routes own; a post with one of these slugs would be unreachable. */
export const RESERVED_POST_SLUGS = ['category', 'tag', 'author', 'authors', 'page', 'search', 'feed', 'rss', 'series', 'feed.xml'] as const

export function slugifyHeading(text: string): string {
  const slug = text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
  return slug || 'section'
}

/** Produces unique ids in document order. The renderer and the TOC must each use a fresh slugger so ids line up. */
export function createSlugger() {
  const seen = new Map<string, number>()
  return (text: string) => {
    const base = slugifyHeading(text)
    const n = seen.get(base) ?? 0
    seen.set(base, n + 1)
    return n ? `${base}-${n}` : base
  }
}

function plainHeadingText(raw: string) {
  return raw
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_~`]/g, '')
    .replace(/\s+#+\s*$/, '')
    .trim()
}

/**
 * Body h1s are rendered as h2 (the page already owns the h1), so they are listed at depth 2.
 * Headings inside fenced code are ignored.
 */
export function extractToc(markdown: string): TocItem[] {
  const slug = createSlugger()
  const items: TocItem[] = []
  let inFence = false
  for (const line of (markdown || '').split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence
      continue
    }
    if (inFence) continue
    const m = /^(#{1,6})\s+(.+)$/.exec(line)
    if (!m) continue
    const text = plainHeadingText(m[2])
    if (!text) continue
    const level = m[1].length
    const id = slug(text)
    if (level <= 3) items.push({ id, text, depth: level <= 2 ? 2 : 3 })
  }
  return items
}
