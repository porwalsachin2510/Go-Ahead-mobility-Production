'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { motion, useReducedMotion } from 'motion/react'
import {
  ArrowDown, ArrowRight, BarChart3, ChartNoAxesColumnIncreasing, ChevronDown, CircleHelp,
  Cookie, Headset, Info, LockKeyhole, Mail, Megaphone, ShieldCheck, UserRoundCog,
  type LucideIcon,
} from 'lucide-react'

type CookiePolicyPageRecord = {
  title: string
  path: string
  blocks: Array<{ id: string; type: string; hidden?: boolean; data?: Record<string, unknown> }>
}
type Data = Record<string, any>
type CategoryKey = 'necessary' | 'preferences' | 'analytics' | 'marketing'
type CookiePreferences = Record<CategoryKey, boolean> & { version: 1; updatedAt: string }

const STORAGE_KEY = 'goahead-cookie-preferences-v1'
const COOKIE_NAME = 'goahead_cookie_preferences'
const CATEGORY_KEYS: CategoryKey[] = ['necessary', 'preferences', 'analytics', 'marketing']
const ICONS: Record<string, LucideIcon> = {
  'shield-check': ShieldCheck,
  'user-round-cog': UserRoundCog,
  'chart-no-axes-column-increasing': ChartNoAxesColumnIncreasing,
  'bar-chart-3': BarChart3,
  megaphone: Megaphone,
  headset: Headset,
  'lock-keyhole': LockKeyhole,
  cookie: Cookie,
  info: Info,
}
const DEFAULT_PREFERENCES: CookiePreferences = {
  necessary: true,
  preferences: false,
  analytics: false,
  marketing: false,
  version: 1,
  updatedAt: '',
}

function text(data: Data, key: string, fallback = ''): string {
  const value = data[key]
  return typeof value === 'string' ? value : value == null ? fallback : String(value)
}

function records(value: unknown): Data[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is Data => Boolean(entry) && typeof entry === 'object' && !Array.isArray(entry))
    : []
}

