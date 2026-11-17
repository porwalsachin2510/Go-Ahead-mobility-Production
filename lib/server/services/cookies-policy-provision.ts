import 'server-only'

import { connectDb } from '../db'
import { Page, PageVersion } from '../models/content'
import { DEFAULT_COOKIES_POLICY_PAGE } from '@/lib/cookies/defaults'

type CookieBlock = { id: string; type: string; hidden?: boolean; data?: Record<string, unknown> }
type PageContent = { title: string; blocks: CookieBlock[]; seo?: Record<string, unknown> }
type CookiesPageSnapshot = {
  _id: unknown
  revision?: number
  published?: PageContent | null
  draft?: PageContent | null
}

const COOKIE_BLOCK = DEFAULT_COOKIES_POLICY_PAGE.blocks[0] as CookieBlock

function hasCookiePolicy(content?: PageContent | null) {
  return Boolean(content?.blocks?.some((block) => block.type === 'cookiesPolicy'))
}

async function writeVersion(page: CookiesPageSnapshot, changeNote: string) {
  const versionNumber = page.revision ?? 1
  const snapshot = page.published ?? page.draft
  if (!snapshot) return

  const filter = { pageId: page._id, versionNumber }
  try {
    await PageVersion.updateOne(
      filter,
      {
        $setOnInsert: {
          ...filter,
          snapshot,
          kind: page.published ? 'publish' : 'save',
          changeNote,
        },
      },
      { upsert: true, setDefaultsOnInsert: true },
    )
  } catch (error) {
    if ((error as { code?: number })?.code !== 11000) throw error
    const existing = await PageVersion.exists(filter)
    if (!existing) throw error
  }
}

/**
 * Ensures /cookies has a structured, editable policy block. Existing legal content
 * and administrator edits are retained; the structured block is only added if missing.
 */
export async function ensureCookiesPolicyPage() {
  await connectDb()

  const initial = {
    title: DEFAULT_COOKIES_POLICY_PAGE.title,
    blocks: DEFAULT_COOKIES_POLICY_PAGE.blocks,
    seo: DEFAULT_COOKIES_POLICY_PAGE.seo,
  }
  const searchText = [initial.title, JSON.stringify(initial.blocks)]
    .join(' ')
    .replace(/\s+/g, ' ')
    .slice(0, 20000)

  let created = false
  try {
    const inserted = await Page.updateOne(
      { path: DEFAULT_COOKIES_POLICY_PAGE.path },
      {
        $setOnInsert: {
          path: DEFAULT_COOKIES_POLICY_PAGE.path,
          pageType: DEFAULT_COOKIES_POLICY_PAGE.pageType,
          draft: initial,
          published: initial,
          state: 'published',
          publishedAt: new Date(),
          revision: 1,
          searchText,
          isSystem: true,
        },
      },
      { upsert: true, runValidators: true, setDefaultsOnInsert: true },
    )
    created = inserted.upsertedCount > 0
  } catch (error) {
    if ((error as { code?: number })?.code !== 11000) throw error
    const existing = await Page.exists({ path: DEFAULT_COOKIES_POLICY_PAGE.path })
    if (!existing) throw error
  }

  let page: CookiesPageSnapshot | null = null
  let migrated = false

  // Compare-and-set the page revision so a concurrent CMS save cannot be overwritten.
  for (let attempt = 0; attempt < 4; attempt += 1) {
    page = await Page.findOne({ path: DEFAULT_COOKIES_POLICY_PAGE.path })
      .select('_id revision draft published')
      .lean<CookiesPageSnapshot>()
    if (!page?._id) throw new Error('Cookies Policy CMS page could not be loaded')

    const draftBlocks = page.draft?.blocks ?? []
    const publishedBlocks = page.published?.blocks ?? []
    const addToDraft = !hasCookiePolicy(page.draft)
    const addToPublished = Boolean(page.published) && !hasCookiePolicy(page.published)

    if (!addToDraft && !addToPublished) break

    const set: Record<string, unknown> = {}
    if (addToDraft) set['draft.blocks'] = [...draftBlocks, COOKIE_BLOCK]
    if (addToPublished) set['published.blocks'] = [...publishedBlocks, COOKIE_BLOCK]

    const revision = page.revision ?? 1
    const revisionCondition = page.revision == null
      ? { $or: [{ revision: { $exists: false } }, { revision: null }] }
      : { revision }
    const result = await Page.updateOne(
      { _id: page._id, ...revisionCondition },
      { $set: set, $inc: { revision: 1 } },
      { runValidators: true },
    )

    if (result.modifiedCount === 1) {
      migrated = true
      page = await Page.findById(page._id)
        .select('_id revision draft published')
        .lean<CookiesPageSnapshot>()
      if (!page) throw new Error('Cookies Policy CMS page disappeared during migration')
      break
    }
    // A concurrent administrator save won; re-read the current version and retry.
  }

  if (!page?._id) throw new Error('Cookies Policy CMS page is unavailable')

  await writeVersion(
    page,
    migrated
      ? 'Added the structured Cookies Policy page block while preserving existing content'
      : created
        ? 'Initial Cookies Policy page content'
        : 'Recovered missing Cookies Policy page version',
  )

  return { created, migrated }
}
