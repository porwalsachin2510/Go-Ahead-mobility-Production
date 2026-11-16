'use client'

import { useId, useState } from 'react'
import useSWR from 'swr'
import { ChevronDown, ChevronUp, Plus, Trash2, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api, fetcher } from '@/lib/client/api'
import { emptyRecord, emptyValueFor, type FieldDef, type Option } from '@/lib/fields'
import { FieldShell, Input, Select, Textarea } from './ui'

type Props = { field: FieldDef; value: unknown; onChange: (v: unknown) => void; error?: string }

export function FieldInput({ field, value, onChange, error }: Props) {
  const id = useId()
  const shell = (child: React.ReactNode) => (
    <FieldShell id={id} label={field.label} help={field.help} error={error} required={field.required}>
      {child}
    </FieldShell>
  )
  const str = typeof value === 'string' ? value : value == null ? '' : String(value)

  switch (field.kind) {
    case 'text':
    case 'url':
    case 'email':
      return shell(<Input id={id} type={field.kind === 'email' ? 'email' : 'text'} value={str} maxLength={'max' in field ? field.max : undefined} placeholder={field.kind === 'url' ? 'https:// or /path' : undefined} onChange={(e) => onChange(e.target.value)} />)
    case 'textarea':
      return shell(<Textarea id={id} value={str} maxLength={field.max} onChange={(e) => onChange(e.target.value)} />)
    case 'markdown':
      return shell(<Textarea id={id} value={str} className="min-h-72 font-mono text-xs" onChange={(e) => onChange(e.target.value)} />)
    case 'number':
      return shell(<Input id={id} type="number" value={value == null ? '' : String(value)} min={field.min} max={field.max} onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))} />)
    case 'boolean':
      return (
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" className="size-4 accent-primary" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
          {field.label}
        </label>
      )
    case 'date':
      return shell(<Input id={id} type="datetime-local" value={toLocalInput(value)} onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)} />)
    case 'select':
      return shell(
        <Select id={id} value={str} onChange={(e) => onChange(e.target.value)}>
          {field.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>,
      )
    case 'tags':
      return shell(<TagsInput id={id} value={Array.isArray(value) ? (value as string[]) : []} onChange={onChange} />)
    case 'image':
      return shell(<ImageInput id={id} value={str} onChange={onChange} />)
    case 'ref':
      return shell(<RefInput id={id} resource={field.resource} multiple={field.multiple} value={value} onChange={onChange} />)
    case 'seo':
      return <SeoInput value={(value as Record<string, unknown>) ?? {}} onChange={onChange} />
    case 'list':
      return <ListInput field={field} value={Array.isArray(value) ? (value as Record<string, unknown>[]) : []} onChange={onChange} />
  }
}

function toLocalInput(v: unknown) {
  if (!v) return ''
  const d = new Date(String(v))
  if (Number.isNaN(d.getTime())) return ''
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

function TagsInput({ id, value, onChange }: { id: string; value: string[]; onChange: (v: unknown) => void }) {
  const [draft, setDraft] = useState('')
  const add = () => {
    const t = draft.trim()
    if (t && !value.includes(t)) onChange([...value, t])
    setDraft('')
  }
  return (
    <div className="flex flex-col gap-2">
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {value.map((t) => (
            <li key={t} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground">
              {t}
              <button
                type="button"
                aria-label={`Remove ${t}`}
                onClick={() => onChange(value.filter((x) => x !== t))}
                className="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <Input
        id={id}
        value={draft}
        placeholder="Type and press Enter"
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) {
            e.preventDefault()
            add()
          }
        }}
        onBlur={add}
      />
    </div>
  )
}

export function ImageInput({ id, value, onChange }: { id: string; value: string; onChange: (v: unknown) => void }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const upload = async (file: File) => {
    setBusy(true)
    setErr('')
    const fd = new FormData()
    fd.append('file', file)
    const r = await api<{ _id: string; url?: string }>('/api/v1/admin/media', { method: 'POST', body: fd })
    setBusy(false)
    if (!r.ok) return setErr(r.error.message)
    onChange(r.data.url || `/api/v1/media/${r.data._id}`)
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-3">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="size-16 shrink-0 rounded-md border border-border object-cover" />
        ) : (
          <div className="size-16 shrink-0 rounded-md border border-dashed border-border bg-muted" />
        )}
        <div className="flex flex-1 flex-col gap-2">
          <Input id={id} value={value} placeholder="Image URL or upload" onChange={(e) => onChange(e.target.value)} />
          <label className="inline-flex w-fit cursor-pointer items-center gap-1.5 text-xs font-medium text-primary">
            <Upload className="size-3.5" />
            {busy ? 'Uploading…' : 'Upload image'}
            <input type="file" accept="image/*" className="sr-only" disabled={busy} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          </label>
        </div>
      </div>
      {err && <p className="text-xs text-destructive">{err}</p>}
    </div>
  )
}

