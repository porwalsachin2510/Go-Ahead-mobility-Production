import { requireApiUser } from '@/lib/server/auth/session'
import { connectDb } from '@/lib/server/db'
import { assertSameOrigin, handler, ok, tooMany } from '@/lib/server/http'
import { SeoAuditRun } from '@/lib/server/models/seo'
import { audit } from '@/lib/server/security/guards'
import { listAuditRuns, runAudit, saveAuditRun } from '@/lib/server/services/seo-inventory'

const MIN_INTERVAL_MS = 30_000

export const GET = handler(async () => {
  await requireApiUser('seo.write')
  return ok(JSON.parse(JSON.stringify(await listAuditRuns(20))))
})

export const POST = handler(async (req) => {
  assertSameOrigin(req)
  const user = await requireApiUser('seo.write')
  await connectDb()
  const last = await SeoAuditRun.findOne({}, 'createdAt').sort({ createdAt: -1 }).lean<any>()
  if (last && Date.now() - new Date(last.createdAt).getTime() < MIN_INTERVAL_MS) throw tooMany()
  const result = await runAudit()
  const run = await saveAuditRun(result, user.id, 'manual')
  await audit({ actor: user, action: 'create', entityType: 'seo_audit', summary: `Ran SEO audit: score ${result.score}, ${result.issues.length} open issues` })
  return ok({ id: String(run._id), score: result.score, issues: result.issues.length, ignored: result.ignored.length })
})
