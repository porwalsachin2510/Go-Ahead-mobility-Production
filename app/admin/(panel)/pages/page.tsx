import { redirect } from 'next/navigation'
import { PagesList } from '@/components/admin/pages-list'
import { PageHeader } from '@/components/admin/ui'
import { can } from '@/lib/rbac'
import { requirePageUser } from '@/lib/server/auth/session'

export const metadata = { title: 'Pages' }

export default async function PagesPage() {
  const user = await requirePageUser()
  if (!can(user.role, 'content.read')) redirect('/admin')
  return (
    <>
      <PageHeader title="Custom pages" description="Build and publish block-based CMS pages such as legal and campaign pages. Core website routes have dedicated editors in Content." />
      <PagesList canWrite={can(user.role, 'content.write')} />
    </>
  )
}
