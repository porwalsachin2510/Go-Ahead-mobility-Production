import 'server-only'

import { connectDb } from '../db'
import { Page, PageVersion } from '../models/content'
import { DEFAULT_NEWSLETTER_PAGE } from '@/lib/newsletter/defaults'

/**
 * Creates the initial published Newsletter CMS page on first use.
 * Existing drafts, published snapshots and administrator edits are never overwritten.
 */
export async function ensureNewsletterPage() {
  await connectDb()

  const content = {
    title: DEFAULT_NEWSLETTER_PAGE.title,
    blocks: DEFAULT_NEWSLETTER_PAGE.blocks,
    seo: DEFAULT_NEWSLETTER_PAGE.seo,
  }
  const searchText = [content.title, JSON.stringify(content.blocks)]
    .join(' ')
    .replace(/\s+/g, ' ')
    .slice(0, 20000)

  let created = false
  try {
    const result = await Page.updateOne(
      { path: DEFAULT_NEWSLETTER_PAGE.path },
      {
        $setOnInsert: {
          path: DEFAULT_NEWSLETTER_PAGE.path,
          pageType: DEFAULT_NEWSLETTER_PAGE.pageType,
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
    // Metadata and page rendering can request the Newsletter route concurrently.
    if ((error as { code?: number })?.code !== 11000) throw error
    const existing = await Page.exists({ path: DEFAULT_NEWSLETTER_PAGE.path })
    if (!existing) throw error
  }

  const page = await Page.findOne({ path: DEFAULT_NEWSLETTER_PAGE.path })
    .select('_id revision published draft')
    .lean<any>()
  if (page?._id) {
    const snapshot = page.published ?? page.draft ?? content
    await PageVersion.updateOne(
      { pageId: page._id, versionNumber: page.revision ?? 1 },
      {
        $setOnInsert: {
          pageId: page._id,
          versionNumber: page.revision ?? 1,
          snapshot,
          kind: page.published ? 'publish' : 'save',
          changeNote: created ? 'Initial Newsletter page content' : 'Recovered missing Newsletter page version',
        },
      },
      { upsert: true, setDefaultsOnInsert: true },
    )
  }

  return { created }
}
