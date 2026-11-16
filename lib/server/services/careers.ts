import 'server-only'
import { connectDb, isValidObjectId } from '../db'
import { Job, JobAlert } from '../models/editorial'
import { Application } from '../models/operations'
import { badRequest, escapeRegex, notFound } from '../http'
import { audit } from '../security/guards'
import { randomToken, sha256 } from '../security/crypto'
import { queueEmail } from './email'
import { deleteMedia } from './media'
import type { SessionUser } from '../auth/session'
import { can } from '@/lib/rbac'
import { APPLICATION_STATES, STATE_LABELS, jobMeta, jobPlace, type ApplicationState } from '@/lib/careers/labels'

const plain = <T>(v: T): T => JSON.parse(JSON.stringify(v))

export function openJobFilter(now = new Date()) {
  return { status: 'published', $or: [{ closeAt: null }, { closeAt: { $gt: now } }] }
}

/* ------------------------------- Public: listing -------------------------------- */

export type JobFilters = { q?: string; department?: string; location?: string; type?: string; workplace?: string; level?: string }

const LISTING_FIELDS = 'slug title summary department location city region country employmentType workplaceType remote experienceLevel salaryMin salaryMax salaryCurrency salaryPeriod showSalary featured publishedAt createdAt closeAt skills openings'

export async function searchJobs(filters: JobFilters) {
  await connectDb()
  const base = openJobFilter()
  const all = await Job.find(base, LISTING_FIELDS).sort({ featured: -1, publishedAt: -1, createdAt: -1 }).lean<any[]>()

  const q = (filters.q ?? '').trim().slice(0, 80)
  const rx = q ? new RegExp(escapeRegex(q), 'i') : null
  const placeOf = (j: any) => j.city || j.location || ''
  const matches = (j: any, skip?: keyof JobFilters) =>
    (!rx || skip === 'q' || rx.test(j.title) || rx.test(j.summary ?? '') || rx.test(j.department ?? '') || (j.skills ?? []).some((s: string) => rx.test(s))) &&
    (!filters.department || skip === 'department' || j.department === filters.department) &&
    (!filters.location || skip === 'location' || placeOf(j) === filters.location) &&
    (!filters.type || skip === 'type' || j.employmentType === filters.type) &&
    (!filters.workplace || skip === 'workplace' || (j.workplaceType ?? (j.remote ? 'remote' : 'onsite')) === filters.workplace) &&
    (!filters.level || skip === 'level' || j.experienceLevel === filters.level)

  // Each facet counts against the other active filters so options never dead-end at zero.
  const facet = (key: keyof JobFilters, pick: (j: any) => string) => {
    const counts = new Map<string, number>()
    for (const j of all) if (matches(j, key)) { const v = pick(j); if (v) counts.set(v, (counts.get(v) ?? 0) + 1) }
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([value, count]) => ({ value, count }))
  }

  return plain({
    jobs: all.filter((j) => matches(j)),
    totalOpen: all.length,
    facets: {
      department: facet('department', (j) => j.department),
      location: facet('location', placeOf),
      type: facet('type', (j) => j.employmentType),
      workplace: facet('workplace', (j) => j.workplaceType ?? (j.remote ? 'remote' : 'onsite')),
      level: facet('level', (j) => j.experienceLevel),
    },
  })
}

/** Published roles past their closing date still resolve so old links show a "closed" notice instead of a 404. */
export async function getJobForPage(slug: string) {
  await connectDb()
  const job = await Job.findOne({ slug, status: { $in: ['published', 'closed'] } }).lean<any>()
  if (!job) return null
  const open = job.status === 'published' && (!job.closeAt || new Date(job.closeAt) > new Date())
  return plain({ job, open })
}

export async function similarJobs(job: any, limit = 3) {
  await connectDb()
  const candidates = await Job.find({ ...openJobFilter(), _id: { $ne: job._id } }, LISTING_FIELDS).limit(60).lean<any[]>()
  const skills = new Set((job.skills ?? []).map((s: string) => s.toLowerCase()))
  const scored = candidates
    .map((c) => ({
      c,
      score:
        (c.department && c.department === job.department ? 3 : 0) +
        (c.city && c.city === job.city ? 2 : 0) +
        (c.experienceLevel && c.experienceLevel === job.experienceLevel ? 1 : 0) +
        (c.skills ?? []).filter((s: string) => skills.has(s.toLowerCase())).length,
    }))
    .sort((a, b) => b.score - a.score)
  return plain(scored.slice(0, limit).map((s) => s.c))
}

