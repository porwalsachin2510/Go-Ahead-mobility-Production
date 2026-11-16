import Link from 'next/link'
import { AuthShell } from '@/components/admin/auth-shell'
import { LogoutButton } from '@/components/admin/auth-forms'
import { requirePageUser } from '@/lib/server/auth/session'
import { ROLES } from '@/lib/rbac'

export const metadata = { title: 'Account' }

export default async function AccountPage() {
  const user = await requirePageUser()
  return (
    <AuthShell title="Account" description={`${user.name} · ${ROLES[user.role]?.label ?? user.role}`}>
      <dl className="flex flex-col gap-1 text-sm">
        <dt className="text-muted-foreground">Signed in as</dt>
        <dd className="font-medium text-foreground">{user.email}</dd>
      </dl>
      <div className="flex items-center justify-between border-t border-border pt-4 text-sm">
        <Link href="/admin" className="font-medium text-primary">
          Go to dashboard
        </Link>
        <LogoutButton className="text-muted-foreground hover:text-foreground" />
      </div>
    </AuthShell>
  )
}
