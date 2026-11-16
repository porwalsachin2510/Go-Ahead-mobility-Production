import { describe, expect, it } from 'vitest'
import { normalizePath } from './config'
import { followRedirects, validateRedirectSource, validateRedirectTarget, wouldCreateLoop } from './redirects'
import { serializeJsonLd } from './jsonld'
import type { RedirectRule } from './types'

const rule = (sourcePath: string, targetUrl: string, extra: Partial<RedirectRule> = {}) =>
  ({ sourcePath, targetUrl, statusCode: 301, enabled: true, ...extra }) as RedirectRule

describe('normalizePath', () => {
  it('produces a single canonical form', () => {
    expect(normalizePath('/Services/')).toBe('/services')
    expect(normalizePath('//blog//post?utm=1#top')).toBe('/blog/post')
    expect(normalizePath('')).toBe('/')
  })
})

describe('redirect source validation', () => {
  it('rejects home, private paths, queries and protocol-relative sources', () => {
    expect(validateRedirectSource('/').ok).toBe(false)
    expect(validateRedirectSource('/admin/seo').ok).toBe(false)
    expect(validateRedirectSource('/old?x=1').ok).toBe(false)
    expect(validateRedirectSource('//evil.com').ok).toBe(false)
  })
  it('normalizes valid sources', () => {
    expect(validateRedirectSource('/Old-Page/')).toEqual({ ok: true, source: '/old-page' })
  })
})

describe('redirect target validation (open-redirect protection)', () => {
  it('blocks unsafe destinations', () => {
    expect(validateRedirectTarget('//evil.com').ok).toBe(false)
    expect(validateRedirectTarget('javascript:alert(1)').ok).toBe(false)
    expect(validateRedirectTarget('https://user:pw@evil.com').ok).toBe(false)
    expect(validateRedirectTarget('/admin').ok).toBe(false)
    expect(validateRedirectTarget('https://evil.com/x').ok).toBe(false)
  })
  it('allows site paths, same-host URLs and opted-in external URLs', () => {
    expect(validateRedirectTarget('/new')).toEqual({ ok: true, target: '/new' })
    expect(validateRedirectTarget('https://example.com/a?b=1', { siteHost: 'example.com' })).toEqual({ ok: true, target: '/a?b=1' })
    expect(validateRedirectTarget('https://partner.com/', { allowExternal: true }).ok).toBe(true)
  })
})

describe('redirect chains and loops', () => {
  it('follows chains to the final destination', () => {
    const r = followRedirects([rule('/a', '/b'), rule('/b', '/c')], '/a')
    expect(r).toEqual({ final: '/c', hops: ['/b', '/c'], loop: false })
  })
  it('detects loops and ignores disabled rules', () => {
    expect(followRedirects([rule('/a', '/b'), rule('/b', '/a')], '/a').loop).toBe(true)
    expect(followRedirects([rule('/a', '/b'), rule('/b', '/a', { enabled: false })], '/a').loop).toBe(false)
  })
  it('prevents saving a rule that would close a loop', () => {
    expect(wouldCreateLoop([rule('/b', '/c'), rule('/c', '/a')], '/a', '/b')).toBe(true)
    expect(wouldCreateLoop([rule('/b', '/c')], '/a', '/b')).toBe(false)
  })
})

describe('JSON-LD serialization', () => {
  it('cannot break out of the script element', () => {
    const out = serializeJsonLd({ '@context': 'https://schema.org', '@type': 'Thing', name: '</script><script>alert(1)</script>' })
    expect(out.toLowerCase()).not.toContain('</script')
    expect(JSON.parse(out).name).toBe('</script><script>alert(1)</script>')
  })
})
