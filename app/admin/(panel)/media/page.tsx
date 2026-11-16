import { redirect } from 'next/navigation'
import { MediaLibrary } from '@/components/admin/media-library'
import { PageHeader } from '@/components/admin/ui'
import { can } from '@/lib/rbac'
import { requirePageUser } from '@/lib/server/auth/session'

export const metadata = { title: 'Media library' }

export default async function MediaPage() {
  const user = await requirePageUser()
  if (!can(user.role, 'media.write')) redirect('/admin')
  return (
    <>
      <PageHeader title="Media library" description="Upload images and documents to Cloudinary for use across the site." />
      <MediaLibrary />
    </>
  )
}
