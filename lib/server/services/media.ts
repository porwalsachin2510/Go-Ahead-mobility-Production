import 'server-only'
import mongoose from 'mongoose'
import { Readable } from 'node:stream'
import { connectDb, isValidObjectId } from '../db'
import { MediaAsset } from '../models/content'
import { ApiError, badRequest } from '../http'

/**
 * Media is stored in MongoDB GridFS so uploads persist with no extra provider.
 * The `provider` field on MediaAsset keeps a seam for moving to Cloudinary/S3 later.
 */
const BUCKET = 'media'

type Kind = 'image' | 'document'
const SIGNATURES: { mime: string; ext: string; kind: Kind; test: (b: Buffer) => boolean }[] = [
  { mime: 'image/png', ext: 'png', kind: 'image', test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { mime: 'image/jpeg', ext: 'jpg', kind: 'image', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: 'image/webp', ext: 'webp', kind: 'image', test: (b) => b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP' },
  { mime: 'application/pdf', ext: 'pdf', kind: 'document', test: (b) => b.subarray(0, 5).toString() === '%PDF-' },
  // DOCX is a ZIP container; accept only with the matching extension.
  { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', ext: 'docx', kind: 'document', test: (b) => b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04 },
]

export const LIMITS = { image: 5 * 1024 * 1024, document: 10 * 1024 * 1024 }

function bucket() {
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db!, { bucketName: BUCKET })
}

function sniff(buf: Buffer, name: string) {
  const ext = name.toLowerCase().split('.').pop() ?? ''
  const match = SIGNATURES.find((s) => s.test(buf) && (s.ext === ext || (s.ext === 'jpg' && ext === 'jpeg') || s.kind === 'image'))
  if (!match) return null
  if (match.ext === 'docx' && ext !== 'docx') return null
  return match
}

function readImageSize(buf: Buffer, mime: string): { width?: number; height?: number } {
  try {
    if (mime === 'image/png') return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
    if (mime === 'image/webp' && buf.subarray(12, 16).toString() === 'VP8X') return { width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) }
    if (mime === 'image/jpeg') {
      let i = 2
      while (i < buf.length) {
        if (buf[i] !== 0xff) break
        const marker = buf[i + 1]
        const len = buf.readUInt16BE(i + 2)
        if (marker >= 0xc0 && marker <= 0xc3) return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) }
        i += 2 + len
      }
    }
  } catch {}
  return {}
}

export const VARIANT_WIDTHS = [480, 960, 1600] as const

function writeToBucket(id: mongoose.Types.ObjectId, name: string, contentType: string, buf: Buffer) {
  return new Promise<void>((resolve, reject) => {
    Readable.from(buf)
      .pipe(bucket().openUploadStreamWithId(id, name, { metadata: { contentType } }))
      .on('finish', () => resolve())
      .on('error', reject)
  })
}

/** Builds downscaled WebP versions; never upscales. Failures leave the original usable. */
async function buildVariants(buf: Buffer, baseName: string) {
  try {
    const sharp = (await import('sharp')).default
    const meta = await sharp(buf).metadata()
    const original = meta.width ?? 0
    const widths = VARIANT_WIDTHS.filter((w) => w < original)
    const out: { width: number; height: number; providerAssetId: string; mimeType: string; size: number }[] = []
    for (const width of widths) {
      const { data, info } = await sharp(buf).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer({ resolveWithObject: true })
      const vid = new mongoose.Types.ObjectId()
      await writeToBucket(vid, `${baseName.replace(/\.[^.]+$/, '')}-${width}w.webp`, 'image/webp', data)
      out.push({ width: info.width, height: info.height, providerAssetId: String(vid), mimeType: 'image/webp', size: data.length })
    }
    return out
  } catch (error) {
    console.error('Responsive image generation failed', error)
    return []
  }
}

/** Generates missing versions for an existing image (e.g. uploaded before variants existed). */
export async function regenerateVariants(mediaId: string) {
  await connectDb()
  const asset = await MediaAsset.findById(mediaId)
  if (!asset) return null
  if (asset.assetType !== 'image' || asset.isPrivate || asset.provider !== 'gridfs') throw badRequest('Only public images have responsive versions')
  const chunks: Buffer[] = []
  await new Promise<void>((resolve, reject) => {
    bucket()
      .openDownloadStream(new mongoose.Types.ObjectId(asset.providerAssetId))
      .on('data', (c: Buffer) => chunks.push(c))
      .on('end', () => resolve())
      .on('error', reject)
  })
  for (const v of asset.variants ?? []) await bucket().delete(new mongoose.Types.ObjectId(v.providerAssetId)).catch(() => {})
  asset.variants = await buildVariants(Buffer.concat(chunks), asset.filename)
  await asset.save()
  return asset
}

