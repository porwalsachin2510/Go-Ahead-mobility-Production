import 'server-only'
import mongoose, { Schema, type Model } from 'mongoose'
import { LEAD_STATUSES, LEAD_TYPES } from '@/lib/leads'

function model<T>(name: string, schema: Schema): Model<T> {
  return (mongoose.models[name] as Model<T>) ?? mongoose.model<T>(name, schema)
}

const attributionSchema = new Schema(
  {
    landingPage: String,
    referrer: String,
    utmSource: String,
    utmMedium: String,
    utmCampaign: String,
    utmContent: String,
    utmTerm: String,
    gclid: String,
    submittedFrom: String,
  },
  { _id: false },
)

const consentSchema = new Schema(
  {
    privacyAccepted: { type: Boolean, required: true },
    privacyNoticeVersion: { type: String, default: 'v1' },
    marketing: { type: Boolean, default: false },
    consentedAt: { type: Date, required: true },
  },
  { _id: false },
)

const leadSchema = new Schema(
  {
    publicReference: { type: String, required: true, unique: true },
    type: { type: String, enum: LEAD_TYPES, required: true },
    vertical: { type: String, enum: ['accommodation', 'transport', 'general'], required: true },
    serviceType: { type: String, default: '' },
    contact: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      emailNormalized: { type: String, required: true },
      phone: { type: String, default: '' },
      company: { type: String, default: '' },
      jobTitle: { type: String, default: '' },
      preferredContact: { type: String, default: '' },
      country: { type: String, default: '' },
    },
    city: { type: String, default: '' },
    requirement: { type: Schema.Types.Mixed, default: {} },
    fileIds: [{ type: Schema.Types.ObjectId, ref: 'MediaAsset' }],
    status: { type: String, enum: LEAD_STATUSES, default: 'new' },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    team: { type: String, default: '' },
    priority: { type: String, enum: ['low', 'normal', 'high'], default: 'normal' },
    qualification: {
      scope: String,
      scale: String,
      timeline: String,
      budgetIndicator: String,
      notes: String,
      disqualifyReason: String,
    },
    proposal: {
      reference: String,
      sentAt: Date,
      valueRange: String,
      expectedDecisionAt: Date,
    },
    outcome: { result: String, lossReason: String, reactivateAt: Date },
    firstContactAt: { type: Date, default: null },
    firstContactMethod: { type: String, default: '' },
    nextFollowUpAt: { type: Date, default: null },
    lastActivityAt: { type: Date, default: Date.now },
    attribution: { type: attributionSchema, default: () => ({}) },
    consent: { type: consentSchema, required: true },
    formVersion: { type: String, default: 'v1' },
    timezone: { type: String, default: '' },
    retentionAt: { type: Date, default: null },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true },
)
leadSchema.index({ status: 1, createdAt: -1 })
leadSchema.index({ vertical: 1, createdAt: -1 })
leadSchema.index({ ownerId: 1, status: 1 })
leadSchema.index({ 'contact.emailNormalized': 1 })
leadSchema.index({ nextFollowUpAt: 1 })
leadSchema.index({ 'contact.name': 'text', 'contact.company': 'text', 'contact.email': 'text', publicReference: 'text', city: 'text' }, { name: 'lead_text' })

const leadActivitySchema = new Schema(
  {
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true },
    actionType: { type: String, enum: ['created', 'status_change', 'assignment', 'note', 'task_created', 'task_completed', 'contact_logged', 'email', 'export', 'update'], required: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    actorName: { type: String, default: 'System' },
    summary: { type: String, default: '' },
    body: { type: String, default: '' },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)
leadActivitySchema.index({ leadId: 1, createdAt: -1 })

const leadTaskSchema = new Schema(
  {
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true },
    title: { type: String, required: true, maxlength: 200 },
    dueAt: { type: Date, required: true },
    assigneeId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    completedAt: { type: Date, default: null },
    createdById: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
)
leadTaskSchema.index({ leadId: 1, dueAt: 1 })
leadTaskSchema.index({ assigneeId: 1, completedAt: 1, dueAt: 1 })

const routingRuleSchema = new Schema(
  {
    name: { type: String, required: true },
    vertical: { type: String, enum: ['accommodation', 'transport', 'general', 'any'], default: 'any' },
    serviceType: { type: String, default: '' },
    cityContains: { type: String, default: '' },
    utmCampaign: { type: String, default: '' },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    team: { type: String, default: '' },
    reminderHours: { type: Number, default: 24 },
    priority: { type: Number, default: 100 },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true },
)

const applicationSchema = new Schema(
  {
    publicReference: { type: String, required: true, unique: true },
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    jobTitle: String,
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: '' },
    portfolioUrl: { type: String, default: '' },
    coverNote: { type: String, default: '' },
    cvMediaId: { type: Schema.Types.ObjectId, ref: 'MediaAsset', required: true },
    linkedinUrl: { type: String, default: '' },
    currentLocation: { type: String, default: '' },
    noticePeriod: { type: String, default: '' },
    expectedSalary: { type: String, default: '' },
    answers: { type: [new Schema({ question: String, answer: String }, { _id: false })], default: [] },
    screeningPassed: { type: Boolean, default: true },
    source: {
      type: new Schema({ referrer: String, utmSource: String, utmMedium: String, utmCampaign: String, landingPage: String }, { _id: false }),
      default: () => ({}),
    },
    state: { type: String, enum: ['received', 'screening', 'interview', 'offer', 'hired', 'rejected', 'withdrawn'], default: 'received' },
    stateChangedAt: { type: Date, default: Date.now },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    tags: { type: [String], default: [] },
    notes: { type: String, default: '' },
    timeline: {
      type: [new Schema({ kind: String, text: String, byName: String, at: { type: Date, default: Date.now } }, { _id: false })],
      default: [],
    },
    consent: { type: consentSchema, required: true },
    retentionAt: { type: Date, required: true },
  },
  { timestamps: true },
)
applicationSchema.index({ jobId: 1, state: 1, createdAt: -1 })
applicationSchema.index({ state: 1, createdAt: -1 })
applicationSchema.index({ email: 1, jobId: 1 })
applicationSchema.index({ retentionAt: 1 })

