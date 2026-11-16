'use client'

import { useEffect, useRef, useState } from 'react'
import useSWR from 'swr'
import { api, fetcher } from '@/lib/client/api'

const FIELDS = ['title', 'subtitle', 'excerpt', 'content', 'heroImage', 'heroAlt', 'heroCaption', 'readingMinutes'] as const

type AutosaveResponse = {
  autosave: { data: Record<string, unknown>; updatedAt: string; baseRevision: number } | null
  currentRevision: number
  stale?: boolean
}

export type AutosaveState = 'idle' | 'pending' | 'saving' | 'saved' | 'error'

export function usePostAutosave(enabled: boolean, id: string, draft: Record<string, unknown> | null, revision: number) {
  const url = enabled ? `/api/v1/admin/blog/posts/${id}/autosave` : null
  const { data, mutate } = useSWR<AutosaveResponse>(url, fetcher, { revalidateOnFocus: false })
  const [state, setState] = useState<AutosaveState>('idle')
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const snapshot = draft ? JSON.stringify(Object.fromEntries(FIELDS.map((k) => [k, draft[k]]))) : null

  useEffect(() => {
    if (!url || !snapshot) return
    setState('pending')
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      setState('saving')
      const r = await api<{ savedAt: string }>(url, { method: 'PUT', json: { baseRevision: revision, data: JSON.parse(snapshot) } })
      if (r.ok) {
        setState('saved')
        setSavedAt(r.data.savedAt)
        setDismissed(true)
      } else setState('error')
    }, 2500)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [url, snapshot, revision])

  const discard = async () => {
    if (timer.current) clearTimeout(timer.current)
    if (url) await api(url, { method: 'DELETE' })
    setDismissed(true)
    setState('idle')
    mutate({ autosave: null, currentRevision: revision }, { revalidate: false })
  }

  const recoverable = !dismissed && !draft && data?.autosave ? data.autosave : null

  return { state, savedAt, recoverable, stale: Boolean(data?.stale), discard, fields: FIELDS }
}
