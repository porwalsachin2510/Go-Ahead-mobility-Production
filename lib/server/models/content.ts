import 'server-only'
import mongoose, { Schema, type Model } from 'mongoose'

function model<T>(name: string, schema: Schema): Model<T> {
  return (mongoose.models[name] as Model<T>) ?? mongoose.model<T>(name, schema)
}

export const PUBLICATION_STATES = ['draft', 'in_review', 'approved', 'scheduled', 'published', 'unpublished', 'archived'] as const
export const POST_STATES = ['idea', 'brief', 'draft', 'editorial_review', 'changes_requested', 'seo_review', 'approved', 'scheduled', 'published', 'update_needed', 'archived'] as const

export const seoSchema = new Schema(
  {
    title: { type: String, default: '', maxlength: 200 },
    description: { type: String, default: '', maxlength: 400 },
    canonical: { type: String, default: '' },
    noindex: { type: Boolean, default: false },
    nofollow: { type: Boolean, default: false },
    ogTitle: { type: String, default: '' },
    ogDescription: { type: String, default: '' },
    ogImage: { type: String, default: '' },
    focusKeyword: { type: String, default: '', maxlength: 120 },
    keywords: { type: [String], default: [] },
    faq: { type: [new Schema({ question: { type: String, maxlength: 300 }, answer: { type: String, maxlength: 2000 } }, { _id: false })], default: [] },
    schemaJson: { type: String, default: '', maxlength: 10000 },
  },
  { _id: false },
)

const blockSchema = new Schema(
  {
    id: { type: String, required: true },
    type: { type: String, required: true },
    hidden: { type: Boolean, default: false },
    data: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false },
)

const pageContentSchema = new Schema(
  {
    title: { type: String, required: true, maxlength: 200 },
    blocks: { type: [blockSchema], default: [] },
    seo: { type: seoSchema, default: () => ({}) },
  },
  { _id: false },
)

export const PAGE_TYPES = ['home', 'vertical', 'service', 'industry', 'company', 'location', 'case_study', 'resource', 'faq', 'landing', 'legal'] as const

const pageSchema = new Schema(
  {
    path: { type: String, required: true, unique: true, trim: true },
    pageType: { type: String, enum: PAGE_TYPES, default: 'landing' },
    parentPath: { type: String, default: '' },
    draft: { type: pageContentSchema, required: true },
    published: { type: pageContentSchema, default: null },
    state: { type: String, enum: PUBLICATION_STATES, default: 'draft' },
    publishAt: { type: Date, default: null },
    expireAt: { type: Date, default: null },
    publishedAt: { type: Date, default: null },
    revision: { type: Number, default: 1 },
    searchText: { type: String, default: '' },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reviewerId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    updatedById: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reviewNote: { type: String, default: '' },
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: true },
)
pageSchema.index({ state: 1, publishAt: 1 })
pageSchema.index({ searchText: 'text', 'published.title': 'text' }, { weights: { 'published.title': 5, searchText: 1 }, name: 'page_text' })

const pageVersionSchema = new Schema(
  {
    pageId: { type: Schema.Types.ObjectId, ref: 'Page', required: true },
    versionNumber: { type: Number, required: true },
    snapshot: { type: pageContentSchema, required: true },
    kind: { type: String, enum: ['save', 'publish', 'restore'], default: 'save' },
    changeNote: { type: String, default: '' },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    restoredFromVersion: { type: Number, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)
pageVersionSchema.index({ pageId: 1, versionNumber: -1 }, { unique: true })

const navItemSchema = new Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true, maxlength: 80 },
    href: { type: String, default: '' },
    description: { type: String, default: '', maxlength: 160 },
    newTab: { type: Boolean, default: false },
    visible: { type: Boolean, default: true },
    device: { type: String, enum: ['all', 'desktop', 'mobile'], default: 'all' },
    children: { type: [Schema.Types.Mixed], default: [] },
  },
  { _id: false },
)