const subscriberSchema = new Schema(
  {
    email: { type: String, required: true },
    emailNormalized: { type: String, required: true, unique: true },
    status: { type: String, enum: ['pending', 'confirmed', 'unsubscribed', 'suppressed'], default: 'pending' },
    source: { type: String, default: '' },
    consentText: { type: String, default: '' },
    consentVersion: { type: String, default: 'v1' },
    consentedAt: { type: Date, required: true },
    confirmedAt: { type: Date, default: null },
    unsubscribedAt: { type: Date, default: null },
    unsubscribeTokenHash: { type: String, default: '' },
  },
  { timestamps: true },
)

const consentEventSchema = new Schema(
  {
    subjectType: { type: String, enum: ['subscriber', 'lead', 'application', 'visitor'], required: true },
    subjectId: { type: String, required: true },
    event: { type: String, required: true },
    text: { type: String, default: '' },
    version: { type: String, default: 'v1' },
    source: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

const emailTemplateSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    subject: { type: String, required: true },
    preheader: { type: String, default: '', maxlength: 200 },
    body: { type: String, required: true },
    allowedVariables: { type: [String], default: [] },
    version: { type: Number, default: 1 },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true },
)

const emailLogSchema = new Schema(
  {
    templateSlug: { type: String, required: true },
    to: { type: String, required: true, select: false },
    toMasked: { type: String, required: true },
    subject: { type: String, required: true },
    html: { type: String, required: true, select: false },
    text: { type: String, default: '', select: false },
    status: { type: String, enum: ['queued', 'sending', 'sent', 'failed', 'dead', 'not_configured'], default: 'queued' },
    attempts: { type: Number, default: 0 },
    nextAttemptAt: { type: Date, default: Date.now },
    lastError: { type: String, default: '' },
    providerMessageId: { type: String, default: '' },
    relatedType: { type: String, default: '' },
    relatedId: { type: String, default: '' },
    sentAt: { type: Date, default: null },
  },
  { timestamps: true },
)
emailLogSchema.index({ status: 1, nextAttemptAt: 1 })
emailLogSchema.index({ createdAt: -1 })
emailLogSchema.index({ relatedType: 1, relatedId: 1 })

const notificationSchema = new Schema(
  {
    kind: { type: String, enum: ['lead', 'application', 'subscriber'], required: true },
    title: { type: String, required: true, maxlength: 200 },
    body: { type: String, maxlength: 500 },
    href: { type: String, maxlength: 300 },
    subjectId: String,
    leadType: String,
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    team: { type: String, default: '' },
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true },
)
notificationSchema.index({ createdAt: -1 })
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 3600, name: 'notification_ttl' })

export const Notification = model<any>('Notification', notificationSchema)
export const Lead = model<any>('Lead', leadSchema)
export const LeadActivity = model<any>('LeadActivity', leadActivitySchema)
export const LeadTask = model<any>('LeadTask', leadTaskSchema)
export const RoutingRule = model<any>('RoutingRule', routingRuleSchema)
export const Application = model<any>('Application', applicationSchema)
export const Subscriber = model<any>('Subscriber', subscriberSchema)
export const ConsentEvent = model<any>('ConsentEvent', consentEventSchema)
export const EmailTemplate = model<any>('EmailTemplate', emailTemplateSchema)
export const EmailLog = model<any>('EmailLog', emailLogSchema)
