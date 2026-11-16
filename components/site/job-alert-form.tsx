'use client'

import { useState } from 'react'
import { api } from '@/lib/client/api'

const field = 'h-11 w-full rounded-xl border border-line bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring'

export function JobAlertForm({ departments, locations }: { departments: string[]; locations: string[] }) {
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const email = String(fd.get('email') || '').trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Enter a valid email')
    if (fd.get('consent') !== 'on') return setError('Please confirm you want job alerts')
    setSending(true)
    setError('')
    const res = await api<{ message: string }>('/api/v1/careers/alerts', {
      method: 'POST',
      body: JSON.stringify({
        email,
        departments: fd.get('department') ? [String(fd.get('department'))] : [],
        locations: fd.get('location') ? [String(fd.get('location'))] : [],
        consent: true,
        website: fd.get('website'),
      }),
    })
    setSending(false)
    if (res.ok) setMessage(res.data.message)
    else setError(res.error.message)
  }

  if (message) return <p role="status" className="rounded-xl bg-muted p-3 text-sm leading-relaxed">{message}</p>

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Email
        <input name="email" type="email" autoComplete="email" className={field} />
      </label>
      {departments.length ? (
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Department
          <select name="department" className={field} defaultValue="">
            <option value="">Any department</option>
            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </label>
      ) : null}
      {locations.length ? (
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Location
          <select name="location" className={field} defaultValue="">
            <option value="">Any location</option>
            {locations.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </label>
      ) : null}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <label className="flex items-start gap-2 text-sm leading-relaxed">
        <input type="checkbox" name="consent" className="mt-1 size-4" />
        <span>Email me new roles. Unsubscribe anytime.</span>
      </label>
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      <button type="submit" disabled={sending} className="btn-primary h-11 justify-center disabled:opacity-60">
        {sending ? 'Subscribing…' : 'Create alert'}
      </button>
    </form>
  )
}
