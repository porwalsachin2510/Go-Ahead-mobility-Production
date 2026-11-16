import 'server-only'
import { z, type ZodType } from 'zod'
import type { FieldDef } from '@/lib/fields'
import { BLOCK_MAP } from '@/lib/blocks'

const OBJECT_ID = /^[a-f0-9]{24}$/i
const SAFE_URL = /^(\/(?!\/)[^\s]*|https?:\/\/[^\s]+|mailto:[^\s]+|tel:[+\d\s()-]+|#[\w-]*)$/i

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Required')
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and single hyphens')

export const urlSchema = z
  .string()
  .trim()
  .max(1000)
  .refine((v) => v === '' || SAFE_URL.test(v), 'Use a site path like /contact or a full https:// URL')

const seoObject = z
  .object({
    title: z.string().trim().max(200).default(''),
    description: z.string().trim().max(400).default(''),
    canonical: urlSchema.default(''),
    noindex: z.boolean().default(false),
    nofollow: z.boolean().default(false),
    ogTitle: z.string().trim().max(200).default(''),
    ogDescription: z.string().trim().max(400).default(''),
    ogImage: urlSchema.default(''),
    focusKeyword: z.string().trim().max(120).default(''),
    keywords: z.array(z.string().trim().min(1).max(80)).max(10).default([]),
    faq: z.array(z.object({
      question: z.string().trim().min(1).max(300),
      answer: z.string().trim().min(1).max(2000),
    })).max(20).default([]),
    schemaJson: z.string().max(10000).default(''),
  })
  .partial()

function fieldSchema(field: FieldDef): ZodType {
  const req = field.required
  switch (field.kind) {
    case 'text':
    case 'textarea': {
      const s = z.string().trim().max(field.max ?? (field.kind === 'text' ? 300 : 4000))
      return req ? s.min(1, 'Required') : s.default('')
    }
    case 'email': {
      const s = z.string().trim().max(254)
      return req ? z.email('Enter a valid email') : s.refine((v) => v === '' || z.email().safeParse(v).success, 'Enter a valid email').default('')
    }
    case 'markdown': {
      const s = z.string().max(field.max ?? 60000)
      return req ? s.trim().min(1, 'Required') : s.default('')
    }
    case 'url':
    case 'image':
      return req ? urlSchema.refine((v) => v !== '', 'Required') : urlSchema.default('')
    case 'number': {
      let n = z.coerce.number()
      if (field.min !== undefined) n = n.min(field.min)
      if (field.max !== undefined) n = n.max(field.max)
      return req ? n : z.union([n, z.null(), z.literal('').transform(() => null)]).optional()
    }
    case 'boolean':
      return z.boolean().default(false)
    case 'date':
      return z
        .union([z.coerce.date(), z.null(), z.literal('').transform(() => null)])
        .optional()
        .transform((v) => (v instanceof Date && !Number.isNaN(v.getTime()) ? v : null))
    case 'tags':
      return z.array(z.string().trim().min(1).max(120)).max(50).default([])
    case 'select': {
      const values = field.options.map((o) => o.value) as [string, ...string[]]
      return z.enum(values).default(values[0])
    }
    case 'ref':
      return field.multiple
        ? z.array(z.string().regex(OBJECT_ID)).max(50).default([])
        : z.union([z.string().regex(OBJECT_ID), z.null(), z.literal('').transform(() => null)]).optional()
    case 'list':
      return z.array(objectSchema(field.itemFields)).max(field.maxItems ?? 40).default([])
    case 'seo':
      return seoObject.default({})
  }
}

/** Strict object: unknown keys are stripped, so callers cannot mass-assign unlisted fields. */
export function objectSchema(fields: FieldDef[]) {
  const shape: Record<string, ZodType> = {}
  for (const f of fields) shape[f.key] = fieldSchema(f)
  return z.object(shape)
}

export function parseFields(fields: FieldDef[], input: unknown, opts: { partial?: boolean } = {}) {
  const schema = objectSchema(fields)
  if (!opts.partial) return schema.parse(input) as Record<string, unknown>
  const parsed = schema.partial().parse(input) as Record<string, unknown>
  // Zod still applies field defaults to omitted keys under .partial(); keep only keys the client sent,
  // otherwise a partial PATCH silently resets status/flags (e.g. unpublishing content).
  const sent = input && typeof input === 'object' ? new Set(Object.keys(input as object)) : new Set<string>()
  return Object.fromEntries(Object.entries(parsed).filter(([key]) => sent.has(key)))
}

const blockInput = z.object({
  id: z.string().trim().min(1).max(40),
  type: z.string(),
  hidden: z.boolean().optional().default(false),
  data: z.record(z.string(), z.unknown()).default({}),
})

/** Validates every block's data against its block definition (unknown block types are rejected). */
export function parseBlocks(input: unknown) {
  const blocks = z.array(blockInput).max(40).parse(input)
  return blocks.map((b, i) => {
    const def = BLOCK_MAP[b.type]
    if (!def) throw new z.ZodError([{ code: 'custom', path: ['blocks', i, 'type'], message: `Unknown block type "${b.type}"`, input: b.type }])
    const result = objectSchema(def.fields).safeParse(b.data)
    if (!result.success) {
      throw new z.ZodError(result.error.issues.map((iss) => ({ ...iss, path: ['blocks', i, 'data', ...iss.path] })))
    }
    return { id: b.id, type: b.type, hidden: b.hidden, data: result.data as Record<string, unknown> }
  })
}
