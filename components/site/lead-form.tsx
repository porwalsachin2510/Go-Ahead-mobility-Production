'use client'

import { useState } from 'react'
import { CircleCheck } from 'lucide-react'
import { api, collectAttribution } from '@/lib/client/api'
import { cn } from '@/lib/utils'

export type LeadVariant = 'accommodation' | 'transport' | 'demo' | 'contact'

type FieldSpec = { name: string; label: string; type?: 'text' | 'email' | 'tel' | 'number' | 'date' | 'select' | 'textarea'; required?: boolean; options?: string[]; span?: 2; autoComplete?: string; placeholder?: string }
type ContactFormContent = {
  formNameLabel?: string; formEmailLabel?: string; formPhoneLabel?: string; formCompanyLabel?: string
  formIndustryLabel?: string; formLocationLabel?: string; formSolutionLabel?: string; formMessageLabel?: string
  formNamePlaceholder?: string; formEmailPlaceholder?: string; formPhonePlaceholder?: string; formCompanyPlaceholder?: string; formMessagePlaceholder?: string
  formPhoneDefaultCode?: string; formPhoneCountryCodes?: string[]
  formIndustryOptions?: string[]; formSolutionOptions?: string[]; formSubmitLabel?: string
  formPrivacyText?: string; formPrivacyHref?: string; formShowMarketingOptIn?: boolean
  formSuccessTitle?: string; formSuccessBody?: string
}

const CONTACT: FieldSpec[] = [
  { name: 'name', label: 'Full name', required: true, autoComplete: 'name' },
  { name: 'email', label: 'Work email', type: 'email', required: true, autoComplete: 'email' },
  { name: 'company', label: 'Company', required: true, autoComplete: 'organization' },
  { name: 'phone', label: 'Phone', type: 'tel', autoComplete: 'tel' },
  { name: 'jobTitle', label: 'Job title', autoComplete: 'organization-title' },
]

const VARIANT_FIELDS: Record<LeadVariant, FieldSpec[]> = {
  accommodation: [
    ...CONTACT,
    { name: 'serviceType', label: 'Stay type', type: 'select', required: true, options: ['Corporate hotel programme', 'Serviced apartments', 'Project / crew housing', 'Relocation & long stay', 'Event & group stays'] },
    { name: 'city', label: 'Destination city / cities', required: true },
    { name: 'checkIn', label: 'Check-in (approx.)', type: 'date' },
    { name: 'checkOut', label: 'Check-out (approx.)', type: 'date' },
    { name: 'guests', label: 'Number of guests', type: 'number' },
    { name: 'roomNights', label: 'Estimated room nights / month', type: 'number' },
    { name: 'budget', label: 'Budget per night (indicative)', placeholder: 'e.g. USD 120–160' },
    { name: 'details', label: 'Requirements', type: 'textarea', span: 2, placeholder: 'Property standards, proximity, meals, billing, duty-of-care needs…' },
  ],
  transport: [
    ...CONTACT,
    { name: 'serviceType', label: 'Service needed', type: 'select', required: true, options: ['Employee shuttle', 'Executive / chauffeur', 'Airport transfers', 'Event transportation', 'Industrial / site transport', 'Fleet management'] },
    { name: 'city', label: 'City / operating area', required: true },
    { name: 'passengers', label: 'Passengers per day', type: 'number' },
    { name: 'shifts', label: 'Shifts / timings', placeholder: 'e.g. 3 shifts, 06:00 / 14:00 / 22:00' },
    { name: 'vehicleTypes', label: 'Vehicle types', placeholder: 'Sedan, MUV, tempo traveller, coach…' },
    { name: 'startDate', label: 'Expected start', type: 'date' },
    { name: 'details', label: 'Routes and requirements', type: 'textarea', span: 2, placeholder: 'Pickup zones, safety requirements, escorts, GPS reporting…' },
  ],
  demo: [
    ...CONTACT,
    { name: 'serviceType', label: 'Interested module', type: 'select', required: true, options: ['Full transport ERP', 'Routing & rostering', 'Live tracking & safety', 'Billing & vendor management', 'Employee app'] },
    { name: 'fleetSize', label: 'Fleet size', type: 'number' },
    { name: 'city', label: 'City' },
    { name: 'details', label: 'What would you like to see?', type: 'textarea', span: 2 },
  ],
  contact: [
    { name: 'name', label: 'Full name', required: true, autoComplete: 'name' },
    { name: 'email', label: 'Work email', type: 'email', required: true, autoComplete: 'email' },
    { name: 'phone', label: 'Phone number', type: 'tel', required: true, autoComplete: 'tel', placeholder: '+91 Enter your phone number' },
    { name: 'company', label: 'Company name', required: true, autoComplete: 'organization' },
    { name: 'industry', label: 'Industry / Business type', type: 'select', options: ['Corporate & Enterprise', 'IT & Technology', 'Manufacturing', 'Healthcare & Pharma', 'Oil, Gas & Energy', 'Events & Conferences', 'Education', 'Government', 'Other'] },
    { name: 'city', label: 'Your location', type: 'select', options: ['Other / Multiple locations'] },
    { name: 'serviceType', label: 'Interested solution', type: 'select', options: ['Global accommodation', 'Local transportation', 'Employee transportation', 'Corporate shuttles', 'Industrial transport', 'Event transport', 'Transport SaaS / ERP', 'Multiple solutions'] },
    { name: 'details', label: 'Your message', type: 'textarea', required: true, span: 2, placeholder: 'Tell us about your requirements…' },
  ],
}

