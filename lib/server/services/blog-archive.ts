import 'server-only'
import type { Metadata } from 'next'
import { breadcrumbSchema, webPageSchema, type JsonLd } from '@/lib/seo/jsonld'
import { buildMetadata } from '@/lib/seo/metadata'
import { truncate } from '@/lib/seo/text'
import { getSeoSettings } from './seo-inventory'

/** Archives with fewer live posts than this are kept out of the index and the sitemap as low-value listings. */
export const MIN_INDEXABLE_ARCHIVE_POSTS = 2

export function archiveIndexable(opts: { total: number; page: number; termNoindex?: boolean }) {
  return !opts.termNoindex && opts.page === 1 && opts.total >= MIN_INDEXABLE_ARCHIVE_POSTS
}

export function parsePage(raw: string | undefined) {
  const n = Number(raw)
  return Number.isInteger(n) && n > 1 && n < 10_000 ? n : 1
}

export async function archiveMetadata(input: { path: string; title: string; description?: string; total: number; page: number; termNoindex?: boolean; image?: string }): Promise<Metadata> {
  const { site } = await getSeoSettings()
  return buildMetadata({
    site,
    path: input.path,
    title: input.page > 1 ? `${input.title} (page ${input.page})` : input.title,
    description: truncate(input.description || '', 160) || undefined,
    noindex: !archiveIndexable(input),
    ogImage: input.image,
  })
}

export async function archiveJsonLd(input: { path: string; name: string; description?: string; trail: { name: string; path: string }[]; extra?: (JsonLd | null)[] }) {
  const { site } = await getSeoSettings()
  return [webPageSchema(site, { path: input.path, name: input.name, description: input.description, type: 'CollectionPage' }), breadcrumbSchema(site, input.trail), ...(input.extra ?? [])].filter(Boolean) as JsonLd[]
}
