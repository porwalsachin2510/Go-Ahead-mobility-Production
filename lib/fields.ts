/**
 * Declarative field definitions shared by the admin editors (client) and the server-side
 * validators. A single definition drives the form UI, the Zod schema and the allow-list of
 * writable fields, so the browser can never set a field the server does not expect.
 */
export type Option = { value: string; label: string }

type Base = { key: string; label: string; help?: string; required?: boolean; adminOnly?: boolean }

export type FieldDef =
  | (Base & { kind: 'text' | 'textarea' | 'url' | 'image' | 'email'; max?: number; placeholder?: string })
  | (Base & { kind: 'markdown'; max?: number })
  | (Base & { kind: 'number'; min?: number; max?: number })
  | (Base & { kind: 'boolean' })
  | (Base & { kind: 'date' })
  | (Base & { kind: 'tags' })
  | (Base & { kind: 'select'; options: readonly Option[] })
  | (Base & { kind: 'ref'; resource: string; multiple?: boolean })
  | (Base & { kind: 'list'; itemFields: FieldDef[]; itemLabel?: string; maxItems?: number })
  | (Base & { kind: 'seo' })

export const VERTICAL_OPTIONS: Option[] = [
  { value: 'general', label: 'General' },
  { value: 'accommodation', label: 'Global Accommodation' },
  { value: 'transport', label: 'Local Transportation' },
  { value: 'both', label: 'Both verticals' },
]

export const CONTENT_STATUS_OPTIONS: Option[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'in_review', label: 'In review' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
]

export const ICON_OPTIONS: Option[] = [
  'building',
  'bed',
  'plane',
  'car',
  'bus',
  'users',
  'shield',
  'route',
  'clock',
  'chart',
  'globe',
  'factory',
  'calendar',
  'cpu',
  'headset',
  'receipt',
  'map',
  'check',
  'briefcase',
  'heart',
].map((v) => ({ value: v, label: v }))

export function emptyValueFor(field: FieldDef): unknown {
  switch (field.kind) {
    case 'number':
      return null
    case 'boolean':
      // Visibility toggles should default on for newly added repeatable items; section toggles remain off.
      return field.key === 'visible'
    case 'tags':
    case 'list':
      return []
    case 'ref':
      return field.multiple ? [] : null
    case 'date':
      return null
    case 'select':
      return field.options[0]?.value ?? ''
    case 'seo':
      return { title: '', description: '', canonical: '', noindex: false, ogImage: '' }
    default:
      return ''
  }
}

export function emptyRecord(fields: FieldDef[]): Record<string, unknown> {
  return Object.fromEntries(fields.map((f) => [f.key, emptyValueFor(f)]))
}
