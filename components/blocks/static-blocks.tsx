import Link from 'next/link'
import { ArrowRight, ArrowUpRight, Check } from 'lucide-react'
import { BlockIcon } from '@/components/site/icons'
import { CtaLink, Markdown, SectionHeading, SmartImage } from '@/components/site/primitives'
import { LeadForm, type LeadVariant } from '@/components/site/lead-form'
import { NewsletterForm } from '@/components/site/newsletter-form'
import { cn } from '@/lib/utils'

type D = Record<string, any>
const list = (v: unknown): D[] => (Array.isArray(v) ? (v as D[]) : [])
const str = (v: unknown) => (typeof v === 'string' ? v : '')

function toneClasses(tone?: string) {
  if (tone === 'dark') return { section: 'bg-ink text-primary-foreground', heading: 'dark' as const, card: 'border-primary-foreground/10 bg-ink-2', body: 'text-primary-foreground/70' }
  if (tone === 'paper') return { section: 'bg-paper', heading: 'light' as const, card: 'border-line bg-background', body: 'text-muted-foreground' }
  return { section: 'bg-background', heading: 'light' as const, card: 'border-line bg-background', body: 'text-muted-foreground' }
}

function Highlighted({ title, highlight }: { title: string; highlight?: string }) {
  if (!highlight || !title.includes(highlight)) return <>{title}</>
  const [before, ...rest] = title.split(highlight)
  return (
    <>
      {before}
      <span className="text-royal">{highlight}</span>
      {rest.join(highlight)}
    </>
  )
}