export async function recordJobView(slug: string) {
  await connectDb()
  const r = await Job.updateOne({ slug, ...openJobFilter() }, { $inc: { viewCount: 1 } })
  return r.modifiedCount > 0
}

/* ------------------------------ Public: applications ------------------------------ */

export type ApplicationInput = {
  jobId: string
  name: string
  email: string
  phone: string
  portfolioUrl: string
  linkedinUrl: string
  currentLocation: string
  noticePeriod: string
  expectedSalary: string
  coverNote: string
  answers: Record<string, string>
  source: Record<string, string>
}

export async function loadApplicableJob(jobId: string) {
  if (!isValidObjectId(jobId)) throw notFound('Open role')
  await connectDb()
  const job = await Job.findOne({ _id: jobId, ...openJobFilter() }).lean<any>()
  if (!job) throw notFound('Open role')
  return job
}

/** Validates answers against the job's screening questions and evaluates knockout rules. */
export function evaluateScreening(job: any, raw: Record<string, string>) {
  const answers: { question: string; answer: string }[] = []
  const errors: Record<string, string> = {}
  let passed = true
  ;(job.screeningQuestions ?? []).forEach((q: any, i: number) => {
    const value = String(raw[`q${i}`] ?? '').trim().slice(0, 2000)
    if (q.kind === 'yes_no' && value && value !== 'yes' && value !== 'no') errors[`q${i}`] = 'Choose yes or no'
    if (q.required && !value) errors[`q${i}`] = 'Required'
    if (q.kind === 'yes_no' && q.knockoutAnswer && value === q.knockoutAnswer) passed = false
    answers.push({ question: q.question, answer: value })
  })
  if (Object.keys(errors).length) throw badRequest('Please answer the screening questions', errors)
  return { answers, passed }
}

export async function assertNotDuplicate(jobId: string, email: string) {
  const since = new Date(Date.now() - 30 * 24 * 3600_000)
  const dup = await Application.exists({ jobId, email: new RegExp(`^${escapeRegex(email)}$`, 'i'), createdAt: { $gte: since } })
  if (dup) throw badRequest('You have already applied for this role recently. Our team will be in touch.', { email: 'Already applied' })
}

export async function afterApplicationCreated(job: any, app: any, origin: string) {
  await Job.updateOne({ _id: job._id }, { $inc: { applicationCount: 1 } })
  if (job.hiringManagerEmail) {
    await queueEmail({
      templateSlug: 'application_internal',
      to: job.hiringManagerEmail,
      vars: { jobTitle: job.title, name: app.name, reference: app.publicReference, screening: app.screeningPassed ? 'Passed' : 'Flagged by a knockout answer', adminUrl: `${origin}/admin/careers/applications/${app._id}` },
      relatedType: 'application',
      relatedId: String(app._id),
    }).catch((e) => console.error('[careers] internal email failed', e))
  }
}

/* ---------------------------------- Job alerts ---------------------------------- */

export async function subscribeJobAlert(input: { email: string; departments: string[]; locations: string[] }, origin: string) {
  await connectDb()
  const emailNormalized = input.email.toLowerCase()
  const existing = await JobAlert.findOne({ emailNormalized })
  const token = randomToken(24)
  const status = existing?.status === 'confirmed' ? 'confirmed' : 'pending'
  await JobAlert.findOneAndUpdate(
    { emailNormalized },
    { $set: { email: input.email, departments: input.departments, locations: input.locations, status, tokenHash: sha256(token) } },
    { upsert: true, new: true },
  )
  if (status === 'confirmed') return { message: 'Your job alert preferences were updated.' }
  const criteria = [...input.departments, ...input.locations].length ? ` for ${[...input.departments, ...input.locations].join(', ')}` : ''
  await queueEmail({ templateSlug: 'job_alert_confirm', to: input.email, vars: { confirmUrl: `${origin}/api/v1/careers/alerts/confirm?token=${token}`, criteria } }).catch((e) =>
    console.error('[careers] alert confirm email failed', e),
  )
  return { message: 'Check your inbox to confirm your job alert.' }
}

