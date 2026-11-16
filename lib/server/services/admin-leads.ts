import 'server-only'
import { z } from 'zod'
import { LEAD_STATUSES } from '@/lib/leads'
import { can } from '@/lib/rbac'
import type { SessionUser } from '../auth/session'
import { isValidObjectId } from '../db'
import { escapeRegex, forbidden, notFound, pagination } from '../http'
import { User } from '../models/identity'
import { Lead, LeadActivity } from '../models/operations'
import { audit } from '../security/guards'

const plain = <T>(v: unknown): T => JSON.parse(JSON.stringify(v))

/** Scopes lead queries by role: all, team, or own leads only. */
function scopeFilter(user: SessionUser): Record<string, unknown> {
  if (can(user.role, 'leads.read.all')) {
    return user.verticalScope.length ? { vertical: { $in: [...user.verticalScope, 'general'] } } : {}
  }
  if (can(user.role, 'leads.read.team')) return { $or: [{ team: user.team }, { ownerId: user.id }] }
  if (can(user.role, 'leads.read.own')) return { ownerId: user.id }
  throw forbidden()
}

function maskContact(lead: any, user: SessionUser) {
  if (can(user.role, 'pii.view') || String(lead.ownerId ?? '') === user.id) return lead
  const c = lead.contact ?? {}
  lead.contact = { ...c, email: c.email ? `${c.email[0]}***@${String(c.email).split('@')[1] ?? ''}` : '', phone: c.phone ? `***${String(c.phone).slice(-3)}` : '' }
  return lead
}

export async function listLeads(user: SessionUser, sp: URLSearchParams) {
  const { page, limit, skip } = pagination(sp, { limit: 25, max: 100 })
  const and: Record<string, unknown>[] = [scopeFilter(user), { archived: false }]
  const status = sp.get('status')
  if (status && (LEAD_STATUSES as readonly string[]).includes(status)) and.push({ status })
  const vertical = sp.get('vertical')
  if (vertical && ['accommodation', 'transport', 'general'].includes(vertical)) and.push({ vertical })
  if (sp.get('owner') === 'me') and.push({ ownerId: user.id })
  if (sp.get('owner') === 'none') and.push({ ownerId: null })
  const q = sp.get('q')?.trim().slice(0, 100)
  if (q) {
    const rx = { $regex: escapeRegex(q), $options: 'i' }
    and.push({ $or: [{ publicReference: rx }, { 'contact.name': rx }, { 'contact.company': rx }, { 'contact.email': rx }, { city: rx }] })
  }
  const filter = { $and: and }
  const [items, total, counts] = await Promise.all([
    Lead.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('ownerId', 'name').lean(),
    Lead.countDocuments(filter),
    Lead.aggregate([{ $match: { $and: [scopeFilter(user), { archived: false }] } }, { $group: { _id: '$status', n: { $sum: 1 } } }]),
  ])
  return {
    items: plain<any[]>(items).map((l) => maskContact(l, user)),
    total,
    page,
    limit,
    counts: Object.fromEntries(counts.map((c: { _id: string; n: number }) => [c._id, c.n])),
  }
}

async function loadScoped(user: SessionUser, id: string) {
  if (!isValidObjectId(id)) throw notFound('Lead')
  const lead = await Lead.findOne({ $and: [{ _id: id }, scopeFilter(user)] })
  if (!lead) throw notFound('Lead')
  return lead
}

export async function getLead(user: SessionUser, id: string) {
  const lead = await loadScoped(user, id)
  await lead.populate('ownerId', 'name email')
  const activities = await LeadActivity.find({ leadId: id }).sort({ createdAt: -1 }).limit(100).lean()
  return { lead: maskContact(plain(lead.toObject()), user), activities: plain<any[]>(activities) }
}

export const leadUpdateSchema = z.object({
  status: z.enum(LEAD_STATUSES).optional(),
  ownerId: z.string().nullable().optional(),
  priority: z.enum(['low', 'normal', 'high']).optional(),
  nextFollowUpAt: z.string().datetime({ offset: true }).nullable().optional().or(z.literal('')),
  note: z.string().trim().max(4000).optional(),
  lossReason: z.string().trim().max(300).optional(),
})

