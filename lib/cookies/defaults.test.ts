import { describe, expect, it } from 'vitest'
import { BLOCK_MAP } from '@/lib/blocks'
import { CookiesPolicyPage } from '@/components/site/cookies-policy-page'
import { LEGAL_MENU_ITEMS } from '@/lib/legal/defaults'
import { DEFAULT_COOKIES_POLICY_PAGE, COOKIES_POLICY_PATH } from './defaults'
import { isDedicatedPublicPath } from '@/lib/seo/route-ownership'

describe('Cookies Policy CMS page', () => {
  const block = DEFAULT_COOKIES_POLICY_PAGE.blocks.find((entry) => entry.type === 'cookiesPolicy')

  it('loads the dedicated Cookies Policy page component', () => {
    expect(CookiesPolicyPage).toBeTypeOf('function')
  })

  it('uses the existing public legal URL and footer destination', () => {
    expect(COOKIES_POLICY_PATH).toBe('/cookies')
    expect(isDedicatedPublicPath(COOKIES_POLICY_PATH)).toBe(false)
    expect(LEGAL_MENU_ITEMS.some((item) => item.href === COOKIES_POLICY_PATH && item.label === 'Cookies Policy')).toBe(true)
  })

  it('contains the thirteen numbered policy sections and full inventory', () => {
    expect(block).toBeDefined()
    expect(block!.data.sections).toHaveLength(13)
    expect(block!.data.sections[7].id).toBe('consent-preferences')
    expect(block!.data.categories).toHaveLength(4)
    expect(block!.data.inventoryRows).toHaveLength(4)
    expect(block!.data.sidebarCards).toHaveLength(2)
  })

  it('keeps strictly necessary cookies enabled and all optional categories off by default', () => {
    const categories = block!.data.categories
    expect(categories[0]).toMatchObject({ key: 'necessary', locked: true })
    expect(categories.slice(1).every((item) => item.locked === false)).toBe(true)
    expect(categories.slice(1).every((item) => !('defaultEnabled' in item))).toBe(true)
    expect(block!.data.inventoryRows[0].provider).toContain('goahead_cookie_preferences')
    expect(block!.data.inventoryRows[0].duration).toContain('180 days')
  })

  it('registers editable policy sections, categories, side cards and inventory rows', () => {
    const definition = BLOCK_MAP.cookiesPolicy
    expect(definition).toBeDefined()
    const fields = definition.fields
    for (const key of [
      'heading', 'intro', 'lastUpdated', 'sections', 'sidebarCards',
      'categories', 'inventoryRows', 'contactEmail', 'footerButtonLabel',
    ]) {
      expect(fields.some((field) => field.key === key)).toBe(true)
    }

    const categoriesField = fields.find((field) => field.key === 'categories')
    expect(categoriesField?.kind).toBe('list')
    if (categoriesField?.kind === 'list') {
      expect(categoriesField.itemFields.some((field) => field.key === 'locked' && field.kind === 'boolean')).toBe(true)
      expect(categoriesField.itemFields.some((field) => field.key === 'defaultEnabled')).toBe(false)
    }
  })

  it('does not claim that the production cookie inventory has been scanned', () => {
    for (const item of block!.data.inventoryRows.slice(1)) {
      expect(item.provider.toLowerCase()).toContain('production cookie scan')
      expect(item.duration.toLowerCase()).toContain('production cookie scan')
    }
  })
})
