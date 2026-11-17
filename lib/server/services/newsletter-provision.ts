import 'server-only'

import { connectDb } from '../db'
import { Page, PageVersion } from '../models/content'
import { DEFAULT_NEWSLETTER_PAGE } from '@/lib/newsletter/defaults'
import {
  LEGACY_NEWSLETTER_ACCOMMODATION_HERO_IMAGE,
  NEWSLETTER_ACCOMMODATION_HERO_IMAGE,
} from '@/lib/newsletter/images'

type PageSnapshot = {
  _id: unknown
  revision?: number
  published?: { title: string; blocks: unknown[]; seo?: Record<string, unknown> } | null
  draft?: { title: string; blocks: unknown[]; seo?: Record<string, unknown> } | null
}

function heroImagePatch(content: PageSnapshot['draft'] | PageSnapshot['published'], prefix: 'draft' | 'published') {
  const patch: Record<string, string> = {}
  for (const [index, block] of (content?.blocks ?? []).entries()) {
    const item = block as { type?: string; data?: Record<string, unknown> }
    if (item.type === 'newsletterPage' && item.data?.heroSecondaryImage === LEGACY_NEWSLETTER_ACCOMMODATION_HERO_IMAGE) {
      patch[`${prefix}.blocks.${index}.data.heroSecondaryImage`] = NEWSLETTER_ACCOMMODATION_HERO_IMAGE
    }
  }
  return patch
}

async function ensurePageVersion(page: PageSnapshot, changeNote: string) {
  const versionNumber = page.revision ?? 1
  const versionFilter = { pageId: page._id, versionNumber }
  const snapshot = page.published ?? page.draft
  if (!snapshot) return

  try {
    await PageVersion.updateOne(
      versionFilter,
      {
        $setOnInsert: {
          ...versionFilter,
          snapshot,
          kind: page.published ? 'publish' : 'save',
          changeNote,
        },
      },
      { upsert: true, setDefaultsOnInsert: true },
    )
  } catch (error) {
    // A parallel first request may have inserted the same version first.
    if ((error as { code?: number })?.code !== 11000) throw error
    const existingVersion = await PageVersion.exists(versionFilter)
    if (!existingVersion) throw error
  }
}

/**
 * Creates the initial published Newsletter CMS page on first use.
 * Existing admin-authored content is preserved. The only existing content migration
 * is a targeted repair of the known, non-existent accommodation image path.
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

  let page: PageSnapshot | null = null
  let repaired = false

  // Use revision matching so a simultaneous Page Builder save is never overwritten.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    page = await Page.findOne({ path: DEFAULT_NEWSLETTER_PAGE.path })
      .select('_id revision published draft')
      .lean<PageSnapshot>()
    if (!page?._id) throw new Error('Newsletter CMS page could not be loaded after provisioning')

    const patch = {
      ...heroImagePatch(page.draft, 'draft'),
      ...heroImagePatch(page.published, 'published'),
    }

    if (Object.keys(patch).length === 0) break

    const revision = page.revision ?? 1
    const revisionCondition = page.revision == null
      ? { $or: [{ revision: { $exists: false } }, { revision: null }] }
      : { revision }
    const update = await Page.updateOne(
      { _id: page._id, ...revisionCondition },
      { $set: patch, $inc: { revision: 1 } },
      { runValidators: true },
    )

    if (update.modifiedCount === 1) {
      repaired = true
      page = await Page.findById(page._id)
        .select('_id revision published draft')
        .lean<PageSnapshot>()
      if (!page) throw new Error('Newsletter CMS page disappeared after hero image repair')
      break
    }
    // A concurrent admin edit won the revision race. Re-read it and repair only if needed.
  }

  if (!page?._id) throw new Error('Newsletter CMS page is unavailable')
  const changeNote = repaired
    ? 'Repaired legacy Newsletter accommodation hero image path'
    : created
      ? 'Initial Newsletter page content'
      : 'Recovered missing Newsletter page version'
  await ensurePageVersion(page, changeNote)

  return { created, repaired }
}
