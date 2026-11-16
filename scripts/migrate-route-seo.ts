import mongoose from 'mongoose'
import { connectDb } from '../lib/server/db'
import { RouteSeo } from '../lib/server/models/seo'

async function main() {
  await connectDb()
  const indexes = await RouteSeo.collection.indexes()
  const existing = indexes.find((index) => index.key?.path === 1 && Object.keys(index.key).length === 1)

  if (existing?.unique) {
    console.log(`[migrate:route-seo] unique path index already exists: ${existing.name}`)
  } else {
    if (existing?.name) await RouteSeo.collection.dropIndex(existing.name)
    const name = await RouteSeo.collection.createIndex(
      { path: 1 },
      { unique: true, name: 'route_seo_path_unique' },
    )
    console.log(`[migrate:route-seo] ensured unique path index: ${name}`)
  }

  await mongoose.disconnect()
}

main().catch(async (error) => {
  console.error('[migrate:route-seo] failed', error)
  await mongoose.disconnect().catch(() => undefined)
  process.exitCode = 1
})
