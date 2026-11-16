import { NextResponse } from 'next/server'
import { handler } from '@/lib/server/http'
import { resolveJobAlertToken } from '@/lib/server/services/careers'

export const GET = handler(async (req) => {
  const token = req.nextUrl.searchParams.get('token') || ''
  const action = req.nextUrl.searchParams.get('action') === 'unsubscribe' ? 'unsubscribe' : 'confirm'
  const result = await resolveJobAlertToken(token, action)
  return NextResponse.redirect(new URL(`/careers?alert=${result}`, req.nextUrl.origin), 303)
})
