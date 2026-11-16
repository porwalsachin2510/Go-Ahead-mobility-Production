import { requireApiUser } from '@/lib/server/auth/session'
import { badRequest, escapeRegex, handler, ok, pagination } from '@/lib/server/http'
import { MediaAsset } from '@/lib/server/models/content'
import { audit } from '@/lib/server/security/guards'
import { storeUpload } from '@/lib/server/services/media'

export const GET = handler(async (req) => {
  await requireApiUser('media.write')
  const sp = req.nextUrl.searchParams
  const { skip, limit, page } = pagination(sp, { limit: 40, max: 100 })
  const filter: Record<string, unknown> = { isPrivate: false }
  const q = sp.get('q')?.trim().slice(0, 80)
  if (q) filter.originalName = { $regex: escapeRegex(q), $options: 'i' }
  const [items, total] = await Promise.all([
    MediaAsset.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    MediaAsset.countDocuments(filter),
  ])
  return ok({ items: JSON.parse(JSON.stringify(items)), total, page, limit })
})

export const POST = handler(async (req) => {
  const user = await requireApiUser('media.write')
  const form = await req.formData().catch(() => null)
  if (!form) throw badRequest('Expected a multipart upload')
  const file = form.get('file')
  if (!(file instanceof File)) throw badRequest('No file provided', { file: 'Choose a file' })
  const altText = String(form.get('altText') ?? '').slice(0, 200)
  const asset = await storeUpload(file, { allow: ['image', 'document'], isPrivate: false, folder: 'library', uploaderId: user.id, altText })
  await audit({ actor: user, action: 'upload', entityType: 'media', entityId: String(asset._id), summary: `Uploaded ${asset.originalName}` })
  return ok(JSON.parse(JSON.stringify(asset.toObject())), { status: 201 })
})
