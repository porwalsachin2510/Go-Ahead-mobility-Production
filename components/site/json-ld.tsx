import { serializeJsonLd, type JsonLd as JsonLdNode } from '@/lib/seo/jsonld'

/** Server-rendered JSON-LD so structured data is present in the initial HTML response. */
export function JsonLd({ data }: { data: (JsonLdNode | null | undefined)[] | JsonLdNode | null | undefined }) {
  const nodes = (Array.isArray(data) ? data : [data]).filter((n): n is JsonLdNode => Boolean(n))
  if (!nodes.length) return null
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(nodes.length === 1 ? nodes[0] : nodes) }} />
}
