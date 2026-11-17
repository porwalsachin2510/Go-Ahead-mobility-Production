'use client'

import Link from 'next/link'
import { useId, useRef } from 'react'
import { motion, useReducedMotion, type Variants } from 'motion/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { ArrowRight, ChevronRight } from 'lucide-react'
import { SmartImage } from '@/components/site/primitives'

if (typeof window !== 'undefined') gsap.registerPlugin(ScrollTrigger, useGSAP)

type HeroContent = {
  heroEyebrow?: string
  heroTitle?: string
  heroHighlight?: string
  heroDescription?: string
  heroImage?: string
  heroImageAlt?: string
  heroImagePosition?: string
  heroPrimaryLabel?: string
  heroPrimaryHref?: string
  heroSecondaryLabel?: string
  heroSecondaryHref?: string
}

const crumbs = [
  { name: 'Home', href: '/' },
  { name: 'Company', href: '/about-us' },
]

/*
 * The image frame is a chamfered shape: a vertical top edge that steps diagonally to the left,
 * then runs straight to the bottom. The accent line traces the same silhouette slightly outside it.
 * Both shapes are expressed in 0..1 bounding-box units so they scale with every breakpoint.
 */
const FRAME_PATH =
  'M0.135,0 L1,0 L1,1 L0.035,1 L0.035,0.77 Q0.035,0.735 0.05,0.705 L0.12,0.4 Q0.135,0.37 0.135,0.335 Z'
const ACCENT_PATH =
  'M0.103,0 L0.103,0.3 Q0.103,0.335 0.088,0.365 L0.018,0.67 Q0.004,0.7 0.004,0.735 L0.004,1'

