'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/client/api'
import { FieldShell, Input, Notice } from './ui'

export function LoginForm() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setBusy(true)
    setError('')
    const r = await api('/api/v1/admin/auth/login', { method: 'POST', json: { email: fd.get('email'), password: fd.get('password') } })
    if (!r.ok) {
      setBusy(false)
      return setError(r.error.message)
    }
    router.replace('/admin')
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {error && <Notice tone="error">{error}</Notice>}
      <FieldShell id="email" label="Work email">
        <Input id="email" name="email" type="email" autoComplete="username" required />
      </FieldShell>
      <FieldShell id="password" label="Password">
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            className="pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            aria-controls="password"
            className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            {showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
          </button>
        </div>
      </FieldShell>
      <Button type="submit" disabled={busy} className="mt-2">
        {busy ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  )
}

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter()
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        await api('/api/v1/admin/auth/logout', { method: 'POST' })
        router.replace('/admin/login')
        router.refresh()
      }}
    >
      Sign out
    </button>
  )
}
