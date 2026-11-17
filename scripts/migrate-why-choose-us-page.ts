/**
 * One-time, idempotent migration for the Company > Why Choose Us navigation link.
 * Preserves existing menu items and adds the link to primary/footer Company menus.
 *
 * Run with: pnpm migrate:why-choose-us-page
 */
import mongoose from 'mongoose'
import { connectDb } from '../lib/server/db'
import { Navigation } from '../lib/server/models/content'

const ROUTE = '/company/why-choose-us'

function ensureWhyChooseUs(items: any[], menuKey: string) {
  const next = Array.isArray(items) ? items.map((item) => ({ ...item })) : []
  const company = next.find((item) => String(item.label || '').trim().toLowerCase() === 'company')
  if (!company) return { items: next, changed: false }

  const children = Array.isArray(company.children) ? company.children.map((child: any) => ({ ...child })) : []
  if (children.some((child: any) => child.href === ROUTE || String(child.label || '').trim().toLowerCase() === 'why choose us')) {
    return { items: next, changed: false }
  }

  const entry = {
    id: menuKey === 'primary' ? 'n5d' : 'f3d',
    label: 'Why Choose Us',
    href: ROUTE,
  }
  const careersIndex = children.findIndex((child: any) => String(child.label || '').trim().toLowerCase() === 'careers')
  if (careersIndex >= 0) children.splice(careersIndex, 0, entry)
  else children.push(entry)
  company.children = children
  return { items: next, changed: true }
}

async function main() {
  await connectDb()
  const menus = await Navigation.find({ menuKey: { $in: ['primary', 'footer'] } }).lean<any[]>()
  let updated = 0
  for (const menu of menus) {
    const result = ensureWhyChooseUs(menu.items, String(menu.menuKey))
    if (!result.changed) continue
    const write = await Navigation.updateOne(
      { _id: menu._id, ...(menu.updatedAt ? { updatedAt: menu.updatedAt } : {}) },
      { $set: { items: result.items } },
      { runValidators: true },
    )
    updated += write.modifiedCount
  }
  console.log('[why-choose-us-page-migration] updated Company menus: ' + updated)
}

main()
  .catch((error) => {
    console.error('[why-choose-us-page-migration] failed', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await mongoose.disconnect()
  })