export async function updateLead(user: SessionUser, id: string, input: z.infer<typeof leadUpdateSchema>) {
  if (!can(user.role, 'leads.write')) throw forbidden()
  const lead = await loadScoped(user, id)
  const acts: { actionType: string; summary: string; body?: string; meta?: unknown }[] = []

  if (input.status && input.status !== lead.status) {
    acts.push({ actionType: 'status_change', summary: `Status ${lead.status} → ${input.status}`, meta: { from: lead.status, to: input.status } })
    if (input.status === 'contacted' && !lead.firstContactAt) lead.firstContactAt = new Date()
    if (input.status === 'lost') lead.set('outcome', { ...(lead.outcome ?? {}), result: 'lost', lossReason: input.lossReason ?? '' })
    if (input.status === 'won') lead.set('outcome', { ...(lead.outcome ?? {}), result: 'won' })
    lead.status = input.status
  }
  if (input.ownerId !== undefined && String(lead.ownerId ?? '') !== String(input.ownerId ?? '')) {
    if (!can(user.role, 'leads.assign')) throw forbidden()
    let ownerName = 'Unassigned'
    if (input.ownerId) {
      if (!isValidObjectId(input.ownerId)) throw notFound('User')
      const owner = await User.findOne({ _id: input.ownerId, status: 'active' }).select('name team').lean<{ name: string; team: string }>()
      if (!owner) throw notFound('User')
      ownerName = owner.name
      lead.team = owner.team || lead.team
    }
    lead.set('ownerId', input.ownerId || null)
    if (input.ownerId && lead.status === 'new') lead.status = 'assigned'
    acts.push({ actionType: 'assignment', summary: `Assigned to ${ownerName}` })
  }
  if (input.priority && input.priority !== lead.priority) {
    lead.priority = input.priority
    acts.push({ actionType: 'update', summary: `Priority set to ${input.priority}` })
  }
  if (input.nextFollowUpAt !== undefined) {
    lead.nextFollowUpAt = input.nextFollowUpAt ? new Date(input.nextFollowUpAt) : null
    acts.push({ actionType: 'update', summary: input.nextFollowUpAt ? `Follow-up set for ${new Date(input.nextFollowUpAt).toUTCString()}` : 'Follow-up cleared' })
  }
  if (input.note) acts.push({ actionType: 'note', summary: 'Note added', body: input.note })

  if (!acts.length) return getLead(user, id)
  lead.lastActivityAt = new Date()
  await lead.save()
  await LeadActivity.insertMany(acts.map((a) => ({ ...a, leadId: lead._id, actorId: user.id, actorName: user.name })))
  await audit({ actor: user, action: 'update', entityType: 'lead', entityId: id, summary: acts.map((a) => a.summary).join('; ') })
  return getLead(user, id)
}

export async function exportLeadsCsv(user: SessionUser, sp: URLSearchParams) {
  if (!can(user.role, 'leads.export')) throw forbidden()
  const params = new URLSearchParams(sp)
  params.set('limit', '100')
  const rows: any[] = []
  for (let page = 1; page <= 50; page++) {
    params.set('page', String(page))
    const res = await listLeads(user, params)
    rows.push(...res.items)
    if (res.items.length < 100) break
  }
  const cell = (v: unknown) => {
    let s = v == null ? '' : String(v)
    if (/^[=+\-@]/.test(s)) s = `'${s}`
    return `"${s.replace(/"/g, '""')}"`
  }
  const header = ['Reference', 'Created', 'Type', 'Vertical', 'Status', 'Name', 'Company', 'Email', 'Phone', 'City', 'Owner', 'Source']
  const lines = rows.map((l) =>
    [l.publicReference, l.createdAt, l.type, l.vertical, l.status, l.contact?.name, l.contact?.company, l.contact?.email, l.contact?.phone, l.city, l.ownerId?.name ?? '', l.attribution?.utmSource ?? l.attribution?.referrer ?? '']
      .map(cell)
      .join(','),
  )
  await audit({ actor: user, action: 'export', entityType: 'lead', summary: `Exported ${rows.length} leads` })
  return [header.map(cell).join(','), ...lines].join('\n')
}
