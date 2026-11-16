/** Editorial quality checks derived from the post's own data. No keyword-density rules. */

export type QualityIssue = { code: string; level: 'blocker' | 'warning' | 'info'; message: string; fix: string }

type PostLike = {
  title?: string
  slug?: string
  excerpt?: string
  content?: string
  heroImage?: string
  heroAlt?: string
  authorId?: unknown
  categoryIds?: unknown[]
  relatedPostIds?: unknown[]
  seo?: { title?: string; description?: string }
  publishedAt?: string | Date | null
  contentUpdatedAt?: string | Date | null
  updatedAt?: string | Date | null
}

export function markdownHeadings(markdown: string): { level: number; text: string }[] {
  const out: { level: number; text: string }[] = []
  let fenced = false
  for (const line of markdown.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced
    if (fenced) continue
    const m = /^(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line)
    if (m) out.push({ level: m[1].length, text: m[2].trim() })
  }
  return out
}

export function countWords(markdown: string): number {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/[#*_>`[\]()!-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length
}

export function markdownImages(markdown: string): { alt: string; src: string }[] {
  return [...markdown.matchAll(/!\[([^\]]*)\]\(([^)\s]+)[^)]*\)/g)].map((m) => ({ alt: m[1].trim(), src: m[2] }))
}

export function markdownLinks(markdown: string): { text: string; href: string }[] {
  return [...markdown.matchAll(/(?<!!)\[([^\]]*)\]\(([^)\s]+)[^)]*\)/g)].map((m) => ({ text: m[1].trim(), href: m[2] }))
}

const GENERIC_ANCHORS = new Set(['click here', 'here', 'read more', 'link', 'this', 'more'])
const STALE_DAYS = 540

export function analysePost(post: PostLike, now = new Date()): QualityIssue[] {
  const issues: QualityIssue[] = []
  const add = (code: string, level: QualityIssue['level'], message: string, fix: string) => issues.push({ code, level, message, fix })
  const content = post.content ?? ''
  const words = countWords(content)
  const headings = markdownHeadings(content)

  if (!post.title?.trim()) add('missing_title', 'blocker', 'The post has no title.', 'Add a descriptive title.')
  if (words === 0) add('empty_content', 'blocker', 'The article body is empty.', 'Write the article before moving it forward.')
  else if (words < 300) add('thin_content', 'warning', `The article has only ${words} words.`, 'Expand it with genuinely useful detail, or keep it out of the index.')
  if (!post.excerpt?.trim() && !post.seo?.description?.trim()) add('missing_description', 'blocker', 'There is no excerpt or meta description.', 'Add a short excerpt that summarises the article for readers and search snippets.')
  else if (!post.seo?.description?.trim()) add('no_meta_description', 'info', 'The excerpt will be used as the meta description.', 'Add a dedicated meta description if the excerpt reads poorly in search results.')
  if (post.heroImage && !post.heroAlt?.trim()) add('missing_hero_alt', 'blocker', 'The featured image has no alt text.', 'Describe the image for screen-reader users.')
  if (!post.heroImage) add('missing_hero', 'warning', 'No featured image is set.', 'Add one for article cards and social sharing.')
  if (!post.authorId) add('missing_author', 'blocker', 'No author is attributed.', 'Select a real author profile.')
  if (!post.categoryIds?.length) add('missing_category', 'warning', 'No category is assigned.', 'Assign at least one category so the article can be discovered.')
  if (!post.relatedPostIds?.length) add('missing_related', 'info', 'No related posts are selected.', 'Related posts are chosen automatically by category if left empty.')

  if (headings.some((h) => h.level === 1)) add('body_h1', 'warning', 'The body contains an H1; the page title already renders as the H1.', 'Use H2 for top-level sections.')
  let prev = 1
  for (const h of headings) {
    if (!h.text) add('empty_heading', 'warning', 'An empty heading was found.', 'Remove it or add text.')
    if (h.level > prev + 1) {
      add('heading_skip', 'warning', `Heading "${h.text}" jumps from H${prev} to H${h.level}.`, 'Keep heading levels sequential.')
      break
    }
    prev = h.level
  }
  const seen = new Map<string, number>()
  for (const h of headings) seen.set(h.text.toLowerCase(), (seen.get(h.text.toLowerCase()) ?? 0) + 1)
  const repeated = [...seen].filter(([, n]) => n > 2)
  if (repeated.length) add('repeated_headings', 'info', `Repeated headings: ${repeated.map(([t]) => `"${t}"`).join(', ')}.`, 'Make each heading specific to its section.')
  if (words > 1500 && headings.filter((h) => h.level === 2).length < 3) add('few_sections', 'info', 'A long article with few sections is hard to scan.', 'Break it up with descriptive H2 headings.')

  for (const img of markdownImages(content)) {
    if (!img.alt) {
      add('image_missing_alt', 'blocker', `An inline image (${img.src.slice(0, 60)}) has no alt text.`, 'Add alt text, or leave it empty only for decorative images.')
      break
    }
  }
  for (const link of markdownLinks(content)) {
    if (!link.href || link.href === '#') {
      add('broken_link', 'warning', `A link (${link.text || 'untitled'}) has an empty destination.`, 'Fix or remove the link.')
      break
    }
  }
  const generic = markdownLinks(content).find((l) => GENERIC_ANCHORS.has(l.text.toLowerCase()))
  if (generic) add('generic_anchor', 'info', `The link text "${generic.text}" is not descriptive.`, 'Describe where the link goes.')

  if (post.seo?.title && post.seo.title.length > 70) add('long_seo_title', 'info', `The SEO title is ${post.seo.title.length} characters and may be truncated in results.`, 'This is editorial guidance only; shorten if the key words fall at the end.')
  const ref = post.contentUpdatedAt || post.publishedAt || post.updatedAt
  if (post.publishedAt && ref) {
    const days = (now.getTime() - new Date(ref).getTime()) / 86400000
    if (days > STALE_DAYS) add('stale', 'info', `Not meaningfully updated in about ${Math.round(days / 30)} months.`, 'Review for accuracy and refresh if needed.')
  }
  return issues
}

export const hasBlockers = (issues: QualityIssue[]) => issues.some((i) => i.level === 'blocker')
