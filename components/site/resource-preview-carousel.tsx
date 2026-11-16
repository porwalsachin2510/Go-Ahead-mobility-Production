'use client'

import { useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowLeft, ArrowRight } from 'lucide-react'

export type ResourcePreviewSlide = { image: string; alt?: string; caption?: string }
type Props = { slides: ResourcePreviewSlide[]; title: string; variant?: 'showcase' | 'gallery' | 'template' }

export function ResourcePreviewCarousel({ slides, title, variant = 'showcase' }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)
  const touchStart = useRef<number | null>(null)
  const reduceMotion = useReducedMotion()
  const safeSlides = slides.filter((slide) => Boolean(slide.image))
  if (!safeSlides.length) return null

  const move = (direction: number) => setActiveIndex((current) => (current + direction + safeSlides.length) % safeSlides.length)
  const visibleCount = variant === 'template' ? 4 : 3
  const visible = Array.from({ length: Math.min(visibleCount, safeSlides.length) }, (_, index) => safeSlides[(activeIndex + index) % safeSlides.length])
  const motionSettings = {
    initial: reduceMotion ? false as const : { opacity: 0.65, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduceMotion ? 0 : 0.28, ease: 'easeOut' as const },
  }

  return (
    <section tabIndex={0} role="region" aria-roledescription="carousel" aria-label={title}
      className="outline-none focus-visible:ring-2 focus-visible:ring-[#1677ee] focus-visible:ring-offset-4"
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight') { event.preventDefault(); move(1) }
        if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1) }
        if (event.key === 'Home') { event.preventDefault(); setActiveIndex(0) }
        if (event.key === 'End') { event.preventDefault(); setActiveIndex(safeSlides.length - 1) }
      }}
      onTouchStart={(event) => { touchStart.current = event.changedTouches[0]?.clientX ?? null }}
      onTouchEnd={(event) => {
        const start = touchStart.current
        const end = event.changedTouches[0]?.clientX
        touchStart.current = null
        if (start == null || end == null || Math.abs(end - start) < 40) return
        move(end < start ? 1 : -1)
      }}
    >
      {variant === 'gallery' || variant === 'template' ? (
        <div className="flex items-center gap-2 sm:gap-3">
          <button type="button" onClick={() => move(-1)} className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-[#dce6f4] bg-white text-[#155fe8] transition hover:border-[#155fe8] hover:bg-[#f1f7ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1677ee]" aria-label="Previous preview"><ArrowLeft className="size-4" aria-hidden /></button>
          <div className={`grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2 ${variant === 'template' ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} lg:gap-4`}>
            {visible.map((slide, index) => <motion.figure key={slide.image + index} {...motionSettings} className={`overflow-hidden rounded-lg border border-[#dfe7f3] bg-white shadow-sm ${index === 1 ? 'hidden sm:block' : ''} ${index === 2 ? 'hidden lg:block' : ''} ${index === 3 && variant === 'template' ? 'hidden lg:block' : ''}`}>
              <div className="relative aspect-[3/4] bg-[#f5f7fb]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={slide.image} alt={slide.alt || title} className="h-full w-full object-contain" />
              </div>
              {slide.caption ? <figcaption className="border-t border-[#edf1f6] px-3 py-2 text-[10px] leading-relaxed text-[#5c6881]">{slide.caption}</figcaption> : null}
            </motion.figure>)}
          </div>
          <button type="button" onClick={() => move(1)} className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-[#dce6f4] bg-white text-[#155fe8] transition hover:border-[#155fe8] hover:bg-[#f1f7ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1677ee]" aria-label="Next preview"><ArrowRight className="size-4" aria-hidden /></button>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-[1.55fr_1fr]">
          <motion.figure key={safeSlides[activeIndex].image} {...motionSettings} className="overflow-hidden rounded-xl border border-[#dfe7f3] bg-white shadow-sm">
            <div className="relative aspect-[16/10] bg-[#f1f5fb]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={safeSlides[activeIndex].image} alt={safeSlides[activeIndex].alt || title} className="h-full w-full object-contain" />
            </div>
            {safeSlides[activeIndex].caption ? <figcaption className="px-4 py-2 text-xs text-[#5c6881]">{safeSlides[activeIndex].caption}</figcaption> : null}
          </motion.figure>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-1">
            {visible.slice(1).map((slide, index) => <button type="button" key={slide.image + index} onClick={() => setActiveIndex((activeIndex + index + 1) % safeSlides.length)} className="group overflow-hidden rounded-xl border border-[#dfe7f3] bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#9cc8ff] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1677ee]" aria-label={`Show preview ${(activeIndex + index + 1) % safeSlides.length + 1}`}>
              <div className="relative aspect-[16/10] bg-[#f1f5fb]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={slide.image} alt={slide.alt || title} className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.025]" />
              </div>
              {slide.caption ? <span className="block px-3 py-2 text-[11px] text-[#5c6881]">{slide.caption}</span> : null}
            </button>)}
            {safeSlides.length === 1 ? <div className="flex min-h-24 items-center justify-center rounded-xl border border-dashed border-[#dfe7f3] px-5 text-center text-xs text-[#66718a]">Add more page previews from the resource editor to expand this carousel.</div> : null}
          </div>
        </div>
      )}
      {variant === 'template' ? <div className="mt-4 flex items-center justify-center gap-2" aria-label="Choose preview page">
        {safeSlides.map((slide, index) => <button key={slide.image + index} type="button" onClick={() => setActiveIndex(index)} aria-label={`Go to preview ${index + 1}`} aria-current={activeIndex === index ? 'true' : undefined} className={`size-2 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1677ee] focus-visible:ring-offset-2 ${activeIndex === index ? 'bg-[#0863f7]' : 'bg-[#d5dfec] hover:bg-[#8fb8f5]'}`} />)}
      </div> : null}
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs text-[#64718b]" aria-live="polite">Preview {activeIndex + 1} of {safeSlides.length}</p>
        {variant === 'showcase' ? <div className="flex items-center gap-2">
          <button type="button" onClick={() => move(-1)} className="inline-flex size-9 items-center justify-center rounded-full border border-[#cbd8ea] bg-white text-[#155fe8] transition hover:border-[#155fe8] hover:bg-[#f1f7ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1677ee]" aria-label="Previous preview"><ArrowLeft className="size-4" aria-hidden /></button>
          <button type="button" onClick={() => move(1)} className="inline-flex size-9 items-center justify-center rounded-full border border-[#cbd8ea] bg-white text-[#155fe8] transition hover:border-[#155fe8] hover:bg-[#f1f7ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1677ee]" aria-label="Next preview"><ArrowRight className="size-4" aria-hidden /></button>
        </div> : null}
      </div>
    </section>
  )
}
