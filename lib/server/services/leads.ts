import 'server-only'
import { z } from 'zod'
import { Lead, LeadActivity, RoutingRule } from '../models/operations'
import { nextSequence } from '../security/guards'
import { queueEmail } from './email'
import { notifyAdmins } from './notifications'
import { LEAD_TYPE_LABELS, REFERENCE_PREFIX, type LeadType } from '@/lib/leads'

const str = (max: number) => z.string().trim().max(max).optional().default('')

export const leadInputSchema = z.object({
  type: z.enum(['accommodation', 'transport', 'demo', 'contact']),
  serviceType: str(120),
  city: str(160),
  contact: z.object({
    name: z.string().trim().min(2, 'Please enter your name').max(120),
    email: z.string().trim().email('Enter a valid email').max(254),
    company: str(160),
    phone: z.string().trim().max(40).regex(/^[+\d\s().-]*$/, 'Enter a valid phone number').optional().default(''),
    jobTitle: str(120),
  }),
  requirement: z
    .record(z.string().max(40), z.string().max(4000))
    .default({})
    .refine((r) => Object.keys(r).length <= 20, 'Too many fields'),
  consent: z.object({
    privacyAccepted: z.boolean().refine((v) => v, 'Please accept the privacy notice'),
    marketing: z.boolean().optional().default(false),
  }),
  attribution: z
    .object({
      landingPage: str(300),
      referrer: str(300),
      utmSource: str(120),
      utmMedium: str(120),
      utmCampaign: str(120),
      utmContent: str(120),
      utmTerm: str(120),
      gclid: str(200),
      submittedFrom: str(300),
    })
    .partial()
    .optional()
    .default({}),
  timezone: str(80),
}).superRefine((input, ctx) => {
  if (input.type === 'contact' && !input.contact.phone.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['contact', 'phone'], message: 'Please enter your phone number' })
  }
})

export type LeadInput = z.infer<typeof leadInputSchema>

const VERTICAL_FOR: Record<string, 'accommodation' | 'transport' | 'general'> = {
  accommodation: 'accommodation',
  transport: 'transport',
  demo: 'transport',
  contact: 'general',
  newsletter: 'general',
  resource_download: 'general',
}

async function resolveRouting(lead: { vertical: string; serviceType: string; city: string; utmCampaign?: string }) {
  const rules = await RoutingRule.find({ enabled: true }).sort({ priority: 1 }).lean<any[]>()
  const city = lead.city.toLowerCase()
  return (
    rules.find(
      (r) =>
        (r.vertical === 'any' || r.vertical === lead.vertical) &&
        (!r.serviceType || r.serviceType === lead.serviceType) &&
        (!r.cityContains || city.includes(String(r.cityContains).toLowerCase())) &&
        (!r.utmCampaign || r.utmCampaign === lead.utmCampaign),
    ) ?? null
  )
}

export async function createLead(input: LeadInput, origin: string) {
  const type = input.type as LeadType
  const vertical = VERTICAL_FOR[type]
  const seq = await nextSequence(`lead:${type}:${new Date().getFullYear()}`)
  const reference = `${REFERENCE_PREFIX[type]}-${new Date().getFullYear()}-${String(seq).padStart(5, '0')}`
  const rule = await resolveRouting({ vertical, serviceType: input.serviceType, city: input.city, utmCampaign: input.attribution.utmCampaign })
  const now = new Date()

  const lead = await Lead.create({
    publicReference: reference,
    type,
    vertical,
    serviceType: input.serviceType,
    contact: { ...input.contact, emailNormalized: input.contact.email.toLowerCase() },
    city: input.city,
    requirement: input.requirement,
    status: rule?.ownerId ? 'assigned' : 'new',
    ownerId: rule?.ownerId ?? null,
    team: rule?.team ?? '',
    nextFollowUpAt: new Date(now.getTime() + (rule?.reminderHours ?? 24) * 3600_000),
    attribution: input.attribution,
    consent: { privacyAccepted: true, privacyNoticeVersion: 'v1', marketing: input.consent.marketing, consentedAt: now },
    timezone: input.timezone,
    retentionAt: new Date(now.getTime() + 3 * 365 * 24 * 3600_000),
  })

  await LeadActivity.create({
    leadId: lead._id,
    actionType: 'created',
    summary: `${LEAD_TYPE_LABELS[type]} received${rule ? ` and routed by rule "${rule.name}"` : ''}`,
  })

  const vars = {
    name: input.contact.name,
    reference,
    typeLabel: LEAD_TYPE_LABELS[type],
    vertical,
    verticalLabel: { accommodation: 'Global Accommodation', transport: 'Local Transportation', general: 'Client Services' }[vertical] ?? 'Client Services',
    company: input.contact.company || '—',
    city: input.city || '—',
    serviceType: input.serviceType || '—',
    adminUrl: `${origin}/admin/leads/${lead._id}`,
  }
  try {
    await queueEmail({ templateSlug: 'lead_acknowledgement', to: input.contact.email, vars, relatedType: 'lead', relatedId: String(lead._id) })
    const inbox = (process.env.CONTACT_INBOX || '').trim()
    if (inbox) await queueEmail({ templateSlug: 'lead_internal', to: inbox, vars, relatedType: 'lead', relatedId: String(lead._id), replyTo: input.contact.email })
  } catch (error) {
    console.error('[leads] email queue failed', error)
  }

  await notifyAdmins({
    kind: 'lead',
    title: `New ${LEAD_TYPE_LABELS[type].toLowerCase()} — ${input.contact.name}`,
    body: [input.contact.company, input.city, reference].filter(Boolean).join(' · '),
    href: `/admin/leads/${lead._id}`,
    subjectId: String(lead._id),
    leadType: type,
    ownerId: lead.ownerId,
    team: lead.team,
  })

  return { id: String(lead._id), reference }
}

export async function createNewsletterLead(email: string, source: string) {
  const emailNormalized = email.toLowerCase()
  const existing = await Lead.findOne({ type: 'newsletter', 'contact.emailNormalized': emailNormalized, archived: false }).select('_id').lean<any>()
  if (existing) return { id: String(existing._id), created: false }
  const year = new Date().getFullYear()
  const seq = await nextSequence(`lead:newsletter:${year}`)
  const reference = `${REFERENCE_PREFIX.newsletter}-${year}-${String(seq).padStart(5, '0')}`
  const now = new Date()
  const name = emailNormalized.split('@')[0].replace(/[._-]+/g, ' ').trim() || 'Newsletter subscriber'
  const lead = await Lead.create({
    publicReference: reference,
    type: 'newsletter',
    vertical: 'general',
    serviceType: 'Newsletter',
    contact: { name, email, emailNormalized },
    requirement: `Subscribed to the newsletter from ${source || 'the website'}.`,
    status: 'new',
    ownerId: null,
    team: '',
    attribution: { landingPage: source },
    consent: { privacyAccepted: true, privacyNoticeVersion: 'v1', marketing: true, consentedAt: now },
    retentionAt: new Date(now.getTime() + 3 * 365 * 24 * 3600_000),
  })
  await LeadActivity.create({ leadId: lead._id, actionType: 'created', summary: 'Newsletter subscription received' })
  await notifyAdmins({
    kind: 'subscriber',
    title: `New newsletter subscriber — ${email}`,
    body: `${reference} · from ${source || 'site'}`,
    href: `/admin/leads/${lead._id}`,
    subjectId: String(lead._id),
    leadType: 'newsletter',
  })
  return { id: String(lead._id), created: true }
}
