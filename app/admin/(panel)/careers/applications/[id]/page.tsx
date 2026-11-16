import { ApplicationDetail } from '@/components/admin/application-detail'
import { can } from '@/lib/rbac'
import { requirePageUser } from '@/lib/server/auth/session'

export const metadata = { title: 'Application' }

export default async function ApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePageUser('applications.read')
  const { id } = await params
  return <ApplicationDetail id={id} canManage={can(user.role, 'careers.manage')} />
}