export function HeroBlock({ data, first }: { data: D; first: boolean }) {
  const Title = first ? 'h1' : 'h2'
  const routes = list(data.routes)
  if (data.variant === 'home') {
    return (
      <section className="route-grid relative overflow-hidden border-b border-line bg-paper">
        <div className="container-x flex flex-col gap-12 py-16 md:py-24">
          <div className="flex max-w-4xl flex-col gap-6">
            {data.eyebrow ? <span className="eyebrow text-royal">{data.eyebrow}</span> : null}
            <Title className="display-xl slant text-balance text-foreground">
              <Highlighted title={str(data.title)} highlight={str(data.highlight)} />
            </Title>
            {data.subtitle ? <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">{data.subtitle}</p> : null}
          </div>
          {routes.length ? (
            <div className="grid gap-5 md:grid-cols-2">
              {routes.map((r, i) => (
                <Link key={i} href={str(r.href) || '#'} className="group relative flex min-h-80 flex-col justify-end overflow-hidden rounded-3xl bg-ink p-7 text-primary-foreground md:min-h-96 md:p-9">
                  {r.image ? <SmartImage src={r.image} alt="" sizes="(min-width: 768px) 50vw, 100vw" priority={first} className="opacity-60 transition-transform duration-700 group-hover:scale-105" /> : null}
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-transparent" />
                  <div className="relative flex items-end justify-between gap-6">
                    <div className="flex flex-col gap-2">
                      <span className="eyebrow text-sky">{`Route 0${i + 1}`}</span>
                      <span className="font-display text-3xl font-extrabold md:text-4xl">{r.label}</span>
                      {r.description ? <span className="max-w-sm leading-relaxed text-primary-foreground/75">{r.description}</span> : null}
                    </div>
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-sky text-ink transition-transform group-hover:-rotate-45">
                      <ArrowRight aria-hidden className="size-5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <CtaLink href={data.primaryHref} label={data.primaryLabel} />
            <CtaLink href={data.secondaryHref} label={data.secondaryLabel} variant="secondary" />
          </div>
        </div>
      </section>
    )
  }
  return (
    <section className="route-grid border-b border-line bg-paper">
      <div className={cn('container-x grid items-center gap-10 py-16 md:py-20', data.image && 'lg:grid-cols-2')}>
        <div className="flex flex-col gap-6">
          {data.eyebrow ? <span className="eyebrow text-royal">{data.eyebrow}</span> : null}
          <Title className="display-lg slant text-balance text-foreground">
            <Highlighted title={str(data.title)} highlight={str(data.highlight)} />
          </Title>
          {data.subtitle ? <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">{data.subtitle}</p> : null}
          <div className="flex flex-wrap gap-3">
            <CtaLink href={data.primaryHref} label={data.primaryLabel} />
            <CtaLink href={data.secondaryHref} label={data.secondaryLabel} variant="secondary" />
          </div>
        </div>
        {data.image ? (
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-ink">
            <SmartImage src={data.image} alt={str(data.imageAlt)} sizes="(min-width: 1024px) 50vw, 100vw" priority={first} />
          </div>
        ) : null}
      </div>
    </section>
  )
}

export function VerticalsBlock({ data }: { data: D }) {
  const items = list(data.items)
  if (!items.length) return null
  return (
    <section className="bg-background py-20 md:py-28">
      <div className="container-x flex flex-col gap-12">
        <SectionHeading eyebrow={data.eyebrow} heading={data.heading} intro={data.intro} />
        <div className="grid gap-6 lg:grid-cols-2">
          {items.map((it, i) => (
            <article key={i} className="flex flex-col overflow-hidden rounded-3xl border border-line bg-background">
              {it.image ? (
                <div className="relative aspect-[16/9] bg-paper">
                  <SmartImage src={it.image} alt={str(it.imageAlt)} sizes="(min-width: 1024px) 50vw, 100vw" />
                </div>
              ) : null}
              <div className="flex flex-1 flex-col gap-4 p-7 md:p-9">
                {it.eyebrow ? <span className="eyebrow text-royal">{it.eyebrow}</span> : null}
                <h3 className="font-display text-2xl font-extrabold text-foreground md:text-3xl">{it.title}</h3>
                {it.body ? <p className="leading-relaxed text-muted-foreground">{it.body}</p> : null}
                {list(it.points).length || (Array.isArray(it.points) && it.points.length) ? (
                  <ul className="flex flex-col gap-2">
                    {(it.points as string[]).map((p) => (
                      <li key={p} className="flex items-start gap-2 text-sm text-foreground">
                        <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-sky" />
                        {p}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {it.href ? (
                  <Link href={it.href} className="mt-auto inline-flex items-center gap-2 pt-2 text-sm font-semibold text-royal hover:underline">
                    {it.ctaLabel || 'Explore'}
                    <ArrowRight aria-hidden className="size-4" />
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </div>
        <CtaLink href={data.ctaHref} label={data.ctaLabel} variant="secondary" className="self-start" />
      </div>
    </section>
  )
}

export function RichTextBlock({ data }: { data: D }) {
  const wide = data.width === 'wide'
  return (
    <section className="bg-background py-16 md:py-20">
      <div className={cn('container-x', wide ? 'grid gap-10 lg:grid-cols-12' : 'max-w-3xl')}>
        <div className={cn('flex flex-col gap-6', wide && 'lg:col-span-8')}>
          {data.eyebrow || data.heading ? <SectionHeading eyebrow={data.eyebrow} heading={data.heading} /> : null}
          <Markdown>{str(data.body)}</Markdown>
        </div>
        {wide && data.aside ? (
          <aside className="h-fit rounded-2xl border border-line bg-paper p-6 text-sm leading-relaxed text-muted-foreground lg:col-span-4">{data.aside}</aside>
        ) : null}
      </div>
    </section>
  )
}

export function ImageTextBlock({ data }: { data: D }) {
  const t = toneClasses(data.tone)
  return (
    <section className={cn('py-16 md:py-24', t.section)}>
      <div className="container-x grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className={cn('relative aspect-[4/3] overflow-hidden rounded-3xl bg-paper', data.reverse && 'lg:order-2')}>
          {data.image ? <SmartImage src={data.image} alt={str(data.imageAlt)} sizes="(min-width: 1024px) 50vw, 100vw" /> : null}
        </div>
        <div className="flex flex-col gap-5">
          <SectionHeading eyebrow={data.eyebrow} heading={data.heading} tone={t.heading} />
          <Markdown className={t.heading === 'dark' ? 'prose-invert' : undefined}>{str(data.body)}</Markdown>
        </div>
      </div>
    </section>
  )
}

export function FeaturesBlock({ data }: { data: D }) {
  const items = list(data.items)
  if (!items.length) return null
  const t = toneClasses(data.tone)
  const cols = { '2': 'md:grid-cols-2', '3': 'md:grid-cols-2 lg:grid-cols-3', '4': 'md:grid-cols-2 lg:grid-cols-4' }[str(data.columns) || '3']
  return (
    <section className={cn('py-20 md:py-28', t.section)}>
      <div className="container-x flex flex-col gap-12">
        <SectionHeading eyebrow={data.eyebrow} heading={data.heading} intro={data.intro} tone={t.heading} />
        <div className={cn('grid gap-5', cols)}>
          {items.map((it, i) => {
            const inner = (
              <>
                <span className={cn('flex size-11 items-center justify-center rounded-xl', t.heading === 'dark' ? 'bg-sky/15 text-sky' : 'bg-sky-soft text-royal')}>
                  <BlockIcon name={it.icon} className="size-5" />
                </span>
                <h3 className="font-display text-lg font-bold">{it.title}</h3>
                {it.body ? <p className={cn('text-sm leading-relaxed', t.body)}>{it.body}</p> : null}
              </>
            )
            const cls = cn('flex flex-col gap-4 rounded-2xl border p-6 transition-colors', t.card, it.href && 'hover:border-royal')
            return it.href ? (
              <Link key={i} href={it.href} className={cls}>
                {inner}
              </Link>
            ) : (
              <div key={i} className={cls}>
                {inner}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function ServiceCardsBlock({ data }: { data: D }) {
  const items = list(data.items)
  if (!items.length) return null
  return (
    <section className="bg-paper py-20 md:py-28">
      <div className="container-x flex flex-col gap-12">
        <SectionHeading eyebrow={data.eyebrow} heading={data.heading} intro={data.intro} />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((it, i) => (
            <Link key={i} href={str(it.href) || '#'} className="group flex flex-col overflow-hidden rounded-3xl border border-line bg-background transition-shadow hover:shadow-xl hover:shadow-ink/5">
              <div className="relative aspect-[3/2] bg-sky-soft">
                {it.image ? <SmartImage src={it.image} alt={str(it.imageAlt)} sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" className="transition-transform duration-500 group-hover:scale-105" /> : null}
                {it.tag ? <span className="absolute left-4 top-4 rounded-full bg-background px-3 py-1 text-xs font-semibold text-royal">{it.tag}</span> : null}
              </div>
              <div className="flex flex-1 flex-col gap-3 p-6">
                <h3 className="flex items-start justify-between gap-4 font-display text-xl font-bold text-foreground">
                  {it.title}
                  <ArrowUpRight aria-hidden className="size-5 shrink-0 text-royal transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </h3>
                {it.body ? <p className="text-sm leading-relaxed text-muted-foreground">{it.body}</p> : null}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export function StepsBlock({ data }: { data: D }) {
  const items = list(data.items)
  if (!items.length) return null
  return (
    <section className="bg-ink py-20 text-primary-foreground md:py-28">
      <div className="container-x flex flex-col gap-12">
        <SectionHeading eyebrow={data.eyebrow} heading={data.heading} intro={data.intro} tone="dark" />
        <ol className="grid gap-px overflow-hidden rounded-3xl border border-primary-foreground/10 bg-primary-foreground/10 md:grid-cols-2 lg:grid-cols-4">
          {items.map((it, i) => (
            <li key={i} className="flex flex-col gap-4 bg-ink p-7">
              <span className="font-mono text-sm text-sky">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="font-display text-lg font-bold">{it.title}</h3>
              {it.body ? <p className="text-sm leading-relaxed text-primary-foreground/70">{it.body}</p> : null}
            </li>
          ))}
        </ol>
        {data.note ? <p className="text-sm text-primary-foreground/60">{data.note}</p> : null}
      </div>
    </section>
  )
}

export function ChallengesBlock({ data }: { data: D }) {
  const items = list(data.items)
  if (!items.length) return null
  return (
    <section className="bg-background py-20 md:py-28">
      <div className="container-x flex flex-col gap-12">
        <SectionHeading eyebrow={data.eyebrow} heading={data.heading} intro={data.intro} />
        <div className="flex flex-col divide-y divide-line border-y border-line">
          {items.map((it, i) => (
            <div key={i} className="grid gap-4 py-8 md:grid-cols-12 md:gap-8">
              <div className="flex flex-col gap-2 md:col-span-5">
                {it.vertical ? <span className="eyebrow text-royal">{it.vertical === 'transport' ? 'Transport' : it.vertical === 'accommodation' ? 'Accommodation' : 'Both'}</span> : null}
                <h3 className="font-display text-xl font-bold text-foreground">{it.problem}</h3>
                {it.detail ? <p className="text-sm leading-relaxed text-muted-foreground">{it.detail}</p> : null}
              </div>
              <div className="flex flex-col gap-3 md:col-span-7 md:border-l md:border-line md:pl-8">
                <span className="eyebrow text-muted-foreground">How we respond</span>
                <p className="leading-relaxed text-foreground">{it.solution}</p>
                {it.href ? (
                  <Link href={it.href} className="inline-flex items-center gap-2 text-sm font-semibold text-royal hover:underline">
                    Learn more <ArrowRight aria-hidden className="size-4" />
                  </Link>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function StatsBlock({ data }: { data: D }) {
  const items = list(data.items).filter((i) => i.value && i.label && i.source)
  if (!items.length) return null
  return (
    <section className="border-y border-line bg-paper py-16 md:py-20">
      <div className="container-x flex flex-col gap-10">
        <SectionHeading eyebrow={data.eyebrow} heading={data.heading} intro={data.intro} />
        <dl className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {items.map((it, i) => (
            <div key={i} className="flex flex-col gap-1 border-l-2 border-sky pl-5">
              <dt className="order-2 text-sm text-muted-foreground">{it.label}</dt>
              <dd className="order-1 font-display text-4xl font-extrabold text-foreground md:text-5xl">{it.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

export function FormBlock({ data }: { data: D }) {
  const variant = (['accommodation', 'transport', 'demo', 'contact'].includes(data.variant) ? data.variant : 'contact') as LeadVariant
  return (
    <section id="enquiry" className="scroll-mt-24 bg-paper py-20 md:py-28">
      <div className="container-x grid gap-10 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-4">
          <SectionHeading eyebrow={data.eyebrow} heading={data.heading} intro={data.intro} />
          {data.sideNote ? <Markdown className="text-sm">{str(data.sideNote)}</Markdown> : null}
        </div>
        <div className="lg:col-span-8">
          <LeadForm variant={variant} serviceType={str(data.serviceType)} />
        </div>
      </div>
    </section>
  )
}

export function NewsletterBlock({ data }: { data: D }) {
  return (
    <section className="bg-sky-soft py-16">
      <div className="container-x grid items-center gap-8 lg:grid-cols-2">
        <SectionHeading heading={data.heading || 'Mobility insights, occasionally.'} intro={data.intro} />
        <NewsletterForm source="block" />
      </div>
    </section>
  )
}

export function CtaBandBlock({ data }: { data: D }) {
  const tone = str(data.tone) || 'dark'
  const bg = tone === 'royal' ? 'bg-royal text-primary-foreground' : tone === 'sky' ? 'bg-sky text-ink' : 'bg-ink text-primary-foreground'
  const light = tone !== 'sky'
  return (
    <section className="bg-background py-12 md:py-16">
      <div className="container-x">
        <div className={cn('grain relative flex flex-col gap-8 overflow-hidden rounded-3xl px-7 py-12 md:flex-row md:items-end md:justify-between md:px-14 md:py-16', bg)}>
          <div className="relative flex max-w-2xl flex-col gap-4">
            <h2 className="display-md text-balance">{data.heading}</h2>
            {data.body ? <p className={cn('text-lg leading-relaxed', light ? 'text-primary-foreground/75' : 'text-ink/75')}>{data.body}</p> : null}
          </div>
          <div className="relative flex flex-wrap gap-3">
            <CtaLink href={data.primaryHref} label={data.primaryLabel} variant={tone === 'sky' ? 'primary' : 'sky'} />
            <CtaLink href={data.secondaryHref} label={data.secondaryLabel} variant={light ? 'ghost-dark' : 'secondary'} />
          </div>
        </div>
      </div>
    </section>
  )
}