export async function resolveJobAlertToken(token: string, action: 'confirm' | 'unsubscribe') {
  if (token.length < 20) return 'invalid'
  await connectDb()
  const alert = await JobAlert.findOne({ tokenHash: sha256(token) })
  if (!alert) return 'invalid'
  if (action === 'confirm') {
    if (alert.status !== 'unsubscribed') { alert.status = 'confirmed'; alert.confirmedAt = new Date() }
  } else alert.status = 'unsubscribed'
  await alert.save()
  return action === 'confirm' ? 'confirmed' : 'unsubscribed'
}

/** Emails confirmed subscribers whose department/location preferences match a newly published role. */
export async function notifyJobAlerts(job: any, siteUrl: string) {
  await connectDb()
  const place = job.city || job.location || ''
  const alerts = await JobAlert.find({
    status: 'confirmed',
    $and: [
      { $or: [{ departments: { $size: 0 } }, { departments: job.department }] },
      { $or: [{ locations: { $size: 0 } }, { locations: place }] },
    ],
  })
    .limit(2000)
    .lean<any[]>()
  let sent = 0
  for (const a of alerts) {
    // A fresh token per email keeps unsubscribe links working without storing raw tokens.
    const token = randomToken(24)
    await JobAlert.updateOne({ _id: a._id }, { $set: { tokenHash: sha256(token), lastNotifiedAt: new Date() } })
    const ok = await queueEmail({
      templateSlug: 'job_alert',
      to: a.email,
      vars: { jobTitle: job.title, jobMeta: jobMeta(job), jobUrl: `${siteUrl}/careers/${job.slug}`, unsubscribeUrl: `${siteUrl}/api/v1/careers/alerts/confirm?action=unsubscribe&token=${token}` },
      relatedType: 'job',
      relatedId: String(job._id),
    }).catch(() => null)
    if (ok) sent++
  }
  return sent
}

/* --------------------------------- Admin: pipeline --------------------------------- */

const maskEmailLite = (e: string) => e.replace(/^(.).*(@.*)$/, '$1***$2')
const maskPhone = (p: string) => (p ? `${p.slice(0, 3)}***${p.slice(-2)}` : '')

function present(app: any, user: SessionUser) {
  const pii = can(user.role, 'pii.view')
  return {
    id: String(app._id),
    reference: app.publicReference,
    jobId: String(app.jobId),
    jobTitle: app.jobTitle,
    name: app.name,
    email: pii ? app.email : maskEmailLite(app.email),
    phone: pii ? app.phone : maskPhone(app.phone),
    state: app.state,
    rating: app.rating ?? 0,
    tags: app.tags ?? [],
    screeningPassed: app.screeningPassed !== false,
    currentLocation: app.currentLocation ?? '',
    createdAt: app.createdAt,
    stateChangedAt: app.stateChangedAt ?? app.createdAt,
  }
}

export type PipelineQuery = { state?: string; jobId?: string; q?: string; flagged?: boolean; minRating?: number; page?: number }

function pipelineFilter(q: PipelineQuery) {
  const f: Record<string, unknown> = {}
  if (q.state && (APPLICATION_STATES as readonly string[]).includes(q.state)) f.state = q.state
  if (q.jobId && isValidObjectId(q.jobId)) f.jobId = q.jobId
  if (q.flagged) f.screeningPassed = false
  if (q.minRating) f.rating = { $gte: q.minRating }
  if (q.q) {
    const rx = new RegExp(escapeRegex(q.q.slice(0, 80)), 'i')
    f.$or = [{ name: rx }, { email: rx }, { publicReference: rx }, { tags: rx }]
  }
  return f
}

