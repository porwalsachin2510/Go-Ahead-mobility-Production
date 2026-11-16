import { redirect } from 'next/navigation'
import { CommentModeration } from '@/components/admin/comment-moderation'
import { Notice, PageHeader } from '@/components/admin/ui'
import { can } from '@/lib/rbac'
import { requirePageUser } from '@/lib/server/auth/session'
import { commentsEnabled } from '@/lib/server/services/blog-tools'

export const metadata = { title: 'Comment moderation' }

export default async function CommentsPage() {
  const user = await requirePageUser()
  if (!can(user.role, 'blog.publish')) redirect('/admin')
  const enabled = await commentsEnabled()
  return (
    <>
      <PageHeader title="Comments" description="Review reader comments before they appear on posts." />
      {!enabled && (
        <div className="mb-4">
          <Notice tone="info">Comments are turned off. Readers can&apos;t post new comments until you enable them in Site settings, under Features.</Notice>
        </div>
      )}
      <CommentModeration />
    </>
  )
}
