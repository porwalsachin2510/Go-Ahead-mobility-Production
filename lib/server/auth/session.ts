import 'server-only'
import { cache } from 'react'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { connectDb } from '../db'
import { Session, User } from '../models/identity'
import { randomToken, sha256 } from '../security/crypto'
import { forbidden, unauthorized } from '../http'
import { can, type Permission, type RoleKey } from '@/lib/rbac'

export const SESSION_COOKIE = 'ga_admin_session'
const SESSION_TTL_MS = 12 * 60 * 60 * 1000
const IDLE_TIMEOUT_MS = 2 * 60 * 60 * 1000

export type SessionUser = {
  id: string
  name: string
  email: string
  role: RoleKey
  verticalScope: string[]
  team: string
  sessionId: string
}

function cookieOptions(expires: Date) {
  // The v0 preview renders inside a cross-site iframe, so development cookies need SameSite=None.
  const isProd = process.env.NODE_ENV === 'production'
  return {
    httpOnly: true,
    secure: true,
    sameSite: isProd ? ('lax' as const) : ('none' as const),
    path: '/',
    expires,
  }
}

export async function createSession(userId: string) {
  const token = randomToken(32)
  const h = await headers()
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)
  await Session.create({
    tokenHash: sha256(token),
    userId,
    ip: (h.get('x-forwarded-for') || '').split(',')[0],
    userAgent: (h.get('user-agent') || '').slice(0, 200),
    expiresAt,
  })
  const jar = await cookies()
  jar.set(SESSION_COOKIE, token, cookieOptions(expiresAt))
}

export async function destroySession() {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  if (token) {
    await connectDb()
    await Session.deleteOne({ tokenHash: sha256(token) })
  }
  jar.set(SESSION_COOKIE, '', { ...cookieOptions(new Date(0)), maxAge: 0 })
}

export async function revokeUserSessions(userId: string, exceptSessionId?: string) {
  await Session.deleteMany({ userId, ...(exceptSessionId ? { _id: { $ne: exceptSessionId } } : {}) })
}

/** Resolves the current admin session (memoised per request). Returns null when absent/invalid. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  if (!token) return null
  await connectDb()
  const session = await Session.findOne({ tokenHash: sha256(token), expiresAt: { $gt: new Date() } }).lean()
  if (!session) return null
  if (Date.now() - new Date(session.lastSeenAt).getTime() > IDLE_TIMEOUT_MS) {
    await Session.deleteOne({ _id: session._id })
    return null
  }
  const user = await User.findById(session.userId).lean()
  if (!user || user.status !== 'active') return null
  if (Date.now() - new Date(session.lastSeenAt).getTime() > 60_000) {
    await Session.updateOne({ _id: session._id }, { $set: { lastSeenAt: new Date() } })
  }
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role as RoleKey,
    verticalScope: (user.verticalScope as string[]) ?? [],
    team: user.team ?? '',
    sessionId: String(session._id),
  }
})

/** For API route handlers. Throws ApiError on failure. */
export async function requireApiUser(permission?: Permission): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) throw unauthorized()
  if (permission && !can(user.role, permission)) throw forbidden()
  return user
}

/** For server components/pages under /admin. Redirects instead of throwing. */
export async function requirePageUser(permission?: Permission): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) redirect('/admin/login')
  if (permission && !can(user.role, permission)) redirect('/admin?denied=1')
  return user
}
