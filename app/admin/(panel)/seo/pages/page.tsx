import { redirect } from 'next/navigation'
import { PageInventory, type InventoryRow } from '@/components/admin/seo/page-inventory'
import { PageHeader } from '@/components/admin/ui'
import { can } from '@/lib/rbac'
import { requirePageUser } from '@/lib/server/auth/session'
import { buildInventory } from '@/lib/server/services/seo-inventory'

export const metadata = { title: 'SEO page inventory' }
export const dynamic = 'force-dynamic'

export default async function SeoPagesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requirePageUser()
  if (!can(user.role, 'seo.write')) redirect('/admin')
  const [{ q }, snapshot] = await Promise.all([searchParams, buildInventory()])
  const rows: InventoryRow[] = snapshot.entries
    .filter((e) => e.isPublic)
    .map((e) => ({
      key: e.key,
      path: e.path,
      label: e.label,
      pageType: e.pageType,
      status: e.status,
      indexable: e.indexable,
      noindexReason: e.noindexReason,
      canonical: e.canonicalPath,
      title: e.title,
      titleSource: e.titleSource,
      description: e.description,
      descriptionSource: e.descriptionSource,
      schemaTypes: e.schemaTypes,
      wordCount: e.wordCount,
      updatedAt: e.updatedAt,
      editable: e.editable,
    }))

  return (
    <>
      <PageHeader title="Page inventory" description="Every public URL the application can render, with its effective metadata. Edit a row to override title, description, canonical, robots and social fields." />
      <PageInventory rows={rows} siteUrl={snapshot.site.siteUrl} initialQuery={q ?? ''} />
    </>
  )
}
