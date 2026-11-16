'use client'

import { useState } from 'react'
import { api } from '@/lib/client/api'

const input = 'h-11 w-full rounded-xl border border-line bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring'

type Question = { question: string; kind: 'text' | 'yes_no'; required?: boolean }

const FIELDS = [
  { name: 'name', label: 'Full name', type: 'text', auto: 'name', required: true },
  { name: 'email', label: 'Email', type: 'email', auto: 'email', required: true },
  { name: 'phone', label: 'Phone', type: 'tel', auto: 'tel' },
  { name: 'currentLocation', label: 'Current location', type: 'text', auto: 'address-level2' },
  { name: 'linkedinUrl', label: 'LinkedIn profile', type: 'url', auto: 'url' },
  { name: 'portfolioUrl', label: 'Portfolio or website', type: 'url', auto: 'url' },
  { name: 'noticePeriod', label: 'Notice period', type: 'text', auto: 'off' },
  { name: 'expectedSalary', label: 'Expected salary', type: 'text', auto: 'off' },
] as const

function attribution() {
  const params = new URLSearchParams(window.location.search)
  return {
    referrer: document.referrer.slice(0, 300),
    utmSource: params.get('utm_source') ?? '',
    utmMedium: params.get('utm_medium') ?? '',
    utmCampaign: params.get('utm_campaign') ?? '',
    landingPage: window.location.pathname.slice(0, 300),
  }
}

export function ApplicationForm({ jobId, questions = [] }: { jobId: string; questions?: Question[] }) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [sending, setSending] = useState(false)
  const [reference, setReference] = useState('')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('jobId', jobId)
    for (const [k, v] of Object.entries(attribution())) fd.set(k, v)
    const local: Record<string, string> = {}
    if (String(fd.get('name') || '').trim().length < 2) local.name = 'Please enter your name'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(fd.get('email') || ''))) local.email = 'Enter a valid email'
    const li = String(fd.get('linkedinUrl') || '').trim()
    if (li && !/linkedin\.com\//i.test(li)) local.linkedinUrl = 'Enter a LinkedIn profile URL'
    questions.forEach((q, i) => {
      if (q.required && !String(fd.get(`q${i}`) || '').trim()) local[`q${i}`] = 'Required'
    })
    const cv = fd.get('cv') as File | null
    if (!cv || !cv.size) local.cv = 'Please attach your CV'
    else if (cv.size > 10 * 1024 * 1024) local.cv = 'Maximum 10 MB'
    if (fd.get('privacy') !== 'on') local.privacy = 'Please accept the privacy notice'
    setErrors(local)
    if (Object.keys(local).length) return
    setSending(true)
    setFormError('')
    const res = await api<{ reference: string }>('/api/v1/applications', { method: 'POST', body: fd })
    setSending(false)
    if (res.ok) setReference(res.data.reference)
    else {
      setErrors((res.error.details as Record<string, string>) ?? {})
      setFormError(res.error.message)
    }
  }

  if (reference) {
    return (
      <p role="status" className="rounded-2xl bg-muted p-5 text-sm leading-relaxed">
        Thank you. Your application reference is <strong>{reference}</strong>. We have emailed you a confirmation and will be in touch about next steps.
      </p>
    )
  }

  const err = (k: string) => (errors[k] ? <span id={`${k}-err`} className="text-xs text-destructive">{errors[k]}</span> : null)
  const aria = (k: string) => ({ 'aria-invalid': Boolean(errors[k]), 'aria-describedby': errors[k] ? `${k}-err` : undefined })

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {FIELDS.map((f) => (
        <label key={f.name} className="flex flex-col gap-1.5 text-sm font-medium">
          <span>
            {f.label}
            {'required' in f && f.required ? <span aria-hidden> *</span> : <span className="font-normal text-muted-foreground"> (optional)</span>}
          </span>
          <input name={f.name} type={f.type} autoComplete={f.auto} required={'required' in f && f.required} className={input} {...aria(f.name)} />
          {err(f.name)}
        </label>
      ))}

      {questions.map((q, i) =>
        q.kind === 'yes_no' ? (
          <fieldset key={i} className="flex flex-col gap-2 text-sm" {...aria(`q${i}`)}>
            <legend className="mb-1 font-medium">
              {q.question}
              {q.required ? <span aria-hidden> *</span> : null}
            </legend>
            <div className="flex gap-4">
              {['yes', 'no'].map((v) => (
                <label key={v} className="flex items-center gap-2">
                  <input type="radio" name={`q${i}`} value={v} className="size-4" />
                  {v === 'yes' ? 'Yes' : 'No'}
                </label>
              ))}
            </div>
            {err(`q${i}`)}
          </fieldset>
        ) : (
          <label key={i} className="flex flex-col gap-1.5 text-sm font-medium">
            <span>
              {q.question}
              {q.required ? <span aria-hidden> *</span> : null}
            </span>
            <textarea name={`q${i}`} rows={3} maxLength={2000} className="w-full rounded-xl border border-line bg-background p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" {...aria(`q${i}`)} />
            {err(`q${i}`)}
          </label>
        ),
      )}

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        <span>
          Cover note <span className="font-normal text-muted-foreground">(optional)</span>
        </span>
        <textarea name="coverNote" rows={4} maxLength={3000} className="w-full rounded-xl border border-line bg-background p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        CV (PDF or DOCX, max 10 MB) *
        <input name="cv" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="text-sm" {...aria('cv')} />
        {err('cv')}
      </label>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <label className="flex items-start gap-2 text-sm leading-relaxed">
        <input type="checkbox" name="privacy" className="mt-1 size-4" {...aria('privacy')} />
        <span>
          I agree that my application data is processed as described in the{' '}
          <a href="/privacy" className="underline">
            privacy notice
          </a>
          .
        </span>
      </label>
      {err('privacy')}
      {formError ? <p role="alert" className="text-sm text-destructive">{formError}</p> : null}
      <button type="submit" disabled={sending} className="btn-primary h-11 justify-center disabled:opacity-60">
        {sending ? 'Sending…' : 'Submit application'}
      </button>
    </form>
  )
}
