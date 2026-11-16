'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LogoutButton } from './auth-forms'
import { NotificationBell } from './notification-bell'

export type NavGroup = { label: string; items: { href: string; label: string }[] }

export function AdminSidebar({ groups, user }: { groups: NavGroup[]; user: { name: string; role: string } }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const isActive = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href))

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-sidebar-border bg-sidebar px-4 py-3 text-sidebar-foreground lg:hidden">
        <span className="font-display font-semibold">GoAhead Admin</span>
        <div className="flex items-center gap-1">
        <NotificationBell tone="sidebar" />
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Toggle navigation" className="inline-flex size-9 items-center justify-center rounded-md transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring">
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
        </div>
      </div>
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center gap-2 border-b border-sidebar-border px-5 py-4">
          <div className="rounded-md bg-background px-2 py-1">
            <Image src="/brand/goahead-logo.png" alt="GoAhead Mobility" width={110} height={30} className="h-6 w-auto" />
          </div>
        </div>
        <nav aria-label="Admin" className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4">
          {groups.map((g) => (
            <div key={g.label} className="flex flex-col gap-0.5">
              <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">{g.label}</p>
              {g.items.map((it) => (
                <Link
                  key={it.href}
                  href={it.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(it.href) ? 'page' : undefined}
                  className={cn(
                    'rounded-md px-2 py-1.5 text-sm transition',
                    isActive(it.href) ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground' : 'hover:bg-sidebar-accent/60',
                  )}
                >
                  {it.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="flex flex-col gap-1 border-t border-sidebar-border px-5 py-4 text-sm">
          <span className="font-medium text-sidebar-accent-foreground">{user.name}</span>
          <span className="text-xs text-sidebar-foreground/60">{user.role}</span>
          <div className="mt-2 flex items-center gap-4 text-xs">
            <Link href="/admin/account" className="hover:text-sidebar-primary">
              Security
            </Link>
            <Link href="/" target="_blank" className="hover:text-sidebar-primary">
              View site
            </Link>
            <LogoutButton className="hover:text-sidebar-primary" />
          </div>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-foreground/40 lg:hidden" onClick={() => setOpen(false)} aria-hidden />}
    </>
  )
}
