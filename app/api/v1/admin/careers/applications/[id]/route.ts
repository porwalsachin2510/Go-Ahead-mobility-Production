import { z } from 'zod'
import { requireApiUser } from '@/lib/server/auth/session'
import { assertSameOrigin, handler, ok, readJson } from '@/lib/server/http'
import { getApplicationDetail, updateApplications } from '@/lib/server/services/careers'
import { APPLICATION_STATES } from '@/lib/careers/labels'

type P = { id: string }

export const GET = handler<P>(async (_req, { params }) => {
  const { id } = await params
  const user = await requireApiUser('applications.read')
  return ok(await getApplicationDetail(user, id))
})

const schema = z.object({
  state: z.enum(APPLICATION_STATES).optional(),
  rating: z.number().int().min(0).max(5).optional(),
  tags: z.array(z.string().trim().max(40)).max(20).optional(),
  note: z.string().trim().max(2000).optional(),
  notes: z.string().max(5000).optional(),
  notifyCandidate: z.boolean().optional().default(false),
})

export const PATCH = handler<P>(async (req, { params }) => {
  assertSameOrigin(req)
  const { id } = await params
  const user = await requireApiUser('careers.manage')
  await updateApplications(user, [id], schema.parse(await readJson(req)))
  return ok(await getApplicationDetail(user, id))
})
