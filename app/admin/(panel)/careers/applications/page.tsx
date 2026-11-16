import { ApplicationsTable } from '@/components/admin/applications-table'
import { PageHeader } from '@/components/admin/ui'
import { can } from '@/lib/rbac'
import { requirePageUser } from '@/lib/server/auth/session'

export const metadata = { title: 'Applications' }

export default async function ApplicationsPage({ searchParams }: { searchParams: Promise<{ state?: string; jobId?: string }> }) {
  const user = await requirePageUser('applications.read')
  const { state, jobId } = await searchParams
  return (
    <>
      <PageHeader title="Applications" description="Screen, rate and move candidates through the hiring pipeline." />
      <ApplicationsTable initialState={state} initialJobId={jobId} canManage={can(user.role, 'careers.manage')} />
    </>
  )
}
