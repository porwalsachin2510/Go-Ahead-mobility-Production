'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Scroll-snap carousel: native swipe on touch, arrow buttons on desktop, no JS required to read content. */
export function Carousel({
  children,
  label,
  tone = 'light',
  controls = 'sides',
  className,
}: {
  children: ReactNode
  label: string
  tone?: 'light' | 'dark'
  controls?: 'sides' | 'top'
  className?: string
}) {
  const track = useRef<HTMLUListElement>(null)
  const [edges, setEdges] = useState({ start: true, end: false })

  const update = useCallback(() => {
    const el = track.current
    if (!el) return
    setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 })
  }, [])

  useEffect(() => {
    update()
    const el = track.current
    el?.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      el?.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [update])

  const go = (dir: 1 | -1) => {
    const el = track.current
    if (!el) return
    const card = el.querySelector('li')
    const step = card ? card.getBoundingClientRect().width + 20 : el.clientWidth * 0.8
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollBy({ left: dir * step, behavior: reduce ? 'auto' : 'smooth' })
  }

  const btn = cn(
    'inline-flex size-10 shrink-0 items-center justify-center rounded-full border transition-all disabled:pointer-events-none disabled:opacity-30',
    tone === 'dark' ? 'border-primary-foreground/25 text-primary-foreground hover:border-azure hover:bg-azure' : 'border-line bg-background text-azure shadow-sm hover:border-azure hover:bg-azure hover:text-primary-foreground',
  )
  const prev = (
    <button type="button" className={btn} onClick={() => go(-1)} disabled={edges.start} aria-label={`Previous ${label}`}>
      <ArrowLeft aria-hidden className="size-4" />
    </button>
  )
  const next = (
    <button type="button" className={btn} onClick={() => go(1)} disabled={edges.end} aria-label={`Next ${label}`}>
      <ArrowRight aria-hidden className="size-4" />
    </button>
  )

  return (
    <section aria-roledescription="carousel" aria-label={label} className={cn('relative flex flex-col gap-4', className)}>
      {controls === 'top' ? <div className="hidden justify-end gap-2 md:flex">{prev}{next}</div> : null}
      <div className="flex items-center gap-3">
        {controls === 'sides' ? <div className="hidden md:block">{prev}</div> : null}
        <ul ref={track} className="no-scrollbar flex min-w-0 flex-1 snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2">
          {children}
        </ul>
        {controls === 'sides' ? <div className="hidden md:block">{next}</div> : null}
      </div>
    </section>
  )
}
