'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/client/api'

export function PurgeButton() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  async function purge() {
    if (!confirm('Permanently delete expired applications and their CVs?')) return
    setBusy(true)
    const r = await api<{ purged: number }>('/api/v1/admin/careers/purge', { method: 'POST' })
    setBusy(false)
    setMsg(r.ok ? `Deleted ${r.data.purged} application(s).` : r.error.message)
    if (r.ok) router.refresh()
  }
  return (
    <div className="flex flex-col gap-1">
      <Button size="sm" variant="outline" onClick={purge} disabled={busy}>
        {busy ? 'Deleting…' : 'Purge expired data'}
      </Button>
      {msg ? <p role="status" className="text-xs text-muted-foreground">{msg}</p> : null}
    </div>
  )
}
