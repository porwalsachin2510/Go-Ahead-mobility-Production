import Image from 'next/image'
import Link from 'next/link'
import type { NavItem, Settings } from '@/lib/server/services/public'
import { NewsletterForm } from './newsletter-form'

const SOCIAL_LABELS: Record<string, string> = { linkedin: 'LinkedIn', x: 'X', instagram: 'Instagram', youtube: 'YouTube', facebook: 'Facebook' }

const SITE_PAGES = [
  { href: '/about-us', label: 'About Us' },
  { href: '/company/why-choose-us', label: 'Why Choose Us' },
  { href: '/company/safety-trust', label: 'Safety & Trust' },
  { href: '/company/market-challenges', label: 'Market Challenges' },
  { href: '/our-footprint', label: 'Our Footprint' },
  { href: '/global-accommodation', label: 'Global Accommodation' },
  { href: '/local-transportation', label: 'Local Transportation' },
  { href: '/industries', label: 'Industries' },
  { href: '/case-studies', label: 'Case Studies' },
  { href: '/resources', label: 'Resources' },
  { href: '/blog', label: 'Blog' },
  { href: '/careers', label: 'Careers' },
  { href: '/faq', label: 'Help & FAQ' },
  { href: '/newsletter', label: 'Newsletter' },
  { href: '/contact', label: 'Contact Us' },
]

const LEGAL_PAGES = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms & Conditions' },
  { href: '/cookies', label: 'Cookies Policy' },
]

const normalize = (href: string) => href.replace(/\/+$/, '') || '/'

function withMissingLinks(footer: NavItem[], legal: NavItem[]) {
  const groups = footer.map((group) => ({ ...group, children: [...(group.children ?? [])] }))
  let company = groups.find((group) => group.label.trim().toLowerCase() === 'company')
  if (!company) {
    company = { id: 'company-fallback', label: 'Company', href: '', children: [] }
    groups.push(company)
  }

  const companyLinks = company.children ?? []
  const whyChooseUs = companyLinks.find((item) =>
    normalize(item.href) === '/company/why-choose-us' ||
    item.label.trim().toLowerCase() === 'why choose us',
  )
  if (whyChooseUs) {
    whyChooseUs.href = '/company/why-choose-us'
    whyChooseUs.label = 'Why Choose Us'
  } else {
    const careersIndex = companyLinks.findIndex((item) => item.label.trim().toLowerCase() === 'careers')
    const entry = { id: 'fb-company-why-choose-us', label: 'Why Choose Us', href: '/company/why-choose-us' }
    if (careersIndex >= 0) companyLinks.splice(careersIndex, 0, entry)
    else companyLinks.push(entry)
  }
  // Keep Safety & Trust in the Company column even before the one-time navigation migration.
  const safetyIndex = companyLinks.findIndex((item) =>
    normalize(item.href) === '/company/safety-trust' ||
    item.label.trim().toLowerCase() === 'safety & trust',
  )
  const safetyEntry = {
    ...(safetyIndex >= 0 ? companyLinks[safetyIndex] : {}),
    id: safetyIndex >= 0 ? companyLinks[safetyIndex].id : 'fb-company-safety-trust',
    label: 'Safety & Trust',
    href: '/company/safety-trust',
    visible: true,
  }
  if (safetyIndex >= 0) {
    companyLinks[safetyIndex] = safetyEntry
  } else {
    const whyIndex = companyLinks.findIndex((item) =>
      normalize(item.href) === '/company/why-choose-us' ||
      item.label.trim().toLowerCase() === 'why choose us',
    )
    companyLinks.splice(whyIndex >= 0 ? whyIndex + 1 : companyLinks.length, 0, safetyEntry)
  }
  company.children = companyLinks

  // Put Newsletter in the Resources column rather than a generic fallback column.
  let resources = groups.find((group) =>
    group.label.trim().toLowerCase() === 'resources' ||
    normalize(group.href) === '/resources',
  )
  if (!resources) {
    resources = { id: 'fb-resources', label: 'Resources', href: '/resources', children: [] }
    groups.push(resources)
  }
  const newsletterCandidates = [
    ...groups.filter((group) => normalize(group.href) === '/newsletter' || group.label.trim().toLowerCase() === 'newsletter'),
    ...groups.flatMap((group) => group.children ?? []).filter((item) =>
      normalize(item.href) === '/newsletter' || item.label.trim().toLowerCase() === 'newsletter',
    ),
  ]
  const newsletterExisting = newsletterCandidates[0]
  for (const group of groups) {
    group.children = (group.children ?? []).filter((item) =>
      normalize(item.href) !== '/newsletter' &&
      item.label.trim().toLowerCase() !== 'newsletter',
    )
  }
  for (let i = groups.length - 1; i >= 0; i -= 1) {
    if (normalize(groups[i].href) === '/newsletter' || groups[i].label.trim().toLowerCase() === 'newsletter') {
      groups.splice(i, 1)
    }
  }
  const resourceLinks = resources.children ?? []
  if (!resourceLinks.some((item) => normalize(item.href) === '/resources' || item.label.trim().toLowerCase() === 'resource centre')) {
    resourceLinks.push({ id: 'fb-resource-centre', label: 'Resource Centre', href: '/resources' })
  }
  resourceLinks.push({
    ...(newsletterExisting ?? {}),
    id: newsletterExisting?.id || 'fb-resources-newsletter',
    label: 'Newsletter',
    href: '/newsletter',
    visible: true,
  })
  resources.children = resourceLinks

  const linked = new Set<string>()
  for (const group of [...groups, ...legal]) {
    linked.add(normalize(group.href))
    group.children?.forEach((child) => linked.add(normalize(child.href)))
  }
  const missingPages = SITE_PAGES.filter((page) => !linked.has(normalize(page.href)))
  const missingLegal = LEGAL_PAGES.filter((page) => !linked.has(normalize(page.href)))
  const footerGroups = missingPages.length
    ? [...groups, { id: 'explore-fallback', label: 'Explore', href: '#', children: missingPages.map((page) => ({ id: 'fb-' + page.href, label: page.label, href: page.href })) } as NavItem]
    : groups
  const legalLinks = [...legal, ...missingLegal.map((page) => ({ id: 'fb-' + page.href, label: page.label, href: page.href }) as NavItem)]
  return { groups: footerGroups, legalLinks }
}

