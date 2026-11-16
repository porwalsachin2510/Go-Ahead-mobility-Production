import 'server-only'
import mongoose, { Schema, type Model } from 'mongoose'
import { seoSchema } from './content'

function model<T>(name: string, schema: Schema): Model<T> {
  return (mongoose.models[name] as Model<T>) ?? mongoose.model<T>(name, schema)
}

const issueSchema = new Schema(
  {
    code: String,
    severity: String,
    title: String,
    path: String,
    entityKey: String,
    evidence: String,
    fix: String,
    verification: String,
  },
  { _id: false },
)

/** A saved snapshot of the audit so score history and regressions can be tracked over time. */
const auditRunSchema = new Schema(
  {
    score: { type: Number, required: true },
    pageCount: { type: Number, default: 0 },
    indexableCount: { type: Number, default: 0 },
    counts: { type: Schema.Types.Mixed, default: {} },
    issues: { type: [issueSchema], default: [] },
    triggeredById: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    trigger: { type: String, enum: ['manual', 'publish', 'schedule'], default: 'manual' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)
auditRunSchema.index({ createdAt: -1 })

/** Editors can acknowledge an issue as intentional. Resurfaces automatically if the evidence changes. */
const issueStateSchema = new Schema(
  {
    entityKey: { type: String, required: true },
    code: { type: String, required: true },
    evidenceHash: { type: String, default: '' },
    status: { type: String, enum: ['ignored', 'fixed'], default: 'ignored' },
    reason: { type: String, default: '', maxlength: 400 },
    byId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
)
issueStateSchema.index({ entityKey: 1, code: 1 }, { unique: true })

/** Real-user Core Web Vitals reported by visitors' browsers. Expires after 45 days. */
const webVitalSchema = new Schema(
  {
    name: { type: String, enum: ['LCP', 'INP', 'CLS', 'FCP', 'TTFB'], required: true },
    value: { type: Number, required: true },
    rating: { type: String, enum: ['good', 'needs-improvement', 'poor'], required: true },
    path: { type: String, required: true },
    device: { type: String, enum: ['mobile', 'desktop'], default: 'desktop' },
    createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 45 },
  },
  { versionKey: false },
)
webVitalSchema.index({ path: 1, name: 1, createdAt: -1 })

/** Internal 404s recorded from real requests, so editors can add redirects for URLs people actually hit. */
const notFoundSchema = new Schema(
  {
    path: { type: String, required: true, unique: true },
    hits: { type: Number, default: 1 },
    lastReferrer: { type: String, default: '' },
    lastSeenAt: { type: Date, default: Date.now },
    resolved: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)
notFoundSchema.index({ hits: -1 })


const routeSeoSchema = new Schema(
  {
    path: { type: String, required: true, unique: true, maxlength: 160 },
    seo: { type: seoSchema, default: () => ({}) },
    updatedById: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
)

export const SeoAuditRun = model<any>('SeoAuditRun', auditRunSchema)
export const SeoIssueState = model<any>('SeoIssueState', issueStateSchema)
export const WebVital = model<any>('WebVital', webVitalSchema)
export const NotFoundLog = model<any>('NotFoundLog', notFoundSchema)
export const RouteSeo = model<any>('RouteSeo', routeSeoSchema)
