import { NextResponse } from 'next/server'
import { handler } from '@/lib/server/http'
import { sha256 } from '@/lib/server/security/crypto'
import { ConsentEvent, Subscriber } from '@/lib/server/models/operations'

export const GET = handler(async (req) => {
  const token = req.nextUrl.searchParams.get('token') || ''
  const action = req.nextUrl.searchParams.get('action') === 'unsubscribe' ? 'unsubscribe' : 'confirm'
  let result = 'invalid'
  if (token.length >= 20) {
    const sub = await Subscriber.findOne({ unsubscribeTokenHash: sha256(token) })
    if (sub) {
      if (action === 'confirm' && sub.status !== 'suppressed') {
        sub.status = 'confirmed'
        sub.confirmedAt = new Date()
      } else if (action === 'unsubscribe') {
        sub.status = 'unsubscribed'
        sub.unsubscribedAt = new Date()
      }
      await sub.save()
      await ConsentEvent.create({ subjectType: 'subscriber', subjectId: String(sub._id), event: action === 'confirm' ? 'newsletter_confirmed' : 'newsletter_unsubscribed', source: 'email_link' })
      result = action === 'confirm' ? 'confirmed' : 'unsubscribed'
    }
  }
  return NextResponse.redirect(new URL(`/newsletter?status=${result}`, req.nextUrl.origin), 303)
})
