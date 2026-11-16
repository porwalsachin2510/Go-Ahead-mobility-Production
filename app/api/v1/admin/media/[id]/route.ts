import { z } from 'zod'
import { requireApiUser } from '@/lib/server/auth/session'
import { connectDb, isValidObjectId } from '@/lib/server/db'
import { ApiError, badRequest, handler, notFound, ok } from '@/lib/server/http'
import { MediaAsset } from '@/lib/server/models/content'
import { audit } from '@/lib/server/security/guards'
import { deleteMedia, findMediaUsage, regenerateVariants } from '@/lib/server/services/media'

type Ctx = { params: Promise<{ id: string }> }

async function loadAsset(id: string) {
  if (!isValidObjectId(id)) throw notFound('File')
  await connectDb()
  const asset = await MediaAsset.findById(id).lean<any>()
  if (!asset) throw notFound('File')
  return asset
}

export const GET = handler(async (_req, ctx: Ctx) => {
  await requireApiUser('media.write')
  const { id } = await ctx.params
  const asset = await loadAsset(id)
  const usage = await findMediaUsage(id)
  return ok({ asset: JSON.parse(JSON.stringify(asset)), usage })
})

const patchSchema = z.object({
  altText: z.string().max(200).optional(),
  caption: z.string().max(500).optional(),
  credit: z.string().max(200).optional(),
  regenerate: z.boolean().optional(),
})

export const PATCH = handler(async (req, ctx: Ctx) => {
  const user = await requireApiUser('media.write')
  const { id } = await ctx.params
  await loadAsset(id)
  const parsed = patchSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) throw badRequest('Invalid media update')
  const { regenerate, ...fields } = parsed.data
  if (Object.keys(fields).length) await MediaAsset.updateOne({ _id: id }, { $set: fields })
  if (regenerate) await regenerateVariants(id)
  await audit({ actor: user, action: 'update', entityType: 'media', entityId: id, summary: regenerate ? 'Regenerated responsive versions' : 'Updated media details' })
  return ok(JSON.parse(JSON.stringify(await MediaAsset.findById(id).lean())))
})

export const DELETE = handler(async (req, ctx: Ctx) => {
  const user = await requireApiUser('media.write')
  const { id } = await ctx.params
  const asset = await loadAsset(id)
  const force = req.nextUrl.searchParams.get('force') === 'true'
  const usage = await findMediaUsage(id)
  if (usage.length && !force) {
    throw new ApiError(409, 'media_in_use', `This file is used in ${usage.length} place${usage.length === 1 ? '' : 's'}. Replace those references first or delete anyway.`, { usage } as any)
  }
  await deleteMedia(id)
  await audit({ actor: user, action: 'delete', entityType: 'media', entityId: id, summary: `Deleted ${asset.originalName}${usage.length ? ` (forced, ${usage.length} references)` : ''}` })
  return ok({ deleted: true, brokenReferences: usage.length })
})
