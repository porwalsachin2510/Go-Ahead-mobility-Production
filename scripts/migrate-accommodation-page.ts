import mongoose from 'mongoose'
import { connectDb } from '../lib/server/db'
import { AccommodationPageContent } from '../lib/server/models/editorial'
import { DEFAULT_ACCOMMODATION_PAGE_CONTENT } from '../lib/accommodation/defaults'

async function main() {
  await connectDb()

  const indexes = await AccommodationPageContent.collection.indexes()
  const existing = indexes.find((index) => index.key?.key === 1 && Object.keys(index.key).length === 1)

  if (existing?.unique) {
    console.log(`[migrate:accommodation-page] unique key index already exists: ${existing.name}`)
  } else {
    if (existing?.name) await AccommodationPageContent.collection.dropIndex(existing.name)
    const name = await AccommodationPageContent.collection.createIndex(
      { key: 1 },
      { unique: true, name: 'accommodation_page_content_key_unique' },
    )
    console.log(`[migrate:accommodation-page] ensured unique key index: ${name}`)
  }

  await AccommodationPageContent.updateOne(
    { key: 'accommodation-page' },
    { $setOnInsert: DEFAULT_ACCOMMODATION_PAGE_CONTENT },
    { upsert: true, setDefaultsOnInsert: true },
  )
  console.log('[migrate:accommodation-page] ensured the Global Accommodation singleton is present')
}

main()
  .catch((error) => {
    console.error('[migrate:accommodation-page] failed', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await mongoose.disconnect()
  })
