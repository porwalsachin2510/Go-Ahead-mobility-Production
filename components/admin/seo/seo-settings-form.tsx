'use client'

import { useRouter } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import { api } from '@/lib/client/api'

export type SeoSettingsValues = {
  defaultTitle: string
  titleTemplate: string
  defaultDescription: string
  ogImage: string
  robotsMode: 'allow' | 'disallow_all'
  extraDisallow: string[]
  indexing: { minWords: number; requireDescription: boolean }
  sitemap: { enabled: boolean; excludePaths: string[] }
  imageSitemap: boolean
  organization: { legalName: string; logo: string }
  integrations: { searchConsoleSiteUrl: string; bingSiteUrl: string; ga4PropertyId: string }
  verification: { google: string; bing: string; yandex: string; pinterest: string; baidu: string }
  indexNow: { enabled: boolean; key: string; lastSubmittedAt: string | null; lastStatus: string }
  llms: { enabled: boolean; intro: string }
}

const inputCls = 'w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 text-card-foreground">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  )
}

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

function Toggle({ id, label, checked, onChange, hint }: { id: string; label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <div className="flex items-start gap-3">
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 size-4 accent-primary" />
      <div className="flex flex-col gap-0.5">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        {hint ? <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p> : null}
      </div>
    </div>
  )
}

const lines = (v: string) => v.split('\n').map((l) => l.trim()).filter(Boolean)

