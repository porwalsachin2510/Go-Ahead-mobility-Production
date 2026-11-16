import type { Metadata } from 'next'
import { absoluteUrl, resolveCanonical, toOgLocale } from './config'
import { applyTemplate, truncate, stripMarkdown } from './text'
import type { SeoSettings, TemplateKind } from './types'

export type MetaInput = {
  site: SeoSettings
  path: string
  title?: string
  description?: string
  canonical?: string
  noindex?: boolean
  nofollow?: boolean
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  ogImageAlt?: string
  type?: 'website' | 'article'
  publishedTime?: string
  modifiedTime?: string
  authors?: string[]
}

export const INDEXABLE_ROBOTS = { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } as const

/** Single place every public route builds metadata, so canonical, robots, OG and Twitter can never disagree. */
export function buildMetadata(input: MetaInput): Metadata {
  const { site } = input
  const canonical = resolveCanonical(site.siteUrl, input.path, input.canonical)
  const title = (input.title ?? '').trim()
  const description = truncate(input.description || site.defaultDescription, 300)
  const brandInTitle = title.toLowerCase().includes(site.brandName.toLowerCase())
  const image = absoluteUrl(site.siteUrl, input.ogImage || site.ogImage)
  const ogTitle = input.ogTitle || title || site.defaultTitle
  const ogDescription = input.ogDescription || description

  return {
    title: !title ? { absolute: site.defaultTitle } : brandInTitle ? { absolute: title } : title,
    description: description || undefined,
    alternates: { canonical },
    robots: input.noindex ? { index: false, follow: !input.nofollow } : input.nofollow ? { ...INDEXABLE_ROBOTS, follow: false } : INDEXABLE_ROBOTS,
    openGraph: {
      type: input.type ?? 'website',
      url: canonical,
      siteName: site.brandName,
      locale: toOgLocale(site.locale),
      title: ogTitle,
      description: ogDescription || undefined,
      images: image ? [{ url: image, alt: input.ogImageAlt || ogTitle }] : undefined,
      ...(input.type === 'article' ? { publishedTime: input.publishedTime, modifiedTime: input.modifiedTime, authors: input.authors } : {}),
    },
    twitter: { card: image ? 'summary_large_image' : 'summary', title: ogTitle, description: ogDescription || undefined, images: image ? [image] : undefined },
  }
}

export type EffectiveSeo = {
  title: string
  titleSource: 'explicit' | 'template' | 'content'
  description: string
  descriptionSource: 'explicit' | 'template' | 'content' | 'none'
}

/** Explicit editor value, then the configured metadata template, then content-derived fallback. */
export function resolveEffectiveSeo(
  kind: TemplateKind,
  site: SeoSettings,
  entity: { name: string; summary?: string; explicitTitle?: string; explicitDescription?: string; vars?: Record<string, string | undefined> },
): EffectiveSeo {
  const vars = { title: entity.name, brand: site.brandName, ...(entity.vars ?? {}) }
  const tpl = site.templates[kind] ?? { title: '%title%', description: '' }

  let title = (entity.explicitTitle ?? '').trim()
  let titleSource: EffectiveSeo['titleSource'] = 'explicit'
  if (!title) {
    const fromTemplate = applyTemplate(tpl.title, vars)
    title = fromTemplate || entity.name
    titleSource = fromTemplate && tpl.title.trim() !== '%title%' ? 'template' : 'content'
  }

  let description = (entity.explicitDescription ?? '').trim()
  let descriptionSource: EffectiveSeo['descriptionSource'] = 'explicit'
  if (!description) {
    const fromTemplate = tpl.description ? applyTemplate(tpl.description, { ...vars, summary: truncate(stripMarkdown(entity.summary ?? ''), 150) }) : ''
    if (fromTemplate) {
      description = fromTemplate
      descriptionSource = 'template'
    } else if (entity.summary) {
      description = truncate(stripMarkdown(entity.summary), 155)
      descriptionSource = description ? 'content' : 'none'
    } else {
      descriptionSource = 'none'
    }
  }
  return { title, titleSource, description, descriptionSource }
}