function RefInput({ id, resource, multiple, value, onChange }: { id: string; resource: string; multiple?: boolean; value: unknown; onChange: (v: unknown) => void }) {
  const { data: options = [] } = useSWR<Option[]>(`/api/v1/admin/refs/${resource}`, fetcher)
  const norm = (v: unknown) => (v && typeof v === 'object' && '_id' in v ? String((v as { _id: string })._id) : v ? String(v) : '')
  if (multiple) {
    const selected = Array.isArray(value) ? value.map(norm) : []
    return (
      <div id={id} className="flex max-h-48 flex-col gap-1 overflow-y-auto rounded-lg border border-input p-2">
        {options.length === 0 && <p className="px-1 text-xs text-muted-foreground">No options yet.</p>}
        {options.map((o) => (
          <label key={o.value} className="flex items-center gap-2 px-1 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-primary"
              checked={selected.includes(o.value)}
              onChange={(e) => onChange(e.target.checked ? [...selected, o.value] : selected.filter((s) => s !== o.value))}
            />
            {o.label}
          </label>
        ))}
      </div>
    )
  }
  return (
    <Select id={id} value={norm(value)} onChange={(e) => onChange(e.target.value || null)}>
      <option value="">— None —</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </Select>
  )
}

const SEO_FIELDS: FieldDef[] = [
  { key: 'title', label: 'SEO title', kind: 'text', max: 70, help: 'Up to ~60 characters.' },
  { key: 'description', label: 'Meta description', kind: 'textarea', max: 170, help: 'Up to ~155 characters.' },
  { key: 'canonical', label: 'Canonical URL', kind: 'url' },
  { key: 'ogImage', label: 'Social share image', kind: 'image' },
  { key: 'noindex', label: 'Hide from search engines (noindex)', kind: 'boolean' },
]

function SeoInput({ value, onChange }: { value: Record<string, unknown>; onChange: (v: unknown) => void }) {
  return (
    <fieldset className="flex flex-col gap-4 rounded-lg border border-border p-4">
      <legend className="px-1 text-sm font-semibold">Search & social</legend>
      {SEO_FIELDS.map((f) => (
        <FieldInput key={f.key} field={f} value={value[f.key]} onChange={(v) => onChange({ ...value, [f.key]: v })} />
      ))}
    </fieldset>
  )
}

function ListInput({ field, value, onChange }: { field: Extract<FieldDef, { kind: 'list' }>; value: Record<string, unknown>[]; onChange: (v: unknown) => void }) {
  const move = (i: number, d: number) => {
    const next = [...value]
    const [it] = next.splice(i, 1)
    next.splice(i + d, 0, it)
    onChange(next)
  }
  const canAdd = !field.maxItems || value.length < field.maxItems
  return (
    <fieldset className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <legend className="px-1 text-sm font-semibold">{field.label}</legend>
      {value.map((item, i) => (
        <div key={i} className="flex flex-col gap-3 rounded-md bg-muted/60 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {field.itemLabel ?? 'Item'} {i + 1}
            </span>
            <div className="flex items-center gap-1">
              <Button type="button" size="icon" variant="ghost" className="size-7" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">
                <ChevronUp className="size-4" />
              </Button>
              <Button type="button" size="icon" variant="ghost" className="size-7" disabled={i === value.length - 1} onClick={() => move(i, 1)} aria-label="Move down">
                <ChevronDown className="size-4" />
              </Button>
              <Button type="button" size="icon" variant="ghost" className="size-7 text-destructive" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Remove">
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
          {field.itemFields.map((f) => (
            <FieldInput key={f.key} field={f} value={item[f.key] ?? emptyValueFor(f)} onChange={(v) => onChange(value.map((it, j) => (j === i ? { ...it, [f.key]: v } : it)))} />
          ))}
        </div>
      ))}
      {canAdd && (
        <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => onChange([...value, emptyRecord(field.itemFields)])}>
          <Plus className="size-4" /> Add {field.itemLabel?.toLowerCase() ?? 'item'}
        </Button>
      )}
    </fieldset>
  )
}

export function FieldGroup({ fields, value, onChange, errors = {} }: { fields: FieldDef[]; value: Record<string, unknown>; onChange: (v: Record<string, unknown>) => void; errors?: Record<string, string> }) {
  return (
    <div className="flex flex-col gap-5">
      {fields.map((f) => (
        <FieldInput key={f.key} field={f} value={value[f.key] ?? emptyValueFor(f)} error={errors[f.key]} onChange={(v) => onChange({ ...value, [f.key]: v })} />
      ))}
    </div>
  )
}
