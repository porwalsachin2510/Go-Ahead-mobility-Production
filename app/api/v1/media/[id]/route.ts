import { Readable } from 'node:stream'
import { NextResponse } from 'next/server'
import { errorResponse, notFound } from '@/lib/server/http'
import { openMediaStream } from '@/lib/server/services/media'
import { getSessionUser } from '@/lib/server/auth/session'
import { can } from '@/lib/rbac'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const w = Number(new URL(req.url).searchParams.get('w'))
    const result = await openMediaStream(id, Number.isFinite(w) && w > 0 ? Math.min(Math.round(w), 4000) : null)
    if (!result) throw notFound('File')
    const { asset, stream, mimeType, size } = result
    if (asset.isPrivate) {
      const user = await getSessionUser()
      if (!user || !(can(user.role, 'pii.view') || can(user.role, 'applications.read') || can(user.role, 'leads.read.all'))) {
        stream.destroy()
        throw notFound('File')
      }
    }
    return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
      headers: {
        'Content-Type': mimeType,
        'Content-Length': String(size),
        'Cache-Control': asset.isPrivate ? 'private, no-store' : 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
        'Content-Disposition': `${asset.assetType === 'image' ? 'inline' : 'attachment'}; filename="${asset.filename}"`,
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}
