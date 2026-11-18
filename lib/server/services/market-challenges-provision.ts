import 'server-only'

import { connectDb } from '../db'
import { Page, PageVersion } from '../models/content'
import { DEFAULT_MARKET_CHALLENGES_PAGE } from '@/lib/market-challenges/defaults'

/**
 * First-use provisioning for the Market Challenges CMS page.
 * The public route and Admin → Pages both call this idempotent operation.
 * Existing drafts, published content and administrator edits are never overwritten.
 */
export async function ensureMarketChallengesPage() {
  await connectDb()

  const content = {
    title: DEFAULT_MARKET_CHALLENGES_PAGE.title,
    blocks: DEFAULT_MARKET_CHALLENGES_PAGE.blocks,
    seo: DEFAULT_MARKET_CHALLENGES_PAGE.seo,
  }
  const searchText = [content.title, JSON.stringify(content.blocks)]
    .join(' ')
    .replace(/\s+/g, ' ')
    .slice(0, 20000)

  let created = false
  try {
    const result = await Page.updateOne(
      { path: DEFAULT_MARKET_CHALLENGES_PAGE.path },
      {
        $setOnInsert: {
          path: DEFAULT_MARKET_CHALLENGES_PAGE.path,
          pageType: DEFAULT_MARKET_CHALLENGES_PAGE.pageType,
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
    // Metadata and page rendering may request this route concurrently.
    if ((error as { code?: number })?.code !== 11000) throw error
    const existing = await Page.exists({ path: DEFAULT_MARKET_CHALLENGES_PAGE.path })
    if (!existing) throw error
  }

  const page = await Page.findOne({ path: DEFAULT_MARKET_CHALLENGES_PAGE.path })
    .select('_id revision published draft')
    .lean<any>()

  if (page?._id) {
    const snapshot = page.published ?? page.draft ?? content
    const versionNumber = page.revision ?? 1
    const versionFilter = { pageId: page._id, versionNumber }

    try {
      await PageVersion.updateOne(
        versionFilter,
        {
          $setOnInsert: {
            ...versionFilter,
            snapshot,
            kind: page.published ? 'publish' : 'save',
            changeNote: created ? 'Initial Market Challenges page content' : 'Recovered missing Market Challenges page version',
          },
        },
        { upsert: true, setDefaultsOnInsert: true },
      )
    } catch (error) {
      if ((error as { code?: number })?.code !== 11000) throw error
      const existingVersion = await PageVersion.exists(versionFilter)
      if (!existingVersion) throw error
    }
  }

  return { created }
}
