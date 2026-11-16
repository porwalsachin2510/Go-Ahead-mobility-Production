'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/client/api'

type Props = { id: string; path: string; hits: number; referrer?: string; suggestion?: string }

export function NotFoundRow({ id, path, hits, referrer, suggestion }: Props) {
  const router = useRouter()
  const [target, setTarget] = useState(suggestion ?? '')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function act(action: 'redirect' | 'gone' | 'dismiss') {
    setBusy(action)
    setError('')
    try {
      await api('/api/v1/admin/seo/not-found', { method: 'POST', json: action === 'redirect' ? { action, id, targetUrl: target } : { action, id } })
      router.refresh()
    } catch (e: any) {
      setError(e?.message ?? 'Could not save.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex flex-col gap-2 p-4 text-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="break-all font-mono text-xs">{path}</span>
        <span className="shrink-0 text-muted-foreground">{hits} hits</span>
      </div>
      {referrer ? <p className="break-all text-xs text-muted-foreground">From {referrer}</p> : null}
      <form
        className="flex flex-wrap items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (target.trim()) act('redirect')
        }}
      >
        <label htmlFor={`nf-${id}`} className="sr-only">Redirect {path} to</label>
        <input
          id={`nf-${id}`}
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="/new-path"
          className="h-8 min-w-0 flex-1 rounded-md border border-input bg-background px-2 font-mono text-xs"
        />
        <Button type="submit" size="sm" disabled={!target.trim() || !!busy}>{busy === 'redirect' ? 'Saving' : '301 redirect'}</Button>
        <Button type="button" size="sm" variant="outline" disabled={!!busy} onClick={() => act('gone')}>410</Button>
        <Button type="button" size="sm" variant="ghost" disabled={!!busy} onClick={() => act('dismiss')}>Dismiss</Button>
      </form>
      {error ? <p role="alert" className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}
