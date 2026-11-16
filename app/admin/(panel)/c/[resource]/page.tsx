import { notFound } from 'next/navigation'
import { ResourceList } from '@/components/admin/resource-list'
import { RESOURCE_MAP } from '@/lib/admin/resources'
import { can } from '@/lib/rbac'
import { requirePageUser } from '@/lib/server/auth/session'

export async function generateMetadata({ params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params
  return { title: RESOURCE_MAP[resource]?.label ?? 'Not found' }
}

export default async function ResourcePage({ params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params
  const config = RESOURCE_MAP[resource]
  if (!config) notFound()
  const user = await requirePageUser(config.readPermission)
  return <ResourceList resource={resource} canWrite={can(user.role, config.writePermission)} />
}
