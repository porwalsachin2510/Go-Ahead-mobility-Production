import { z } from 'zod'
import { clientIp, errorResponse, notFound, ok, readJson } from '@/lib/server/http'
import { connectDb } from '@/lib/server/db'
import { Resource } from '@/lib/server/models/editorial'
import { rateLimit } from '@/lib/server/security/guards'
import { registerForWebinar } from '@/lib/server/services/leads'

const registrationSchema = z.object({
  email: z.email('Enter a valid work email').max(254),
  company: z.string().trim().min(1, 'Please enter your company name').max(160),
  privacyAccepted: z.literal(true),
  marketing: z.boolean().optional().default(false),
  website: z.string().max(200).optional().default(''),
})

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const body = await readJson(req) as Record<string, unknown>
    // Honeypot: return a neutral success without creating a CRM record.
    if (typeof body.website === 'string' && body.website.trim()) {
      return ok({ reference: 'WEB-RECEIVED', alreadyRegistered: false }, { status: 201 })
    }
    await rateLimit('webinar-register:' + clientIp(req), 8, 600)
    const input = registrationSchema.parse(body)
    await connectDb()
    const resource = await Resource.findOne({ slug, resourceType: 'webinar', status: 'published' }).select('slug').lean<any>()
    if (!resource) throw notFound('Webinar')
    const result = await registerForWebinar({
      slug: resource.slug,
      email: input.email,
      company: input.company,
      marketing: input.marketing,
      origin: new URL(req.url).origin,
    })
    return ok(result, { status: 201, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return errorResponse(error)
  }
}
