'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { gsap } from 'gsap'
import { IndiaNetworkMap } from './india-network-map'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  ArrowRight, Building2, BusFront, Clock3, Factory, Globe2,
  Landmark, Map, MapPin, Mountain, Network, Phone, ShieldCheck, UsersRound,
} from 'lucide-react'

type RecordValue = Record<string, any>
type Props = { content: RecordValue; contact?: Record<string, string> }

function Icon({ name, className = 'size-5' }: { name?: string; className?: string }) {
  const key = String(name || '').toLowerCase()
  const Component = key.includes('bus') || key.includes('fleet') ? BusFront
    : key.includes('user') || key.includes('commuter') ? UsersRound
    : key.includes('factory') ? Factory
    : key.includes('corporate') || key.includes('building') ? Building2
    : key.includes('mountain') ? Mountain
    : key.includes('network') ? Network
    : key.includes('shield') || key.includes('check') ? ShieldCheck
    : key.includes('clock') || key.includes('time') ? Clock3
    : key.includes('globe') ? Globe2
    : key.includes('landmark') ? Landmark
    : key.includes('map') || key.includes('state') ? Map
    : MapPin
  return <Component aria-hidden="true" className={className} strokeWidth={1.7} />
}

function getText(record: RecordValue, key: string, fallback = '') {
  const value = record?.[key]
  return typeof value === 'string' && value.trim() ? value : fallback
}

function approvedRows(record: RecordValue, key: string): RecordValue[] {
  const value = record?.[key]
  return Array.isArray(value) ? value.filter((item) => item && item.approved === true) : []
}

