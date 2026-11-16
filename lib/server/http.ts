import 'server-only'
import { NextResponse, type NextRequest } from 'next/server'
import { ZodError } from 'zod'
import { connectDb } from './db'

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message)
  }
}

export const badRequest = (message: string, details?: unknown) => new ApiError(400, 'bad_request', message, details)
export const unauthorized = () => new ApiError(401, 'unauthorized', 'Authentication required')
export const forbidden = () => new ApiError(403, 'forbidden', 'You do not have permission to perform this action')
export const notFound = (what = 'Resource') => new ApiError(404, 'not_found', `${what} not found`)
export const conflict = (message: string, details?: unknown) => new ApiError(409, 'conflict', message, details)
export const tooMany = () => new ApiError(429, 'rate_limited', 'Too many requests. Please wait a moment and try again.')

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init)
}

export function errorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ ok: false, error: { code: error.code, message: error.message, details: error.details } }, { status: error.status })
  }
  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of error.issues) {
      const key = issue.path.join('.') || '_form'
      if (!fieldErrors[key]) fieldErrors[key] = issue.message
    }
    return NextResponse.json({ ok: false, error: { code: 'validation_error', message: 'Please check the highlighted fields.', details: fieldErrors } }, { status: 422 })
  }
  const err = error as { code?: number; name?: string }
  if (err?.code === 11000) {
    return NextResponse.json({ ok: false, error: { code: 'duplicate', message: 'A record with the same unique value already exists.' } }, { status: 409 })
  }
  if (err?.name === 'CastError' || err?.name === 'ValidationError') {
    return NextResponse.json({ ok: false, error: { code: 'validation_error', message: 'The submitted data is invalid.' } }, { status: 422 })
  }
  console.error('[api] unhandled error', error)
  return NextResponse.json({ ok: false, error: { code: 'server_error', message: 'Something went wrong on our side. Please try again.' } }, { status: 500 })
}

export function clientIp(req: NextRequest | Request): string {
  const h = req.headers
  return (h.get('x-forwarded-for')?.split(',')[0] || h.get('x-real-ip') || 'unknown').trim()
}

/** CSRF defence for cookie-authenticated mutations: require same-origin Origin header. */
export function assertSameOrigin(req: Request) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return
  const origin = req.headers.get('origin')
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host')
  if (!origin || !host) throw new ApiError(403, 'csrf', 'Cross-site request rejected')
  try {
    if (new URL(origin).host !== host) throw new Error('mismatch')
  } catch {
    throw new ApiError(403, 'csrf', 'Cross-site request rejected')
  }
}

type Ctx<P> = { params: Promise<P> }

export function handler<P = Record<string, string>>(fn: (req: NextRequest, ctx: Ctx<P>) => Promise<Response>) {
  return async (req: NextRequest, ctx: Ctx<P>) => {
    try {
      assertSameOrigin(req)
      await connectDb()
      return await fn(req, ctx)
    } catch (error) {
      return errorResponse(error)
    }
  }
}

export async function readJson(req: Request): Promise<unknown> {
  const len = Number(req.headers.get('content-length') || 0)
  if (len > 512 * 1024) throw new ApiError(413, 'payload_too_large', 'Request body too large')
  try {
    return await req.json()
  } catch {
    throw badRequest('Invalid JSON body')
  }
}

export function pagination(searchParams: URLSearchParams, defaults = { limit: 20, max: 100 }) {
  const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1)
  const limit = Math.min(defaults.max, Math.max(1, Number.parseInt(searchParams.get('limit') || String(defaults.limit), 10) || defaults.limit))
  return { page, limit, skip: (page - 1) * limit }
}

export function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
