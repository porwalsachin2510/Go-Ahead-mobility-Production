import 'server-only'
import mongoose from 'mongoose'

type Cache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }

const globalForMongoose = globalThis as unknown as { __gaMongoose?: Cache }
const cache: Cache = globalForMongoose.__gaMongoose ?? { conn: null, promise: null }
globalForMongoose.__gaMongoose = cache

function dbNameFromUri(uri: string): string {
  const match = uri.match(/^mongodb(?:\+srv)?:\/\/[^/]+\/([^?]+)/)
  return match ? decodeURIComponent(match[1]).trim() : ''
}

const DEFAULT_DB_NAME = 'goaheadmobility'

/**
 * MONGODB_CONNECTION_STRING is the project's own cluster and wins over the marketplace-injected
 * MONGODB_URI, so the app and every seed/migration script target the same database.
 */
export function getMongoUri(): string {
  return (process.env.MONGODB_CONNECTION_STRING ?? '').trim() || (process.env.MONGODB_URI ?? '').trim()
}

/**
 * MONGODB_DB wins; otherwise the database named in the connection string path; otherwise a stable default.
 * Read lazily so scripts can load env first.
 */
export function getDbName(uri = getMongoUri()): string {
  return (process.env.MONGODB_DB ?? '').trim() || dbNameFromUri(uri) || DEFAULT_DB_NAME
}

export async function connectDb(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn
  const uri = getMongoUri()
  if (!uri) throw new Error('MONGODB_CONNECTION_STRING (or MONGODB_URI) is not configured')
  const DB_NAME = getDbName(uri)
  if (!cache.promise) {
    mongoose.set('strictQuery', true)
    // sanitizeFilter is intentionally off: it rejects the trusted $in/$ne/$lte operators the
    // services build. Untrusted input is validated by Zod and regex-escaped before querying.
    cache.promise = mongoose.connect(uri, {
      dbName: DB_NAME,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
      autoIndex: process.env.NODE_ENV !== 'production' || process.env.MONGODB_AUTO_INDEX === 'true',
    })
  }
  try {
    cache.conn = await cache.promise
  } catch (error) {
    cache.promise = null
    throw error
  }
  return cache.conn
}

export function isValidObjectId(id: unknown): id is string {
  return typeof id === 'string' && /^[a-f0-9]{24}$/i.test(id)
}
