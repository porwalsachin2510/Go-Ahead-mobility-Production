import { getRefModel } from '@/lib/server/admin/registry'
import { requireApiUser } from '@/lib/server/auth/session'
import { escapeRegex, handler, ok } from '@/lib/server/http'

export const GET = handler<{ resource: string }>(async (req, { params }) => {
  const { resource } = await params
  const user = await requireApiUser()
  const { model, label } = getRefModel(resource, user)
  const q = req.nextUrl.searchParams.get('q')?.trim().slice(0, 80)
  const filter: Record<string, unknown> = q ? { [label]: { $regex: escapeRegex(q), $options: 'i' } } : {}
  if (resource === 'faqs') filter.status = 'published'
  const docs = await model.find(filter).select(label).sort({ [label]: 1 }).limit(100).lean<Record<string, unknown>[]>()
  return ok(docs.map((d) => ({ value: String(d._id), label: String(d[label] ?? '') })))
})
