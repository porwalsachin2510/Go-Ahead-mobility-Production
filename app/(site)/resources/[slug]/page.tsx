import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { JsonLd } from '@/components/site/json-ld'
import { ResourceDetailPage } from '@/components/site/resource-detail-page'
import { getResource, getResourceDetail } from '@/lib/server/services/public'
import { detailJsonLd, detailMetadata, liveHub } from '@/lib/server/services/seo-page'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const d = await getResource(slug)
  if (!d) return { robots: { index: false } }
  return detailMetadata({ kind: 'resource', path: `/resources/${d.slug}`, name: d.title, summary: d.summary, bodyText: [d.summary, d.body, ...(d.audiences ?? []).map((item: any) => [item.title, item.body].filter(Boolean).join(' ')), ...(d.learningOutcomes ?? []).map((item: any) => [item.title, item.body].filter(Boolean).join(' ')), ...(d.playbookSections ?? []).map((item: any) => [item.title, item.body].filter(Boolean).join(' ')), ...(d.keyQuestions ?? []).map((item: any) => item.question), ...(d.paperSections ?? []).map((item: any) => [item.title, item.body].filter(Boolean).join(' ')), ...(d.keyInsights ?? []).map((item: any) => [item.title, item.body].filter(Boolean).join(' ')), ...(d.templateFiles ?? []).map((item: any) => [item.title, item.body, item.format].filter(Boolean).join(' ')), ...(d.templateSteps ?? []).map((item: any) => [item.title, item.body].filter(Boolean).join(' '))].join('\n\n'), image: d.image, seo: d.seo, type: 'article', publishedTime: d.publishedAt, modifiedTime: d.updatedAt })
}

export default async function ResourcePage({ params }: Props) {
  const { slug } = await params
  const d = await getResourceDetail(slug)
  if (!d) notFound()
  const hub = await liveHub([
    { name: 'Resources', path: '/resources' },
    { name: 'Learn', path: '/learn' },
  ])
  const path = `/resources/${d.slug}`
  const trail = [{ name: 'Home', path: '/' }, ...(hub ? [hub] : []), { name: d.title, path }]
  const jsonLd = await detailJsonLd({ path, name: d.title, description: d.summary, modified: d.updatedAt, trail, seo: d.seo })
  return (
    <>
      <JsonLd data={jsonLd} />
      <ResourceDetailPage resource={d} />
    </>
  )
}
