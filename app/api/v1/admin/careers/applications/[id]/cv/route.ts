import { Readable } from 'node:stream'
import { NextResponse } from 'next/server'
import { requireApiUser } from '@/lib/server/auth/session'
import { handler, notFound } from '@/lib/server/http'
import { connectDb, isValidObjectId } from '@/lib/server/db'
import { Application } from '@/lib/server/models/operations'
import { openMediaStream } from '@/lib/server/services/media'
import { audit } from '@/lib/server/security/guards'

export const GET = handler<{ id: string }>(async (_req, { params }) => {
  const { id } = await params
  const user = await requireApiUser('pii.view')
  if (!isValidObjectId(id)) throw notFound('CV')
  await connectDb()
  const app = await Application.findById(id, 'cvMediaId publicReference name').lean<any>()
  if (!app?.cvMediaId) throw notFound('CV')
  const file = await openMediaStream(String(app.cvMediaId))
  if (!file) throw notFound('CV')
  await audit({ actor: user, action: 'application.cv_download', entityType: 'application', entityId: id, summary: `Downloaded CV for ${app.publicReference}` })
  const ext = (file.asset.filename as string).split('.').pop() ?? 'pdf'
  const safeName = `${app.publicReference}-${String(app.name).replace(/[^a-z0-9]+/gi, '-')}.${ext}`.slice(0, 120)
  return new NextResponse(Readable.toWeb(file.stream) as ReadableStream, {
    headers: {
      'Content-Type': file.mimeType,
      'Content-Length': String(file.size),
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Disposition': `attachment; filename="${safeName}"`,
    },
  })
})
