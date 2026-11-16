import { destroySession } from '@/lib/server/auth/session'
import { handler, ok } from '@/lib/server/http'

export const POST = handler(async () => {
  await destroySession()
  return ok({ signedOut: true })
})
