import { requireApiUser } from '@/lib/server/auth/session'
import { assertSameOrigin, handler, ok, readJson } from '@/lib/server/http'
import { audit } from '@/lib/server/security/guards'
import { issueActionSchema, setIssueState } from '@/lib/server/services/seo-admin'

export const POST = handler(async (req) => {
  assertSameOrigin(req)
  const user = await requireApiUser('seo.write')
  const input = issueActionSchema.parse(await readJson(req))
  await setIssueState(input, user.id)
  await audit({ actor: user, action: 'update', entityType: 'seo_issue', summary: `${input.action === 'ignore' ? 'Ignored' : 'Restored'} ${input.code} on ${input.entityKey}` })
  return ok({ ok: true })
})