/** Picks the smallest stored version at least `width` wide, falling back to the original. */
export function pickVariant(asset: any, width: number | null) {
  if (!width || !asset.variants?.length) return null
  const sorted = [...asset.variants].sort((a, b) => a.width - b.width)
  if (asset.width && width >= asset.width) return null
  return sorted.find((v) => v.width >= width) ?? null
}

const SCAN_SKIP = /^(media\.|mediaassets$|auditlogs$|.*revisions$|.*versions$|.*autosaves$|.*reviews$|sessions$|accounts$|ratelimits$|system\.)/i
const SCAN_LIMIT = 5000

/**
 * Finds documents that reference a media asset by its id (in URLs or ObjectId fields).
 * History collections are skipped: they keep old references by design.
 */
export async function findMediaUsage(mediaId: string) {
  if (!isValidObjectId(mediaId)) return []
  await connectDb()
  const db = mongoose.connection.db!
  const collections = (await db.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name).filter((n) => !SCAN_SKIP.test(n))
  const needle = String(mediaId)
  const usages: { collection: string; id: string; label: string; status?: string }[] = []
  for (const name of collections) {
    const cursor = db.collection(name).find({}, { limit: SCAN_LIMIT })
    for await (const doc of cursor) {
      if (!JSON.stringify(doc).includes(needle)) continue
      usages.push({
        collection: name,
        id: String(doc._id),
        label: String(doc.title ?? doc.name ?? doc.label ?? doc.slug ?? doc.siteName ?? doc._id),
        status: doc.status ? String(doc.status) : undefined,
      })
      if (usages.length >= 50) return usages
    }
  }
  return usages
}

export async function storeUpload(
  file: File,
  opts: { allow: Kind[]; isPrivate: boolean; folder?: string; uploaderId?: string | null; altText?: string },
) {
  if (!file || typeof file.arrayBuffer !== 'function') throw badRequest('No file provided', { file: 'Choose a file' })
  if (file.size === 0) throw badRequest('The file is empty', { file: 'Empty file' })
  const buf = Buffer.from(await file.arrayBuffer())
  const sig = sniff(buf, file.name)
  if (!sig || !opts.allow.includes(sig.kind)) {
    throw badRequest('Unsupported file type', { file: `Allowed: ${opts.allow.includes('image') ? 'PNG, JPG, WEBP ' : ''}${opts.allow.includes('document') ? 'PDF, DOCX' : ''}`.trim() })
  }
  if (buf.length > LIMITS[sig.kind]) throw new ApiError(413, 'file_too_large', `File exceeds ${LIMITS[sig.kind] / 1024 / 1024} MB`, { file: 'Too large' })
  await connectDb()
  const safeName = file.name.replace(/[^\w.-]+/g, '_').slice(-120)
  const id = new mongoose.Types.ObjectId()
  await writeToBucket(id, safeName, sig.mime, buf)
  const variants = sig.kind === 'image' && !opts.isPrivate ? await buildVariants(buf, safeName) : []
  const asset = await MediaAsset.create({
    variants,
    provider: 'gridfs',
    providerAssetId: String(id),
    filename: safeName,
    originalName: file.name.slice(0, 200),
    mimeType: sig.mime,
    size: buf.length,
    ...(sig.kind === 'image' ? readImageSize(buf, sig.mime) : {}),
    assetType: sig.kind,
    altText: opts.altText ?? '',
    folder: opts.folder ?? 'general',
    isPrivate: opts.isPrivate,
    uploaderId: opts.uploaderId ?? null,
  })
  asset.url = opts.isPrivate ? '' : `/api/v1/media/${asset._id}`
  await asset.save()
  return asset
}

export async function openMediaStream(mediaId: string, width: number | null = null) {
  if (!isValidObjectId(mediaId)) return null
  await connectDb()
  const asset = await MediaAsset.findById(mediaId).lean<any>()
  if (!asset || asset.provider !== 'gridfs') return null
  const variant = asset.isPrivate ? null : pickVariant(asset, width)
  const stream = bucket().openDownloadStream(new mongoose.Types.ObjectId(variant ? variant.providerAssetId : asset.providerAssetId))
  return { asset, stream, mimeType: variant ? variant.mimeType : asset.mimeType, size: variant ? variant.size : asset.size }
}

export async function deleteMedia(mediaId: string) {
  const asset = await MediaAsset.findById(mediaId)
  if (!asset) return false
  if (asset.provider === 'gridfs') {
    await bucket().delete(new mongoose.Types.ObjectId(asset.providerAssetId)).catch(() => {})
    for (const v of asset.variants ?? []) await bucket().delete(new mongoose.Types.ObjectId(v.providerAssetId)).catch(() => {})
  }
  await asset.deleteOne()
  return true
}
