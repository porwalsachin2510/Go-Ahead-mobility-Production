/**
 * Idempotent migration: makes Our Footprint and the legal pages reachable from the footer.
 *
 * - Adds "Our Footprint" to the footer "Company" column when missing.
 * - Adds any missing legal links (Privacy, Terms, Cookies, Our Footprint) to the legal menu.
 * - Creates the /terms and /cookies CMS pages when they do not exist (never overwrites edits).
 *
 * Run with: pnpm migrate:footer-links
 */
import mongoose from 'mongoose'
import { connectDb } from '../lib/server/db'
import { Navigation, Page } from '../lib/server/models/content'
import { FOOTPRINT_FOOTER_LINK, LEGAL_MENU_ITEMS, LEGAL_PAGES } from '../lib/legal/defaults'

type Item = { id: string; label: string; href: string; children?: Item[] }

async function main() {
  await connectDb()

  const footer = await Navigation.findOne({ menuKey: 'footer' }).lean<{ items: Item[] } | null>()
  let footerUpdated = false
  if (footer) {
    const items: Item[] = JSON.parse(JSON.stringify(footer.items ?? []))
    const hasFootprint = items.some((g) => g.href === FOOTPRINT_FOOTER_LINK.href || g.children?.some((c) => c.href === FOOTPRINT_FOOTER_LINK.href))
    if (!hasFootprint) {
      const company = items.find((g) => /company/i.test(g.label)) ?? items[items.length - 1]
      if (company) {
        company.children = [...(company.children ?? [])]
        const aboutIndex = company.children.findIndex((c) => c.href === '/about-us')
        company.children.splice(aboutIndex + 1, 0, { ...FOOTPRINT_FOOTER_LINK })
        await Navigation.updateOne({ menuKey: 'footer' }, { $set: { items } }, { runValidators: true })
        footerUpdated = true
      }
    }
  }

  const legal = await Navigation.findOne({ menuKey: 'legal' }).lean<{ items: Item[] } | null>()
  const legalItems: Item[] = JSON.parse(JSON.stringify(legal?.items ?? []))
  const missing = LEGAL_MENU_ITEMS.filter((item) => !legalItems.some((existing) => existing.href === item.href))
  if (missing.length) {
    const usedIds = new Set(legalItems.map((i) => i.id))
    for (const item of missing) legalItems.push({ ...item, id: usedIds.has(item.id) ? `${item.id}-${Date.now()}` : item.id })
    await Navigation.updateOne({ menuKey: 'legal' }, { $set: { items: legalItems } }, { upsert: true, runValidators: true })
  }

  let createdPages = 0
  for (const p of LEGAL_PAGES) {
    const content = { title: p.title, blocks: p.blocks, seo: p.seo }
    const result = await Page.updateOne(
      { path: p.path },
      {
        $setOnInsert: {
          path: p.path,
          pageType: p.pageType,
          draft: content,
          published: content,
          state: 'published',
          publishedAt: new Date(),
          isSystem: true,
          searchText: p.blocks.map((b) => `${b.data.heading} ${b.data.body}`).join(' ').slice(0, 20000),
        },
      },
      { upsert: true },
    )
    createdPages += result.upsertedCount
  }

  console.log(`[migrate:footer-links] footer updated: ${footerUpdated}; legal links added: ${missing.length}; legal pages created: ${createdPages}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => mongoose.disconnect())