export async function listApplications(user: SessionUser, q: PipelineQuery) {
  await connectDb()
  const filter = pipelineFilter(q)
  const page = Math.max(1, q.page ?? 1)
  const limit = 25
  const { state: _ignored, ...withoutState } = filter
  const [items, total, stateCounts, jobs] = await Promise.all([
    Application.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean<any[]>(),
    Application.countDocuments(filter),
    Application.aggregate([{ $match: withoutState }, { $group: { _id: '$state', n: { $sum: 1 } } }]),
    Job.find({ status: { $ne: 'archived' } }, 'title status').sort({ title: 1 }).lean<any[]>(),
  ])
  return plain({
    items: items.map((a) => present(a, user)),
    total,
    pages: Math.max(1, Math.ceil(total / limit)),
    counts: Object.fromEntries(stateCounts.map((c: any) => [c._id, c.n])),
    jobs: jobs.map((j) => ({ id: String(j._id), title: j.title, status: j.status })),
  })
}

export async function getApplicationDetail(user: SessionUser, id: string) {
  if (!isValidObjectId(id)) throw notFound('Application')
  await connectDb()
  const app = await Application.findById(id).lean<any>()
  if (!app) throw notFound('Application')
  const pii = can(user.role, 'pii.view')
  const others = await Application.find({ email: app.email, _id: { $ne: app._id } }, 'publicReference jobTitle state createdAt').sort({ createdAt: -1 }).limit(10).lean<any[]>()
  return plain({
    ...present(app, user),
    portfolioUrl: app.portfolioUrl,
    linkedinUrl: app.linkedinUrl ?? '',
    noticePeriod: app.noticePeriod ?? '',
    expectedSalary: app.expectedSalary ?? '',
    coverNote: app.coverNote,
    answers: app.answers ?? [],
    notes: app.notes ?? '',
    source: app.source ?? {},
    timeline: [...(app.timeline ?? [])].reverse(),
    hasCv: Boolean(app.cvMediaId) && pii,
    retentionAt: app.retentionAt,
    otherApplications: others.map((o) => ({ id: String(o._id), reference: o.publicReference, jobTitle: o.jobTitle, state: o.state, createdAt: o.createdAt })),
  })
}

const CANDIDATE_MESSAGES: Partial<Record<ApplicationState, (job: string) => string>> = {
  screening: (j) => `Thank you for your interest in the ${j} role. Our team is now reviewing your application in detail.`,
  interview: (j) => `Good news — we would like to invite you to interview for the ${j} role. A member of our team will contact you shortly to arrange a time.`,
  offer: (j) => `We are delighted to let you know we are preparing an offer for the ${j} role. We will be in touch with the details very soon.`,
  hired: (j) => `Welcome aboard! We are thrilled you are joining GoAhead Mobility as ${j}.`,
  rejected: (j) => `Thank you for the time you invested in applying for the ${j} role. After careful consideration we will not be progressing your application on this occasion. We will keep your details on file and encourage you to apply for future roles.`,
}

export type ApplicationUpdate = { state?: ApplicationState; rating?: number; tags?: string[]; note?: string; notes?: string; notifyCandidate?: boolean }

export async function updateApplications(user: SessionUser, ids: string[], update: ApplicationUpdate) {
  const valid = ids.filter(isValidObjectId)
  if (!valid.length) throw badRequest('Choose at least one application')
  await connectDb()
  const apps = await Application.find({ _id: { $in: valid } })
  let emailed = 0
  for (const app of apps) {
    const entries: { kind: string; text: string; byName: string; at: Date }[] = []
    const at = new Date()
    if (update.state && update.state !== app.state) {
      entries.push({ kind: 'state', text: `${STATE_LABELS[app.state as ApplicationState] ?? app.state} → ${STATE_LABELS[update.state]}`, byName: user.name, at })
      app.state = update.state
      app.stateChangedAt = at
      const msg = CANDIDATE_MESSAGES[update.state]
      if (update.notifyCandidate && msg) {
        const sent = await queueEmail({
          templateSlug: 'application_status_update',
          to: app.email,
          vars: { name: app.name, jobTitle: app.jobTitle, reference: app.publicReference, message: msg(app.jobTitle) },
          relatedType: 'application',
          relatedId: String(app._id),
        }).catch(() => null)
        if (sent) { emailed++; entries.push({ kind: 'email', text: `Candidate emailed about ${STATE_LABELS[update.state].toLowerCase()}`, byName: user.name, at }) }
      }
    }
    if (typeof update.rating === 'number' && update.rating !== app.rating) {
      app.rating = Math.max(0, Math.min(5, Math.round(update.rating)))
      entries.push({ kind: 'rating', text: `Rated ${app.rating}/5`, byName: user.name, at })
    }
    if (update.tags) app.tags = [...new Set(update.tags.map((t) => t.trim()).filter(Boolean))].slice(0, 20)
    if (typeof update.notes === 'string') app.notes = update.notes
    if (update.note?.trim()) entries.push({ kind: 'note', text: update.note.trim().slice(0, 2000), byName: user.name, at })
    app.timeline.push(...entries)
    await app.save()
  }
  await audit({ actor: user, action: 'application.update', entityType: 'application', entityId: valid.join(',').slice(0, 200), summary: `Updated ${apps.length} application(s)`, diff: { state: update.state, rating: update.rating } })
  return { changed: apps.length, emailed }
}

