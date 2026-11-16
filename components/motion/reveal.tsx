'use client'

import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from 'react'

type Phase = 'static' | 'hidden' | 'shown'

/**
 * Scroll-triggered entrance. Server HTML is fully visible (no flash, no blank content without JS);
 * only elements still below the fold at hydration are hidden and then revealed.
 */
export function Reveal({
  children,
  as: Tag = 'div',
  delay = 0,
  y = 28,
  className,
  id,
}: {
  children: ReactNode
  as?: ElementType
  delay?: number
  y?: number
  className?: string
  id?: string
}) {
  const ref = useRef<HTMLElement | null>(null)
  const [phase, setPhase] = useState<Phase>('static')

  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return
    setPhase('hidden')
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setPhase('shown')
          io.disconnect()
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const style: CSSProperties | undefined =
    phase === 'static'
      ? undefined
      : {
          opacity: phase === 'shown' ? 1 : 0,
          transform: phase === 'shown' ? 'none' : `translate3d(0, ${y}px, 0)`,
          transition: `opacity 800ms var(--ease-out-expo) ${delay}ms, transform 900ms var(--ease-out-expo) ${delay}ms`,
        }

  return (
    <Tag ref={ref} id={id} className={className} style={style}>
      {children}
    </Tag>
  )
}
