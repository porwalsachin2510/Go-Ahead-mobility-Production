/**
 * Idempotently creates the Safety & Trust CMS page and adds it to the Company menus.
 * Existing page content and administrator edits are never overwritten.
 *
 * Run with: pnpm migrate:safety-trust-page
 */
import mongoose from 'mongoose'
import { connectDb } from '../lib/server/db'
import { Navigation, Page, PageVersion } from '../lib/server/models/content'
import { DEFAULT_SAFETY_TRUST_PAGE, SAFETY_TRUST_NAV_LINK, SAFETY_TRUST_PATH } from '../lib/safety-trust/defaults'

type MenuKey = 'primary' | 'footer'
type MenuItem = {
  id: string
  label: string
  href: string
  description?: string
  visible?: boolean
  children?: MenuItem[]
  [key: string]: unknown
}

function ensureCompanySafetyLink(items: MenuItem[], menuKey: MenuKey) {
  const next = Array.isArray(items)
    ? items.map((item) => ({ ...item, children: [...(item.children ?? [])] }))
    : []

  let company = next.find((item) => String(item.label || '').trim().toLowerCase() === 'company')
  if (!company) {
    company = {
      id: menuKey === 'primary' ? 'company-primary' : 'company-footer',
      label: 'Company',
      href: menuKey === 'primary' ? '/about-us' : '',
      visible: true,
      children: [],
    }
    next.push(company)
  }

  company.visible = true
  const children = [...(company.children ?? [])]
  const matches = children
    .map((child, index) => ({ child, index }))
    .filter(({ child }) =>
      String(child.href || '').replace(/\/+$/, '') === SAFETY_TRUST_PATH ||
      String(child.label || '').trim().toLowerCase() === 'safety & trust',
    )

  const canonical: MenuItem = {
    ...(matches[0]?.child ?? {}),
    ...SAFETY_TRUST_NAV_LINK,
    id: matches[0]?.child.id || (menuKey === 'primary' ? 'company-safety-trust-primary' : 'company-safety-trust-footer'),
  }

  if (matches.length) {
    const keepIndex = matches[0].index
    company.children = children
      .map((child, index) => index === keepIndex ? canonical : child)
      .filter((_child, index) => index === keepIndex || !matches.some((match) => match.index === index))
  } else {
    const whyIndex = children.findIndex((child) =>
      String(child.href || '').replace(/\/+$/, '') === '/company/why-choose-us' ||
      String(child.label || '').trim().toLowerCase() === 'why choose us',
    )
    if (whyIndex >= 0) children.splice(whyIndex + 1, 0, canonical)
    else children.push(canonical)
    company.children = children
  }

  return { items: next, changed: JSON.stringify(next) !== JSON.stringify(items ?? []) }
}

async function ensureMenu(menuKey: MenuKey) {
  const menu = await Navigation.findOneAndUpdate(
    { menuKey },
    { $setOnInsert: { menuKey, items: [] } },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  ).lean<any>()
  if (!menu) throw new Error('Unable to initialize the ' + menuKey + ' navigation menu')

  const result = ensureCompanySafetyLink(menu.items ?? [], menuKey)
  if (!result.changed) return false

  const saved = await Navigation.updateOne(
    { _id: menu._id, ...(menu.updatedAt ? { updatedAt: menu.updatedAt } : {}) },
    { $set: { items: result.items } },
    { runValidators: true },
  )
  if (saved.matchedCount !== 1) throw new Error('Navigation changed concurrently; rerun the migration for ' + menuKey)
  return true
}

function collectText(value: unknown, output: string[]) {
  if (typeof value === 'string') output.push(value)
  else if (Array.isArray(value)) value.forEach((item) => collectText(item, output))
  else if (value && typeof value === 'object') Object.values(value).forEach((item) => collectText(item, output))
}

async function main() {
  await connectDb()

  let createdPage = false
  let createdVersion = false
  let page = await Page.findOne({ path: SAFETY_TRUST_PATH })

  if (!page) {
    const content = {
      title: DEFAULT_SAFETY_TRUST_PAGE.title,
      blocks: DEFAULT_SAFETY_TRUST_PAGE.blocks,
      seo: DEFAULT_SAFETY_TRUST_PAGE.seo,
    }
    const searchable: string[] = [content.title]
    collectText(content.blocks, searchable)
    page = await Page.create({
      path: SAFETY_TRUST_PATH,
      pageType: 'company',
      draft: content,
      published: content,
      state: 'published',
      publishedAt: new Date(),
      isSystem: true,
      searchText: searchable.join(' ').replace(/\s+/g, ' ').slice(0, 20000),
    })
    createdPage = true
    await PageVersion.create({
      pageId: page._id,
      versionNumber: page.revision ?? 1,
      snapshot: content,
      kind: 'publish',
      changeNote: 'Initial Safety & Trust page content',
    })
    createdVersion = true
  }

  const primaryUpdated = await ensureMenu('primary')
  const footerUpdated = await ensureMenu('footer')

  console.log(
    '[migrate:safety-trust-page] page created: ' + createdPage +
    '; initial version created: ' + createdVersion +
    '; primary Company menu updated: ' + primaryUpdated +
    '; footer Company menu updated: ' + footerUpdated +
    '; path: ' + SAFETY_TRUST_PATH +
    '; page state: ' + page.state,
  )
  if (page.state !== 'published') {
    console.log('[migrate:safety-trust-page] existing page retained its current publication state and content')
  }
}

main()
  .catch((error) => {
    console.error('[migrate:safety-trust-page] failed', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await mongoose.disconnect()
  })
