import { LeadDetail } from '@/components/admin/lead-detail'
import { can } from '@/lib/rbac'
import { requirePageUser } from '@/lib/server/auth/session'

export const metadata = { title: 'Lead' }

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePageUser()
  const { id } = await params
  return <LeadDetail id={id} userId={user.id} canWrite={can(user.role, 'leads.write')} />
}
