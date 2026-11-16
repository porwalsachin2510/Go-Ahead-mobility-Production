import { BlogDashboard } from '@/components/admin/blog-dashboard'
import { can } from '@/lib/rbac'
import { requirePageUser } from '@/lib/server/auth/session'

export const metadata = { title: 'Blog' }

export default async function BlogAdminPage() {
  const user = await requirePageUser('content.read')
  return <BlogDashboard canWrite={can(user.role, 'blog.write')} />
}