export async function exportApplicationsCsv(user: SessionUser, q: PipelineQuery) {
  await connectDb()
  const pii = can(user.role, 'pii.view')
  const rows = await Application.find(pipelineFilter(q)).sort({ createdAt: -1 }).limit(10000).lean<any[]>()
  const cell = (v: unknown) => {
    const s = String(v ?? '')
    const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s // blocks spreadsheet formula injection
    return `"${safe.replace(/"/g, '""')}"`
  }
  const header = ['Reference', 'Applied', 'Job', 'Name', 'Email', 'Phone', 'Location', 'State', 'Rating', 'Screening', 'Tags', 'Notice period', 'Expected salary', 'LinkedIn', 'Portfolio', 'Source']
  const lines = rows.map((a) =>
    [
      a.publicReference,
      new Date(a.createdAt).toISOString().slice(0, 10),
      a.jobTitle,
      a.name,
      pii ? a.email : maskEmailLite(a.email),
      pii ? a.phone : maskPhone(a.phone),
      a.currentLocation,
      STATE_LABELS[a.state as ApplicationState] ?? a.state,
      a.rating ?? 0,
      a.screeningPassed === false ? 'Flagged' : 'Passed',
      (a.tags ?? []).join('; '),
      a.noticePeriod,
      a.expectedSalary,
      a.linkedinUrl,
      a.portfolioUrl,
      a.source?.utmSource || a.source?.referrer || '',
    ]
      .map(cell)
      .join(','),
  )
  await audit({ actor: user, action: 'application.export', entityType: 'application', entityId: 'csv', summary: `Exported ${rows.length} application(s)` })
  return [header.map(cell).join(','), ...lines].join('\r\n')
}

export async function purgeExpiredApplications(user: SessionUser) {
  await connectDb()
  const expired = await Application.find({ retentionAt: { $lt: new Date() } }, 'cvMediaId').lean<any[]>()
  for (const a of expired) if (a.cvMediaId) await deleteMedia(String(a.cvMediaId)).catch(() => false)
  const r = await Application.deleteMany({ _id: { $in: expired.map((a) => a._id) } })
  await audit({ actor: user, action: 'application.purge', entityType: 'application', entityId: 'retention', summary: `Purged ${r.deletedCount} application(s) past retention` })
  return { purged: r.deletedCount }
}

/* -------------------------------- Admin: analytics -------------------------------- */

/** Fields Google for Jobs requires or strongly recommends; surfaced so HR can fix listings before they lose rich results. */
export function jobSeoIssues(j: any): string[] {
  const issues: string[] = []
  if ((j.description ?? '').trim().length < 150) issues.push('Description is shorter than 150 characters')
  if (j.workplaceType !== 'remote' && !j.city) issues.push('City is missing (required for on-site and hybrid roles)')
  if (!j.country) issues.push('Country code is missing')
  if (j.workplaceType === 'remote' && !(j.applicantCountries ?? []).length) issues.push('Remote role needs eligible countries')
  if (!j.salaryMin && !j.salaryMax) issues.push('No salary range (listings with pay get more clicks)')
  else if (!j.salaryCurrency || !j.salaryPeriod) issues.push('Salary needs a currency and period')
  if (!j.closeAt) issues.push('No closing date (validThrough)')
  return issues
}

