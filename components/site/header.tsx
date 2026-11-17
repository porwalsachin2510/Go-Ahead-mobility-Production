'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ChevronDown, Menu, X } from 'lucide-react'
import type { NavItem } from '@/lib/server/services/public'
import { cn } from '@/lib/utils'

export function SiteHeader({ items, ctaLabel, ctaHref, brandName }: { items: NavItem[]; ctaLabel: string; ctaHref: string; brandName: string }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  const isMarketingPath = ['/', '/global-accommodation', '/local-transportation', '/about-us', '/company/about-us', '/company/why-choose-us', '/company/safety-trust', '/industries', '/blog', '/resources', '/learn', '/faq', '/contact', '/case-studies'].includes(pathname) || pathname.startsWith('/industries/') || pathname.startsWith('/blog/') || pathname.startsWith('/case-studies/')
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))
  const useDarkHeader = isMarketingPath && pathname !== '/company/why-choose-us' && pathname !== '/company/safety-trust'
  const shell = useDarkHeader ? 'bg-night/90 text-white' : 'bg-background/95 text-foreground'
  const border = scrolled ? (useDarkHeader ? 'border-white/10' : 'border-line') : 'border-transparent'
  const muted = useDarkHeader ? 'text-white/80 hover:text-white' : 'text-foreground hover:text-royal'

  return (
    <header className={cn('sticky top-0 z-50 border-b backdrop-blur transition-colors', shell, border)}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-royal focus:px-4 focus:py-2 focus:text-primary-foreground">
        Skip to content
      </a>
      <div className={cn("container-x flex items-center justify-between gap-4", isMarketingPath ? "h-14 py-2 lg:h-16" : "h-18 gap-6 py-3")}>
        <Link href="/" className="flex shrink-0 items-center" aria-label={`${brandName} home`}>
          <Image src="/brand/goahead-logo.png" alt={brandName} width={168} height={44} priority className={cn('w-auto', useDarkHeader ? 'h-8 brightness-0 invert' : pathname === '/company/why-choose-us' ? 'h-8' : 'h-10')} />
        </Link>

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {items.filter((i) => i.device !== 'mobile').map((item) => (
              <li key={item.id} className="group relative">
                {item.children && item.children.length > 0 ? (
                  <>
                    <Link href={item.href || '#'} className={cn('flex items-center gap-1 rounded-full px-3 py-2 text-xs font-medium transition-colors', muted, (isActive(item.href) || item.children?.some((child) => isActive(child.href))) && 'text-azure')} aria-haspopup="true">
                      {item.label}
                      <ChevronDown aria-hidden className="size-3.5 transition-transform group-hover:rotate-180" />
                    </Link>
                    <div className="invisible absolute left-0 top-full w-80 pt-2 opacity-0 transition-all group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                      <ul className="flex flex-col gap-1 rounded-2xl border border-line bg-background p-2 shadow-xl shadow-ink/10">
                        {item.children.map((child) => (
                          <li key={child.id}>
                            <Link href={child.href} target={child.newTab ? '_blank' : undefined} rel={child.newTab ? 'noopener noreferrer' : undefined} className="flex flex-col gap-0.5 rounded-xl px-4 py-3 transition-colors hover:bg-paper">
                              <span className="text-sm font-semibold text-foreground">{child.label}</span>
                              {child.description ? <span className="text-xs leading-relaxed text-muted-foreground">{child.description}</span> : null}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : (
                    <Link href={item.href} target={item.newTab ? '_blank' : undefined} className={cn('rounded-full px-3 py-2 text-xs font-medium transition-colors', muted, isActive(item.href) && 'text-azure')}>
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <Link href={ctaHref} className={cn('hidden bg-azure font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-azure-deep sm:inline-flex', pathname === '/company/why-choose-us' ? 'rounded-md px-3.5 py-1.5 text-[10px]' : 'rounded-full px-4 py-2 text-xs')}>
            {ctaLabel}
          </Link>
          <button type="button" className={cn('inline-flex size-10 items-center justify-center rounded-full border lg:hidden', useDarkHeader ? 'border-white/25 text-white' : 'border-line')} aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen((v) => !v)}>
            {open ? <X aria-hidden className="size-5" /> : <Menu aria-hidden className="size-5" />}
            <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
          </button>
        </div>
      </div>

      {open ? (
        <nav id="mobile-nav" aria-label="Mobile" className="max-h-[calc(100dvh-4.5rem)] overflow-y-auto border-t border-line bg-background lg:hidden">
          <ul className="container-x flex flex-col gap-1 py-4">
            {items.filter((i) => i.device !== 'desktop').map((item) => (
              <li key={item.id} className="flex flex-col">
                <Link href={item.href || '#'} className="rounded-lg px-2 py-3 font-display text-lg font-bold text-foreground">
                  {item.label}
                </Link>
                {item.children?.length ? (
                  <ul className="mb-2 flex flex-col border-l-2 border-sky pl-4">
                    {item.children.map((child) => (
                      <li key={child.id}>
                        <Link href={child.href} className="block py-2 text-sm text-muted-foreground">
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
            <li className="pt-3">
              <Link href={ctaHref} className="flex justify-center rounded-full bg-royal px-5 py-3 text-sm font-semibold text-primary-foreground">
                {ctaLabel}
              </Link>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  )
}