export function OurFootprintPage({ content, contact = {} }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const [selectedCity, setSelectedCity] = useState('')
  const [selectedState, setSelectedState] = useState('')
  const states = approvedRows(content, 'stateCoverageItems')
  const cities = approvedRows(content, 'cityCards')
  const regions = approvedRows(content, 'regionalStrengthItems')
  const heroStats = Array.isArray(content?.heroStats) ? content.heroStats : []
  const metrics = Array.isArray(content?.metricsItems) ? content.metricsItems : []
  const activeCity = cities.find((city) => city.name === selectedCity) || cities[0]
  const phone = getText(contact, 'phone', getText(content, 'ctaPhone', '+91 98765 43210'))
  const phoneHref = 'tel:' + phone.replace(/[^\d+]/g, '')

  useEffect(() => {
    const element = root.current
    if (!element || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    gsap.registerPlugin(ScrollTrigger)
    const context = gsap.context(() => {
      const revealItems = gsap.utils.toArray<HTMLElement>('[data-footprint-reveal]')
      revealItems.forEach((item) => {
        gsap.fromTo(item, { autoAlpha: 0, y: 28 }, {
          autoAlpha: 1,
          y: 0,
          duration: 0.72,
          ease: 'power3.out',
          scrollTrigger: { trigger: item, start: 'top 88%', once: true },
        })
      })
      const mapArt = element.querySelector('.footprint-map-art')
      if (mapArt) {
        gsap.fromTo(mapArt, { scale: 0.94, autoAlpha: 0.72 }, {
          scale: 1,
          autoAlpha: 1,
          duration: 1.1,
          ease: 'power2.out',
          scrollTrigger: { trigger: mapArt, start: 'top 90%', once: true },
        })
      }
    }, element)
    return () => context.revert()
  }, [])

  function selectCity(city: RecordValue) {
    setSelectedCity(String(city.name || ''))
    if (city.state) setSelectedState(String(city.state))
  }

  function selectState(state: RecordValue) {
    setSelectedState(String(state.name || ''))
    const match = cities.find((city) => city.state === state.name)
    if (match) setSelectedCity(String(match.name))
  }

  return (
    <div ref={root} data-page="our-footprint" className="overflow-hidden bg-white text-[#081632]">
      {content?.showHero !== false && (
        <section className="footprint-hero relative isolate min-h-[640px] overflow-hidden bg-[#020c20] text-white lg:min-h-[650px]">
          <div className="absolute inset-0 -z-20">
            <Image
              src={getText(content, 'heroImage', '/images/site/transport-hero.png')}
              alt={getText(content, 'heroImageAlt', 'GoAhead Mobility transportation fleet')}
              fill
              priority
              unoptimized
              sizes="100vw"
              className="object-cover object-center opacity-60"
            />
          </div>
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(1,9,24,.98)_0%,rgba(2,14,34,.91)_37%,rgba(2,12,29,.50)_72%,rgba(1,8,20,.68)_100%)]" />
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_73%_48%,rgba(0,146,255,.18),transparent_48%)]" />
          <div className="mx-auto grid min-h-[640px] max-w-[1380px] items-center gap-3 px-5 py-14 sm:px-8 lg:min-h-[650px] lg:grid-cols-[.92fr_1.08fr] lg:px-10 lg:py-12">
            <div className="relative z-10 max-w-[560px] py-5" data-footprint-reveal>
              <p className="mb-4 text-[11px] font-bold uppercase tracking-[.2em] text-[#12c9f4]">
                {getText(content, 'heroEyebrow', 'OUR FOOTPRINT')}
              </p>
              <h1 className="max-w-[590px] text-[clamp(2.65rem,5vw,4.55rem)] font-semibold leading-[1.02] tracking-[-.045em]">
                {getText(content, 'heroTitle', 'Driven Across India.')}
                <span className="mt-1 block text-[#16b9ed]">{getText(content, 'heroAccent', 'Trusted Everywhere.')}</span>
              </h1>
              <p className="mt-5 max-w-[475px] text-[14px] leading-[1.8] text-white/85 sm:text-[15px]">
                {getText(content, 'heroDescription')}
              </p>
              <div className="mt-6 grid max-w-[550px] grid-cols-2 gap-2 sm:grid-cols-4">
                {heroStats.map((stat: RecordValue, index: number) => (
                  <div key={String(stat.label || index)} className="flex min-h-[96px] flex-col items-center justify-center rounded-lg border border-[#3e6d9e]/70 bg-[#03132b]/65 px-2 py-3 text-center backdrop-blur-sm">
                    <Icon name={stat.icon} className="mb-2 size-6 text-[#14c9f4]" />
                    <strong className="text-[21px] font-semibold leading-none sm:text-[23px]">{stat.value}</strong>
                    <span className="mt-1.5 text-[10px] leading-tight text-white/90">{stat.label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link href={getText(content, 'heroPrimaryHref', '/local-transportation')} className="group inline-flex min-h-11 items-center gap-3 rounded-full bg-[#0879f9] px-5 text-[12px] font-bold text-white shadow-lg shadow-blue-950/30 transition hover:bg-[#0069df]">
                  {getText(content, 'heroPrimaryLabel', 'Explore Solutions')}
                  <span className="flex size-7 items-center justify-center rounded-full bg-white/25"><ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" /></span>
                </Link>
                <a href={getText(content, 'heroSecondaryHref', '#footprint-cta')} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#12bde9]/80 px-5 text-[12px] font-semibold text-white transition hover:bg-[#0c9dd2]/15">
                  {getText(content, 'heroSecondaryLabel', 'Talk To Our Expert')}
                  <Phone className="size-4" />
                </a>
              </div>
            </div>

            <div className="relative mx-auto flex h-[405px] w-full max-w-[600px] items-center justify-center sm:h-[485px] lg:h-[570px]" aria-label="Interactive map of approved GoAhead Mobility service cities">
              <IndiaNetworkMap
                cities={cities}
                activeCityName={activeCity?.name}
                highlightedState={selectedState || activeCity?.state}
                onSelectCity={selectCity}
              />
              <div className="absolute bottom-2 right-0 max-w-[230px] rounded-lg border border-white/15 bg-[#020d22]/90 px-4 py-3 shadow-2xl backdrop-blur-md sm:bottom-4 sm:right-3">
                <span className="absolute bottom-3 left-0 top-3 w-0.5 bg-[#11c7ef]" />
                <p className="pl-2 text-[13px] font-semibold leading-snug text-white">{getText(content, 'heroStatement', 'One Network. Limitless Possibilities.')}</p>
                {activeCity?.name ? <p className="mt-1 pl-2 text-[10px] text-cyan-200">{activeCity.name} · {activeCity.serviceCount}</p> : null}
              </div>
            </div>
          </div>
        </section>
      )}

      {content?.showPresence !== false && (
        <section id="presence" className="relative bg-white px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
          <div className="mx-auto max-w-[1380px]">
            <div className="mb-7 text-center" data-footprint-reveal>
              <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#049dcc]">{getText(content, 'presenceEyebrow', 'OUR NETWORK')}</p>
              <h2 className="mt-2 text-[clamp(1.65rem,3.3vw,2.35rem)] font-bold tracking-[-.035em] text-[#081632]">
                {getText(content, 'presenceTitle', 'Our Presence Across India')}
              </h2>
              <p className="mt-2 text-[13px] text-[#41506b]">{getText(content, 'presenceDescription')}</p>
            </div>

            <div className="grid items-stretch gap-4 lg:grid-cols-[205px_minmax(0,1fr)_205px]">
              <aside className="rounded-xl border border-[#e6eaf0] bg-[#fbfcfe] p-4 shadow-[0_6px_24px_rgba(7,22,48,.06)]" data-footprint-reveal>
                <h3 className="mb-3 text-[16px] font-bold text-[#101e3e]">{getText(content, 'stateCoverageTitle', 'State Coverage')}</h3>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-1">
                  {states.map((state: RecordValue, index: number) => {
                    const active = selectedState === state.name
                    return (
                      <button type="button" key={String(state.name || index)} onClick={() => selectState(state)} aria-pressed={active}
                        className={'group flex min-w-0 items-center gap-2 rounded-lg border px-2 py-2 text-left transition ' + (active ? 'border-[#17b5e8] bg-[#eaf9ff]' : 'border-transparent bg-white hover:border-[#d8e6f2] hover:bg-[#f2f9fd]')}>
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-[#e4eaf1] bg-white text-[#133268] shadow-sm"><Icon name={state.icon} className="size-4" /></span>
                        <span className="min-w-0 flex-1">
                          <strong className="block truncate text-[11px] font-bold text-[#102044]">{state.name}</strong>
                          <span className="mt-0.5 block text-[9px] text-[#52617b]">{state.cityCount}</span>
                        </span>
                        <ArrowRight className="size-3 shrink-0 text-[#079fe0] transition-transform group-hover:translate-x-0.5" />
                      </button>
                    )
                  })}
                </div>
                {states.length === 0 ? <p className="text-xs text-[#65718a]">Approved state coverage will appear here.</p> : null}
                {selectedState ? <p className="mt-3 border-t border-[#e5eaf0] pt-3 text-[10px] leading-relaxed text-[#53617a]">{states.find((state) => state.name === selectedState)?.description}</p> : null}
              </aside>

              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
                {cities.map((city: RecordValue, index: number) => {
                  const active = (activeCity?.name || selectedCity) === city.name
                  return (
                    <motion.button
                      type="button"
                      key={String(city.name || index)}
                      onClick={() => selectCity(city)}
                      aria-pressed={active}
                      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.12 }}
                      transition={reduceMotion ? { duration: 0 } : { duration: 0.48, delay: Math.min(index * 0.055, 0.35), ease: [0.22, 1, 0.36, 1] }}
                      whileHover={reduceMotion ? undefined : { y: -4, scale: 1.012 }}
                      className={'group relative min-h-[146px] overflow-hidden rounded-xl text-left text-white shadow-[0_8px_22px_rgba(3,17,38,.14)] ring-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#079fe0] sm:min-h-[166px] ' + (active ? 'ring-2 ring-[#13b8ed]' : '')}
                    >
                      <Image src={getText(city, 'image', '/images/site/ind-corporate.png')} alt={getText(city, 'imageAlt', city.name)} fill unoptimized sizes="(max-width: 640px) 50vw, (max-width: 1280px) 28vw, 18vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                      <span className="absolute inset-0 bg-gradient-to-t from-[#020814]/95 via-[#071a31]/25 to-transparent" />
                      <span className="absolute inset-x-0 bottom-0 p-3">
                        <strong className="block text-[13px] font-bold leading-tight sm:text-[14px]">{city.name}</strong>
                        <span className="mt-1.5 inline-flex items-center gap-1 text-[9px] font-medium text-[#14d0ff]"><MapPin className="size-3 fill-current" />{city.serviceCount}</span>
                      </span>
                    </motion.button>
                  )
                })}
                {cities.length === 0 ? <p className="col-span-full rounded-xl border border-dashed border-[#d7e1ed] p-8 text-center text-sm text-[#64718a]">Approved city service areas will appear here.</p> : null}
              </div>

              <aside className="rounded-xl border border-[#e6eaf0] bg-[#fbfcfe] p-4 shadow-[0_6px_24px_rgba(7,22,48,.06)]" data-footprint-reveal>
                <h3 className="mb-4 text-[16px] font-bold text-[#101e3e]">{getText(content, 'regionalStrengthTitle', 'Regional Strength')}</h3>
                <div className="flex flex-col gap-4">
                  {regions.map((region: RecordValue, index: number) => (
                    <div className="flex items-start gap-3" key={String(region.name || index)}>
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-[#e5eaf0] bg-white text-[#102f68] shadow-[0_3px_12px_rgba(5,22,48,.09)]"><Icon name={region.icon} className="size-5" /></span>
                      <div className="min-w-0">
                        <strong className="block text-[11px] font-bold text-[#102044]">{region.name}</strong>
                        <span className="mt-0.5 block text-[10px] font-medium text-[#172c50]">{region.cityCount}</span>
                        <p className="mt-1 text-[10px] leading-[1.55] text-[#43516b]">{region.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {regions.length === 0 ? <p className="text-xs text-[#65718a]">Approved regional details will appear here.</p> : null}
              </aside>
            </div>
          </div>
        </section>
      )}

      {content?.showMetrics !== false && (
        <section className="bg-white px-4 pb-3 sm:px-6 lg:px-8" data-footprint-reveal>
          <div className="mx-auto grid max-w-[1380px] grid-cols-2 overflow-hidden rounded-2xl bg-[#03132f] text-white shadow-[0_12px_30px_rgba(3,17,48,.18)] sm:grid-cols-3 lg:grid-cols-6">
            {metrics.map((metric: RecordValue, index: number) => (
              <div key={String(metric.label || index)} className="relative flex min-h-[92px] items-center gap-3 px-4 py-4 sm:px-5">
                {index > 0 && <span aria-hidden className="absolute bottom-5 left-0 top-5 hidden w-px bg-white/15 lg:block" />}
                <Icon name={metric.icon} className="size-7 shrink-0 text-[#08c6f4]" />
                <span className="min-w-0">
                  <strong className="block text-[20px] font-semibold leading-none sm:text-[22px]">{metric.value}</strong>
                  <span className="mt-1 block text-[10px] leading-tight text-white/85">{metric.label}</span>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {content?.showCta !== false && (
        <section id="footprint-cta" className="bg-white px-4 py-3 sm:px-6 lg:px-8" data-footprint-reveal>
          <div className="relative mx-auto flex max-w-[1380px] flex-col overflow-hidden rounded-2xl bg-[#03132f] text-white shadow-[0_12px_30px_rgba(3,17,48,.18)] lg:min-h-[142px] lg:flex-row lg:items-center">
            <div className="absolute inset-0 opacity-40">
              <Image src={getText(content, 'ctaImage', '/images/site/fleet-bus.png')} alt={getText(content, 'ctaImageAlt', 'GoAhead Mobility fleet')} fill unoptimized sizes="100vw" className="object-cover object-left" />
            </div>
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,13,35,.32),#03132f_34%,#03132f_100%)]" />
            <div className="relative flex min-h-[150px] w-full flex-col justify-center gap-4 px-6 py-6 sm:px-9 lg:min-h-[142px] lg:flex-row lg:items-center lg:justify-between lg:px-10">
              <div className="max-w-[620px] lg:pl-[230px]">
                <h2 className="text-[clamp(1.4rem,2.6vw,2rem)] font-bold leading-tight tracking-[-.025em]">{getText(content, 'ctaTitle', 'Wherever You Are, We Are There.')}</h2>
                <p className="mt-2 text-[12px] leading-[1.7] text-white/85 sm:text-[13px]">{getText(content, 'ctaDescription')}</p>
              </div>
              <div className="flex shrink-0 flex-col gap-2 lg:min-w-[260px]">
                <Link href={getText(content, 'ctaButtonHref', '/contact')} className="group inline-flex min-h-10 items-center justify-between gap-3 rounded-full bg-[#0879f9] px-5 text-[12px] font-bold text-white transition hover:bg-[#0069df]">
                  {getText(content, 'ctaButtonLabel', 'Get a Custom Proposal')}
                  <span className="flex size-6 items-center justify-center rounded-full bg-white/25"><ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" /></span>
                </Link>
                <a href={phoneHref} className="inline-flex items-center justify-center gap-2 text-[13px] font-semibold text-white hover:text-[#13c5f1]">
                  <Phone className="size-4 text-[#13c5f1]" /> {phone}
                </a>
              </div>
            </div>
          </div>
        </section>
      )}
      <div className="h-2 bg-white" />
    </div>
  )
}
