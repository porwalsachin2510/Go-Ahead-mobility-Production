import { redirect } from 'next/navigation'
import { AuthShell } from '@/components/admin/auth-shell'
import { LoginForm } from '@/components/admin/auth-forms'
import { getSessionUser } from '@/lib/server/auth/session'

export const metadata = { title: 'Sign in' }

export default async function LoginPage() {
  const user = await getSessionUser()
  if (user) redirect('/admin')
  return (
    <AuthShell title="Admin sign in" description="Restricted to authorised GoAhead Mobility staff. All activity is logged.">
      <LoginForm />
    </AuthShell>
  )
}
