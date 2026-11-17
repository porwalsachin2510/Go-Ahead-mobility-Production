import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { BLOCK_MAP } from '@/lib/blocks'
import { NewsletterPage } from '@/components/site/newsletter-page'
import { DEFAULT_NEWSLETTER_PAGE, NEWSLETTER_PATH } from './defaults'
import { isDedicatedPublicPath } from '@/lib/seo/route-ownership'
import {
  LEGACY_NEWSLETTER_ACCOMMODATION_HERO_IMAGE,
  NEWSLETTER_ACCOMMODATION_HERO_IMAGE,
  resolveNewsletterImagePath,
} from './images'

describe('Newsletter CMS page defaults', () => {
  const block = DEFAULT_NEWSLETTER_PAGE.blocks.find((entry) => entry.type === 'newsletterPage')

  it('uses a public route that can be edited in the Page Builder', () => {
    expect(NEWSLETTER_PATH).toBe('/newsletter')
    expect(isDedicatedPublicPath(NEWSLETTER_PATH)).toBe(false)
    expect(DEFAULT_NEWSLETTER_PAGE.path).toBe(NEWSLETTER_PATH)
    expect(DEFAULT_NEWSLETTER_PAGE.pageType).toBe('resource')
  })

  it('seeds every major newsletter section shown in the reference design', () => {
    expect(block).toBeDefined()
    const data = block!.data
    expect(data.benefits).toHaveLength(3)
    expect(data.previewCards).toHaveLength(2)
    expect(data.insights).toHaveLength(3)
    expect(data.choicePoints).toHaveLength(4)
    expect(data.manageLinks).toHaveLength(2)
    expect(data.featuredStoryTitle).toBeTruthy()
    expect(data.resourceTitle).toBeTruthy()
    expect(data.ctaHeading).toBeTruthy()
  })

  it('registers a structured admin editor for every newsletter section', () => {
    const definition = BLOCK_MAP.newsletterPage
    expect(definition).toBeDefined()
    const keys = definition.fields.map((field) => field.key)
    for (const key of [
      'heroTitle', 'heroImage', 'benefits', 'previewCards', 'insights',
      'choicePoints', 'manageLinks', 'accommodationHeading', 'transportHeading',
    ]) {
      expect(keys).toContain(key)
    }
  })

  it('loads the Newsletter page component and its TSX module', () => {
    expect(NewsletterPage).toBeTypeOf('function')
  })

  it('uses an existing accommodation hero asset and resolves the old CMS filename', () => {
    expect(resolveNewsletterImagePath(LEGACY_NEWSLETTER_ACCOMMODATION_HERO_IMAGE))
      .toBe(NEWSLETTER_ACCOMMODATION_HERO_IMAGE)
    expect(resolveNewsletterImagePath(NEWSLETTER_ACCOMMODATION_HERO_IMAGE))
      .toBe(NEWSLETTER_ACCOMMODATION_HERO_IMAGE)
    expect(existsSync(join(process.cwd(), 'public', NEWSLETTER_ACCOMMODATION_HERO_IMAGE.slice(1))))
      .toBe(true)
    expect(block!.data.heroSecondaryImage).toBe(NEWSLETTER_ACCOMMODATION_HERO_IMAGE)
  })

  it('provides accessible descriptions for every editable newsletter image', () => {
    const data = block!.data
    expect(data.heroImageAlt).toBeTruthy()
    expect(data.featuredStoryImageAlt).toBeTruthy()
    expect(data.resourceImageAlt).toBeTruthy()
    for (const item of data.previewCards) expect(item.imageAlt).toBeTruthy()
    for (const item of data.insights) expect(item.imageAlt).toBeTruthy()
  })
})
