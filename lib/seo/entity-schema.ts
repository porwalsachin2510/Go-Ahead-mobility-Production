import { canonicalUrl } from './config'
import type { JsonLd } from './jsonld'
import type { SeoSettings } from './types'

export type FaqItem = { question: string; answer: string }

export const MAX_CUSTOM_NODES = 10

/** Types that the site already emits from code; a custom node of the same type would duplicate them. */
const RESERVED_TYPES = new Set(['Organization', 'WebSite', 'BreadcrumbList'])

export function faqSchema(site: SeoSettings, path: string, items: FaqItem[]): JsonLd | null {
  const valid = (items ?? []).filter((i) => i?.question?.trim() && i?.answer?.trim())
  if (!valid.length) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${canonicalUrl(site.siteUrl, path)}#faq`,
    mainEntity: valid.map((i) => ({ '@type': 'Question', name: i.question.trim(), acceptedAnswer: { '@type': 'Answer', text: i.answer.trim() } })),
  }
}

export type CustomSchemaResult = { nodes: JsonLd[]; errors: string[]; types: string[] }

/** Parses an editor-supplied JSON-LD block. Accepts one object, an array, or an @graph wrapper. */
export function parseCustomJsonLd(raw: string): CustomSchemaResult {
  const text = (raw ?? '').trim()
  if (!text) return { nodes: [], errors: [], types: [] }
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch (e) {
    return { nodes: [], errors: [`Invalid JSON: ${(e as Error).message}`], types: [] }
  }
  const list = Array.isArray(data) ? data : data && typeof data === 'object' && Array.isArray((data as any)['@graph']) ? (data as any)['@graph'] : [data]
  const errors: string[] = []
  const nodes: JsonLd[] = []
  if (list.length > MAX_CUSTOM_NODES) errors.push(`At most ${MAX_CUSTOM_NODES} nodes are allowed.`)
  list.slice(0, MAX_CUSTOM_NODES).forEach((node: unknown, i: number) => {
    if (!node || typeof node !== 'object' || Array.isArray(node)) return errors.push(`Node ${i + 1} must be an object.`)
    const n = node as JsonLd
    const type = Array.isArray(n['@type']) ? n['@type'][0] : n['@type']
    if (typeof type !== 'string' || !type.trim()) return errors.push(`Node ${i + 1} needs an "@type".`)
    if (RESERVED_TYPES.has(type)) return errors.push(`Node ${i + 1}: ${type} is generated automatically. Edit it in Site settings instead.`)
    const ctx = n['@context']
    if (ctx && typeof ctx === 'string' && !/^https?:\/\/schema\.org\/?$/.test(ctx)) return errors.push(`Node ${i + 1}: "@context" must be https://schema.org.`)
    nodes.push({ '@context': 'https://schema.org', ...n })
  })
  return { nodes: errors.length ? [] : nodes, errors, types: nodes.map((n) => String(Array.isArray(n['@type']) ? n['@type'][0] : n['@type'])) }
}

type EntitySeoLike = { faq?: FaqItem[] | null; schemaJson?: string | null } | null | undefined

/** Extra structured data an editor attached to a page: FAQ plus validated custom JSON-LD. Invalid input renders nothing. */
export function entitySchemaNodes(site: SeoSettings, path: string, seo: EntitySeoLike): JsonLd[] {
  if (!seo) return []
  const out: JsonLd[] = []
  const faq = faqSchema(site, path, seo.faq ?? [])
  if (faq) out.push(faq)
  out.push(...parseCustomJsonLd(seo.schemaJson ?? '').nodes)
  return out
}
