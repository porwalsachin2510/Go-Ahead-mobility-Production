import { z } from 'zod'
import { getAdminCredentials, upsertEnvAdmin } from '@/lib/server/auth/admin-account'
import { createSession } from '@/lib/server/auth/session'
import { ApiError, clientIp, handler, ok, readJson, tooMany } from '@/lib/server/http'
import { User } from '@/lib/server/models/identity'
import { verifyPassword } from '@/lib/server/security/crypto'
import { audit, rateLimit } from '@/lib/server/security/guards'

const schema = z.object({ email: z.string().trim().email().max(254), password: z.string().min(1).max(200) })
const MAX_FAILED = 5
const LOCK_MS = 15 * 60 * 1000

export const POST = handler(async (req) => {
  const ip = clientIp(req)
  const { email, password } = schema.parse(await readJson(req))
  await rateLimit(`login:${ip}`, 10, 300)

  const normalized = email.toLowerCase()
  // First sign-in on a fresh database: provision the env-configured super admin.
  if (normalized === getAdminCredentials()?.email && !(await User.exists({ emailNormalized: normalized }))) {
    await upsertEnvAdmin({ resetPassword: false })
  }
  const user = await User.findOne({ emailNormalized: normalized }).select('+passwordHash')
  const invalid = new ApiError(401, 'invalid_credentials', 'Email or password is incorrect.')

  if (!user) {
    await verifyPassword(password, null)
    await audit({ action: 'login', entityType: 'auth', summary: 'Failed login for unknown account', outcome: 'failure', ip })
    throw invalid
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new ApiError(423, 'locked', 'Too many failed attempts. Try again in 15 minutes.')
  }
  if (user.status !== 'active') throw new ApiError(403, 'inactive', 'This account is not active. Contact your administrator.')

  if (!(await verifyPassword(password, user.passwordHash))) {
    user.failedLogins = (user.failedLogins ?? 0) + 1
    if (user.failedLogins >= MAX_FAILED) {
      user.lockedUntil = new Date(Date.now() + LOCK_MS)
      user.failedLogins = 0
    }
    await user.save()
    await audit({ actor: { id: String(user._id), email: user.email }, action: 'login', entityType: 'auth', outcome: 'failure', ip })
    throw invalid
  }

  user.failedLogins = 0
  user.lockedUntil = null
  user.lastLoginAt = new Date()
  await user.save()
  await createSession(String(user._id))
  await audit({ actor: { id: String(user._id), email: user.email }, action: 'login', entityType: 'auth', ip, userAgent: req.headers.get('user-agent') ?? '' })
  return ok({ signedIn: true })
})
