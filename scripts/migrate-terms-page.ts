/**
 * Idempotently upgrades the /terms CMS page to the complete Terms & Conditions content.
 * Existing administrator-authored content is preserved; only the known starter placeholder
 * from the original legal-page migration is replaced.
 *
 * Run with: pnpm migrate:terms-page
 */
import mongoose from 'mongoose'
import { connectDb } from '../lib/server/db'
import { Navigation, Page, PageVersion } from '../lib/server/models/content'
import { LEGAL_MENU_ITEMS, LEGAL_PAGES } from '../lib/legal/defaults'

const terms = LEGAL_PAGES.find((page) => page.path === '/terms')
if (!terms) throw new Error('Missing /terms defaults')

const STARTER_MARKER = '_Version v1. These terms must be reviewed by your legal counsel before launch._'

async function main() {
  await connectDb()

  const existing = await Page.findOne({ path: '/terms' })
  const content = {
    title: terms.title,
    blocks: terms.blocks,
    seo: terms.seo,
  }
  const searchText = terms.blocks.map((block) => `${String(block.data.heading || '')} ${String(block.data.body || '')} ${String(block.data.aside || '')}`).join(' ').slice(0, 20000)

  if (!existing) {
    const page = await Page.create({
      path: '/terms',
      pageType: 'legal',
      draft: content,
      published: content,
      state: 'published',
      publishedAt: new Date(),
      isSystem: true,
      searchText,
    })
    await PageVersion.create({ pageId: page._id, versionNumber: page.revision ?? 1, snapshot: content, kind: 'publish' })
    console.log('[migrate:terms-page] created and published /terms')
  } else {
    const currentBody = String(existing.draft?.blocks?.find((block: any) => block.type === 'richText')?.data?.body ?? '')
    if (currentBody.includes(STARTER_MARKER)) {
      existing.set('draft', content)
      existing.set('published', content)
      existing.set('pageType', 'legal')
      existing.set('state', 'published')
      existing.set('publishedAt', existing.publishedAt ?? new Date())
      existing.set('isSystem', true)
      existing.set('searchText', searchText)
      existing.revision = (existing.revision ?? 1) + 1
      await existing.save()
      await PageVersion.create({ pageId: existing._id, versionNumber: existing.revision, snapshot: content, kind: 'publish', changeNote: 'Upgrade starter Terms & Conditions page' })
      console.log('[migrate:terms-page] upgraded the original starter /terms content')
    } else {
      console.log('[migrate:terms-page] preserved existing /terms content; no overwrite needed')
    }
  }

  const legal = await Navigation.findOne({ menuKey: 'legal' }).lean<any>()
  const items = Array.isArray(legal?.items) ? [...legal.items] : []
  const termsLink = LEGAL_MENU_ITEMS.find((item) => item.href === '/terms')!
  if (!items.some((item: any) => item.href === '/terms')) {
    items.push(termsLink)
    await Navigation.updateOne({ menuKey: 'legal' }, { $set: { items } }, { upsert: true, runValidators: true })
    console.log('[migrate:terms-page] added /terms to the legal navigation menu')
  } else {
    console.log('[migrate:terms-page] legal navigation already contains /terms')
  }
}

main()
  .catch((error) => {
    console.error('[migrate:terms-page] failed', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await mongoose.disconnect()
  })
