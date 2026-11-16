'use client'

import { useEffect, useState } from 'react'

const VIEW_DELAY_MS = 10_000

/** Reading progress bar plus an engaged-view beacon sent after the reader has stayed for a few seconds. */
export function ReadingProgress({ slug, targetId }: { slug: string; targetId: string }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const el = document.getElementById(targetId)
    if (!el) return
    let frame = 0
    const update = () => {
      frame = 0
      const rect = el.getBoundingClientRect()
      const total = rect.height - window.innerHeight
      setProgress(total <= 0 ? 1 : Math.min(1, Math.max(0, -rect.top / total)))
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [targetId])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (document.visibilityState !== 'visible') return
      fetch(`/api/v1/blog/posts/${encodeURIComponent(slug)}/view`, { method: 'POST', keepalive: true }).catch(() => {})
    }, VIEW_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [slug])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-50 h-1 print:hidden">
      <div className="h-full origin-left bg-royal transition-transform duration-75" style={{ transform: `scaleX(${progress})` }} />
    </div>
  )
}
