import { requireApiUser } from '@/lib/server/auth/session'
import { handler, ok } from '@/lib/server/http'
import { exportLeadsCsv, listLeads } from '@/lib/server/services/admin-leads'

export const GET = handler(async (req) => {
  const user = await requireApiUser()
  const sp = req.nextUrl.searchParams
  if (sp.get('format') === 'csv') {
    const csv = await exportLeadsCsv(user, sp)
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`,
        'Cache-Control': 'no-store',
      },
    })
  }
  return ok(await listLeads(user, sp))
})
