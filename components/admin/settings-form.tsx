'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { api, fetcher } from '@/lib/client/api'
import { Card, FieldShell, Input, Notice, Select, Textarea } from './ui'

type Settings = Record<string, Record<string, string> | string | undefined>
type F = { key: string; label: string; type?: 'textarea' | 'email' | 'url' | 'robots'; help?: string }
type Section = { key: string | null; title: string; fields: F[] }

const SECTIONS: Section[] = [
  { key: null, title: 'Brand', fields: [{ key: 'brandName', label: 'Brand name' }, { key: 'tagline', label: 'Tagline' }, { key: 'siteUrl', label: 'Site URL', type: 'url', help: 'Canonical production URL, used for SEO and emails' }] },
  { key: 'contact', title: 'Contact details', fields: [{ key: 'email', label: 'General email', type: 'email' }, { key: 'phone', label: 'Phone' }, { key: 'address', label: 'Address', type: 'textarea' }, { key: 'hours', label: 'Business hours' }, { key: 'mapUrl', label: 'Map link', type: 'url' }, { key: 'accommodationEmail', label: 'Accommodation enquiries email', type: 'email' }, { key: 'transportEmail', label: 'Transport enquiries email', type: 'email' }, { key: 'careersEmail', label: 'Careers email', type: 'email' }] },
  { key: 'header', title: 'Header', fields: [{ key: 'primaryCtaLabel', label: 'Primary button label' }, { key: 'primaryCtaHref', label: 'Primary button link', type: 'url' }] },
  { key: 'footer', title: 'Footer', fields: [{ key: 'blurb', label: 'Footer blurb', type: 'textarea' }, { key: 'newsletterHeading', label: 'Newsletter heading' }, { key: 'newsletterCopy', label: 'Newsletter copy', type: 'textarea' }] },
  { key: 'social', title: 'Social profiles', fields: [{ key: 'linkedin', label: 'LinkedIn', type: 'url' }, { key: 'x', label: 'X', type: 'url' }, { key: 'instagram', label: 'Instagram', type: 'url' }, { key: 'youtube', label: 'YouTube', type: 'url' }, { key: 'facebook', label: 'Facebook', type: 'url' }] },
  { key: 'seo', title: 'Default SEO', fields: [{ key: 'defaultTitle', label: 'Default title' }, { key: 'titleTemplate', label: 'Title template', help: 'Use %s for the page title, e.g. "%s | GoAhead Mobility"' }, { key: 'defaultDescription', label: 'Default description', type: 'textarea' }, { key: 'ogImage', label: 'Default social image URL', type: 'url' }, { key: 'robotsMode', label: 'Search engine indexing', type: 'robots' }] },
  { key: 'notifications', title: 'Notifications', fields: [{ key: 'salesInbox', label: 'Sales inbox (new leads)', type: 'email' }, { key: 'hrInbox', label: 'HR inbox (applications)', type: 'email' }, { key: 'senderName', label: 'Email sender name' }, { key: 'acknowledgementCopy', label: 'Enquiry acknowledgement text', type: 'textarea' }] },
]

export function SettingsForm() {
  const { data, error, mutate } = useSWR<Settings>('/api/v1/admin/settings', fetcher)
  const [draft, setDraft] = useState<Settings | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState<{ tone: 'error' | 'success'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  if (error) return <Notice tone="error">{error.message}</Notice>
  if (!data) return <p className="text-sm text-muted-foreground">Loading…</p>
  const value = draft ?? data

  const get = (section: string | null, key: string) => String((section ? (value[section] as Record<string, string> | undefined)?.[key] : value[key]) ?? '')
  const set = (section: string | null, key: string, v: string) => {
    if (!section) return setDraft({ ...value, [key]: v })
    setDraft({ ...value, [section]: { ...((value[section] as Record<string, string>) ?? {}), [key]: v } })
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    setErrors({})
    const payload: Record<string, unknown> = {}
    for (const s of SECTIONS) {
      if (!s.key) for (const f of s.fields) payload[f.key] = get(null, f.key)
      else payload[s.key] = Object.fromEntries(s.fields.map((f) => [f.key, get(s.key, f.key) || (f.type === 'robots' ? 'allow' : '')]))
    }
    const r = await api<Settings>('/api/v1/admin/settings', { method: 'PATCH', json: payload })
    setBusy(false)
    if (r.ok) {
      setDraft(null)
      await mutate(r.data, { revalidate: false })
      setMsg({ tone: 'success', text: 'Settings saved. The live site is updated.' })
    } else {
      setErrors(r.error.details ?? {})
      setMsg({ tone: 'error', text: r.error.message })
    }
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-6">
      {SECTIONS.map((s) => (
        <Card key={s.title}>
          <h2 className="mb-4 font-serif text-lg font-semibold">{s.title}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {s.fields.map((f) => {
              const id = `set-${s.key ?? 'root'}-${f.key}`
              const path = s.key ? `${s.key}.${f.key}` : f.key
              const v = get(s.key, f.key)
              return (
                <div key={f.key} className={f.type === 'textarea' ? 'md:col-span-2' : undefined}>
                  <FieldShell id={id} label={f.label} help={f.help} error={errors[path]}>
                    {f.type === 'textarea' ? (
                      <Textarea id={id} rows={3} value={v} onChange={(e) => set(s.key, f.key, e.target.value)} />
                    ) : f.type === 'robots' ? (
                      <Select id={id} value={v || 'allow'} onChange={(e) => set(s.key, f.key, e.target.value)}>
                        <option value="allow">Allow indexing (production)</option>
                        <option value="disallow_all">Block all crawlers (staging)</option>
                      </Select>
                    ) : (
                      <Input id={id} type={f.type === 'email' ? 'email' : 'text'} value={v} onChange={(e) => set(s.key, f.key, e.target.value)} />
                    )}
                  </FieldShell>
                </div>
              )
            })}
          </div>
        </Card>
      ))}
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
      <div className="sticky bottom-4 flex justify-end">
        <Button type="submit" disabled={busy || !draft} className="shadow-lg">{busy ? 'Saving…' : 'Save settings'}</Button>
      </div>
    </form>
  )
}
