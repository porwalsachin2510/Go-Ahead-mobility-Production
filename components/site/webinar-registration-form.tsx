'use client'

import { useState } from 'react'
import { CheckCircle2, LoaderCircle } from 'lucide-react'
import Link from 'next/link'
import { api, collectAttribution } from '@/lib/client/api'

type Props = {
  resourceSlug: string
  privacyHref: string
  submitLabel: string
  successHeading: string
  successBody: string
}

export function WebinarRegistrationForm({
  resourceSlug,
  privacyHref,
  submitLabel,
  successHeading,
  successBody,
}: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [reference, setReference] = useState('')
  const [alreadyRegistered, setAlreadyRegistered] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const email = String(data.get('email') || '').trim()
    const company = String(data.get('company') || '').trim()
    const privacyAccepted = data.get('privacy') === 'on'
    const marketing = data.get('marketing') === 'on'
    const website = String(data.get('website') || '')
    setError('')
    if (!privacyAccepted) {
      setError('Please confirm the privacy notice before registering.')
      return
    }

    setBusy(true)
    try {
      const result = await api<{ reference: string; alreadyRegistered?: boolean }>(
        '/api/v1/resources/' + encodeURIComponent(resourceSlug) + '/register',
        {
          method: 'POST',
          headers: { 'Idempotency-Key': crypto.randomUUID() },
          json: { email, company, privacyAccepted, marketing, website, attribution: collectAttribution() },
        },
      )
      if (!result.ok) {
        setError(result.error.message || 'Registration could not be completed. Please try again.')
        return
      }
      setReference(result.data.reference)
      setAlreadyRegistered(Boolean(result.data.alreadyRegistered))
    } catch {
      setError('We could not connect to the registration service. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (reference) {
    return (
      <div role="status" className="flex h-full flex-col justify-center rounded-xl border border-[#cfe8da] bg-[#f5fcf8] p-5">
        <CheckCircle2 className="size-8 text-emerald-600" aria-hidden="true" />
        <h3 className="mt-3 text-base font-semibold text-[#173a2c]">{alreadyRegistered ? "You're already registered" : successHeading}</h3>
        <p className="mt-2 text-xs leading-5 text-[#527064]">{alreadyRegistered ? 'This work email is already registered for this webinar.' : successBody}</p>
        <p className="mt-3 text-[11px] font-semibold text-[#355e4d]">Registration reference: {reference}</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="grid gap-3" aria-label="Register for this webinar">
      <div>
        <label htmlFor="webinar-email" className="mb-1.5 block text-[11px] font-semibold text-[#27375d]">Work email address <span className="text-red-600" aria-hidden="true">*</span></label>
        <input id="webinar-email" name="email" type="email" autoComplete="email" required maxLength={254} placeholder="name@company.com" className="w-full rounded-lg border border-[#dbe4f0] bg-white px-3 py-2.5 text-xs text-[#142449] outline-none transition focus:border-[#1677ef] focus:ring-2 focus:ring-[#1677ef]/15" />
      </div>
      <div>
        <label htmlFor="webinar-company" className="mb-1.5 block text-[11px] font-semibold text-[#27375d]">Company name <span className="text-red-600" aria-hidden="true">*</span></label>
        <input id="webinar-company" name="company" type="text" autoComplete="organization" required maxLength={160} placeholder="Enter your company name" className="w-full rounded-lg border border-[#dbe4f0] bg-white px-3 py-2.5 text-xs text-[#142449] outline-none transition focus:border-[#1677ef] focus:ring-2 focus:ring-[#1677ef]/15" />
      </div>
      <div className="flex items-start gap-2">
        <input id="webinar-privacy" name="privacy" type="checkbox" required className="mt-0.5 size-4 accent-[#0863f7]" />
        <label htmlFor="webinar-privacy" className="text-[10px] leading-4 text-[#64718a]">I confirm that the information provided is accurate and I agree to the collection and use of my data as described in the <Link href={privacyHref || '/privacy-policy'} className="font-semibold text-[#0863f7] underline underline-offset-2">Privacy Policy</Link>.</label>
      </div>
      <div className="flex items-start gap-2">
        <input id="webinar-marketing" name="marketing" type="checkbox" className="mt-0.5 size-4 accent-[#0863f7]" />
        <label htmlFor="webinar-marketing" className="text-[10px] leading-4 text-[#64718a]">Yes, I would like to receive updates on relevant insights, webinars and events from GoAhead Mobility. (Optional)</label>
      </div>
      <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
        <label htmlFor="webinar-website">Website</label>
        <input id="webinar-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      {error ? <p role="alert" className="text-xs text-red-700">{error}</p> : null}
      <button type="submit" disabled={busy} className="mt-1 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#0863f7] px-5 py-3 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#064fca] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1677ef] focus-visible:ring-offset-2">
        {busy ? <><LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> Registering…</> : submitLabel}
      </button>
      <p className="text-center text-[10px] text-[#7a869d]">It only takes a minute</p>
    </form>
  )
}
