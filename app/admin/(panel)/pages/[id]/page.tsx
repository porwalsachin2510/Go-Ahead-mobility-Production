import { redirect } from 'next/navigation'
import { PageBuilder } from '@/components/admin/page-builder'
import { can } from '@/lib/rbac'
import { requirePageUser } from '@/lib/server/auth/session'

export const metadata = { title: 'Edit page' }

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePageUser()
  if (!can(user.role, 'content.read')) redirect('/admin')
  const { id } = await params
  return <PageBuilder id={id} canWrite={can(user.role, 'content.write')} canPublish={can(user.role, 'content.publish')} />
}
