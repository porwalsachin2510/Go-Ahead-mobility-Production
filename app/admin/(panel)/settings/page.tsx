import { redirect } from 'next/navigation'
import { SettingsForm } from '@/components/admin/settings-form'
import { PageHeader } from '@/components/admin/ui'
import { can } from '@/lib/rbac'
import { requirePageUser } from '@/lib/server/auth/session'

export const metadata = { title: 'Site settings' }

export default async function SettingsPage() {
  const user = await requirePageUser()
  if (!can(user.role, 'settings.write')) redirect('/admin')
  return (
    <>
      <PageHeader title="Site settings" description="Brand, contact details, navigation buttons, SEO defaults and notification inboxes." />
      <SettingsForm />
    </>
  )
}
