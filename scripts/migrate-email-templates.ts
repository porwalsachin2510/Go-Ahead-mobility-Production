/**
 * Upgrades stored email templates to the professional defaults.
 * Only templates still at version 1 (seeded, never edited in the admin) are replaced; admin-customised templates are preserved.
 * Missing templates are created. Run with `pnpm migrate:email-templates`.
 */
import mongoose from 'mongoose'
import { connectDb } from '../lib/server/db'
import { EmailTemplate } from '../lib/server/models/operations'
import { DEFAULT_TEMPLATES } from '../lib/server/services/email'

async function main() {
  await connectDb()
  let updated = 0
  let created = 0
  let kept = 0
  for (const t of DEFAULT_TEMPLATES) {
    const existing = await EmailTemplate.findOne({ slug: t.slug }).lean<any>()
    const fields = { name: t.name, subject: t.subject, preheader: t.preheader, body: t.body, allowedVariables: t.allowedVariables }
    if (!existing) {
      await EmailTemplate.create({ slug: t.slug, ...fields, version: 2, enabled: true })
      created++
    } else if ((existing.version ?? 1) <= 1) {
      await EmailTemplate.updateOne({ _id: existing._id }, { $set: { ...fields, version: 2 } })
      updated++
    } else {
      await EmailTemplate.updateOne({ _id: existing._id }, { $addToSet: { allowedVariables: { $each: t.allowedVariables } } })
      kept++
      console.log(`[email-templates] kept customised template "${t.slug}" (v${existing.version}); added any new variables`)
    }
  }
  console.log(`[email-templates] updated ${updated}, created ${created}, kept ${kept} customised`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => mongoose.disconnect())
