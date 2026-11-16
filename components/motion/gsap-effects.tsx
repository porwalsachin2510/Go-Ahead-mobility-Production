'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') gsap.registerPlugin(ScrollTrigger)

const MOTION_OK = '(prefers-reduced-motion: no-preference)'

export function ScrollReveal({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const mm = gsap.matchMedia()
    mm.add(MOTION_OK, () => {
      const nodes = Array.from(el.querySelectorAll<HTMLElement>('[data-scroll-reveal]'))
      const targets = nodes.length ? nodes : [el]
      const tween = gsap.fromTo(targets, { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: 0.75, stagger: 0.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 86%', once: true } })
      return () => tween.kill()
    })
    return () => mm.revert()
  }, [])
  return <div ref={ref} className={className}>{children}</div>
}

/** Subtle scrubbed parallax. Disabled on small screens and for reduced motion to protect mobile performance. */
export function Parallax({ children, amount = 10, className }: { children: ReactNode; amount?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const mm = gsap.matchMedia()
    mm.add(`${MOTION_OK} and (min-width: 768px)`, () => {
      gsap.fromTo(
        el,
        { yPercent: -amount / 2, scale: 1.08 },
        { yPercent: amount / 2, scale: 1.08, ease: 'none', scrollTrigger: { trigger: el.parentElement ?? el, start: 'top bottom', end: 'bottom top', scrub: true } },
      )
    })
    return () => mm.revert()
  }, [amount])
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}

