import 'server-only'

import { connectDb } from '../db'
import { Page, PageVersion } from '../models/content'
import { DEFAULT_SAFETY_TRUST_PAGE } from '@/lib/safety-trust/defaults'

/**
 * First-use provisioning for the Safety & Trust CMS page.
 *
 * A deployment must not rely on someone remembering to run a one-off seed command:
 * both the public route and the admin Pages listing call this idempotent operation.
 * Existing records (including unpublished/admin-edited records) are never overwritten.
 */
export async function ensureSafetyTrustPage() {
  await connectDb()

  const content = {
    title: DEFAULT_SAFETY_TRUST_PAGE.title,
    blocks: DEFAULT_SAFETY_TRUST_PAGE.blocks,
    seo: DEFAULT_SAFETY_TRUST_PAGE.seo,
  }
  const searchText = [content.title, JSON.stringify(content.blocks)]
    .join(' ')
    .replace(/\s+/g, ' ')
    .slice(0, 20000)

  const result = await Page.updateOne(
    { path: DEFAULT_SAFETY_TRUST_PAGE.path },
    {
      $setOnInsert: {
        path: DEFAULT_SAFETY_TRUST_PAGE.path,
        pageType: DEFAULT_SAFETY_TRUST_PAGE.pageType,
        draft: content,
        published: content,
        state: 'published',
        publishedAt: new Date(),
        revision: 1,
        searchText,
        isSystem: true,
      },
    },
    { upsert: true, runValidators: true, setDefaultsOnInsert: true },
  )

  // Only the request which inserted the page creates its first immutable version.
  if (result.upsertedCount > 0) {
    const created = await Page.findOne({ path: DEFAULT_SAFETY_TRUST_PAGE.path }).select('_id revision').lean<any>()
    if (created?._id) {
      await PageVersion.updateOne(
        { pageId: created._id, versionNumber: created.revision ?? 1 },
        {
          $setOnInsert: {
            pageId: created._id,
            versionNumber: created.revision ?? 1,
            snapshot: content,
            kind: 'publish',
            changeNote: 'Initial Safety & Trust page content',
          },
        },
        { upsert: true, setDefaultsOnInsert: true },
      )
    }
  }

  return { created: result.upsertedCount > 0 }
}
