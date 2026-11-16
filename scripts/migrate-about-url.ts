/**
 * One-time, idempotent migration for the canonical About Us URL.
 *
 * - Rewrites primary/footer/utility/legal navigation hrefs in MongoDB.
 * - Keeps the legacy CMS page content by moving it to /about-us when that
 *   path is unused, or archives the duplicate /about record when it exists.
 * - Creates/updates the permanent database redirect /about -> /about-us.
 *
 * Run with: pnpm migrate:about-url
 */
import mongoose from 'mongoose'
import { connectDb } from '../lib/server/db'
import { Navigation, Page, Redirect } from '../lib/server/models/content'
import { canonicalizeNavigationItems } from '../lib/seo/about-url'

async function main() {
  await connectDb()

  const menus = await Navigation.find({
    menuKey: { $in: ['primary', 'footer', 'utility', 'legal'] },
  }).lean<any[]>()

  let updatedMenus = 0
  for (const menu of menus) {
    const currentItems = menu.items ?? []
    const normalizedItems = canonicalizeNavigationItems(currentItems)
    if (JSON.stringify(normalizedItems) === JSON.stringify(currentItems)) continue

    const result = await Navigation.updateOne(
      { _id: menu._id, ...(menu.updatedAt ? { updatedAt: menu.updatedAt } : {}) },
      { $set: { items: normalizedItems } },
      { runValidators: true },
    )
    updatedMenus += result.modifiedCount
  }

  let movedLegacyPage = false
  let archivedLegacyPage = false
  const legacyPage = await Page.findOne({ path: '/about' }).select('_id').lean<any>()
  if (legacyPage) {
    const canonicalPageExists = await Page.exists({ path: '/about-us' })
    if (canonicalPageExists) {
      const result = await Page.updateOne(
        { _id: legacyPage._id },
        { $set: { state: 'archived' } },
      )
      archivedLegacyPage = result.modifiedCount > 0
    } else {
      const result = await Page.updateOne(
        { _id: legacyPage._id },
        { $set: { path: '/about-us' } },
        { runValidators: true },
      )
      movedLegacyPage = result.modifiedCount > 0
    }
  }

  await Redirect.findOneAndUpdate(
    { sourcePath: '/about' },
    {
      $set: {
        targetUrl: '/about-us',
        statusCode: 301,
        enabled: true,
        reason: 'Canonical About Us URL migration',
      },
      $setOnInsert: { hitCount: 0 },
    },
    { upsert: true, returnDocument: 'after', runValidators: true },
  )

  console.log(
    `[about-url-migration] updated menus: ${updatedMenus}; moved legacy page: ${movedLegacyPage}; archived duplicate legacy page: ${archivedLegacyPage}; redirect: /about -> /about-us`,
  )
}

main()
  .catch((error) => {
    console.error('[about-url-migration] failed', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await mongoose.disconnect()
  })
