import mongoose from 'mongoose'
import { connectDb } from '../lib/server/db'
import { TransportationPageContent } from '../lib/server/models/editorial'
import { DEFAULT_TRANSPORTATION_PAGE_CONTENT } from '../lib/transportation/defaults'

async function main() {
  await connectDb()

  const indexes = await TransportationPageContent.collection.indexes()
  const existing = indexes.find((index) => index.key?.key === 1 && Object.keys(index.key).length === 1)

  if (existing?.unique) {
    console.log(`[migrate:transportation-page] unique key index already exists: ${existing.name}`)
  } else {
    if (existing?.name) await TransportationPageContent.collection.dropIndex(existing.name)
    const name = await TransportationPageContent.collection.createIndex(
      { key: 1 },
      { unique: true, name: 'transportation_page_content_key_unique' },
    )
    console.log(`[migrate:transportation-page] ensured unique key index: ${name}`)
  }

  await TransportationPageContent.updateOne(
    { key: 'transportation-page' },
    { $setOnInsert: DEFAULT_TRANSPORTATION_PAGE_CONTENT },
    { upsert: true, setDefaultsOnInsert: true },
  )
  console.log('[migrate:transportation-page] ensured the Local Transportation singleton is present')
}

main()
  .catch((error) => {
    console.error('[migrate:transportation-page] failed', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await mongoose.disconnect()
  })
