'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import {
  ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, CalendarClock, Captions, CheckCircle2,
  Clock3, FileVideo, PlayCircle, ShieldCheck, Users, UserRound, Building2, BookOpen,
  ClipboardList, Video, Code2, Settings, Route,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Breadcrumbs } from '@/components/site/breadcrumbs'
import { Markdown, SmartImage, formatDate } from '@/components/site/primitives'
import { WebinarRegistrationForm } from '@/components/site/webinar-registration-form'
import { Parallax } from '@/components/motion/gsap-effects'

type Props = { resource: Record<string, any> }

const audienceIcons: Record<string, LucideIcon> = {
  users: Users,
  settings: Settings,
  handshake: Handshake,
  'building-2': Building2,
  'shield-check': ShieldCheck,
  route: Route,
  'clipboard-list': ClipboardList,
}
function AudienceIcon({ name }: { name?: string }) {
  const Icon = audienceIcons[name || ''] || Users
  return <Icon className="size-7" aria-hidden="true" />
}
function timestampSeconds(value?: string) {
  if (!value) return null
  const parts = value.trim().split(':').map((part) => Number(part))
  if (!parts.length || parts.length > 3 || parts.some((part) => !Number.isFinite(part) || part < 0)) return null
  return parts.reduce((total, part) => total * 60 + part, 0)
}
function videoSource(value?: string, startAt = 0) {
  if (!value || !/^https:\/\//i.test(value)) return null
  try {
    const url = new URL(value)
    const host = url.hostname.toLowerCase().replace(/^www\./, '')
    if (host === 'youtu.be' || host.endsWith('youtube.com') || host === 'youtube-nocookie.com') {
      let id = ''
      if (host === 'youtu.be') id = url.pathname.split('/').filter(Boolean)[0] || ''
      else {
        const segments = url.pathname.split('/').filter(Boolean)
        id = url.searchParams.get('v') || (['embed', 'shorts', 'live'].includes(segments[0] || '') ? segments[1] || '' : '')
      }
      if (!/^[\w-]{6,20}$/.test(id)) return null
      const start = startAt > 0 ? '?start=' + Math.floor(startAt) : ''
      return { kind: 'embed' as const, src: 'https://www.youtube-nocookie.com/embed/' + id + start }
    }
    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
      const id = url.pathname.split('/').filter(Boolean).find((part) => /^\d+$/.test(part))
      if (!id) return null
      const start = startAt > 0 ? '#t=' + Math.floor(startAt) + 's' : ''
      return { kind: 'embed' as const, src: 'https://player.vimeo.com/video/' + id + start }
    }
    if (/\.(mp4|m4v|webm|ogv)$/i.test(url.pathname)) return { kind: 'file' as const, src: url.toString() }
    return null
  } catch {
    return null
  }
}

