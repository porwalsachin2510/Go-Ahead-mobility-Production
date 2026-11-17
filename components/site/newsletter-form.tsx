'use client'

import { useState } from 'react'
import { Mail } from 'lucide-react'
import { api } from '@/lib/client/api'
import { cn } from '@/lib/utils'

type NewsletterFormProps = {
  tone?: 'light' | 'dark'
  source?: string
  variant?: 'inline' | 'card'
  emailLabel?: string
  placeholder?: string
  buttonLabel?: string
  consentCopy?: string
  className?: string
}

export function NewsletterForm({
  tone = 'light',
  source = 'site',
  variant = 'inline',
  emailLabel = 'Work email',
  placeholder = 'you@company.com',
  buttonLabel = 'Subscribe',
  consentCopy = 'I agree to receive emails and accept the privacy notice.',
  className,
}: NewsletterFormProps) {
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const safeSource = source.replace(/[^a-z0-9_-]/gi, '-')

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
    return (
      <p role="status" className={cn('rounded-xl px-4 py-3 text-sm', tone === 'dark' ? 'bg-primary-foreground/10 text-primary-foreground' : 'bg-sky-soft text-foreground', className)}>
        {message}
      </p>
    )
  }

  const emailInput = (
    <input
      id={`nl-${safeSource}`}
      name="email"
      type="email"
      required
      autoComplete="email"
      placeholder={placeholder}
      aria-label={emailLabel}
      className={cn(
        'min-w-0 w-full rounded-lg border px-3 py-3 text-sm outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-azure',
        tone === 'dark'
          ? 'border-primary-foreground/20 bg-primary-foreground/5 text-primary-foreground placeholder:text-primary-foreground/40'
          : 'border-line bg-background text-foreground placeholder:text-muted-foreground',
      )}
    />
  )

  return (
    <form onSubmit={onSubmit} className={cn('flex flex-col gap-3', className)}>
      {variant === 'card' ? (
        <>
          <label htmlFor={`nl-${safeSource}`} className="text-xs font-semibold text-foreground">
            {emailLabel}<span className="text-azure" aria-hidden="true">*</span>
          </label>
          <div className="relative">
            <Mail aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <div className="[&_input]:pl-10">{emailInput}</div>
          </div>
          <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
          <label className={cn('flex items-start gap-2 text-xs leading-relaxed', tone === 'dark' ? 'text-primary-foreground/60' : 'text-muted-foreground')}>
            <input type="checkbox" name="consent" required className="mt-0.5 accent-azure focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azure" />
            <span>{consentCopy}</span>
          </label>
          <button type="submit" disabled={state === 'sending'} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-azure px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-azure-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60">
            {state === 'sending' ? 'Sending…' : buttonLabel}
            <span aria-hidden="true">→</span>
          </button>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label htmlFor={`nl-${safeSource}`} className="sr-only">
              {emailLabel}
            </label>
            {emailInput}
            <button type="submit" disabled={state === 'sending'} className={cn('shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky focus-visible:ring-offset-2', tone === 'dark' ? 'bg-sky text-ink hover:bg-sky-soft' : 'bg-azure text-white hover:bg-azure-deep')}>
              {state === 'sending' ? 'Sending…' : buttonLabel}
            </button>
          </div>
          <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
          <label className={cn('flex items-start gap-2 text-xs leading-relaxed', tone === 'dark' ? 'text-primary-foreground/60' : 'text-muted-foreground')}>
            <input type="checkbox" name="consent" required className="mt-0.5 accent-sky focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky" />
            <span>{consentCopy} <a href="/privacy" className="underline underline-offset-2">Privacy Policy</a>.</span>
          </label>
        </>
      )}
      {state === 'error' ? <p role="alert" className="text-xs text-destructive">{message}</p> : null}
    </form>
  )
}