export function WhyChooseUsHero({ content: c }: { content: HeroContent }) {
  const reduceMotion = Boolean(useReducedMotion())
  const rootRef = useRef<HTMLElement>(null)
  const clipId = `wcu-hero-frame-${useId().replace(/:/g, '')}`

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          '[data-hero-accent]',
          { clipPath: 'inset(0% 0% 100% 0%)' },
          { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, delay: 0.35, ease: 'power3.inOut' },
        )
        gsap.fromTo(
          '[data-hero-media]',
          { scale: 1.08 },
          { scale: 1, duration: 1.6, ease: 'power3.out' },
        )
      })
      mm.add('(prefers-reduced-motion: no-preference) and (min-width: 768px)', () => {
        gsap.to('[data-hero-media]', {
          yPercent: 6,
          ease: 'none',
          scrollTrigger: { trigger: rootRef.current, start: 'top top', end: 'bottom top', scrub: true },
        })
        gsap.to('[data-hero-copy]', {
          yPercent: -10,
          opacity: 0.35,
          ease: 'none',
          scrollTrigger: { trigger: rootRef.current, start: 'top top', end: 'bottom top', scrub: true },
        })
      })
      return () => mm.revert()
    },
    { scope: rootRef },
  )

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduceMotion ? 0 : 0.09, delayChildren: reduceMotion ? 0 : 0.05 } },
  }
  const item: Variants = reduceMotion
    ? { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0 } }
    : {
        hidden: { opacity: 0, y: 18 },
        show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
      }

  const title = c.heroTitle || 'A clearer way to'

  return (
    <section
      ref={rootRef}
      aria-labelledby="wcu-hero-title"
      className="relative isolate overflow-hidden bg-white"
    >
      <svg aria-hidden="true" width="0" height="0" className="absolute">
        <defs>
          <clipPath id={clipId} clipPathUnits="objectBoundingBox">
            <path d={FRAME_PATH} />
          </clipPath>
        </defs>
      </svg>

      <div className="relative mx-auto grid max-w-[1440px] grid-cols-1 md:min-h-[460px] md:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] lg:min-h-[500px] xl:min-h-[540px]">
        <motion.div
          data-hero-copy
          variants={container}
          initial={reduceMotion ? false : 'hidden'}
          animate="show"
          className="relative z-10 flex flex-col px-5 pb-10 pt-5 sm:px-8 md:pb-14 md:pl-8 md:pr-4 md:pt-6 lg:pl-12 xl:pl-[52px]"
        >
          <motion.nav variants={item} aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs text-[#5b6680]">
              {crumbs.map((crumb) => (
                <li key={crumb.href} className="flex items-center gap-1.5">
                  <Link
                    href={crumb.href}
                    className="rounded-sm transition-colors hover:text-[#0863f7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0863f7] focus-visible:ring-offset-2"
                  >
                    {crumb.name}
                  </Link>
                  <ChevronRight className="size-3 text-[#97a1b5]" aria-hidden="true" />
                </li>
              ))}
              <li aria-current="page" className="font-medium text-[#101d42]">
                Why Choose Us
              </li>
            </ol>
          </motion.nav>

          <div className="mt-10 flex flex-1 flex-col justify-center md:mt-8 lg:mt-6">
            {c.heroEyebrow ? (
              <motion.p
                variants={item}
                className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#0863f7]"
              >
                {c.heroEyebrow}
              </motion.p>
            ) : null}

            <motion.h1
              id="wcu-hero-title"
              variants={item}
              className="max-w-[620px] text-balance text-[2.15rem] font-semibold leading-[1.14] tracking-[-0.03em] text-[#101d42] sm:text-[2.6rem] lg:text-[2.95rem] xl:text-[3.15rem]"
            >
              <span className="block">{title}</span>
              {c.heroHighlight ? <span className="text-[#0863f7]">{c.heroHighlight}</span> : null}
            </motion.h1>

            {c.heroDescription ? (
              <motion.p
                variants={item}
                className="mt-6 max-w-[540px] text-pretty text-[15px] leading-[1.75] text-[#3d4a66] lg:text-base"
              >
                {c.heroDescription}
              </motion.p>
            ) : null}

            {c.heroPrimaryLabel || c.heroSecondaryLabel ? (
              <motion.div variants={item} className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                {c.heroPrimaryLabel ? (
                  <Link
                    href={c.heroPrimaryHref || '/contact'}
                    className="group inline-flex min-h-11 items-center justify-center gap-2.5 rounded-[4px] bg-[#0863f7] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_22px_rgba(8,99,247,0.22)] transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:bg-[#0552d6] hover:shadow-[0_12px_28px_rgba(8,99,247,0.3)] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0863f7] focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none"
                  >
                    {c.heroPrimaryLabel}
                    <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden="true" />
                  </Link>
                ) : null}
                {c.heroSecondaryLabel ? (
                  <Link
                    href={c.heroSecondaryHref || '#how-we-work'}
                    className="group inline-flex min-h-11 items-center gap-2 rounded-[4px] px-1 text-sm font-semibold text-[#0863f7] transition-colors duration-200 hover:text-[#0552d6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0863f7] focus-visible:ring-offset-2"
                  >
                    <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat pb-0.5 transition-[background-size] duration-300 group-hover:bg-[length:100%_1px] motion-reduce:transition-none">
                      {c.heroSecondaryLabel}
                    </span>
                    <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden="true" />
                  </Link>
                ) : null}
              </motion.div>
            ) : null}
          </div>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="relative aspect-[16/10] w-full sm:aspect-[16/9] md:aspect-auto md:h-full"
        >
          <div
            className="absolute inset-0 overflow-hidden bg-[#dfe9f5]"
            style={{ clipPath: `url(#${clipId})` }}
          >
            <div data-hero-media className="absolute -inset-y-[6%] inset-x-0 will-change-transform">
              {c.heroImage ? (
                <SmartImage
                  src={c.heroImage}
                  alt={c.heroImageAlt || ''}
                  sizes="(min-width: 768px) 55vw, 100vw"
                  priority
                  objectPosition={c.heroImagePosition || '58% 55%'}
                  className="object-cover"
                />
              ) : null}
            </div>
          </div>
          <svg
            data-hero-accent
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 size-full text-[#1aa3ef]"
            viewBox="0 0 1 1"
            preserveAspectRatio="none"
            fill="none"
          >
            <path
              d={ACCENT_PATH}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </motion.div>
      </div>
    </section>
  )
}