export function ResourceWebinarDetailPage({ resource: d }: Props) {
  const reducedMotion = Boolean(useReducedMotion())
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [activeChapterIndex, setActiveChapterIndex] = useState(0)
  const slug = String(d.slug || '')
  const title = String(d.title || 'Webinar')
  const chapters = Array.isArray(d.sessionChapters) ? d.sessionChapters.filter((item: any) => item?.title) : []
  const outcomes = Array.isArray(d.learningOutcomes) ? d.learningOutcomes.filter((item: any) => item?.title) : []
  const audiences = Array.isArray(d.audiences) ? d.audiences.filter((item: any) => item?.title) : []
  const speakers = Array.isArray(d.speakers) ? d.speakers.filter((item: any) => item?.name) : []
  const related = Array.isArray(d.relatedResources) ? d.relatedResources.slice(0, 3) : []
  const tags: string[] = Array.isArray(d.tags) ? d.tags.filter(Boolean).slice(0, 4) : []
  const selectedChapter = chapters[activeChapterIndex]
  const chapterStart = timestampSeconds(selectedChapter?.timestamp) || 0
  const player = videoSource(d.videoUrl, chapterStart)
  const published = formatDate(d.publishedAt) || 'Managed in resource details'
  const updated = formatDate(d.updatedAt) || 'Managed in resource details'
  const duration = d.durationLabel || 'Managed in resource details'
  const format = d.videoFormat || 'Webinar Replay'
  const needsRegistration = d.videoAccessMode !== 'open_access'
  const videoDetails = [
    { icon: FileVideo, title: 'Video format', value: format },
    { icon: Clock3, title: 'Duration', value: duration },
    { icon: CalendarDays, title: 'Published', value: published },
    { icon: CalendarClock, title: 'Updated', value: updated },
    { icon: Code2, title: 'Version', value: d.version ? 'v' + d.version : 'Managed in CMS' },
    { icon: ShieldCheck, title: 'Access mode', value: needsRegistration ? 'Registration required' : 'Open access' },
    { icon: Captions, title: 'Captions / transcript', value: d.captionsUrl ? (d.captionsLabel || 'Available') : 'Managed in CMS' },
  ]
  const navItems = [
    { label: d.webinarOverviewTabLabel || 'Overview', href: '#webinar-overview', icon: Users },
    { label: d.webinarLearningTabLabel || "What You'll Learn", href: '#webinar-learning', icon: BookOpen },
    { label: d.webinarChaptersTabLabel || 'Session Chapters', href: '#webinar-chapters', icon: ClipboardList },
    { label: d.webinarSpeakersTabLabel || 'Speakers', href: '#webinar-speakers', icon: Users },
    { label: d.webinarDetailsTabLabel || 'Details', href: '#webinar-details', icon: CalendarDays },
  ]
  const ctaHref = d.webinarBottomCtaButtonHref || '/contact?topic=resource'
  const motionProps = reducedMotion
    ? { initial: false as const, animate: { opacity: 1, y: 0 }, transition: { duration: 0 } }
    : { initial: { opacity: 0, y: 12 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.14 }, transition: { duration: 0.32, ease: 'easeOut' as const } }

  const selectChapter = (index: number) => {
    setActiveChapterIndex(index)
    const seconds = timestampSeconds(chapters[index]?.timestamp)
    if (seconds == null) return
    if (videoRef.current && videoSource(d.videoUrl)?.kind === 'file') {
      videoRef.current.currentTime = seconds
      void videoRef.current.play().catch(() => {})
    }
  }

  const playerContent = player?.kind === 'file' ? (
    <video
      key={player.src}
      ref={videoRef}
      className="h-full w-full bg-[#07172e] object-contain"
      controls
      playsInline
      preload="metadata"
      poster={d.image || undefined}
      aria-label={'Webinar video: ' + title}
    >
      <source src={player.src} />
      {d.captionsUrl ? <track kind="captions" src={d.captionsUrl} srcLang="en" label={d.captionsLabel || 'Captions'} default /> : null}
      Your browser does not support HTML video.
    </video>
  ) : player?.kind === 'embed' ? (
    <iframe
      key={player.src}
      src={player.src}
      title={'Webinar video: ' + title}
      className="h-full w-full border-0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
      allowFullScreen
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
    />
  ) : d.image ? (
    <div className="relative h-full w-full">
      <SmartImage src={d.image} alt={title} sizes="(min-width: 1024px) 58vw, 100vw" className="object-cover" />
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#061630]/40 p-6 text-center text-white">
        <PlayCircle className="size-14" aria-hidden="true" />
        <p className="mt-3 text-sm font-semibold">Video playback is being prepared</p>
        <p className="mt-1 max-w-sm text-xs text-white/85">Add a public MP4, WebM, YouTube or Vimeo URL in the webinar resource editor to enable playback.</p>
      </div>
    </div>
  ) : (
    <div className="flex h-full w-full flex-col items-center justify-center bg-[#07172e] p-6 text-center text-white">
      <Video className="size-14 text-[#82b8ff]" aria-hidden="true" />
      <p className="mt-3 text-sm font-semibold">Webinar video not configured</p>
      <p className="mt-1 max-w-sm text-xs text-white/75">Add a public MP4, WebM, YouTube or Vimeo URL in Admin → Resources.</p>
    </div>
  )

  return (
    <article data-page="resource-webinar-detail" className="overflow-hidden bg-white text-[#101d42]">
      <section className="border-b border-[#e7edf5] bg-[linear-gradient(135deg,#f8fbff_0%,#ffffff_62%,#f3f8ff_100%)]">
        <div className="mx-auto max-w-[1240px] px-5 pb-9 pt-6 sm:px-7 lg:px-10 lg:pb-11">
          <Breadcrumbs trail={[
            { name: 'Home', path: '/' },
            { name: 'Resources', path: '/resources' },
            { name: 'Videos & Webinars', path: '/resources' },
            { name: title, path: '/resources/' + slug },
          ]} />
          <div className="mt-7 grid items-start gap-7 lg:grid-cols-[.82fr_1.18fr] lg:gap-9">
            <div className="max-w-[560px]">
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#167be7]">{d.eyebrow || 'WEBINAR REPLAY'}</p>
              <h1 className="mt-3 text-balance text-[clamp(2rem,4.1vw,3.05rem)] font-semibold leading-[1.08] tracking-[-.045em] text-[#101d42]">{title}</h1>
              {d.summary ? <p className="mt-4 max-w-[520px] text-sm leading-7 text-[#4c5872] sm:text-[15px]">{d.summary}</p> : null}
              {tags.length ? <div className="mt-5 flex flex-wrap gap-2">{tags.map((tag) => <span key={tag} className="inline-flex items-center gap-2 rounded-lg border border-[#e0e8f4] bg-white/90 px-3 py-2 text-[10px] font-medium text-[#25365c]"><span className="size-2 rounded-full bg-[#1682f6]" />{tag}</span>)}</div> : null}
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { icon: Clock3, label: 'Duration', value: duration },
                  { icon: FileVideo, label: 'Format', value: format },
                  { icon: CalendarDays, label: 'Published', value: published },
                  { icon: CalendarClock, label: 'Updated', value: updated },
                ].map((item) => <div key={item.label} className="flex items-start gap-2 text-[9px] text-[#69758d]">
                  <item.icon className="mt-0.5 size-4 shrink-0 text-[#1678ed]" aria-hidden="true" />
                  <span><strong className="block text-[10px] font-semibold text-[#27375d]">{item.label}</strong><span className="mt-1 block leading-4">{item.value}</span></span>
                </div>)}
              </div>
              {d.webinarMetadataNote ? <p className="mt-4 rounded-lg border border-[#dce9ff] bg-[#f3f7ff] p-3 text-[10px] leading-5 text-[#5b6d89]"><ShieldCheck className="mr-2 inline size-4 text-[#1678ef]" aria-hidden="true" />{d.webinarMetadataNote}</p> : null}
            </div>

            <Parallax amount={1} className="grid gap-4">
              <div className="relative aspect-video overflow-hidden rounded-xl border border-[#dce5f0] bg-[#07172e] shadow-[0_14px_38px_rgba(16,36,72,.16)]">{playerContent}</div>
              <div className="grid items-center gap-4 rounded-xl border border-[#e2eaf4] bg-white p-4 shadow-[0_8px_24px_rgba(16,36,72,.07)] sm:grid-cols-[1fr_auto] sm:p-5">
                <div>
                  <h2 className="text-sm font-semibold text-[#17284d]">{d.webinarWatchHeading || 'Watch this webinar'}</h2>
                  <p className="mt-1 text-[10px] leading-5 text-[#66738b]">{d.webinarWatchIntro || 'Gain practical perspectives and frameworks you can apply in your organisation.'}</p>
                </div>
                <Link href="#watch-access" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#0863f7] px-5 py-3 text-[11px] font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#064fca] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1677ef] focus-visible:ring-offset-2">
                  <Users className="size-4" aria-hidden="true" /> {d.webinarSubmitLabel || 'Register to watch'}
                </Link>
              </div>
            </Parallax>
          </div>
        </div>
      </section>

      <nav aria-label="Webinar sections" className="sticky top-0 z-30 border-b border-[#e5eaf2] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1240px] gap-6 overflow-x-auto px-5 sm:px-7 lg:gap-10 lg:px-10">
          {navItems.map((item, index) => <a key={item.href} href={item.href} className={'relative flex shrink-0 items-center gap-2 py-4 text-[10px] font-semibold transition-colors hover:text-[#0863f7] focus-visible:outline-none focus-visible:text-[#0863f7] ' + (index === 0 ? 'text-[#0863f7]' : 'text-[#66738f')}>
            <span className="flex size-6 items-center justify-center rounded-md bg-[#f1f6ff] text-[#1678ec]"><item.icon className="size-3.5" aria-hidden="true" /></span>
            {item.label}
            {index === 0 ? <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#0863f7]" /> : null}
          </a>)}
        </div>
      </nav>

      <div className="mx-auto max-w-[1240px] px-5 pb-8 sm:px-7 lg:px-10">
        <section id="webinar-overview" className={'scroll-mt-24 grid gap-7 border-b border-[#e8edf4] py-9 lg:gap-10 lg:py-10 ' + (audiences.length ? 'lg:grid-cols-[.82fr_1.18fr]' : '')}>
          <motion.div {...motionProps}>
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#167be7]">About this session</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#142449]">{d.webinarAboutHeading || 'About this session'}</h2>
            {d.body ? <div className="mt-4 text-[12px] leading-6 text-[#5e6a83]"><Markdown>{d.body}</Markdown></div> : <p className="mt-4 text-[12px] leading-6 text-[#5e6a83]">{d.summary}</p>}
          </motion.div>
          {audiences.length ? <motion.div {...motionProps}>
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#167be7]">For your team</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#142449]">{d.webinarAudienceHeading || 'Who should watch'}</h2>
            <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
              {audiences.map((item: any, index: number) => <div key={item.title || index} className="flex flex-col items-center border-l border-[#e9eef5] px-2 text-center first:border-0">
                <span className="flex size-11 items-center justify-center text-[#1678f2]"><AudienceIcon name={item.icon} /></span>
                <strong className="mt-2 text-[10px] leading-4 text-[#17284d]">{item.title}</strong>
                {item.body ? <span className="mt-1 text-[9px] leading-4 text-[#6c7890]">{item.body}</span> : null}
              </div>)}
            </div>
          </motion.div> : null}
        </section>

        <section className="grid gap-4 py-7 lg:grid-cols-[.82fr_1.18fr] lg:py-8">
          <motion.div {...motionProps} id="webinar-learning" className="scroll-mt-24 rounded-xl border border-[#e8eef6] bg-white p-5 shadow-[0_5px_20px_rgba(20,43,80,.035)]">
            <h2 className="text-lg font-semibold tracking-tight text-[#142449]">{d.webinarLearningHeading || "What you'll learn"}</h2>
            {outcomes.length ? <ol className="mt-4 space-y-4">
              {outcomes.map((item: any, index: number) => <li key={item.title || index} className="flex gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#0863f7] text-[10px] font-semibold text-white">{String(index + 1).padStart(2, '0')}</span>
                <span><strong className="block text-[10px] leading-4 text-[#192a50]">{item.title}</strong>{item.body ? <span className="mt-1 block text-[9px] leading-4 text-[#66728a]">{item.body}</span> : null}</span>
              </li>)}
            </ol> : <p className="mt-4 text-xs text-[#6b7891]">Add learning outcomes in Admin → Resources to show what viewers will learn.</p>}
          </motion.div>
          <motion.div {...motionProps} id="webinar-chapters" className="scroll-mt-24 rounded-xl border border-[#e8eef6] bg-white p-5 shadow-[0_5px_20px_rgba(20,43,80,.035)]">
            <h2 className="text-lg font-semibold tracking-tight text-[#142449]">{d.webinarChaptersHeading || 'Session chapters'}</h2>
            {chapters.length ? <ol className="mt-4 divide-y divide-[#edf1f6]">
              {chapters.map((item: any, index: number) => <li key={(item.timestamp || '') + '-' + item.title} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-[#d5e5ff] bg-white text-[9px] font-semibold text-[#0863f7]">{item.number || 'Chapter ' + (index + 1)}</span>
                <span className="min-w-0"><strong className="block text-[10px] text-[#1b2c50]">{item.title}</strong>{item.body ? <span className="mt-1 block text-[9px] leading-4 text-[#69758d]">{item.body}</span> : null}</span>
                <button type="button" onClick={() => selectChapter(index)} aria-label={'Play ' + item.title + (item.timestamp ? ' at ' + item.timestamp : '')} aria-current={activeChapterIndex === index ? 'true' : undefined} className={'min-w-16 rounded-md px-2 py-1.5 text-left text-[9px] leading-4 transition hover:bg-[#f0f6ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1677ef] ' + (activeChapterIndex === index ? 'bg-[#eef5ff] font-semibold text-[#0863f7]' : 'text-[#68758d]')}>
                  {item.timestamp || 'Play chapter'}
                </button>
              </li>)}
            </ol> : <p className="mt-4 text-xs text-[#6b7891]">Add chapter titles and timestamps in Admin → Resources.</p>}
          </motion.div>
        </section>

        <section id="webinar-speakers" className="scroll-mt-24 py-2">
          <motion.div {...motionProps} className="rounded-xl border border-[#e8eef6] bg-white p-5 shadow-[0_5px_20px_rgba(20,43,80,.035)] sm:p-6">
            <h2 className="text-lg font-semibold tracking-tight text-[#142449]">{d.webinarSpeakersHeading || 'Meet the speakers'}</h2>
            {speakers.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {speakers.map((speaker: any, index: number) => <article key={speaker.name + '-' + index} className="flex items-center gap-3 rounded-lg border border-[#e6edf6] bg-white p-3">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-full border border-[#dce6f2] bg-[#f0f3f8]">
                  {speaker.photo ? <SmartImage src={speaker.photo} alt={speaker.photoAlt || speaker.name} sizes="56px" className="object-cover" /> : <UserRound className="absolute inset-0 m-auto size-9 text-[#a5adba]" aria-hidden="true" />}
                </div>
                <div className="min-w-0"><h3 className="text-[11px] font-semibold text-[#18294e]">{speaker.name}</h3>{speaker.title ? <p className="mt-1 text-[9px] leading-4 text-[#64718a]">{speaker.title}</p> : null}{speaker.bio ? <p className="mt-1 line-clamp-2 text-[9px] leading-4 text-[#69758d]">{speaker.bio}</p> : null}</div>
              </article>)}
            </div> : <p className="mt-4 text-xs text-[#69758d]">Speaker details will appear here after they are added and approved in the resource editor.</p>}
            {d.webinarSpeakerNote ? <p className="mt-3 text-center text-[10px] leading-4 text-[#7a869d]">{d.webinarSpeakerNote}</p> : null}
          </motion.div>
        </section>

        <section id="watch-access" className="scroll-mt-24 grid gap-5 rounded-xl border border-[#e8eef6] bg-white p-5 shadow-[0_5px_20px_rgba(20,43,80,.035)] sm:p-6 lg:grid-cols-[.88fr_1.12fr] lg:gap-8">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-[#142449]">{d.webinarWatchHeading || 'Watch access'}</h2>
            <p className="mt-2 text-[11px] leading-5 text-[#64718a]">{d.webinarWatchIntro || 'This webinar is on-demand. Register below to watch the full session.'}</p>
            <div className="mt-4 rounded-lg border border-[#e1ebfb] bg-[#f3f7ff] p-4">
              <h3 className="text-[10px] font-semibold text-[#27375d]">{d.webinarInformationHeading || 'Information we collect'}</h3>
              <p className="mt-2 text-[10px] leading-5 text-[#64718a]">{d.webinarInformationBody || 'We collect your work email and company details to provide access to this webinar and share related resources.'}</p>
              <p className="mt-2 text-[10px] leading-5 text-[#64718a]">{d.webinarPrivacyText || 'Read our Privacy Policy for more information.'} <Link href={d.webinarPrivacyHref || '/privacy-policy'} className="font-semibold text-[#0863f7] underline underline-offset-2">Privacy Policy</Link></p>
            </div>
          </div>
          <WebinarRegistrationForm
            resourceSlug={slug}
            privacyHref={d.webinarPrivacyHref || '/privacy-policy'}
            submitLabel={d.webinarSubmitLabel || 'Register to watch'}
            successHeading={d.webinarSuccessHeading || "You're registered"}
            successBody={d.webinarSuccessBody || 'Thank you. Your webinar registration has been received.'}
          />
        </section>

        <section id="webinar-details" className="scroll-mt-24 py-7">
          <div className="rounded-xl border border-[#e8eef6] bg-white p-5 shadow-[0_6px_22px_rgba(20,43,80,.035)] sm:p-6">
            <h2 className="text-lg font-semibold tracking-tight text-[#142449]">{d.webinarDetailsHeading || 'Resource details'}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-7">
              {videoDetails.map((item) => <div key={item.title} className="flex items-center gap-3 rounded-lg border border-[#e7edf6] bg-[#fbfdff] p-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[#d8e7ff] bg-white text-[#1678ef]"><item.icon className="size-4" aria-hidden="true" /></span>
                <span className="min-w-0"><strong className="block text-[9px] font-semibold text-[#24365b]">{item.title}</strong><span className="mt-1 block text-[9px] leading-4 text-[#64718a]">{item.value}</span></span>
              </div>)}
            </div>
            {d.webinarMetadataNote ? <p className="mt-3 flex gap-2 text-[10px] leading-relaxed text-[#74809a]"><CheckCircle2 className="size-4 shrink-0 text-[#1678ef]" aria-hidden="true" />{d.webinarMetadataNote}</p> : null}
          </div>
        </section>

        <section className="pb-7 pt-1">
          <div className="mb-4 flex items-end justify-between gap-4">
            <h2 className="text-xl font-semibold tracking-tight text-[#142449]">{d.webinarRelatedHeading || 'Related videos and resources'}</h2>
            <Link href="/resources" className="hidden items-center gap-1 text-xs font-semibold text-[#0863f7] sm:inline-flex">Browse all resources <ArrowRight className="size-4" aria-hidden="true" /></Link>
          </div>
          {related.length ? <div className="grid gap-3 md:grid-cols-3">
            {related.map((item: any) => <Link key={item._id || item.slug} href={item.href || '/resources/' + item.slug} className="group grid min-h-[142px] grid-cols-[38%_1fr] overflow-hidden rounded-xl border border-[#e1e8f2] bg-white transition hover:-translate-y-0.5 hover:border-[#a8cafa] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1677ee]">
              <div className="relative min-h-[142px] bg-[#f1f5fb]"><SmartImage src={item.image || '/images/site/transport-hero.png'} alt={item.title || ''} sizes="(min-width: 768px) 160px, 40vw" className="object-cover" /></div>
              <span className="flex min-w-0 flex-col p-3">
                <span className="w-fit rounded-full border border-[#dce9fa] bg-[#f8fbff] px-2 py-0.5 text-[8px] font-semibold uppercase text-[#1678ed]">{item.resourceType === 'webinar' ? 'WEBINAR REPLAY' : item.resourceType || 'RESOURCE'}</span>
                <strong className="mt-2 line-clamp-2 text-[11px] leading-4 text-[#17284d] group-hover:text-[#0863f7]">{item.title}</strong>
                <span className="mt-1 line-clamp-2 text-[9px] leading-4 text-[#69758d]">{item.summary}</span>
                <span className="mt-auto pt-2 text-[9px] font-semibold text-[#0863f7]">{item.resourceType === 'webinar' ? 'Watch now' : 'View resource'} <ArrowUpRight className="inline size-3" aria-hidden="true" /></span>
              </span>
            </Link>)}
          </div> : <p className="rounded-xl border border-dashed border-[#dce5f1] p-5 text-xs text-[#69758d]">Related videos and resources will appear here as they are published.</p>}
        </section>

        <section className="relative isolate mb-7 grid overflow-hidden rounded-2xl border border-[#dce9ff] bg-[linear-gradient(110deg,#f3f7ff,#f9fbff)] p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-5 sm:p-7">
          <div className="flex size-16 items-center justify-center rounded-full border border-[#84b5ff] bg-white text-[#0863f7] sm:size-20"><Users className="size-9" aria-hidden="true" /></div>
          <div className="relative z-10 mt-4 sm:mt-0"><h2 className="max-w-xl text-xl font-semibold leading-tight tracking-tight text-[#142449]">{d.webinarBottomCtaTitle || 'Planning a more coordinated employee transport programme?'}</h2><p className="mt-2 max-w-xl text-xs leading-relaxed text-[#64718a]">{d.webinarBottomCtaBody || 'Our mobility experts can help you design, implement and operate a programme that is safe, reliable and people-centric.'}</p></div>
          <Link href={ctaHref} className="relative z-10 mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-[#0863f7] px-5 py-3 text-[11px] font-semibold text-white transition hover:bg-[#064fca] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1677ee] focus-visible:ring-offset-2 sm:mt-0">{d.webinarBottomCtaButtonLabel || 'Discuss your requirements'} <ArrowRight className="size-4" aria-hidden="true" /></Link>
          <div className="pointer-events-none absolute -right-8 -bottom-20 size-64 rounded-full border-[24px] border-[#dce9ff]/65" />
        </section>

        <nav aria-label="Resource navigation" className="flex items-center justify-between gap-4 pb-6">
          {d.previousResource ? <Link href={'/resources/' + d.previousResource.slug} className="inline-flex items-center gap-2 rounded-xl border border-[#e2eaf5] px-3 py-2 text-[10px] font-semibold text-[#405274] transition hover:border-[#9fc6ff] hover:text-[#0863f7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1677ee]"><ArrowLeft className="size-4" /><span><strong className="block">Previous resource</strong><span className="block max-w-40 truncate font-normal">{d.previousResource.title}</span></span></Link> : <span />}
          <Link href="/resources" className="inline-flex items-center gap-2 rounded-xl border border-[#e2eaf5] px-3 py-2 text-[10px] font-semibold text-[#405274] transition hover:border-[#9fc6ff] hover:text-[#0863f7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1677ee]"><span className="text-right"><strong className="block">Back to Resource Centre</strong><span className="block font-normal">Browse all resources</span></span><ArrowRight className="size-4" /></Link>
          {d.nextResource ? <Link href={'/resources/' + d.nextResource.slug} className="hidden items-center gap-2 rounded-xl border border-[#e2eaf5] px-3 py-2 text-[10px] font-semibold text-[#405274] transition hover:border-[#9fc6ff] hover:text-[#0863f7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1677ee] md:inline-flex"><span><strong className="block">Next resource</strong><span className="block max-w-40 truncate font-normal">{d.nextResource.title}</span></span><ArrowRight className="size-4" /></Link> : null}
        </nav>
      </div>
    </article>
  )
}
