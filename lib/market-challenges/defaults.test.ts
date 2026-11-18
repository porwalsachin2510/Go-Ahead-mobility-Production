import { describe, expect, it } from 'vitest'
import { BLOCK_MAP } from '@/lib/blocks'
import { isDedicatedPublicPath } from '@/lib/seo/route-ownership'
import {
  DEFAULT_MARKET_CHALLENGES_PAGE,
  MARKET_CHALLENGES_NAV_LINK,
  MARKET_CHALLENGES_PATH,
} from './defaults'

describe('Market Challenges CMS page', () => {
  const block = DEFAULT_MARKET_CHALLENGES_PAGE.blocks.find((entry) => entry.type === 'marketChallenges')

  it('uses a CMS-managed public route that is not reserved by a dedicated renderer', () => {
    expect(MARKET_CHALLENGES_PATH).toBe('/company/market-challenges')
    expect(isDedicatedPublicPath(MARKET_CHALLENGES_PATH)).toBe(false)
    expect(MARKET_CHALLENGES_NAV_LINK.href).toBe(MARKET_CHALLENGES_PATH)
    expect(DEFAULT_MARKET_CHALLENGES_PAGE.pageType).toBe('company')
  })

  it('contains the complete reference-page content structure', () => {
    expect(block).toBeDefined()
    expect(block!.data.verticals).toHaveLength(2)
    expect(block!.data.accommodationChallenges).toHaveLength(3)
    expect(block!.data.transportationChallenges).toHaveLength(3)
    expect(block!.data.solutions).toHaveLength(2)
    expect(block!.data.solutions[0].items).toHaveLength(3)
    expect(block!.data.solutions[1].items).toHaveLength(6)
    expect(block!.data.processSteps).toHaveLength(4)
    expect(block!.data.insights).toHaveLength(3)
    expect(block!.data.faqs).toHaveLength(0)
  })

  it('registers all public content and nested repeatable lists in Page Builder', () => {
    const definition = BLOCK_MAP.marketChallenges
    expect(definition).toBeDefined()
    const fieldKeys = definition.fields.map((field) => field.key)
    for (const key of [
      'heroTitle', 'heroHighlight', 'heroIntro', 'heroAccommodationImage', 'heroTransportationImage',
      'verticals', 'accommodationChallenges', 'transportationChallenges', 'solutions',
      'processSteps', 'insights', 'faqs', 'ctaHeading', 'accommodationCtaHref', 'transportationCtaHref',
    ]) {
      expect(fieldKeys).toContain(key)
    }

    const solutionField = definition.fields.find((field) => field.key === 'solutions')
    expect(solutionField?.kind).toBe('list')
    if (solutionField?.kind === 'list') {
      const servicesField = solutionField.itemFields.find((field) => field.key === 'items')
      expect(servicesField?.kind).toBe('list')
    }
  })

  it('keeps the optional FAQ section empty unless an administrator adds items', () => {
    expect(block!.data.faqs).toEqual([])
  })
})
