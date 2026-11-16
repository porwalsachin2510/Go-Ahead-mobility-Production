import { User } from '../models/identity'
import { hashPassword } from '../security/crypto'

export type AdminCredentials = { name: string; email: string; password: string }

/** Admin account details come only from env (ADMIN_NAME / ADMIN_EMAIL / ADMIN_PASSWORD). */
export function getAdminCredentials(): AdminCredentials | null {
  const email = (process.env.ADMIN_EMAIL ?? '').trim().toLowerCase()
  const password = (process.env.ADMIN_PASSWORD ?? '').trim()
  if (!email || !password) return null
  return { name: (process.env.ADMIN_NAME ?? '').trim() || 'Super Admin', email, password }
}

/**
 * Creates the env-configured super admin, or resets it to the env password.
 * `resetPassword` is used by the seed so the configured password is always the one that works.
 */
export async function upsertEnvAdmin(opts: { resetPassword: boolean }) {
  const creds = getAdminCredentials()
  if (!creds) return null
  const existing = await User.findOne({ emailNormalized: creds.email })
  if (!existing) {
    return User.create({
      name: creds.name,
      email: creds.email,
      emailNormalized: creds.email,
      role: 'super_admin',
      status: 'active',
      passwordHash: await hashPassword(creds.password),
      isProtected: true,
      passwordChangedAt: new Date(),
    })
  }
  if (opts.resetPassword) {
    existing.set({
      name: creds.name,
      role: 'super_admin',
      status: 'active',
      passwordHash: await hashPassword(creds.password),
      passwordChangedAt: new Date(),
      failedLogins: 0,
      lockedUntil: null,
      'mfa.enabled': false,
    })
    await existing.save()
  }
  return existing
}