export function SeoSettingsForm({ initial, siteUrl }: { initial: SeoSettingsValues; siteUrl: string }) {
  const router = useRouter()
  const [v, setV] = useState(initial)
  const [disallowText, setDisallowText] = useState(initial.extraDisallow.join('\n'))
  const [excludeText, setExcludeText] = useState(initial.sitemap.excludePaths.join('\n'))
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState<'recent' | 'all' | null>(null)
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)

  const set = <K extends keyof SeoSettingsValues>(key: K, value: SeoSettingsValues[K]) => setV((s) => ({ ...s, [key]: value }))

  async function save(regenerateKey = false) {
    setSaving(true)
    setMessage(null)
    const res = await api<{ saved: boolean; indexNowKey: string }>('/api/v1/admin/seo/settings', {
      method: 'PATCH',
      json: {
        defaultTitle: v.defaultTitle,
        titleTemplate: v.titleTemplate,
        defaultDescription: v.defaultDescription,
        ogImage: v.ogImage,
        robotsMode: v.robotsMode,
        extraDisallow: lines(disallowText),
        indexing: v.indexing,
        sitemap: { enabled: v.sitemap.enabled, excludePaths: lines(excludeText) },
        imageSitemap: v.imageSitemap,
        organization: v.organization,
        integrations: v.integrations,
        verification: v.verification,
        indexNow: { enabled: v.indexNow.enabled, regenerateKey },
        llms: v.llms,
      },
    })
    setSaving(false)
    if (!res.ok) return setMessage({ tone: 'error', text: res.error.message })
    setV((s) => ({ ...s, indexNow: { ...s.indexNow, key: res.data.indexNowKey } }))
    setMessage({ tone: 'success', text: 'SEO settings saved. Metadata, robots.txt and feeds update on the next request.' })
    router.refresh()
  }

  async function submit(scope: 'recent' | 'all') {
    setSubmitting(scope)
    setMessage(null)
    const res = await api<{ message: string; submitted: number; candidates: number }>('/api/v1/admin/seo/indexnow', { method: 'POST', json: { scope } })
    setSubmitting(null)
    if (!res.ok) return setMessage({ tone: 'error', text: res.error.message })
    setMessage({ tone: res.data.submitted ? 'success' : 'error', text: `${res.data.message} (${res.data.candidates} eligible URLs)` })
    router.refresh()
  }

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault()
        save()
      }}
    >
      <Section title="Global metadata" description="Fallbacks used when a page has no explicit title, description or share image.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field id="defaultTitle" label="Default title" hint={`${v.defaultTitle.length}/60 characters`}>
            <input id="defaultTitle" className={inputCls} value={v.defaultTitle} maxLength={70} onChange={(e) => set('defaultTitle', e.target.value)} />
          </Field>
          <Field id="titleTemplate" label="Title template" hint="%s is replaced with the page title, e.g. %s | Brand">
            <input id="titleTemplate" className={inputCls} value={v.titleTemplate} maxLength={90} onChange={(e) => set('titleTemplate', e.target.value)} />
          </Field>
        </div>
        <Field id="defaultDescription" label="Default meta description" hint={`${v.defaultDescription.length}/160 characters`}>
          <textarea id="defaultDescription" rows={3} className={inputCls} value={v.defaultDescription} maxLength={170} onChange={(e) => set('defaultDescription', e.target.value)} />
        </Field>
        <Field id="ogImage" label="Default social share image" hint="Absolute URL or site path, 1200 x 630 recommended.">
          <input id="ogImage" className={inputCls} value={v.ogImage} onChange={(e) => set('ogImage', e.target.value)} placeholder="/og-default.png" />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field id="legalName" label="Organization legal name" hint="Used in Organization structured data.">
            <input id="legalName" className={inputCls} value={v.organization.legalName} onChange={(e) => set('organization', { ...v.organization, legalName: e.target.value })} />
          </Field>
          <Field id="orgLogo" label="Organization logo">
            <input id="orgLogo" className={inputCls} value={v.organization.logo} onChange={(e) => set('organization', { ...v.organization, logo: e.target.value })} />
          </Field>
        </div>
      </Section>

      <Section title="Search engine verification" description="Paste only the content value from each provider's HTML meta-tag verification method. Tags are added to every page automatically.">
        <div className="grid gap-4 md:grid-cols-2">
          {(
            [
              ['google', 'Google Search Console'],
              ['bing', 'Bing Webmaster Tools'],
              ['yandex', 'Yandex Webmaster'],
              ['pinterest', 'Pinterest'],
              ['baidu', 'Baidu'],
            ] as const
          ).map(([key, label]) => (
            <Field key={key} id={`verify-${key}`} label={label}>
              <input id={`verify-${key}`} className={`${inputCls} font-mono`} value={v.verification[key]} onChange={(e) => set('verification', { ...v.verification, [key]: e.target.value.trim() })} />
            </Field>
          ))}
          <Field id="ga4" label="GA4 property ID" hint="Reference only; used to link reports.">
            <input id="ga4" className={`${inputCls} font-mono`} value={v.integrations.ga4PropertyId} onChange={(e) => set('integrations', { ...v.integrations, ga4PropertyId: e.target.value })} />
          </Field>
        </div>
      </Section>

      <Section title="Crawling and indexing" description="Controls robots.txt and which pages are allowed into search results.">
        <Field id="robotsMode" label="Robots mode">
          <select id="robotsMode" className={inputCls} value={v.robotsMode} onChange={(e) => set('robotsMode', e.target.value as SeoSettingsValues['robotsMode'])}>
            <option value="allow">Allow search engines (production)</option>
            <option value="disallow_all">Block all crawlers (staging / pre-launch)</option>
          </select>
        </Field>
        {v.robotsMode === 'disallow_all' ? <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">The entire site is hidden from search engines while this is set.</p> : null}
        <Field id="extraDisallow" label="Extra Disallow rules" hint="One path pattern per line, e.g. /thank-you or /*?ref=">
          <textarea id="extraDisallow" rows={3} className={`${inputCls} font-mono`} value={disallowText} onChange={(e) => setDisallowText(e.target.value)} />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field id="minWords" label="Thin-content threshold (words)" hint="Pages below this are flagged in the audit.">
            <input id="minWords" type="number" min={0} max={2000} className={inputCls} value={v.indexing.minWords} onChange={(e) => set('indexing', { ...v.indexing, minWords: Number(e.target.value) || 0 })} />
          </Field>
          <div className="flex items-end pb-1">
            <Toggle id="requireDescription" label="Require a meta description to index" checked={v.indexing.requireDescription} onChange={(c) => set('indexing', { ...v.indexing, requireDescription: c })} />
          </div>
        </div>
      </Section>

      <Section title="Sitemaps and AI discovery" description="Feeds that tell search engines and AI answer engines what to crawl.">
        <Toggle id="sitemapEnabled" label="XML sitemap" hint={`${siteUrl}/sitemap.xml`} checked={v.sitemap.enabled} onChange={(c) => set('sitemap', { ...v.sitemap, enabled: c })} />
        <Toggle id="imageSitemap" label="Image sitemap" hint={`${siteUrl}/image-sitemap.xml - helps images rank in Google Images`} checked={v.imageSitemap} onChange={(c) => set('imageSitemap', c)} />
        <Field id="excludePaths" label="Exclude from sitemap" hint="One path per line. Prefix matches, e.g. /legal">
          <textarea id="excludePaths" rows={3} className={`${inputCls} font-mono`} value={excludeText} onChange={(e) => setExcludeText(e.target.value)} />
        </Field>
        <Toggle id="llmsEnabled" label="llms.txt for AI assistants" hint={`${siteUrl}/llms.txt - a Markdown index ChatGPT, Perplexity and Claude can read`} checked={v.llms.enabled} onChange={(c) => set('llms', { ...v.llms, enabled: c })} />
        {v.llms.enabled ? (
          <Field id="llmsIntro" label="llms.txt introduction" hint="Describe what the company does, who it serves and where. AI answers quote this.">
            <textarea id="llmsIntro" rows={4} className={inputCls} value={v.llms.intro} maxLength={2000} onChange={(e) => set('llms', { ...v.llms, intro: e.target.value })} />
          </Field>
        ) : null}
      </Section>

      <Section title="IndexNow instant indexing" description="Pings Bing, Yandex, Seznam and Naver the moment content changes instead of waiting for a crawl.">
        <Toggle id="indexNowEnabled" label="Enable IndexNow" checked={v.indexNow.enabled} onChange={(c) => set('indexNow', { ...v.indexNow, enabled: c })} />
        {v.indexNow.key ? (
          <div className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">
              Key file: <span className="font-mono text-foreground">{siteUrl}/indexnow-key.txt</span>
            </span>
            {v.indexNow.lastSubmittedAt ? (
              <span className="text-muted-foreground">
                Last submission {new Date(v.indexNow.lastSubmittedAt).toLocaleString()}: <span className="text-foreground">{v.indexNow.lastStatus}</span>
              </span>
            ) : null}
          </div>
        ) : v.indexNow.enabled ? (
          <p className="text-sm text-muted-foreground">A key is generated when you save.</p>
        ) : null}
        {v.indexNow.enabled && initial.indexNow.enabled && v.indexNow.key ? (
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={!!submitting} onClick={() => submit('recent')} className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50">
              {submitting === 'recent' ? 'Submitting...' : 'Submit pages changed in last 7 days'}
            </button>
            <button type="button" disabled={!!submitting} onClick={() => submit('all')} className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50">
              {submitting === 'all' ? 'Submitting...' : 'Submit all indexable pages'}
            </button>
            <button type="button" disabled={saving} onClick={() => save(true)} className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50">
              Regenerate key
            </button>
          </div>
        ) : null}
      </Section>

      <div className="sticky bottom-0 flex flex-col gap-3 border-t border-border bg-background py-4 md:flex-row md:items-center md:justify-between">
        <div aria-live="polite" className="text-sm">
          {message ? <span className={message.tone === 'error' ? 'text-destructive' : 'text-success'}>{message.text}</span> : null}
        </div>
        <button type="submit" disabled={saving} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save SEO settings'}
        </button>
      </div>
    </form>
  )
}
