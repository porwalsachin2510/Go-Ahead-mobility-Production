/**
 * Canonical Newsletter artwork paths.
 * The accommodation hero was previously saved in some CMS records under a filename
 * that is not present in /public. Keep a single compatibility alias while repairing
 * those existing records.
 */
export const NEWSLETTER_ACCOMMODATION_HERO_IMAGE = '/images/site/acc-hero.png'
export const LEGACY_NEWSLETTER_ACCOMMODATION_HERO_IMAGE = '/images/site/accommodation-hero.png'

const NEWSLETTER_IMAGE_ALIASES: Record<string, string> = {
  [LEGACY_NEWSLETTER_ACCOMMODATION_HERO_IMAGE]: NEWSLETTER_ACCOMMODATION_HERO_IMAGE,
}

export function resolveNewsletterImagePath(path: string): string {
  return NEWSLETTER_IMAGE_ALIASES[path] ?? path
}
