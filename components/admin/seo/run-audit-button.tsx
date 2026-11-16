'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'

export function RunAuditButton() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [, startTransition] = useTransition()

  async function run() {
    setBusy(true)
    setMessage('')
    try {
      const res = await fetch('/api/v1/admin/seo/audit', { method: 'POST' })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body?.error?.message || 'Audit failed')
      setMessage(`Score ${body.data?.score ?? body.score}, ${body.data?.issues ?? body.issues} open issues`)
      startTransition(() => router.refresh())
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Audit failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <span role="status" aria-live="polite" className="text-sm text-muted-foreground">{message}</span>
      <Button type="button" onClick={run} disabled={busy}>{busy ? 'Auditing…' : 'Run audit'}</Button>
    </div>
  )
}
