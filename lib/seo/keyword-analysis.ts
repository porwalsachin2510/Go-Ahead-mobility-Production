import type { HeadingRef, ImageRef, LinkRef } from './types'

export type CheckStatus = 'pass' | 'warn' | 'fail'
export type AnalysisCheck = { id: string; group: 'keyword' | 'content' | 'meta' | 'links'; label: string; status: CheckStatus; detail: string }

export type AnalysisInput = {
  keyword: string
  secondary?: string[]
  title: string
  description: string
  path: string
  bodyText: string
  headings: HeadingRef[]
  images: ImageRef[]
  links: LinkRef[]
  siteHost?: string
  /** Other URLs that already target this focus keyword. */
  competingPaths?: string[]
  minWords?: number
}

export type Readability = { score: number; label: string; avgSentenceWords: number; longSentencePct: number }

export type KeywordAnalysis = {
  score: number
  checks: AnalysisCheck[]
  wordCount: number
  occurrences: number
  density: number
  readability: Readability
  secondary: { keyword: string; occurrences: number }[]
}

export const fold = (s: string) =>
  (s ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Whole-phrase, case- and accent-insensitive match. Whitespace in the keyword matches any run of whitespace or hyphens. */
export function phraseRegex(keyword: string) {
  const parts = fold(keyword).trim().split(/[\s-]+/).filter(Boolean).map(escape)
  if (!parts.length) return null
  return new RegExp(`(^|[^\\p{L}\\p{N}])${parts.join('[\\s-]+')}(?=$|[^\\p{L}\\p{N}])`, 'gu')
}

export function countPhrase(text: string, keyword: string) {
  const re = phraseRegex(keyword)
  if (!re) return 0
  return (fold(text).match(re) ?? []).length
}

export const containsPhrase = (text: string, keyword: string) => countPhrase(text, keyword) > 0

const words = (text: string) => (text.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) ?? [])

function syllables(word: string) {
  const w = fold(word).replace(/[^a-z]/g, '')
  if (!w) return 0
  if (w.length <= 3) return 1
  const trimmed = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '')
  return Math.max(1, (trimmed.match(/[aeiouy]{1,2}/g) ?? []).length)
}

/** Flesch reading ease (0–100, higher is easier) plus sentence-length signals. */
export function readability(text: string): Readability {
  const sentences = text
    .split(/(?<=[.!?])\s+|\n{2,}/)
    .map((s) => s.trim())
    .filter((s) => words(s).length > 0)
  const w = words(text)
  if (!w.length || !sentences.length) return { score: 0, label: 'Not enough text', avgSentenceWords: 0, longSentencePct: 0 }
  const syl = w.reduce((n, x) => n + syllables(x), 0)
  const avg = w.length / sentences.length
  const score = Math.max(0, Math.min(100, Math.round(206.835 - 1.015 * avg - 84.6 * (syl / w.length))))
  const long = sentences.filter((s) => words(s).length > 25).length
  const label = score >= 70 ? 'Easy' : score >= 50 ? 'Fairly easy' : score >= 30 ? 'Difficult' : 'Very difficult'
  return { score, label, avgSentenceWords: Math.round(avg * 10) / 10, longSentencePct: Math.round((long / sentences.length) * 100) }
}

function isInternal(href: string, siteHost?: string) {
  if (href.startsWith('/') && !href.startsWith('//')) return true
  if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return false
  try {
    return Boolean(siteHost) && new URL(href).host === siteHost
  } catch {
    return false
  }
}

const WEIGHT: Record<CheckStatus, number> = { pass: 1, warn: 0.5, fail: 0 }

