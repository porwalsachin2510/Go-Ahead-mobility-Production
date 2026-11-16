import { z } from 'zod'
import { NextResponse } from 'next/server'
import { requireApiUser } from '@/lib/server/auth/session'
import { assertSameOrigin, handler, ok, readJson } from '@/lib/server/http'
import { exportApplicationsCsv, listApplications, updateApplications, type PipelineQuery } from '@/lib/server/services/careers'
import { APPLICATION_STATES } from '@/lib/careers/labels'

function query(sp: URLSearchParams): PipelineQuery {
  return {
    state: sp.get('state') || undefined,
    jobId: sp.get('jobId') || undefined,
    q: sp.get('q') || undefined,
    flagged: sp.get('flagged') === '1',
    minRating: Number(sp.get('minRating')) || undefined,
    page: Number(sp.get('page')) || 1,
  }
}

export const GET = handler(async (req) => {
  const user = await requireApiUser('applications.read')
  const sp = req.nextUrl.searchParams
  if (sp.get('format') === 'csv') {
    const csv = await exportApplicationsCsv(user, query(sp))
    return new NextResponse(`\uFEFF${csv}`, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="applications-${new Date().toISOString().slice(0, 10)}.csv"`,
        'Cache-Control': 'private, no-store',
      },
    })
  }
  return ok(await listApplications(user, query(sp)))
})

const bulkSchema = z.object({
  ids: z.array(z.string()).min(1).max(200),
  state: z.enum(APPLICATION_STATES).optional(),
  notifyCandidate: z.boolean().optional().default(false),
})

export const PATCH = handler(async (req) => {
  assertSameOrigin(req)
  const user = await requireApiUser('careers.manage')
  const { ids, ...update } = bulkSchema.parse(await readJson(req))
  return ok(await updateApplications(user, ids, update))
})