const navigationSchema = new Schema(
  {
    menuKey: { type: String, enum: ['primary', 'footer', 'utility', 'legal'], required: true, unique: true },
    items: { type: [navItemSchema], default: [] },
    updatedById: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
)

const settingsSchema = new Schema(
  {
    key: { type: String, default: 'site', unique: true },
    brandName: { type: String, default: 'GoAhead Mobility' },
    tagline: { type: String, default: '' },
    siteUrl: { type: String, default: '' },
    contact: {
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      address: { type: String, default: '' },
      hours: { type: String, default: '' },
      mapUrl: { type: String, default: '' },
      accommodationEmail: { type: String, default: '' },
      transportEmail: { type: String, default: '' },
      careersEmail: { type: String, default: '' },
    },
    social: {
      linkedin: { type: String, default: '' },
      x: { type: String, default: '' },
      instagram: { type: String, default: '' },
      youtube: { type: String, default: '' },
      facebook: { type: String, default: '' },
    },
    header: {
      primaryCtaLabel: { type: String, default: 'Request a Proposal' },
      primaryCtaHref: { type: String, default: '/contact' },
    },
    footer: {
      blurb: { type: String, default: '' },
      newsletterHeading: { type: String, default: '' },
      newsletterCopy: { type: String, default: '' },
    },
    seo: {
      defaultTitle: { type: String, default: 'GoAhead Mobility' },
      titleTemplate: { type: String, default: '%s | GoAhead Mobility' },
      defaultDescription: { type: String, default: '' },
      ogImage: { type: String, default: '/og-default.png' },
      robotsMode: { type: String, enum: ['allow', 'disallow_all'], default: 'allow' },
      extraDisallow: { type: [String], default: [] },
      templates: { type: Schema.Types.Mixed, default: () => ({}) },
      indexing: {
        minWords: { type: Number, default: 120 },
        requireDescription: { type: Boolean, default: false },
      },
      sitemap: {
        enabled: { type: Boolean, default: true },
        excludePaths: { type: [String], default: [] },
      },
      organization: {
        legalName: { type: String, default: '' },
        logo: { type: String, default: '/brand/goahead-logo.png' },
      },
      integrations: {
        searchConsoleSiteUrl: { type: String, default: '' },
        bingSiteUrl: { type: String, default: '' },
        ga4PropertyId: { type: String, default: '' },
      },
      verification: {
        google: { type: String, default: '' },
        bing: { type: String, default: '' },
        yandex: { type: String, default: '' },
        pinterest: { type: String, default: '' },
        baidu: { type: String, default: '' },
      },
      indexNow: {
        enabled: { type: Boolean, default: false },
        key: { type: String, default: '' },
        lastSubmittedAt: { type: Date, default: null },
        lastStatus: { type: String, default: '' },
      },
      llms: {
        enabled: { type: Boolean, default: true },
        intro: { type: String, default: '' },
      },
      imageSitemap: { type: Boolean, default: true },
    },
    notifications: {
      salesInbox: { type: String, default: '' },
      hrInbox: { type: String, default: '' },
      senderName: { type: String, default: 'GoAhead Mobility' },
      acknowledgementCopy: { type: String, default: '' },
    },
    locale: { type: String, default: 'en' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    verticals: {
      accommodation: { type: Boolean, default: true },
      transport: { type: Boolean, default: true },
    },
    maintenanceNotice: { type: String, default: '' },
    features: {
      portal: { type: Boolean, default: false },
      comments: { type: Boolean, default: false },
    },
    analytics: { gaMeasurementId: { type: String, default: '' } },
    updatedById: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
)

const mediaSchema = new Schema(
  {
    provider: { type: String, enum: ['gridfs', 'cloudinary'], required: true },
    providerAssetId: { type: String, required: true },
    url: { type: String, default: '' },
    filename: { type: String, required: true },
    originalName: { type: String, default: '' },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    width: Number,
    height: Number,
    assetType: { type: String, enum: ['image', 'document', 'video'], required: true },
    altText: { type: String, default: '' },
    caption: { type: String, default: '' },
    credit: { type: String, default: '' },
    licence: { type: String, default: '' },
    folder: { type: String, default: 'general' },
    tags: { type: [String], default: [] },
    focalPoint: { x: { type: Number, default: 0.5 }, y: { type: Number, default: 0.5 } },
    isPrivate: { type: Boolean, default: false },
    uploaderId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    downloadCount: { type: Number, default: 0 },
    variants: {
      type: [
        {
          _id: false,
          width: { type: Number, required: true },
          height: { type: Number, required: true },
          providerAssetId: { type: String, required: true },
          mimeType: { type: String, default: 'image/webp' },
          size: { type: Number, required: true },
        },
      ],
      default: [],
    },
  },
  { timestamps: true },
)
mediaSchema.index({ folder: 1, createdAt: -1 })
mediaSchema.index({ isPrivate: 1 })
mediaSchema.index({ originalName: 'text', altText: 'text', tags: 'text' })

const redirectSchema = new Schema(
  {
    sourcePath: { type: String, required: true, unique: true },
    targetUrl: { type: String, default: '' },
    statusCode: { type: Number, enum: [301, 302, 410], default: 301 },
    reason: { type: String, default: '' },
    enabled: { type: Boolean, default: true },
    hitCount: { type: Number, default: 0 },
    lastHitAt: { type: Date, default: null },
    createdById: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
)

export const Page = model<any>('Page', pageSchema)
export const PageVersion = model<any>('PageVersion', pageVersionSchema)
export const Navigation = model<any>('Navigation', navigationSchema)
export const SiteSettings = model<any>('SiteSettings', settingsSchema)
export const MediaAsset = model<any>('MediaAsset', mediaSchema)
export const Redirect = model<any>('Redirect', redirectSchema)