const inputCls =
  'w-full rounded-xl border border-line bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-royal focus-visible:ring-2 focus-visible:ring-royal/20 aria-[invalid=true]:border-destructive'

export function LeadForm({ variant, serviceType, compact = false, locations = [], contactContent }: { variant: LeadVariant; serviceType?: string; compact?: boolean; locations?: string[]; contactContent?: ContactFormContent }) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [sending, setSending] = useState(false)
  const [reference, setReference] = useState<string | null>(null)
  const [phoneCountryCode, setPhoneCountryCode] = useState(contactContent?.formPhoneDefaultCode || '+91')
  const baseFields = VARIANT_FIELDS[variant] ?? VARIANT_FIELDS.contact
  const contactOverrides: Record<string, Partial<FieldSpec>> = variant === 'contact' ? {
    name: { label: contactContent?.formNameLabel, placeholder: contactContent?.formNamePlaceholder },
    email: { label: contactContent?.formEmailLabel, placeholder: contactContent?.formEmailPlaceholder },
    phone: { label: contactContent?.formPhoneLabel, placeholder: contactContent?.formPhonePlaceholder },
    company: { label: contactContent?.formCompanyLabel, placeholder: contactContent?.formCompanyPlaceholder },
    industry: { label: contactContent?.formIndustryLabel, options: contactContent?.formIndustryOptions },
    city: { label: contactContent?.formLocationLabel },
    serviceType: { label: contactContent?.formSolutionLabel, options: contactContent?.formSolutionOptions },
    details: { label: contactContent?.formMessageLabel, placeholder: contactContent?.formMessagePlaceholder },
  } : {}
  const fields = baseFields.map((field) => ({ ...field, ...contactOverrides[field.name], label: contactOverrides[field.name]?.label || field.label, placeholder: contactOverrides[field.name]?.placeholder || field.placeholder, options: contactOverrides[field.name]?.options?.length ? contactOverrides[field.name]?.options : field.options }))
  const fieldInputClass = compact ? 'w-full rounded-md border border-[#dce3ed] bg-white px-3 py-2.5 text-xs text-[#15213c] outline-none transition-colors placeholder:text-[#98a3b5] focus:border-[#078bea] focus-visible:ring-2 focus-visible:ring-[#078bea]/15 aria-[invalid=true]:border-destructive' : inputCls

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const values: Record<string, string> = {}
    for (const f of fields) values[f.name] = String(fd.get(f.name) ?? '').trim()
    if (variant === 'contact' && values.phone) values.phone = `${String(fd.get('phoneCountryCode') || contactContent?.formPhoneDefaultCode || '+91')} ${values.phone}`.trim()
    const local: Record<string, string> = {}
    for (const f of fields) if (f.required && !values[f.name]) local[f.name] = 'Required'
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) local.email = 'Enter a valid email'
    if (fd.get('privacy') !== 'on') local.privacy = 'Please accept the privacy notice'
    setErrors(local)
    if (Object.keys(local).length) return

    setSending(true)
    setFormError('')
    const { name, email, company, phone, jobTitle, city, serviceType: st, ...requirement } = values
    try {
      const res = await api<{ reference: string }>('/api/v1/leads', {
        method: 'POST',
        headers: { 'Idempotency-Key': crypto.randomUUID() },
        json: {
          type: variant,
          serviceType: st,
          city: city ?? '',
          contact: { name, email, company, phone, jobTitle },
          requirement,
          consent: { privacyAccepted: true, marketing: fd.get('marketing') === 'on' },
          attribution: collectAttribution(),
          website: fd.get('website'),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      })
      if (res.ok) {
        setReference(res.data.reference)
      } else {
        const mapped: Record<string, string> = {}
        for (const [k, v] of Object.entries(res.error.details ?? {})) mapped[k.split('.').pop() as string] = v
        setErrors(mapped)
        setFormError(res.error.message || 'We could not submit your request. Please try again.')
      }
    } catch {
      setFormError('We could not connect to our server. Please check your connection and try again.')
    } finally {
      setSending(false)
    }
  }

  if (reference) {
    return (
      <div role="status" className="flex flex-col items-start gap-4 rounded-3xl border border-line bg-paper p-8">
        <CircleCheck aria-hidden className="size-10 text-sky" />
        <h3 className="font-display text-2xl font-bold text-foreground">{variant === 'contact' ? contactContent?.formSuccessTitle || 'Thank you. We have your request.' : 'Thank you. We have your request.'}</h3>
        <p className="leading-relaxed text-muted-foreground">
          Your reference is <strong className="font-mono text-foreground">{reference}</strong>. {variant === 'contact' ? contactContent?.formSuccessBody || 'A specialist will contact you within one business day.' : 'A specialist will contact you within one business day, and a confirmation is on its way to your inbox.'}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate aria-busy={sending} className={cn('flex flex-col gap-5 border border-line bg-background shadow-sm', compact ? 'rounded-none border-0 bg-transparent p-0 shadow-none' : 'rounded-3xl p-6 md:p-8')}>
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((f) => {
          const id = `lf-${variant}-${f.name}`
          const err = errors[f.name]
          const common = {
            id,
            name: f.name,
            required: f.required,
            'aria-invalid': Boolean(err),
            'aria-describedby': err ? `${id}-err` : undefined,
            className: fieldInputClass,
            autoComplete: f.autoComplete,
            placeholder: f.placeholder,
          }
          return (
            <div key={f.name} className={cn('flex flex-col gap-2', f.span === 2 && 'sm:col-span-2')}>
              <label htmlFor={id} className="text-xs font-medium text-foreground">
                {f.label}
                {f.required ? <span className="text-royal"> *</span> : null}
              </label>
              {f.type === 'select' ? (
                <select {...common} defaultValue={f.name === 'serviceType' && serviceType && f.options?.includes(serviceType) ? serviceType : ''}>
                  <option value="" disabled>
                    Select…
                  </option>
                  {(f.name === 'city' && variant === 'contact' && locations.length ? locations : f.options ?? []).map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : f.type === 'textarea' ? (
                <textarea {...common} rows={4} maxLength={4000} />
              ) : f.name === 'phone' && variant === 'contact' ? (
                <div className="flex gap-2">
                  <label className="sr-only" htmlFor={id + '-country'}>Phone country code</label>
                  <select id={id + '-country'} name="phoneCountryCode" value={phoneCountryCode} onChange={(event) => setPhoneCountryCode(event.target.value)} className={cn(fieldInputClass, 'max-w-[92px] shrink-0 px-2')}>
                    {(contactContent?.formPhoneCountryCodes?.length ? contactContent.formPhoneCountryCodes : ['+91', '+1', '+44', '+971', '+65']).map((code) => <option key={code} value={code}>{code}</option>)}
                  </select>
                  <input {...common} type="tel" minLength={7} maxLength={20} />
                </div>
              ) : (
                <input {...common} type={f.type ?? 'text'} min={f.type === 'number' ? 0 : undefined} maxLength={f.type === 'number' ? undefined : 200} />
              )}
              {err ? (
                <p id={`${id}-err`} role="alert" className="text-xs text-destructive">
                  {err}
                </p>
              ) : null}
            </div>
          )
        })}
      </div>

      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      <div className="flex flex-col gap-3 border-t border-line pt-5">
        <label className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
          <input type="checkbox" name="privacy" className="mt-1 size-4 accent-royal" aria-invalid={Boolean(errors.privacy)} aria-describedby={errors.privacy ? `lf-${variant}-privacy-error` : undefined} />
          <span>
            {variant === 'contact' ? contactContent?.formPrivacyText || 'I agree to GoAhead Mobility processing my details to respond to this request.' : 'I agree to GoAhead Mobility processing my details to respond to this request, as described in the'}{' '}
            {variant === 'contact' ? <a href={contactContent?.formPrivacyHref || '/privacy'} className="font-medium text-royal underline underline-offset-2">Privacy Policy and Terms & Conditions</a> : <a href="/privacy" className="font-medium text-royal underline underline-offset-2">privacy notice</a>}
            . <span className="text-royal">*</span>
          </span>
        </label>
        {errors.privacy ? <p id={`lf-${variant}-privacy-error`} role="alert" className="text-xs text-destructive">{errors.privacy}</p> : null}
        {variant !== 'contact' || contactContent?.formShowMarketingOptIn ? <label className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
          <input type="checkbox" name="marketing" className="mt-1 size-4 accent-royal" />
          <span>Send me occasional insights on corporate mobility. Optional.</span>
        </label> : null}
      </div>

      {formError ? (
        <p role="alert" aria-live="assertive" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {formError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={sending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-azure px-6 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-azure-deep disabled:opacity-60 sm:w-auto sm:self-end"
      >
        {sending ? 'Submitting…' : variant === 'contact' ? contactContent?.formSubmitLabel || 'Send Message' : variant === 'demo' ? 'Book my demo' : 'Submit request'}
      </button>
    </form>
  )
}