export function SiteFooter({ settings, footer: footerMenu, legal: legalMenu }: { settings: Settings; footer: NavItem[]; legal: NavItem[] }) {
  const { groups: footer, legalLinks: legal } = withMissingLinks(footerMenu, legalMenu)
  const socials = Object.entries(settings.social ?? {}).filter(([, url]) => Boolean(url))
  const year = new Date().getFullYear()
  return (
    <footer className="bg-ink text-primary-foreground">
      <div className="container-x grid gap-9 py-10 md:py-12 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-4">
          <div className="inline-flex w-fit rounded-xl bg-background px-4 py-3">
            <Image src="/brand/goahead-logo.png" alt={settings.brandName} width={150} height={40} className="h-8 w-auto" />
          </div>
          <p className="max-w-sm leading-relaxed text-primary-foreground/70">{settings.footer.blurb || settings.tagline}</p>
          {settings.contact.email ? (
            <a href={`mailto:${settings.contact.email}`} className="w-fit font-display text-xl font-bold text-sky hover:underline">
              {settings.contact.email}
            </a>
          ) : null}
        </div>

        <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-5 xl:grid-cols-4">
          {footer.map((group) => (
            <div key={group.id} className="flex flex-col gap-4">
              <p className="eyebrow text-sky">{group.label}</p>
              <ul className="flex flex-col gap-2.5">
                {(group.children?.length ? group.children : [group]).map((link) => (
                  <li key={link.id}>
                    <Link href={link.href} className="text-sm text-primary-foreground/75 transition-colors hover:text-primary-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="flex flex-col gap-4 lg:col-span-3">
          <p className="eyebrow text-sky">{settings.footer.newsletterHeading || 'Mobility insights'}</p>
          <p className="text-sm leading-relaxed text-primary-foreground/70">{settings.footer.newsletterCopy || 'Occasional notes on corporate travel, workforce stays and fleet operations. Confirm by email; unsubscribe anytime.'}</p>
          <NewsletterForm tone="dark" source="footer" />
        </div>
      </div>

      <div className="border-t border-primary-foreground/10">
        <div className="container-x flex flex-col gap-4 py-6 text-xs text-primary-foreground/60 md:flex-row md:items-center md:justify-between">
          <p>{`© ${year} ${settings.brandName}. All rights reserved.`}</p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {legal.map((l) => (
              <li key={l.id}>
                <Link href={l.href} className="hover:text-primary-foreground">
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/cookies#consent-preferences" className="hover:text-primary-foreground">
                Cookie Preferences
              </Link>
            </li>
            {socials.map(([key, url]) => (
              <li key={key}>
                <a href={url} target="_blank" rel="noopener noreferrer" className="hover:text-primary-foreground">
                  {SOCIAL_LABELS[key] ?? key}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}
