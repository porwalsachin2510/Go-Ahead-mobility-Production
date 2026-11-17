/**
 * Idempotently adds the Why Choose Us link to both live Company navigation menus.
 * Preserves existing items and repairs stale hrefs or duplicate entries.
 *
 * Run with: pnpm migrate:why-choose-us-page
 */
import mongoose from 'mongoose'
import { connectDb } from '../lib/server/db'
import { Navigation } from '../lib/server/models/content'
import { WhyChooseUsPageContent } from '../lib/server/models/editorial'
import { DEFAULT_WHY_CHOOSE_US_PAGE_CONTENT } from '../lib/why-choose-us/defaults'

const ROUTE = '/company/why-choose-us'
const LEGACY_HERO_IMAGE = '/images/site/transport-hero.png'
type MenuKey = 'primary' | 'footer'

function ensureWhyChooseUs(items: any[], menuKey: MenuKey) {
  const next = Array.isArray(items) ? items.map((item) => ({ ...item, children: [...(item.children ?? [])] })) : []
  let company = next.find((item) => String(item.label || '').trim().toLowerCase() === 'company')
  if (!company) {
    company = {
      id: menuKey === 'primary' ? 'company-primary' : 'company-footer',
      label: 'Company',
      href: menuKey === 'primary' ? '/about-us' : '',
      children: [],
    }
    next.push(company)
  }
  company.visible = true

  const children = Array.isArray(company.children) ? [...company.children] : []
  const normalize = (href: string) => String(href || '').split(/[?#]/, 1)[0].replace(/\/+$/, '').toLowerCase() || '/'
  const matches = children
    .map((child: any, index: number) => ({ child, index }))
    .filter(({ child }: { child: any }) =>
      normalize(child.href) === ROUTE ||
      String(child.label || '').trim().toLowerCase() === 'why choose us',
    )

  const canonical = {
    ...(matches[0]?.child ?? {}),
    id: matches[0]?.child?.id || (menuKey === 'primary' ? 'n5d' : 'f3d'),
    label: 'Why Choose Us',
    href: ROUTE,
    visible: true,
  }

  if (matches.length) {
    const keepIndex = matches[0].index
    company.children = children
      .map((child: any, index: number) => index === keepIndex ? canonical : child)
      .filter((_child: any, index: number) => index === keepIndex || !matches.some((match: { index: number }) => match.index === index))
  } else {
    const careersIndex = children.findIndex((child) => String(child.label || '').trim().toLowerCase() === 'careers')
    if (careersIndex >= 0) children.splice(careersIndex, 0, canonical)
    else children.push(canonical)
    company.children = children
  }

  return { items: next, changed: JSON.stringify(next) !== JSON.stringify(items ?? []) }
}

async function main() {
  await connectDb()

  for (const menuKey of ['primary', 'footer'] as const) {
    const menu = await Navigation.findOneAndUpdate(
      { menuKey },
      { $setOnInsert: { menuKey, items: [] } },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    ).lean<any>()
    if (!menu) throw new Error('Unable to initialize the ' + menuKey + ' navigation menu')

    const result = ensureWhyChooseUs(menu.items, menuKey)
    if (!result.changed) continue
    await Navigation.updateOne(
      { _id: menu._id, ...(menu.updatedAt ? { updatedAt: menu.updatedAt } : {}) },
      { $set: { items: result.items } },
      { runValidators: true },
    )
  }

  console.log('[why-choose-us-page-migration] primary and footer Company links are present')

  // Only replace hero media that is still the superseded default, so editor-chosen images are preserved.
  const heroUpdate = await WhyChooseUsPageContent.updateMany(
    { key: 'why-choose-us-page', heroImage: { $in: ['', null, LEGACY_HERO_IMAGE] } },
    { $set: { heroImage: DEFAULT_WHY_CHOOSE_US_PAGE_CONTENT.heroImage, heroImagePosition: DEFAULT_WHY_CHOOSE_US_PAGE_CONTENT.heroImagePosition } },
    { runValidators: true },
  )
  const ogUpdate = await WhyChooseUsPageContent.updateMany(
    { key: 'why-choose-us-page', ogImage: { $in: ['', null, LEGACY_HERO_IMAGE] } },
    { $set: { ogImage: DEFAULT_WHY_CHOOSE_US_PAGE_CONTENT.ogImage } },
    { runValidators: true },
  )
  console.log('[why-choose-us-page-migration] hero image updated on ' + heroUpdate.modifiedCount + ' doc(s), og image on ' + ogUpdate.modifiedCount)
}

main()
  .catch((error) => {
    console.error('[why-choose-us-page-migration] failed', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await mongoose.disconnect()
  })