export function analyzeKeyword(input: AnalysisInput): KeywordAnalysis {
  const keyword = input.keyword.trim()
  const body = input.bodyText ?? ''
  const allWords = words(body)
  const wordCount = allWords.length
  const occurrences = keyword ? countPhrase(body, keyword) : 0
  const kwWords = Math.max(1, words(keyword).length)
  const density = wordCount ? Math.round(((occurrences * kwWords) / wordCount) * 1000) / 10 : 0
  const read = readability(body)
  const checks: AnalysisCheck[] = []
  const add = (c: AnalysisCheck) => checks.push(c)
  const minWords = Math.max(300, input.minWords ?? 0)

  if (!keyword) {
    add({ id: 'kw-set', group: 'keyword', label: 'Focus keyword', status: 'fail', detail: 'Set the search phrase this page should rank for to unlock keyword checks.' })
  } else {
    const titleHit = containsPhrase(input.title, keyword)
    const position = fold(input.title).search(phraseRegex(keyword) ?? /$^/)
    add({
      id: 'kw-title',
      group: 'keyword',
      label: 'Keyword in SEO title',
      status: titleHit ? (position <= input.title.length / 2 ? 'pass' : 'warn') : 'fail',
      detail: titleHit ? (position <= input.title.length / 2 ? 'The keyword appears early in the title.' : 'Present, but move it closer to the start of the title.') : 'Add the focus keyword to the SEO title.',
    })
    add({
      id: 'kw-desc',
      group: 'keyword',
      label: 'Keyword in meta description',
      status: containsPhrase(input.description, keyword) ? 'pass' : 'fail',
      detail: containsPhrase(input.description, keyword) ? 'Search engines bold matching terms in snippets.' : 'Use the keyword naturally in the meta description.',
    })
    const slugTokens = fold(input.path).split(/[^a-z0-9\p{L}]+/u).filter(Boolean)
    const kwTokens = fold(keyword).split(/[^a-z0-9\p{L}]+/u).filter((t) => t.length > 2)
    const slugHits = kwTokens.filter((t) => slugTokens.includes(t)).length
    add({
      id: 'kw-url',
      group: 'keyword',
      label: 'Keyword in URL',
      status: input.path === '/' ? 'pass' : slugHits === kwTokens.length && kwTokens.length ? 'pass' : slugHits ? 'warn' : 'fail',
      detail: input.path === '/' ? 'The home page URL is not keyword-dependent.' : slugHits === kwTokens.length && kwTokens.length ? 'The URL contains the keyword.' : slugHits ? 'The URL contains part of the keyword.' : 'The URL slug does not contain the keyword. Changing a live slug adds a redirect.',
    })
    const intro = allWords.slice(0, 100).join(' ')
    add({
      id: 'kw-intro',
      group: 'keyword',
      label: 'Keyword in introduction',
      status: containsPhrase(intro, keyword) ? 'pass' : 'warn',
      detail: containsPhrase(intro, keyword) ? 'Used within the first 100 words.' : 'Mention the keyword within the first 100 words.',
    })
    const sub = input.headings.filter((h) => h.level >= 2)
    const subHits = sub.filter((h) => containsPhrase(h.text, keyword)).length
    add({
      id: 'kw-heading',
      group: 'keyword',
      label: 'Keyword in subheadings',
      status: subHits ? 'pass' : sub.length ? 'warn' : 'fail',
      detail: subHits ? `Found in ${subHits} of ${sub.length} subheadings.` : sub.length ? 'Use the keyword or a close variant in at least one H2/H3.' : 'Add H2/H3 subheadings to structure the content.',
    })
    add({
      id: 'kw-density',
      group: 'keyword',
      label: 'Keyword density',
      status: density >= 0.5 && density <= 2.5 ? 'pass' : density > 2.5 ? 'fail' : occurrences ? 'warn' : 'fail',
      detail:
        density > 2.5
          ? `${density}% (${occurrences}×) looks like keyword stuffing. Use synonyms instead.`
          : density >= 0.5
            ? `${density}% (${occurrences}×) is a natural frequency.`
            : `${density}% (${occurrences}×). Aim for roughly 0.5–2.5%.`,
    })
    if (input.images.length) {
      const altHit = input.images.some((i) => containsPhrase(i.alt, keyword))
      add({ id: 'kw-alt', group: 'keyword', label: 'Keyword in image alt text', status: altHit ? 'pass' : 'warn', detail: altHit ? 'At least one image alt text describes the topic.' : 'Describe at least one relevant image using the keyword.' })
    }
    const competing = (input.competingPaths ?? []).filter((p) => p !== input.path)
    add({
      id: 'kw-unique',
      group: 'keyword',
      label: 'Keyword cannibalisation',
      status: competing.length ? 'fail' : 'pass',
      detail: competing.length ? `Also targeted by ${competing.slice(0, 3).join(', ')}${competing.length > 3 ? '…' : ''}. Pages competing for one query split ranking signals.` : 'No other page targets this keyword.',
    })
  }

  const t = input.title.length
  add({ id: 'meta-title', group: 'meta', label: 'Title length', status: t >= 30 && t <= 60 ? 'pass' : t ? 'warn' : 'fail', detail: t ? `${t} characters (30–60 displays fully).` : 'No title.' })
  const d = input.description.length
  add({ id: 'meta-desc', group: 'meta', label: 'Description length', status: d >= 70 && d <= 160 ? 'pass' : d ? 'warn' : 'fail', detail: d ? `${d} characters (70–160 recommended).` : 'No description: search engines will choose page text.' })

  add({ id: 'content-length', group: 'content', label: 'Content length', status: wordCount >= minWords ? 'pass' : wordCount >= minWords / 2 ? 'warn' : 'fail', detail: `${wordCount} words. Pages that fully answer a query usually need ${minWords}+.` })
  const h1s = input.headings.filter((h) => h.level === 1).length
  if (h1s > 1) add({ id: 'content-h1', group: 'content', label: 'Single H1', status: 'warn', detail: `${h1s} H1 headings found in content. The page title is already the H1.` })
  add({
    id: 'content-readability',
    group: 'content',
    label: 'Readability',
    status: read.score >= 50 ? 'pass' : read.score >= 30 ? 'warn' : wordCount ? 'fail' : 'warn',
    detail: `Flesch score ${read.score} (${read.label}). ${read.longSentencePct}% of sentences exceed 25 words.`,
  })
  const missingAlt = input.images.filter((i) => !i.alt.trim()).length
  if (input.images.length) add({ id: 'content-alt', group: 'content', label: 'Image alt text', status: missingAlt ? 'fail' : 'pass', detail: missingAlt ? `${missingAlt} of ${input.images.length} images have no alt text.` : 'Every image has alt text.' })

  const internal = input.links.filter((l) => isInternal(l.href, input.siteHost)).length
  const external = input.links.filter((l) => /^https?:/i.test(l.href) && !isInternal(l.href, input.siteHost)).length
  add({ id: 'links-internal', group: 'links', label: 'Internal links', status: internal >= 2 ? 'pass' : internal ? 'warn' : 'fail', detail: `${internal} internal links. Link to related pages to pass authority and help crawling.` })
  add({ id: 'links-external', group: 'links', label: 'Outbound links', status: external ? 'pass' : 'warn', detail: external ? `${external} links to external sources.` : 'Cite at least one authoritative external source.' })

  const score = Math.round((checks.reduce((n, c) => n + WEIGHT[c.status], 0) / checks.length) * 100)
  return {
    score,
    checks,
    wordCount,
    occurrences,
    density,
    readability: read,
    secondary: (input.secondary ?? []).filter(Boolean).map((k) => ({ keyword: k, occurrences: countPhrase(body, k) })),
  }
}
