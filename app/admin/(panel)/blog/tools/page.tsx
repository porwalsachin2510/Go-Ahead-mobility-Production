import { redirect } from 'next/navigation'
import { ImportExport, TermMerge } from '@/components/admin/blog-tools'
import { PageHeader } from '@/components/admin/ui'
import { can } from '@/lib/rbac'
import { requirePageUser } from '@/lib/server/auth/session'

export const metadata = { title: 'Blog tools' }

export default async function BlogToolsPage() {
  const user = await requirePageUser()
  if (!can(user.role, 'blog.write')) redirect('/admin')
  return (
    <>
      <PageHeader title="Blog tools" description="Merge duplicate categories and tags, and move posts in or out as JSON or Markdown." />
      <div className="flex flex-col gap-6">
        {can(user.role, 'blog.publish') && <TermMerge />}
        <ImportExport />
      </div>
    </>
  )
}
