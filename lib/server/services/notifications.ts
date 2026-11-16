import 'server-only'
import { Types } from 'mongoose'
import { Notification } from '../models/operations'
import { can } from '@/lib/rbac'
import type { SessionUser } from '../auth/session'

type NewNotification = {
  kind: 'lead' | 'application' | 'subscriber'
  title: string
  body?: string
  href?: string
  subjectId?: string
  leadType?: string
  ownerId?: unknown
  team?: string
}

export async function notifyAdmins(input: NewNotification) {
  try {
    await Notification.create({ ...input, ownerId: input.ownerId ?? null, team: input.team ?? '' })
  } catch (error) {
    console.error('[notifications] create failed', error)
  }
}

function scope(user: SessionUser): Record<string, unknown> {
  const leadScope: Record<string, unknown> = can(user.role, 'leads.read.all')
    ? {}
    : can(user.role, 'leads.read.team')
      ? { $or: [{ team: user.team }, { ownerId: user.id }] }
      : can(user.role, 'leads.read.own')
        ? { ownerId: user.id }
        : { _id: null }
  const kinds: Record<string, unknown>[] = [{ kind: { $in: ['lead', 'subscriber'] }, ...leadScope }]
  if (can(user.role, 'applications.read') || can(user.role, 'leads.read.all')) kinds.push({ kind: 'application' })
  return { $or: kinds }
}

export async function listNotifications(user: SessionUser, limit = 20) {
  const filter = scope(user)
  const userId = new Types.ObjectId(user.id)
  const [items, unread] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).limit(limit).lean<any[]>(),
    Notification.countDocuments({ $and: [filter, { readBy: { $ne: userId } }] }),
  ])
  return {
    unread,
    items: items.map((n) => ({
      id: String(n._id),
      kind: n.kind,
      title: n.title,
      body: n.body ?? '',
      href: n.href ?? '',
      leadType: n.leadType ?? '',
      createdAt: new Date(n.createdAt).toISOString(),
      read: (n.readBy ?? []).some((id: unknown) => String(id) === user.id),
    })),
  }
}

export async function markNotificationsRead(user: SessionUser, ids: string[] | 'all') {
  const filter = scope(user)
  const userId = new Types.ObjectId(user.id)
  const target = ids === 'all' ? filter : { $and: [filter, { _id: { $in: ids.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id)) } }] }
  await Notification.updateMany(target, { $addToSet: { readBy: userId } })
}
