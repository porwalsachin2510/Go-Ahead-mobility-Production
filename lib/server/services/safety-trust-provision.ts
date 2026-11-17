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

  let created = false
  try {
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
    created = result.upsertedCount > 0
  } catch (error) {
    // Public metadata and page rendering may request the route at the same time.
    // The unique page-path index allows only one upsert to win; the other request
    // should reuse the record created by its neighbour rather than return a 500.
    if ((error as { code?: number })?.code !== 11000) throw error
    const existing = await Page.exists({ path: DEFAULT_SAFETY_TRUST_PAGE.path })
    if (!existing) throw error
  }

  const page = await Page.findOne({ path: DEFAULT_SAFETY_TRUST_PAGE.path })
    .select('_id revision published draft')
    .lean<any>()
  if (page?._id) {
    // Repair a missing first version as well, without replacing a version an admin has created.
    const snapshot = page.published ?? page.draft ?? content
    await PageVersion.updateOne(
      { pageId: page._id, versionNumber: page.revision ?? 1 },
      {
        $setOnInsert: {
          pageId: page._id,
          versionNumber: page.revision ?? 1,
          snapshot,
          kind: page.published ? 'publish' : 'save',
          changeNote: created ? 'Initial Safety & Trust page content' : 'Recovered missing Safety & Trust page version',
        },
      },
      { upsert: true, setDefaultsOnInsert: true },
    )
  }

  return { created }
}
