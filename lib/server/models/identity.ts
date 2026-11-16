import 'server-only'
import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose'
import { ROLE_KEYS } from '@/lib/rbac'

function model<T>(name: string, schema: Schema): Model<T> {
  return (mongoose.models[name] as Model<T>) ?? mongoose.model<T>(name, schema)
}

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, maxlength: 254 },
    emailNormalized: { type: String, required: true, unique: true, lowercase: true },
    role: { type: String, enum: ROLE_KEYS, required: true },
    verticalScope: { type: [String], enum: ['accommodation', 'transport', 'general'], default: [] },
    team: { type: String, default: '' },
    status: { type: String, enum: ['active', 'suspended', 'invited'], default: 'invited' },
    passwordHash: { type: String, select: false },
    mfa: {
      enabled: { type: Boolean, default: false },
      secret: { type: String, select: false },
      pendingSecret: { type: String, select: false },
    },
    failedLogins: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
    passwordChangedAt: { type: Date, default: null },
    isProtected: { type: Boolean, default: false },
  },
  { timestamps: true },
)
userSchema.index({ role: 1, status: 1 })

const sessionSchema = new Schema(
  {
    tokenHash: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    mfaVerified: { type: Boolean, default: false },
    ip: String,
    userAgent: String,
    expiresAt: { type: Date, required: true },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
)
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

const tokenSchema = new Schema(
  {
    purpose: { type: String, enum: ['password_reset', 'account_setup', 'preview', 'newsletter_confirm', 'resource_download'], required: true },
    tokenHash: { type: String, required: true, unique: true },
    subjectId: { type: String, required: true },
    meta: { type: Schema.Types.Mixed, default: {} },
    usedAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
)
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

const auditSchema = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    actorEmail: String,
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: String,
    summary: String,
    diff: { type: Schema.Types.Mixed, default: null },
    outcome: { type: String, enum: ['success', 'denied', 'failure'], default: 'success' },
    ip: String,
    userAgent: String,
    correlationId: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)
auditSchema.index({ createdAt: -1 })
auditSchema.index({ entityType: 1, entityId: 1, createdAt: -1 })
auditSchema.index({ actorId: 1, createdAt: -1 })
// Audit log is append-only: block updates/deletes through the model.
for (const op of ['updateOne', 'updateMany', 'findOneAndUpdate', 'deleteOne', 'deleteMany', 'findOneAndDelete'] as const) {
  auditSchema.pre(op, function () {
    throw new Error('Audit log entries are immutable')
  })
}

const rateLimitSchema = new Schema({
  key: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
})
rateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

const counterSchema = new Schema({ _id: String, seq: { type: Number, default: 0 } })

const idempotencySchema = new Schema({
  key: { type: String, required: true, unique: true },
  response: Schema.Types.Mixed,
  expiresAt: { type: Date, required: true },
})
idempotencySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export type UserDoc = InferSchemaType<typeof userSchema> & { _id: mongoose.Types.ObjectId }
export const User = model<UserDoc>('User', userSchema)
export const Session = model<InferSchemaType<typeof sessionSchema>>('Session', sessionSchema)
export const Token = model<InferSchemaType<typeof tokenSchema>>('Token', tokenSchema)
export const AuditLog = model<InferSchemaType<typeof auditSchema>>('AuditLog', auditSchema)
export const RateLimit = model<InferSchemaType<typeof rateLimitSchema>>('RateLimit', rateLimitSchema)
export const Counter = model<{ _id: string; seq: number }>('Counter', counterSchema)
export const Idempotency = model<InferSchemaType<typeof idempotencySchema>>('Idempotency', idempotencySchema)
