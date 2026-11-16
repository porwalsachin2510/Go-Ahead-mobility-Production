'use client'

import { useState } from 'react'
import { api } from '@/lib/client/api'
import { cn } from '@/lib/utils'

export function NewsletterForm({ tone = 'light', source = 'site' }: { tone?: 'light' | 'dark'; source?: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setState('sending')
    const res = await api<{ message: string }>('/api/v1/newsletter', {
      method: 'POST',
      json: { email: form.get('email'), consent: form.get('consent') === 'on', website: form.get('website'), source },
    })
    if (res.ok) {
      setState('done')
      setMessage(res.data.message)
    } else {
      setState('error')
      setMessage(res.error.details?.email || res.error.details?.consent || res.error.message)
    }
  }

  if (state === 'done') {
    return <p role="status" className={cn('rounded-xl px-4 py-3 text-sm', tone === 'dark' ? 'bg-primary-foreground/10 text-primary-foreground' : 'bg-sky-soft text-foreground')}>{message}</p>
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3" noValidate>
      <div className="flex gap-2">
        <label htmlFor={`nl-${source}`} className="sr-only">
          Work email
        </label>
        <input
          id={`nl-${source}`}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@company.com"
          className={cn('min-w-0 flex-1 rounded-full border px-4 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-sky', tone === 'dark' ? 'border-primary-foreground/20 bg-primary-foreground/5 text-primary-foreground placeholder:text-primary-foreground/40' : 'border-line bg-background')}
        />
        <button type="submit" disabled={state === 'sending'} className="rounded-full bg-sky px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-sky-soft disabled:opacity-60">
          {state === 'sending' ? 'Sending…' : 'Subscribe'}
        </button>
      </div>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <label className={cn('flex items-start gap-2 text-xs leading-relaxed', tone === 'dark' ? 'text-primary-foreground/60' : 'text-muted-foreground')}>
        <input type="checkbox" name="consent" required className="mt-0.5 accent-sky" />
        <span>
          I agree to receive emails and accept the{' '}
          <a href="/privacy" className="underline underline-offset-2">
            privacy notice
          </a>
          .
        </span>
      </label>
      {state === 'error' ? (
        <p role="alert" className="text-xs text-destructive">
          {message}
        </p>
      ) : null}
    </form>
  )
}
