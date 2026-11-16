import Image from 'next/image'
import Link from 'next/link'
import type { NavItem, Settings } from '@/lib/server/services/public'
import { NewsletterForm } from './newsletter-form'

const SOCIAL_LABELS: Record<string, string> = { linkedin: 'LinkedIn', x: 'X', instagram: 'Instagram', youtube: 'YouTube', facebook: 'Facebook' }

const SITE_PAGES = [
  { href: '/about-us', label: 'About Us' },
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
  const linked = new Set<string>()
  for (const g of [...footer, ...legal]) {
    linked.add(normalize(g.href))
    g.children?.forEach((c) => linked.add(normalize(c.href)))
  }
  const missingPages = SITE_PAGES.filter((p) => !linked.has(p.href))
  const missingLegal = LEGAL_PAGES.filter((p) => !linked.has(p.href))
  const groups = missingPages.length
    ? [...footer, { id: 'explore-fallback', label: 'Explore', href: '#', children: missingPages.map((p) => ({ id: `fb-${p.href}`, label: p.label, href: p.href })) } as NavItem]
    : footer
  const legalLinks = [...legal, ...missingLegal.map((p) => ({ id: `fb-${p.href}`, label: p.label, href: p.href }) as NavItem)]
  return { groups, legalLinks }
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
