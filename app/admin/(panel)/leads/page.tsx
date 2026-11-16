import { LeadsTable } from '@/components/admin/leads-table'
import { PageHeader } from '@/components/admin/ui'
import { can } from '@/lib/rbac'
import { requirePageUser } from '@/lib/server/auth/session'

export const metadata = { title: 'Leads' }

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const user = await requirePageUser()
  const { status } = await searchParams
  return (
    <>
      <PageHeader title="Leads" description="Every enquiry from the website, routed by vertical with a full activity history." />
      <LeadsTable initialStatus={status} canExport={can(user.role, 'leads.export')} />
    </>
  )
}
