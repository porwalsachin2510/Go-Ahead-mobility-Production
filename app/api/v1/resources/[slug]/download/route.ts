import { NextResponse } from 'next/server'
import { connectDb } from '@/lib/server/db'
import { clientIp, errorResponse, forbidden, notFound } from '@/lib/server/http'
import { rateLimit } from '@/lib/server/security/guards'
import { Resource } from '@/lib/server/models/editorial'
import { MediaAsset } from '@/lib/server/models/content'

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    await rateLimit(`resource-download:${clientIp(req)}`, 30, 600)
    const { slug } = await params
    await connectDb()
    const resource = await Resource.findOne({ slug, status: 'published' }).lean<any>()
    if (!resource) throw notFound('Resource')
    if (resource.gated) throw forbidden()

    let destination = ''
    if (resource.fileMediaId) {
      const asset = await MediaAsset.findOne({ _id: resource.fileMediaId, isPrivate: false, assetType: 'document' }).lean<any>()
      if (!asset) throw notFound('Download file')
      destination = `/api/v1/media/${asset._id}`
    } else if (typeof resource.externalUrl === 'string' && /^https:\/\//i.test(resource.externalUrl)) {
      destination = resource.externalUrl
    } else {
      throw notFound('Download file')
    }

    await Resource.updateOne({ _id: resource._id, status: 'published', gated: false }, { $inc: { downloadCount: 1 } })
    return NextResponse.redirect(new URL(destination, req.url), 302)
  } catch (error) {
    return errorResponse(error)
  }
}
