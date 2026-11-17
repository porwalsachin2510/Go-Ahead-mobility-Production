/**
 * Public routes rendered by dedicated Next.js page components or dedicated content models.
 * Generic block-CMS Pages must not claim these URLs: saving a Page record there would not
 * change the visitor-facing route because the dedicated renderer wins.
 */
export const DEDICATED_PUBLIC_PATHS = [
  '/',
  '/about-us',
  '/company/why-choose-us',
  '/company/about-us',
  '/global-accommodation',
  '/local-transportation',
  '/our-footprint',
  '/industries',
  '/case-studies',
  '/contact',
  '/resources',
  '/learn',
  '/faq',
  '/careers',
  '/blog',
] as const

const DEDICATED_PREFIXES = [
  '/blog/',
  '/careers/',
  '/industries/',
  '/case-studies/',
  '/resources/',
] as const

export function isDedicatedPublicPath(path: string): boolean {
  const normalized = path.replace(/\/+$/, '') || '/'
  return (DEDICATED_PUBLIC_PATHS as readonly string[]).includes(normalized)
    || DEDICATED_PREFIXES.some((prefix) => normalized.startsWith(prefix))
}