export async function careersAnalytics() {
  await connectDb()
  const now = new Date()
  const d30 = new Date(now.getTime() - 30 * 24 * 3600_000)
  const in7 = new Date(now.getTime() + 7 * 24 * 3600_000)
  const [jobs, byState, last30, perJob, sources, hired, alerts, expired] = await Promise.all([
    Job.find({ status: { $in: ['published', 'closed', 'draft'] } }).lean<any[]>(),
    Application.aggregate([{ $group: { _id: '$state', n: { $sum: 1 } } }]),
    Application.countDocuments({ createdAt: { $gte: d30 } }),
    Application.aggregate([{ $group: { _id: '$jobId', total: { $sum: 1 }, hired: { $sum: { $cond: [{ $eq: ['$state', 'hired'] }, 1, 0] } }, flagged: { $sum: { $cond: [{ $eq: ['$screeningPassed', false] }, 1, 0] } }, fresh: { $sum: { $cond: [{ $eq: ['$state', 'received'] }, 1, 0] } } } }]),
    Application.aggregate([
      { $project: { src: { $ifNull: [{ $cond: [{ $gt: [{ $strLenCP: { $ifNull: ['$source.utmSource', ''] } }, 0] }, '$source.utmSource', null] }, { $ifNull: ['$source.referrer', ''] }] } } },
      { $group: { _id: '$src', n: { $sum: 1 } } },
      { $sort: { n: -1 } },
      { $limit: 8 },
    ]),
    Application.find({ state: 'hired' }, 'createdAt stateChangedAt').lean<any[]>(),
    JobAlert.countDocuments({ status: 'confirmed' }),
    Application.countDocuments({ retentionAt: { $lt: now } }),
  ])
  const stats = new Map(perJob.map((p: any) => [String(p._id), p]))
  const openJobs = jobs.filter((j) => j.status === 'published' && (!j.closeAt || new Date(j.closeAt) > now))
  const days = hired.map((h) => (new Date(h.stateChangedAt ?? h.createdAt).getTime() - new Date(h.createdAt).getTime()) / 86400_000).filter((d) => d >= 0)
  const hostOf = (s: string) => {
    if (!s) return 'Direct / unknown'
    try { return new URL(s).hostname.replace(/^www\./, '') } catch { return s }
  }
  const counts = Object.fromEntries(byState.map((s: any) => [s._id, s.n]))
  return plain({
    openJobs: openJobs.length,
    totalApplications: Object.values(counts).reduce((a: number, b) => a + (b as number), 0),
    last30,
    pipeline: APPLICATION_STATES.map((s) => ({ state: s, label: STATE_LABELS[s], count: counts[s] ?? 0 })),
    avgDaysToHire: days.length ? Math.round(days.reduce((a, b) => a + b, 0) / days.length) : null,
    confirmedAlerts: alerts,
    expiredApplications: expired,
    sources: sources.map((s: any) => ({ source: hostOf(s._id), count: s.n })),
    jobs: jobs
      .map((j) => {
        const s: any = stats.get(String(j._id)) ?? {}
        const open = openJobs.includes(j)
        return {
          id: String(j._id),
          title: j.title,
          slug: j.slug,
          status: open ? 'open' : j.status === 'published' ? 'expired' : j.status,
          place: jobPlace(j),
          views: j.viewCount ?? 0,
          applications: s.total ?? 0,
          newApplications: s.fresh ?? 0,
          flagged: s.flagged ?? 0,
          hired: s.hired ?? 0,
          conversion: j.viewCount ? Math.round(((s.total ?? 0) / j.viewCount) * 1000) / 10 : 0,
          closingSoon: Boolean(open && j.closeAt && new Date(j.closeAt) < in7),
          closeAt: j.closeAt,
          seoIssues: j.status === 'draft' || open ? jobSeoIssues(j) : [],
        }
      })
      .sort((a, b) => Number(b.status === 'open') - Number(a.status === 'open') || b.applications - a.applications),
  })
}
