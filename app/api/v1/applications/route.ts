import { notifyAdmins } from '@/lib/server/services/notifications'
import { z } from 'zod'
import { badRequest, clientIp, handler, ok } from '@/lib/server/http'
import { nextSequence, rateLimit } from '@/lib/server/security/guards'
import { Application, ConsentEvent } from '@/lib/server/models/operations'
import { storeUpload } from '@/lib/server/services/media'
import { queueEmail } from '@/lib/server/services/email'
import { isValidObjectId } from '@/lib/server/db'
import { afterApplicationCreated, assertNotDuplicate, evaluateScreening, loadApplicableJob } from '@/lib/server/services/careers'

const optionalUrl = z.union([z.literal(''), z.string().trim().url('Enter a valid URL').max(300)]).optional().default('')
const short = (max: number) => z.string().trim().max(max).optional().default('')

const schema = z.object({
  jobId: z.string().refine(isValidObjectId, 'Invalid role'),
  name: z.string().trim().min(2, 'Please enter your name').max(120),
  email: z.string().trim().email('Enter a valid email').max(254),
  phone: short(40),
  portfolioUrl: optionalUrl,
  linkedinUrl: optionalUrl.refine((v) => !v || /linkedin\.com\//i.test(v), 'Enter a LinkedIn profile URL'),
  currentLocation: short(120),
  noticePeriod: short(60),
  expectedSalary: short(60),
  coverNote: short(3000),
  privacy: z.literal('on', { message: 'Please accept the privacy notice' }),
  referrer: short(300),
  utmSource: short(80),
  utmMedium: short(80),
  utmCampaign: short(120),
  landingPage: short(300),
})

export const POST = handler(async (req) => {
  const len = Number(req.headers.get('content-length') || 0)
  if (len > 11 * 1024 * 1024) throw badRequest('Upload too large', { cv: 'Maximum 10 MB' })
  const form = await req.formData().catch(() => {
    throw badRequest('Invalid form submission')
  })
  if (String(form.get('website') || '').trim()) return ok({ reference: 'APP-RECEIVED' }, { status: 201 })
  await rateLimit(`apply:${clientIp(req)}`, 5, 900)

  const raw = Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === 'string')) as Record<string, string>
  const input = schema.parse(raw)
  const job = await loadApplicableJob(input.jobId)
  const { answers, passed } = evaluateScreening(job, raw)
  await assertNotDuplicate(String(job._id), input.email)

  const cv = form.get('cv')
  if (!(cv instanceof File) || cv.size === 0) throw badRequest('Please attach your CV', { cv: 'Required' })
  const asset = await storeUpload(cv, { allow: ['document'], isPrivate: true, folder: 'applications' })

  const now = new Date()
  const seq = await nextSequence(`application:${now.getFullYear()}`)
  const reference = `APP-${now.getFullYear()}-${String(seq).padStart(5, '0')}`
  const app = await Application.create({
    publicReference: reference,
    jobId: job._id,
    jobTitle: job.title,
    name: input.name,
    email: input.email,
    phone: input.phone,
    portfolioUrl: input.portfolioUrl,
    linkedinUrl: input.linkedinUrl,
    currentLocation: input.currentLocation,
    noticePeriod: input.noticePeriod,
    expectedSalary: input.expectedSalary,
    coverNote: input.coverNote,
    answers,
    screeningPassed: passed,
    source: { referrer: input.referrer, utmSource: input.utmSource, utmMedium: input.utmMedium, utmCampaign: input.utmCampaign, landingPage: input.landingPage },
    cvMediaId: asset._id,
    stateChangedAt: now,
    timeline: [{ kind: 'created', text: passed ? 'Application received' : 'Application received — flagged by a knockout answer', byName: 'Candidate', at: now }],
    consent: { privacyAccepted: true, privacyNoticeVersion: 'v1', marketing: false, consentedAt: now },
    retentionAt: new Date(now.getTime() + 365 * 24 * 3600_000),
  })
  await ConsentEvent.create({ subjectType: 'application', subjectId: String(app._id), event: 'privacy_accepted', source: 'careers_form' })
  await queueEmail({ templateSlug: 'application_acknowledgement', to: input.email, vars: { name: input.name, jobTitle: job.title, reference }, relatedType: 'application', relatedId: String(app._id) }).catch((e) =>
    console.error('[applications] email failed', e),
  )
  await afterApplicationCreated(job, app, req.nextUrl.origin)
  await notifyAdmins({ kind: 'application', title: `New application — ${input.name}`, body: `${job.title} · ${reference}`, href: `/admin/careers/applications/${app._id}`, subjectId: String(app._id) })
  return ok({ reference }, { status: 201 })
})
