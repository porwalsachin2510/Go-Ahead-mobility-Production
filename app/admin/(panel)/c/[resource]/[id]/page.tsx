import { notFound } from 'next/navigation'
import { AiWritingAssistant } from '@/components/admin/ai-writing-assistant'
import { PostWorkflowPanel } from '@/components/admin/post-workflow-panel'
import { ResourceEditor } from '@/components/admin/resource-editor'
import { RESOURCE_MAP } from '@/lib/admin/resources'
import { can } from '@/lib/rbac'
import { requirePageUser } from '@/lib/server/auth/session'

export async function generateMetadata({ params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params
  return { title: RESOURCE_MAP[resource]?.singular ?? 'Not found' }
}

export default async function ResourceEditPage({ params }: { params: Promise<{ resource: string; id: string }> }) {
  const { resource, id } = await params
  const config = RESOURCE_MAP[resource]
  if (!config) notFound()
  const user = await requirePageUser(config.readPermission)
  const canWrite = can(user.role, config.writePermission)
  return (
    <div className="flex flex-col gap-8">
      <ResourceEditor key={id} resource={resource} id={id} canWrite={canWrite} />
      {resource === 'posts' && id !== 'new' && canWrite && <AiWritingAssistant postId={id} />}
      {resource === 'posts' && id !== 'new' && <PostWorkflowPanel postId={id} canWrite={canWrite} />}
    </div>
  )
}
