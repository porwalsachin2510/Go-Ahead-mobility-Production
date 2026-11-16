import { z } from 'zod'
import { requireApiUser } from '@/lib/server/auth/session'
import { badRequest, handler, ok, readJson } from '@/lib/server/http'
import { listReviewTrail, transitionPost } from '@/lib/server/services/blog-workflow'
import { addAnchoredComment, setCommentResolved } from '@/lib/server/services/blog-editor'

type P = { id: string }

const body = z.discriminatedUnion('action', [
  z.object({ action: z.literal('comment'), body: z.string().max(4000), anchorField: z.string().max(40).optional(), anchorQuote: z.string().max(500).optional() }),
  z.object({ action: z.literal('resolve'), commentId: z.string().max(40), resolved: z.boolean() }),
  z.object({
    action: z.literal('transition'),
    to: z.string().max(40),
    note: z.string().max(4000).optional(),
    publishAt: z.string().max(40).nullish(),
    expectedRevision: z.number().int().nonnegative().optional(),
  }),
])

export const GET = handler<P>(async (_req, { params }) => {
  const { id } = await params
  const user = await requireApiUser()
  return ok(await listReviewTrail(user, id))
})

export const POST = handler<P>(async (req, { params }) => {
  const { id } = await params
  const user = await requireApiUser()
  const parsed = body.safeParse(await readJson(req))
  if (!parsed.success) throw badRequest('Invalid request')
  if (parsed.data.action === 'comment') {
    const { body: text, anchorField, anchorQuote } = parsed.data
    return ok(await addAnchoredComment(user, id, { body: text, anchorField, anchorQuote }), { status: 201 })
  }
  if (parsed.data.action === 'resolve') return ok(await setCommentResolved(user, id, parsed.data.commentId, parsed.data.resolved))
  const { to, note, publishAt, expectedRevision } = parsed.data
  return ok(await transitionPost(user, id, { to, note, publishAt, expectedRevision }))
})
