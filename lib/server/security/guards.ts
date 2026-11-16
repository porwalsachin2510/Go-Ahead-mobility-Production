import 'server-only'
import { AuditLog, Counter, Idempotency, RateLimit } from '../models/identity'
import { tooMany } from '../http'

/** Fixed-window rate limiter persisted in MongoDB (works across serverless instances). */
export async function rateLimit(key: string, limit: number, windowSeconds: number) {
  const bucket = Math.floor(Date.now() / 1000 / windowSeconds)
  const doc = await RateLimit.findOneAndUpdate(
    { key: `${key}:${bucket}` },
    { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((bucket + 1) * windowSeconds * 1000 + 60_000) } },
    { upsert: true, returnDocument: 'after' },
  ).lean()
  if ((doc?.count ?? 0) > limit) throw tooMany()
}

export async function nextSequence(name: string): Promise<number> {
  const doc = await Counter.findOneAndUpdate({ _id: name }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: 'after' }).lean()
  return doc!.seq
}

export async function getIdempotent<T>(key: string | null): Promise<T | null> {
  if (!key) return null
  const doc = await Idempotency.findOne({ key }).lean()
  return (doc?.response as T) ?? null
}

export async function saveIdempotent(key: string | null, response: unknown) {
  if (!key) return
  await Idempotency.updateOne({ key }, { $setOnInsert: { response, expiresAt: new Date(Date.now() + 24 * 3600 * 1000) } }, { upsert: true })
}

export type AuditInput = {
  actor?: { id: string; email: string } | null
  action: string
  entityType: string
  entityId?: string
  summary?: string
  diff?: unknown
  outcome?: 'success' | 'denied' | 'failure'
  ip?: string
  userAgent?: string
}

const SECRET_KEYS = /password|secret|token|hash/i

function scrub(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.slice(0, 50).map(scrub)
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = SECRET_KEYS.test(k) ? '[redacted]' : typeof v === 'string' && v.length > 500 ? `${v.slice(0, 500)}…` : scrub(v)
  }
  return out
}

export async function audit(input: AuditInput) {
  try {
    await AuditLog.create({
      actorId: input.actor?.id ?? null,
      actorEmail: input.actor?.email ?? 'system',
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      summary: input.summary,
      diff: input.diff ? scrub(input.diff) : null,
      outcome: input.outcome ?? 'success',
      ip: input.ip,
      userAgent: input.userAgent?.slice(0, 200),
    })
  } catch (error) {
    console.error('[audit] failed to write audit log', error)
  }
}

export function diffFields(before: Record<string, unknown>, after: Record<string, unknown>) {
  const changes: Record<string, { from: unknown; to: unknown }> = {}
  for (const key of Object.keys(after)) {
    const a = JSON.stringify(before?.[key] ?? null)
    const b = JSON.stringify(after[key] ?? null)
    if (a !== b) changes[key] = { from: before?.[key] ?? null, to: after[key] }
  }
  return changes
}
