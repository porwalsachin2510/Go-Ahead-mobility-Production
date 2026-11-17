import { describe, expect, it } from 'vitest'
import { DEFAULT_SAFETY_TRUST_PAGE, SAFETY_TRUST_PATH } from './defaults'
import { isDedicatedPublicPath } from '@/lib/seo/route-ownership'

describe('Safety & Trust CMS page defaults', () => {
  it('uses a custom CMS route that remains editable in the Page Builder', () => {
    expect(SAFETY_TRUST_PATH).toBe('/company/safety-trust')
    expect(isDedicatedPublicPath(SAFETY_TRUST_PATH)).toBe(false)
    expect(DEFAULT_SAFETY_TRUST_PAGE.path).toBe(SAFETY_TRUST_PATH)
    expect(DEFAULT_SAFETY_TRUST_PAGE.pageType).toBe('company')
  })

  it('seeds all of the visible sections from the reference design', () => {
    const block = DEFAULT_SAFETY_TRUST_PAGE.blocks.find((item) => item.type === 'safetyTrust')
    expect(block).toBeDefined()
    const data = block!.data
    expect(data.benefits).toHaveLength(4)
    expect(data.introItems).toHaveLength(3)
    expect(data.frameworkItems).toHaveLength(6)
    expect(data.steps).toHaveLength(4)
    expect(data.contexts).toHaveLength(2)
    expect(data.policies).toHaveLength(3)
    expect(data.faqs).toHaveLength(3)
    expect(data.quickLinks).toHaveLength(4)
  })

  it('has editable copy and an image for each framework card', () => {
    const block = DEFAULT_SAFETY_TRUST_PAGE.blocks.find((item) => item.type === 'safetyTrust')!
    for (const item of block.data.frameworkItems) {
      expect(item.title.trim().length).toBeGreaterThan(0)
      expect(item.body.trim().length).toBeGreaterThan(0)
      expect(item.image.trim().length).toBeGreaterThan(0)
      expect(item.imageAlt.trim().length).toBeGreaterThan(0)
    }
  })
})