/** Draws an SVG route path as it scrolls into view. */
export function RouteLine({ d, viewBox, className, strokeWidth = 2, dashed = false }: { d: string; viewBox: string; className?: string; strokeWidth?: number; dashed?: boolean }) {
  const ref = useRef<SVGPathElement>(null)
  useEffect(() => {
    const path = ref.current
    if (!path) return
    const mm = gsap.matchMedia()
    mm.add(MOTION_OK, () => {
      const len = path.getTotalLength()
      gsap.set(path, { strokeDasharray: len, strokeDashoffset: len })
      gsap.to(path, { strokeDashoffset: 0, duration: 2.2, ease: 'power2.inOut', scrollTrigger: { trigger: path.closest('svg'), start: 'top 85%', once: true } })
    })
    return () => mm.revert()
  }, [])
  return (
    <svg viewBox={viewBox} fill="none" aria-hidden className={className} preserveAspectRatio="none">
      {dashed ? <path d={d} stroke="currentColor" strokeOpacity={0.25} strokeWidth={strokeWidth} strokeDasharray="4 6" vectorEffect="non-scaling-stroke" /> : null}
      <path ref={ref} d={d} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export type CoverageNode = { x: number; y: number; hub?: boolean }

function arcPath([x1, y1]: [number, number], [x2, y2]: [number, number]) {
  const lift = Math.hypot(x2 - x1, y2 - y1) * 0.28
  return `M${x1} ${y1} Q${(x1 + x2) / 2} ${(y1 + y2) / 2 - lift} ${x2} ${y2}`
}

/**
 * Animated route network drawn in the coordinate space of the background map image. The SVG uses
 * `slice`, matching the image's `object-cover`, so nodes stay pinned to their cities at any width.
 */
export function CoverageNetwork({ width, height, nodes, links, className }: { width: number; height: number; nodes: CoverageNode[]; links: [number, number][]; className?: string }) {
  const ref = useRef<SVGSVGElement>(null)
  const paths = links.filter(([a, b]) => nodes[a] && nodes[b]).map(([a, b]) => arcPath([nodes[a].x, nodes[a].y], [nodes[b].x, nodes[b].y]))

  useEffect(() => {
    const svg = ref.current
    if (!svg) return
    const mm = gsap.matchMedia()
    mm.add(MOTION_OK, () => {
      const lines = svg.querySelectorAll('[data-net-line]')
      const pulses = svg.querySelectorAll('[data-net-pulse]')
      const dots = svg.querySelectorAll('[data-net-node]')
      const halos = svg.querySelectorAll('[data-net-halo]')
      gsap.set(lines, { strokeDasharray: 1, strokeDashoffset: 1 })
      gsap.set(dots, { scale: 0, transformOrigin: '50% 50%' })
      gsap.set(pulses, { autoAlpha: 0 })
      const tl = gsap.timeline({ scrollTrigger: { trigger: svg, start: 'top 85%', once: true } })
      tl.to(lines, { strokeDashoffset: 0, duration: 1.6, stagger: 0.12, ease: 'power2.inOut' })
        .to(dots, { scale: 1, duration: 0.45, stagger: 0.05, ease: 'back.out(2.4)' }, 0.4)
        .add(() => {
          gsap.set(pulses, { autoAlpha: 1 })
          pulses.forEach((pulse, i) => {
            gsap.fromTo(pulse, { strokeDashoffset: 1.12 }, { strokeDashoffset: -0.12, duration: 3.2 + (i % 4) * 0.5, delay: i * 0.35, repeat: -1, ease: 'none' })
          })
          gsap.fromTo(halos, { scale: 0.6, opacity: 0.45, transformOrigin: '50% 50%' }, { scale: 2.2, opacity: 0, duration: 2.4, stagger: { each: 0.3, repeat: -1 }, ease: 'power1.out' })
        })
    })
    return () => mm.revert()
  }, [])

  return (
    <svg ref={ref} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice" fill="none" aria-hidden className={className}>
      <defs>
        <radialGradient id="coverage-hub-glow">
          <stop offset="0%" stopColor="#1a7cf5" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#1a7cf5" stopOpacity="0" />
        </radialGradient>
      </defs>
      {paths.map((d, i) => <path key={`l${i}`} data-net-line d={d} pathLength={1} stroke="#4a9ef0" strokeOpacity={0.55} strokeWidth={1.25} strokeLinecap="round" vectorEffect="non-scaling-stroke" />)}
      {paths.map((d, i) => <path key={`p${i}`} data-net-pulse d={d} pathLength={1} stroke="#1a7cf5" strokeWidth={2.25} strokeLinecap="round" strokeDasharray="0.12 1" strokeDashoffset={1.12} vectorEffect="non-scaling-stroke" style={{ visibility: 'hidden' }} />)}
      {nodes.map((node, i) => (
        <g key={`n${i}`}>
          {node.hub ? <circle cx={node.x} cy={node.y} r={46} fill="url(#coverage-hub-glow)" /> : null}
          <circle data-net-halo cx={node.x} cy={node.y} r={node.hub ? 18 : 11} fill="#1a7cf5" fillOpacity={0.18} />
          <g data-net-node>
            {node.hub ? <circle cx={node.x} cy={node.y} r={15} fill="#ffffff" stroke="#1a7cf5" strokeOpacity={0.35} strokeWidth={6} /> : null}
            <circle cx={node.x} cy={node.y} r={node.hub ? 7 : 5.5} fill="#1a7cf5" stroke="#ffffff" strokeWidth={2.5} />
          </g>
        </g>
      ))}
    </svg>
  )
}

export type RouteMarker = { x: number; y: number; kind: 'pin' | 'dot' | 'hub' | 'arrow' }

/**
 * Route illustration with exact, non-distorted geometry: markers are positioned in viewBox units so they
 * always sit on the drawn curves. On scroll it draws each path, pops the markers in, then sends a soft
 * light pulse along the routes while visible. Reduced motion renders the finished, static illustration.
 */
export function RouteGraphic({ viewBox, paths, markers, className, pinIcon, stretch = false }: { viewBox: string; paths: (string | { d: string; faint?: boolean })[]; markers: RouteMarker[]; className?: string; pinIcon?: ReactNode; stretch?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const [, , vbW, vbH] = viewBox.split(/\s+/).map(Number)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const mm = gsap.matchMedia()
    mm.add(MOTION_OK, () => {
      const lines = Array.from(el.querySelectorAll<SVGPathElement>('[data-route-line]'))
      const glows = Array.from(el.querySelectorAll<SVGPathElement>('[data-route-glow]'))
      const marks = Array.from(el.querySelectorAll<HTMLElement>('[data-route-marker]'))
      // Paths use pathLength={1}, so dash values are normalised and stay correct when the SVG is stretched.
      gsap.set(lines, { strokeDasharray: '1 1', strokeDashoffset: 1 })
      gsap.set(glows, { strokeDasharray: '0.09 1', strokeDashoffset: 0.09, autoAlpha: 0 })
      gsap.set(marks, { scale: 0, autoAlpha: 0 })

      const pulse = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 0.6 })
      glows.forEach((path, index) => {
        pulse.fromTo(path, { strokeDashoffset: 0.09, autoAlpha: 0 }, { strokeDashoffset: -1, autoAlpha: 1, duration: 2.6, ease: 'sine.inOut' }, index * 0.35)
      })

      const intro = gsap.timeline({
        paused: true,
        onComplete: () => { pulse.play() },
      })
      intro
        .to(lines, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut', stagger: 0.22 })
        .to(marks, { scale: 1, autoAlpha: 1, duration: 0.55, ease: 'back.out(2.2)', stagger: 0.14 }, '-=0.9')

      const trigger = ScrollTrigger.create({
        trigger: el,
        start: 'top 88%',
        onEnter: () => intro.play(),
        onToggle: self => {
          if (intro.progress() < 1) return
          if (self.isActive) pulse.play()
          else pulse.pause()
        },
        end: 'bottom top',
      })
      return () => {
        trigger.kill()
        intro.kill()
        pulse.kill()
      }
    })
    return () => mm.revert()
  }, [])

  return (
    <div ref={ref} aria-hidden className={className} style={{ position: 'relative', ...(stretch ? {} : { aspectRatio: `${vbW} / ${vbH}` }) }}>
      <svg viewBox={viewBox} fill="none" preserveAspectRatio={stretch ? 'none' : undefined} className="absolute inset-0 size-full overflow-visible">
        {paths.map(entry => {
          const { d, faint } = typeof entry === 'string' ? { d: entry, faint: false } : entry
          return (
            <g key={d}>
              <path data-route-line d={d} pathLength={1} stroke="currentColor" strokeOpacity={faint ? 0.35 : 0.85} strokeWidth={1.5} strokeLinecap="round" />
              {faint ? null : <path data-route-glow d={d} pathLength={1} stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" opacity={0} style={{ filter: 'drop-shadow(0 0 4px currentColor)' }} />}
            </g>
          )
        })}
      </svg>
      {markers.map((marker, index) => (
        <span
          key={index}
          data-route-marker
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${(marker.x / vbW) * 100}%`, top: `${(marker.y / vbH) * 100}%` }}
        >
          {marker.kind === 'pin' ? (
            <span className="flex size-7 items-center justify-center rounded-full border border-current/40 bg-white shadow-[0_6px_18px_-6px_currentColor] [&_svg]:size-3.5">
              <span className="text-[#1689d8]">{pinIcon}</span>
            </span>
          ) : marker.kind === 'arrow' ? (
            <span className="block size-0 border-y-4 border-l-[6px] border-y-transparent border-l-[#1a7cf5]" />
          ) : marker.kind === 'hub' ? (
            <span className="relative flex size-4 items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-current opacity-25 motion-safe:animate-ping [animation-duration:2s]" />
              <span className="relative size-2.5 rounded-full bg-[#1a7cf5] shadow-[0_0_0_5px_rgba(26,124,245,.16)]" />
            </span>
          ) : (
            <span className="relative flex size-3 items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-current opacity-20 motion-safe:animate-ping [animation-duration:2.4s]" />
              <span className="relative size-2 rounded-full bg-[#1a7cf5] shadow-[0_0_0_4px_rgba(26,124,245,.14)]" />
            </span>
          )}
        </span>
      ))}
    </div>
  )
}

/** Horizontal progress rail that fills as its section scrolls (used by timelines and step rows). */
export function ProgressRail({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const mm = gsap.matchMedia()
    mm.add(MOTION_OK, () => {
      gsap.fromTo(el, { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: el.parentElement ?? el, start: 'top 80%', end: 'bottom 55%', scrub: 0.6 } })
    })
    return () => mm.revert()
  }, [])
  return <div ref={ref} aria-hidden className={className} style={{ transformOrigin: 'left center' }} />
}

/** Counts a metric like "5000+" or "99.6%" up from zero once visible. Final value is server-rendered. */
export function CountUp({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [text, setText] = useState(value)
  useEffect(() => {
    const el = ref.current
    const match = value.match(/^([^\d]*)([\d,.]+)(.*)$/)
    if (!el || !match) return
    const [, prefix, num, suffix] = match
    const target = Number(num.replace(/,/g, ''))
    const decimals = num.includes('.') ? num.split('.')[1].length : 0
    const mm = gsap.matchMedia()
    mm.add(MOTION_OK, () => {
      const state = { n: 0 }
      setText(`${prefix}0${suffix}`)
      gsap.to(state, {
        n: target,
        duration: 1.8,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        onUpdate: () => setText(`${prefix}${state.n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`),
      })
      return () => setText(value)
    })
    return () => mm.revert()
  }, [value])
  return (
    <span ref={ref} className={className}>
      <span aria-hidden>{text}</span>
      <span className="sr-only">{value}</span>
    </span>
  )
}
