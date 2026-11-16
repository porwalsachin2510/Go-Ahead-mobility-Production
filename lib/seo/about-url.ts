/**
 * Canonical public URL helpers for legacy routes.
 * Keep old inbound links working, but never emit the retired URL in navigation.
 */
export function canonicalizeAboutHref(href: string): string {
  const match = href.match(new RegExp("^/about/?(?=$|[?#])"))
  return match ? `/about-us${href.slice(match[0].length)}` : href
}

function canonicalizeNode(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value

  const node = { ...(value as Record<string, unknown>) }
  if (typeof node.href === 'string') node.href = canonicalizeAboutHref(node.href)
  if (Array.isArray(node.children)) node.children = node.children.map(canonicalizeNode)
  return node
}

/** Recursively rewrites exact legacy /about links, including nested menu items. */
export function canonicalizeNavigationItems<T>(items: T[]): T[] {
  return items.map((item) => canonicalizeNode(item) as T)
}