function slug(value: string, fallback: string) {
  return value.toLowerCase().trim().replace(/^\d+\.\s*/, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || fallback
}

function parsePreferences(raw: string | null): CookiePreferences | null {
  if (!raw) return null
  try {
    const value = JSON.parse(raw) as Record<string, unknown>
    if (value.version !== 1) return null
    return {
      necessary: true,
      preferences: value.preferences === true,
      analytics: value.analytics === true,
      marketing: value.marketing === true,
      version: 1,
      updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : '',
    }
  } catch {
    return null
  }
}

function savePreferences(preferences: CookiePreferences) {
  const saved: CookiePreferences = { ...preferences, necessary: true, version: 1, updatedAt: new Date().toISOString() }
  const serialized = JSON.stringify(saved)
  try {
    window.localStorage.setItem(STORAGE_KEY, serialized)
  } catch {
    // The consent cookie below remains available when browser storage is restricted.
  }
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(serialized)}; Max-Age=15552000; Path=/; SameSite=Lax${secure}`
  window.dispatchEvent(new CustomEvent('goahead:cookie-consent-updated', { detail: saved }))
  return saved
}

function Markdown({ children }: { children: string }) {
  return (
    <div className="cookies-policy-prose text-[12px] leading-[1.7] text-[#405071]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children: content }) => <p className="mb-2 last:mb-0">{content}</p>,
          ul: ({ children: content }) => <ul className="mb-2 ml-4 list-disc space-y-1 marker:text-[#0864f7]">{content}</ul>,
          ol: ({ children: content }) => <ol className="mb-2 ml-4 list-decimal space-y-1">{content}</ol>,
          strong: ({ children: content }) => <strong className="font-semibold text-[#14234b]">{content}</strong>,
          a: ({ href, children: content }) => <a href={href} className="font-semibold text-[#0864f7] underline underline-offset-2 hover:text-[#064dbb]">{content}</a>,
          blockquote: ({ children: content }) => <blockquote className="my-3 border-l-2 border-[#8bb5ff] bg-[#f5f8ff] px-3 py-2">{content}</blockquote>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}

function CookieToggle({ checked, label, onChange }: { checked: boolean; label: string; onChange: (value: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={[
        'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0864f7] focus-visible:ring-offset-2 motion-reduce:transition-none',
        checked ? 'border-[#0864f7] bg-[#0864f7]' : 'border-[#aebbd0] bg-[#e7edf5]',
      ].join(' ')}
    >
      <span className={['inline-block size-5 rounded-full bg-white shadow-sm transition-transform duration-200 motion-reduce:transition-none', checked ? 'translate-x-[23px]' : 'translate-x-1'].join(' ')} />
    </button>
  )
}

function CookiePreferencesPanel({ data }: { data: Data }) {
  const reduceMotion = useReducedMotion()
  const router = useRouter()
  const categories = records(data.categories)
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [savedMessage, setSavedMessage] = useState('')

  useEffect(() => {
    try {
      const localValue = parsePreferences(window.localStorage.getItem(STORAGE_KEY))
      if (localValue) {
        setPreferences(localValue)
        return
      }
    } catch {
      // Fall through to the first-party preference cookie.
    }

    const cookie = document.cookie.split('; ').find((entry) => entry.startsWith(COOKIE_NAME + '='))
    if (cookie) {
      const decoded = decodeURIComponent(cookie.slice(COOKIE_NAME.length + 1))
      const cookieValue = parsePreferences(decoded)
      if (cookieValue) setPreferences(cookieValue)
    }
  }, [])

  const updateCategory = (key: string, enabled: boolean) => {
    if (!CATEGORY_KEYS.includes(key as CategoryKey) || key === 'necessary') return
    setPreferences((current) => ({ ...current, [key]: enabled }))
    setSavedMessage('')
  }

  const persist = (next: CookiePreferences) => {
    const saved = savePreferences(next)
    setPreferences(saved)
    setSavedMessage(text(data, 'saveSuccessMessage', 'Your cookie preferences have been saved on this device.'))
    router.refresh()
  }

  const acceptSelected = () => persist({ ...preferences, necessary: true })
  const rejectNonEssential = () => persist({ ...DEFAULT_PREFERENCES, necessary: true })
  const saveSelected = () => persist({ ...preferences, necessary: true })

  return (
    <motion.section
      id="consent-preferences"
      aria-labelledby="cookie-preferences-heading"
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: reduceMotion ? 0 : 0.35 }}
      className="scroll-mt-28 mt-4 rounded-xl border border-[#dce3ed] bg-white p-3 shadow-[0_5px_20px_rgba(13,37,76,.035)] sm:p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 px-1 pb-3">
        <div>
          <h3 id="cookie-preferences-heading" className="text-[14px] font-bold text-[#14234b]">{text(data, 'preferencesHeading', 'Manage your cookie preferences')}</h3>
          <p className="mt-1 text-[11px] leading-relaxed text-[#64708b]">{text(data, 'preferencesDescription')}</p>
        </div>
        <a href="#cookie-inventory" className="inline-flex min-h-8 items-center gap-1 text-[10px] font-semibold text-[#0864f7] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0864f7]">
          {text(data, 'cookieListLabel', 'View full cookie list')} <ArrowDown aria-hidden className="size-3" />
        </a>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#e1e7f0]">
        {categories.map((category, index) => {
          const key = String(category.key || '') as CategoryKey
          const validKey = CATEGORY_KEYS.includes(key)
          const locked = category.locked === true || key === 'necessary'
          const enabled = locked ? true : validKey ? preferences[key] : false
          const Icon = ICONS[String(category.icon)] ?? Cookie
          const isExpanded = expanded === String(category.key)
          const detailId = 'cookie-category-detail-' + key
          return (
            <div key={key || index} className="border-b border-[#e5eaf1] last:border-b-0">
              <div className="flex items-center gap-3 px-3 py-3 sm:gap-4 sm:px-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#d9e5f5] bg-[#f9fbff] text-[#0864f7] sm:size-12">
                  <Icon aria-hidden className="size-6" strokeWidth={1.6} />
                </span>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[11px] font-bold text-[#14234b]">{String(category.title || '')}</h4>
                  <p className="mt-1 max-w-[480px] text-[10px] leading-[1.55] text-[#52617d]">{String(category.description || '')}</p>
                </div>
                {locked ? (
                  <div className="flex shrink-0 items-center gap-2 text-[9px] font-semibold text-[#14865b] sm:gap-3">
                    <span>{text(category, 'alwaysActiveLabel', 'Always active')}</span>
                    <LockKeyhole aria-hidden className="size-4 text-[#0864f7]" />
                  </div>
                ) : (
                  <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                    <span className="hidden text-[9px] font-semibold text-[#52617d] sm:inline">{enabled ? 'On' : 'Off'}</span>
                    <CookieToggle checked={enabled} label={`Enable ${String(category.title || key)} cookies`} onChange={(value) => updateCategory(key, value)} />
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      aria-controls={detailId}
                      aria-label={`More information about ${String(category.title || key)}`}
                      onClick={() => setExpanded(isExpanded ? null : String(category.key))}
                      className="flex size-8 items-center justify-center rounded-md text-[#0864f7] transition-colors hover:bg-[#f1f6ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0864f7]"
                    >
                      <ChevronDown aria-hidden className={['size-4 transition-transform duration-200 motion-reduce:transition-none', isExpanded ? 'rotate-180' : ''].join(' ')} />
                    </button>
                  </div>
                )}
              </div>
              <div
                id={detailId}
                role="region"
                aria-label={`${String(category.title || key)} details`}
                aria-hidden={!isExpanded}
                className={['grid overflow-hidden transition-[grid-template-rows,opacity] duration-200 motion-reduce:transition-none', isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'].join(' ')}
              >
                <div className="min-h-0 overflow-hidden">
                  <p className="border-t border-[#edf0f5] bg-[#fafcff] px-4 py-3 pl-[68px] text-[10px] leading-relaxed text-[#52617d] sm:pl-[76px]">{String(category.details || '')}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <button type="button" onClick={acceptSelected} className="min-h-10 rounded-md border border-[#8db6ff] bg-white px-3 text-[10px] font-bold text-[#0864f7] transition-colors hover:bg-[#eff5ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0864f7] focus-visible:ring-offset-2">
          {text(data, 'acceptSelectedLabel', 'Accept selected')}
        </button>
        <button type="button" onClick={rejectNonEssential} className="min-h-10 rounded-md border border-[#8db6ff] bg-white px-3 text-[10px] font-bold text-[#0864f7] transition-colors hover:bg-[#eff5ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0864f7] focus-visible:ring-offset-2">
          {text(data, 'rejectNonEssentialLabel', 'Reject non-essential')}
        </button>
        <button type="button" onClick={saveSelected} className="min-h-10 rounded-md bg-[#0864f7] px-3 text-[10px] font-bold text-white transition-colors hover:bg-[#0753cf] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0864f7] focus-visible:ring-offset-2">
          {text(data, 'savePreferencesLabel', 'Save my preferences')}
        </button>
      </div>
      {savedMessage ? <p role="status" aria-live="polite" className="mt-3 rounded-md bg-[#eef8f3] px-3 py-2 text-[10px] font-medium text-[#14764f]">{savedMessage}</p> : null}
    </motion.section>
  )
}

function SectionHeading({ children }: { children: string }) {
  return <h2 className="text-[14px] font-bold leading-snug text-[#14234b] sm:text-[15px]">{children}</h2>
}

export function CookiesPolicyPage({ page }: { page: CookiePolicyPageRecord | null }) {
  const reduceMotion = useReducedMotion()
  const block = page?.blocks.find((entry) => entry.type === 'cookiesPolicy' && !entry.hidden)
  const data: Data = block?.data ?? {}
  const sections = records(data.sections)
  const sidebarCards = records(data.sidebarCards)
  const inventoryRows = records(data.inventoryRows)
  const columns = [
    text(data, 'inventoryCategoryLabel', 'Category'),
    text(data, 'inventoryPurposeLabel', 'Purpose'),
    text(data, 'inventoryProviderLabel', 'Provider / cookie name'),
    text(data, 'inventoryDurationLabel', 'Duration'),
  ]

  const sectionIds = sections.map((section, index) => ({
    ...section,
    anchor: slug(String(section.id || section.heading || ''), `cookie-section-${index + 1}`),
    number: String(index + 1).padStart(2, '0'),
  }))

  const jumpToPreferences = () => {
    document.getElementById('consent-preferences')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' })
  }

  return (
    <div className="scroll-smooth motion-reduce:scroll-auto bg-white text-[#14234b]" data-page="cookies-policy">
      <div className="mx-auto max-w-[1240px] px-4 pb-7 pt-4 sm:px-6 sm:pt-5 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-2 text-[11px] text-[#64708b]">
          <Link href="/" className="transition-colors hover:text-[#0864f7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0864f7]">Home</Link>
          <span aria-hidden="true">›</span>
          <span>Legal</span>
          <span aria-hidden="true">›</span>
          <span aria-current="page" className="font-medium text-[#14234b]">{page?.title || text(data, "heading", "Cookies Policy")}</span>
        </nav>

        <div className="grid gap-5 lg:grid-cols-[132px_minmax(0,1fr)] lg:gap-6">
          <aside className="order-2 min-w-0 lg:order-1">
            <nav aria-label="On this page" className="rounded-lg bg-[#f7f9fc] p-3 sm:p-4">
              <h2 className="mb-3 text-[11px] font-bold">On this page</h2>
              <ol className="grid grid-cols-2 gap-x-2 gap-y-1.5 sm:grid-cols-3 lg:grid-cols-1">
                {sectionIds.map((section) => (
                  <li key={section.anchor}>
                    <a href={`#${section.anchor}`} className="group flex min-h-8 items-center gap-2 rounded-md px-1 py-1 text-[9px] leading-snug text-[#405071] transition-colors hover:bg-white hover:text-[#0864f7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0864f7]">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-[#c9d8f2] bg-white text-[8px] font-semibold text-[#0864f7]">{section.number}</span>
                      <span>{String(section.heading || '').replace(/^\d+\.\s*/, '')}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
            {sidebarCards.map((card, index) => {
              const Icon = ICONS[String(card.icon)] ?? Info
              return (
                <section key={index} className="mt-3 rounded-lg border border-[#dce3ed] bg-white p-3 sm:p-4">
                  <Icon aria-hidden className="mb-2 size-5 text-[#0864f7]" strokeWidth={1.6} />
                  <h3 className="text-[10px] font-bold">{String(card.title || '')}</h3>
                  <p className="mt-2 text-[9px] leading-[1.65] text-[#52617d]">{String(card.body || '')}</p>
                  {String(card.href || '') && String(card.linkLabel || '') ? (
                    <Link href={String(card.href)} className="mt-2 inline-flex min-h-7 items-center gap-1 text-[9px] font-semibold text-[#0864f7] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0864f7]">
                      {String(card.linkLabel)} <ArrowRight aria-hidden className="size-3" />
                    </Link>
                  ) : null}
                </section>
              )
            })}
          </aside>

          <div className="order-1 min-w-0 lg:order-2">
            <header className="border-b border-[#e5eaf2] pb-4">
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.45 }}
              >
                <p className="mb-2 text-[9px] font-bold uppercase tracking-[.15em] text-[#0864f7]">{text(data, 'eyebrow', 'Legal · Website cookies')}</p>
                <h1 className="text-[clamp(1.9rem,3.2vw,2.6rem)] font-semibold leading-tight tracking-[-.045em]">{text(data, 'heading', page?.title || 'Cookies Policy')}</h1>
                <p className="mt-2 max-w-[760px] text-[11px] leading-[1.65] text-[#405071] sm:text-[12px]">{text(data, 'intro')}</p>
                <p className="mt-2 text-[10px] font-semibold">Last updated: <span className="font-medium text-[#0864f7]">{text(data, 'lastUpdated', '[Date to be confirmed]')}</span></p>
              </motion.div>
              <div className="mt-3 flex items-center gap-3 rounded-md border border-[#b9d9ff] bg-[#f1f7ff] px-3 py-3 text-[10px] leading-relaxed text-[#263c67] sm:px-4">
                <Info aria-hidden className="size-4 shrink-0 text-[#0864f7]" />
                <span>{text(data, 'notice')}</span>
              </div>
            </header>

            <div className="divide-y divide-[#e5eaf2]">
              {sectionIds.map((section, index) => (
                <section id={section.anchor} key={section.anchor} className="scroll-mt-28 py-3 first:pt-4">
                  <motion.div
                    initial={reduceMotion ? false : { opacity: 0, y: 9 }}
                    whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.22 }}
                    transition={{ duration: reduceMotion ? 0 : 0.3, delay: reduceMotion ? 0 : Math.min(index * 0.025, 0.12) }}
                  >
                    <div className="flex gap-3">
                      <span className="pt-0.5 text-[12px] font-bold text-[#0864f7]">{section.number}.</span>
                      <div className="min-w-0 flex-1">
                        <SectionHeading>{String(section.heading || '')}</SectionHeading>
                        <div className="mt-1.5">
                          <Markdown>{String(section.body || '')}</Markdown>
                        </div>
                        {section.anchor === 'consent-preferences' ? <CookiePreferencesPanel data={data} /> : null}
                      </div>
                    </div>
                  </motion.div>
                </section>
              ))}
            </div>

            <section id="cookie-inventory" className="scroll-mt-28 pt-5">
              <h2 className="text-[15px] font-bold text-[#14234b]">{text(data, 'inventoryHeading', 'Our cookie inventory')}</h2>
              <p className="mt-1.5 max-w-[780px] text-[11px] leading-[1.65] text-[#405071]">{text(data, 'inventoryIntro')}</p>
              <div className="mt-3 overflow-x-auto rounded-md border border-[#dce3ed]">
                <table className="w-full min-w-[620px] border-collapse text-left text-[9px] leading-[1.5]">
                  <thead className="bg-[#071b42] text-white">
                    <tr>
                      {columns.map((column, index) => <th key={index} scope="col" className="border-r border-white/20 px-3 py-2 font-semibold last:border-r-0">{column}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryRows.map((row, index) => (
                      <tr key={index} className="border-t border-[#e2e7ef] align-top odd:bg-white even:bg-[#fafbfd]">
                        <td className="px-3 py-2 font-semibold text-[#283957]">{String(row.category || '')}</td>
                        <td className="px-3 py-2 text-[#405071]">{String(row.purpose || '')}</td>
                        <td className="px-3 py-2 text-[#405071]">{String(row.provider || '')}</td>
                        <td className="px-3 py-2 text-[#405071]">{String(row.duration || '')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex items-start gap-2 rounded-md border border-[#dce8ff] bg-[#f3f7ff] px-3 py-3 text-[10px] leading-relaxed text-[#405071]">
                <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-[#0864f7]" />
                <span>{text(data, 'inventoryNotice')}</span>
              </div>
            </section>
          </div>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-[1.3fr_.72fr]">
          <div className="grid gap-3 rounded-xl border border-[#cbdcff] bg-[#f3f7ff] p-4 sm:grid-cols-2 sm:p-5">
            <section className="flex gap-3 border-b border-[#d9e4f5] pb-3 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-[#a8c7ff] bg-white text-[#0864f7]"><Mail aria-hidden className="size-6" /></span>
              <div>
                <h2 className="text-[11px] font-bold">{text(data, 'contactHeading', 'Questions about cookies?')}</h2>
                <p className="mt-1 text-[9px] leading-[1.6] text-[#52617d]">{text(data, 'contactBody')}</p>
                <a href={`mailto:${text(data, 'contactEmail', 'privacy@goahead.ae')}`} className="mt-1.5 inline-flex text-[9px] font-semibold text-[#0864f7] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0864f7]">{text(data, 'contactEmail', 'privacy@goahead.ae')}</a>
              </div>
            </section>
            <section className="flex gap-3 sm:pl-1">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-[#a8c7ff] bg-white text-[#0864f7]"><Headset aria-hidden className="size-6" /></span>
              <div>
                <h2 className="text-[11px] font-bold">{text(data, 'helpHeading', 'We’re here to help')}</h2>
                <p className="mt-1 whitespace-pre-line text-[9px] leading-[1.6] text-[#52617d]">{text(data, 'helpHours')}</p>
                <Link href={text(data, 'helpLinkHref', '/contact')} className="mt-1.5 inline-flex items-center gap-1 text-[9px] font-semibold text-[#0864f7] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0864f7]">
                  {text(data, 'helpLinkLabel', 'Contact Us')} <ArrowRight aria-hidden className="size-3" />
                </Link>
              </div>
            </section>
          </div>

          <section className="flex items-center gap-3 rounded-xl bg-[#071b42] p-4 text-white sm:p-5">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-white/40 text-white"><Cookie aria-hidden className="size-6" /></span>
            <div className="min-w-0 flex-1">
              <h2 className="text-[11px] font-bold">{text(data, 'footerHeading', 'Manage cookie preferences')}</h2>
              <p className="mt-1 text-[9px] leading-[1.6] text-white/75">{text(data, 'footerBody', 'Update your cookie choices at any time.')}</p>
              <button type="button" onClick={jumpToPreferences} className="mt-2 inline-flex min-h-8 items-center gap-2 rounded-md border border-white/50 px-3 text-[9px] font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                {text(data, 'footerButtonLabel', 'Manage preferences')} <ArrowRight aria-hidden className="size-3" />
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
