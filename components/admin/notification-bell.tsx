'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import useSWR from 'swr'
import { Bell, Briefcase, Inbox, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'

type Item = { id: string; kind: 'lead' | 'application' | 'subscriber'; title: string; body: string; href: string; createdAt: string; read: boolean }
type Payload = { unread: number; items: Item[] }

const fetcher = async (url: string): Promise<Payload> => {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to load notifications')
  const json = await res.json()
  return (json.data ?? json) as Payload
}

function timeAgo(iso: string) {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
  if (s < 60) return `${s}s ago`
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.round(h / 24)}d ago`
}

const ICONS = { lead: Inbox, subscriber: Mail, application: Briefcase }

async function markRead(ids: string[] | 'all') {
  await fetch('/api/v1/admin/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) })
}

export function NotificationBell({ tone = 'light' }: { tone?: 'light' | 'sidebar' }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)
  const seen = useRef<Set<string> | null>(null)
  const [fresh, setFresh] = useState(false)
  const { data, mutate } = useSWR('/api/v1/admin/notifications', fetcher, { refreshInterval: 15000, revalidateOnFocus: true, dedupingInterval: 5000 })

  useEffect(() => {
    if (!data) return
    const ids = new Set(data.items.map((i) => i.id))
    if (seen.current && data.items.some((i) => !i.read && !seen.current!.has(i.id))) {
      setFresh(true)
      const t = setTimeout(() => setFresh(false), 4000)
      seen.current = ids
      return () => clearTimeout(t)
    }
    seen.current = ids
  }, [data])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => wrap.current && !wrap.current.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const unread = data?.unread ?? 0
  const items = data?.items ?? []

  async function openItem(item: Item) {
    setOpen(false)
    if (!item.read) {
      mutate({ unread: Math.max(0, unread - 1), items: items.map((i) => (i.id === item.id ? { ...i, read: true } : i)) }, { revalidate: false })
      markRead([item.id]).finally(() => mutate())
    }
    if (item.href) router.push(item.href)
  }

  async function readAll() {
    mutate({ unread: 0, items: items.map((i) => ({ ...i, read: true })) }, { revalidate: false })
    await markRead('all')
    mutate()
  }

  return (
    <div ref={wrap} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        className={cn(
          'relative inline-flex size-9 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2',
          tone === 'sidebar' ? 'hover:bg-sidebar-accent focus-visible:ring-sidebar-ring' : 'border border-border bg-card text-foreground hover:bg-accent focus-visible:ring-ring',
        )}
      >
        <Bell className={cn('size-5', fresh && 'motion-safe:animate-[bell-ring_0.9s_ease-in-out_2]')} aria-hidden />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[11px] font-semibold leading-5 text-destructive-foreground">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>
      <span className="sr-only" aria-live="polite">
        {fresh ? 'New notification received' : ''}
      </span>

      {open && (
        <div role="dialog" aria-label="Notifications" className="absolute right-0 top-11 z-50 flex w-[min(92vw,380px)] flex-col overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold">Notifications</p>
            {unread > 0 && (
              <button type="button" onClick={readAll} className="text-xs font-medium text-primary hover:underline">
                Mark all as read
              </button>
            )}
          </div>
          <ul className="flex max-h-96 flex-col overflow-y-auto">
            {items.length === 0 && <li className="px-4 py-8 text-center text-sm text-muted-foreground">No notifications yet. New leads will appear here.</li>}
            {items.map((item) => {
              const Icon = ICONS[item.kind] ?? Inbox
              return (
                <li key={item.id} className="border-b border-border last:border-b-0">
                  <button type="button" onClick={() => openItem(item)} className={cn('flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent', !item.read && 'bg-primary/5')}>
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className={cn('text-sm leading-snug', !item.read ? 'font-semibold' : 'font-medium')}>{item.title}</span>
                      {item.body && <span className="truncate text-xs text-muted-foreground">{item.body}</span>}
                      <span className="text-xs text-muted-foreground">{timeAgo(item.createdAt)}</span>
                    </span>
                    {!item.read && <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
                  </button>
                </li>
              )
            })}
          </ul>
          <Link href="/admin/leads" onClick={() => setOpen(false)} className="border-t border-border px-4 py-3 text-center text-sm font-medium text-primary hover:bg-accent">
            View all leads
          </Link>
        </div>
      )}
    </div>
  )
}
