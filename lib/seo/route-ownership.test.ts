import { describe, expect, it } from 'vitest'
import { isDedicatedPublicPath } from './route-ownership'

describe('dedicated public route ownership', () => {
  it('recognises dedicated singleton landing pages', () => {
    for (const path of [
      '/',
      '/about-us',
      '/global-accommodation',
      '/local-transportation',
      '/industries',
      '/case-studies',
      '/contact',
      '/resources',
      '/faq',
      '/careers',
      '/blog',
    ]) {
      expect(isDedicatedPublicPath(path), path).toBe(true)
    }
  })

  it('leaves the Newsletter landing page editable through the CMS', () => {
    expect(isDedicatedPublicPath('/newsletter')).toBe(false)
  })

  it('recognises dynamic route families', () => {
    for (const path of [
      '/blog/a-post',
      '/blog/category/guides',
      '/blog/author/editor',
      '/careers/operations-manager',
      '/industries/technology',
      '/case-studies/employee-shuttles',
      '/resources/travel-checklist',
    ]) {
      expect(isDedicatedPublicPath(path), path).toBe(true)
    }
  })

  it('normalises a trailing slash', () => {
    expect(isDedicatedPublicPath('/about-us/')).toBe(true)
    expect(isDedicatedPublicPath('/blog/category/guides/')).toBe(true)
  })

  it('leaves custom CMS page paths available', () => {
    for (const path of ['/privacy', '/terms', '/company/safety-trust', '/campaign/autumn', '/services/custom']) {
      expect(isDedicatedPublicPath(path), path).toBe(false)
    }
  })
})
