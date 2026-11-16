import Link from 'next/link'
import { ArrowRight, Download, Mail, MapPin, Phone, Quote } from 'lucide-react'
import { BlockIcon } from '@/components/site/icons'
import { FaqList } from '@/components/site/faq-list'
import { SectionHeading, SmartImage, formatDate } from '@/components/site/primitives'
import { getSettings, listFaqs, listHomePosts, listIndustries, listLocations, listLogos, listProof, listResources, listTeam } from '@/lib/server/services/public'

type D = Record<string, any>
const num = (v: unknown, d: number) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : d)

export async function IndustriesBlock({ data }: { data: D }) {
  const items = await listIndustries(num(data.limit, 24))
  if (!items.length) return null
  return (
    <section className="bg-background py-20 md:py-28">
      <div className="container-x flex flex-col gap-12">
        <SectionHeading eyebrow={data.eyebrow} heading={data.heading} intro={data.intro} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it: any) => (
            <Link key={it._id} href={`/industries/${it.slug}`} className="group flex flex-col gap-4 rounded-2xl border border-line bg-background p-6 transition-colors hover:border-royal hover:bg-paper">
              <span className="flex size-11 items-center justify-center rounded-xl bg-sky-soft text-royal">
                <BlockIcon name={it.icon} className="size-5" />
              </span>
              <h3 className="font-display text-lg font-bold text-foreground">{it.title}</h3>
              {it.summary ? <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{it.summary}</p> : null}
              <span className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-royal">
                View industry <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export async function ProofBlock({ data }: { data: D }) {
  const { testimonials, caseStudies } = await listProof(data.vertical || undefined)
  if (!testimonials.length && !caseStudies.length) return null
  return (
    <section className="bg-paper py-20 md:py-28">
      <div className="container-x flex flex-col gap-12">
        <SectionHeading eyebrow={data.eyebrow} heading={data.heading} intro={data.intro} />
        {caseStudies.length ? (
          <div className="grid gap-5 lg:grid-cols-3">
            {caseStudies.map((c: any) => (
              <Link key={c._id} href={`/case-studies/${c.slug}`} className="group flex flex-col overflow-hidden rounded-3xl border border-line bg-background">
                <div className="relative aspect-[16/10] bg-sky-soft">{c.image ? <SmartImage src={c.image} alt="" sizes="(min-width: 1024px) 33vw, 100vw" /> : null}</div>
                <div className="flex flex-col gap-3 p-6">
                  <span className="eyebrow text-royal">{c.anonymized ? 'Client confidential' : c.clientName}</span>
                  <h3 className="font-display text-lg font-bold text-foreground group-hover:text-royal">{c.title}</h3>
                  <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{c.summary}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : null}
        {testimonials.length ? (
          <div className="grid gap-5 md:grid-cols-2">
            {testimonials.map((t: any) => (
              <figure key={t._id} className="flex flex-col gap-5 rounded-3xl bg-ink p-8 text-primary-foreground">
                <Quote aria-hidden className="size-7 text-sky" />
                <blockquote className="text-lg leading-relaxed">{t.quote}</blockquote>
                <figcaption className="text-sm text-primary-foreground/70">
                  <span className="font-semibold text-primary-foreground">{t.personName}</span>
                  {[t.personTitle, t.company].filter(Boolean).length ? `, ${[t.personTitle, t.company].filter(Boolean).join(', ')}` : ''}
                </figcaption>
              </figure>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}

export async function LogoWallBlock({ data }: { data: D }) {
  const logos = await listLogos()
  if (!logos.length) return null
  return (
    <section className="border-y border-line bg-background py-12">
      <div className="container-x flex flex-col gap-8">
        {data.heading ? <p className="eyebrow text-center text-muted-foreground">{data.heading}</p> : null}
        <ul className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
          {logos.map((l: any) => (
            <li key={l._id} className="relative h-10 w-32 opacity-70 grayscale transition hover:opacity-100 hover:grayscale-0">
              <SmartImage src={l.logo} alt={l.name} sizes="128px" className="object-contain" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export async function FaqBlock({ data }: { data: D }) {
  const items = await listFaqs({ category: data.category || undefined, vertical: data.vertical || undefined, limit: num(data.limit, 8) })
  if (!items.length) return null
  return (
    <section className="bg-background py-20 md:py-28">
      <div className="container-x grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <SectionHeading eyebrow={data.eyebrow || 'FAQ'} heading={data.heading} intro={data.intro} />
        </div>
        <div className="lg:col-span-8">
          <FaqList items={items} />
        </div>
      </div>
    </section>
  )
}

export async function PostsBlock({ data }: { data: D }) {
  const posts = await listHomePosts(num(data.limit, 3), data.vertical || undefined)
  if (!posts.length) return null
  return (
    <section className="bg-background py-20 md:py-28">
      <div className="container-x flex flex-col gap-12">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading eyebrow={data.eyebrow} heading={data.heading} intro={data.intro} />
          <Link href="/blog" className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-royal hover:underline">
            All insights <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {posts.map((p: any) => (
            <PostCard key={p._id} post={p} />
          ))}
        </div>
      </div>
    </section>
  )
}

export function PostCard({ post }: { post: any }) {
  const cat = post.categoryIds?.[0]
  return (
    <Link href={`/blog/${post.slug}`} className="group flex flex-col gap-4">
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-sky-soft">
        {post.heroImage ? <SmartImage src={post.heroImage} alt={post.heroAlt || ''} sizes="(min-width: 768px) 33vw, 100vw" className="transition-transform duration-500 group-hover:scale-105" /> : null}
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {cat?.name ? <span className="font-semibold uppercase tracking-wider text-royal">{cat.name}</span> : null}
        <span>{formatDate(post.publishedAt || post.publishAt)}</span>
        {post.readingMinutes ? <span>{`${post.readingMinutes} min read`}</span> : null}
      </div>
      <h3 className="font-display text-xl font-bold text-balance text-foreground group-hover:text-royal">{post.title}</h3>
      {post.excerpt ? <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p> : null}
    </Link>
  )
}

export async function ResourcesBlock({ data }: { data: D }) {
  const items = await listResources({ vertical: data.vertical || undefined, limit: num(data.limit, 3) })
  if (!items.length) return null
  return (
    <section className="bg-paper py-20 md:py-28">
      <div className="container-x flex flex-col gap-12">
        <SectionHeading eyebrow={data.eyebrow} heading={data.heading} intro={data.intro} />
        <div className="grid gap-5 md:grid-cols-3">
          {items.map((r: any) => (
            <Link key={r._id} href={`/resources/${r.slug}`} className="group flex flex-col gap-4 rounded-2xl border border-line bg-background p-6 hover:border-royal">
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-royal">
                <Download aria-hidden className="size-4" /> {r.resourceType}
              </span>
              <h3 className="font-display text-lg font-bold text-foreground">{r.title}</h3>
              {r.summary ? <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{r.summary}</p> : null}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export async function CoverageBlock({ data }: { data: D }) {
  const locations = await listLocations(data.vertical || undefined)
  if (!locations.length) return null
  const byCountry = new Map<string, any[]>()
  for (const l of locations) byCountry.set(l.country, [...(byCountry.get(l.country) ?? []), l])
  return (
    <section className="bg-ink py-20 text-primary-foreground md:py-28">
      <div className="container-x flex flex-col gap-12">
        <SectionHeading eyebrow={data.eyebrow} heading={data.heading} intro={data.intro} tone="dark" />
        <div className="grid gap-px overflow-hidden rounded-3xl border border-primary-foreground/10 bg-primary-foreground/10 sm:grid-cols-2 lg:grid-cols-3">
          {[...byCountry.entries()].map(([country, cities]) => (
            <div key={country} className="flex flex-col gap-4 bg-ink p-6">
              <h3 className="flex items-center gap-2 font-display text-lg font-bold">
                <MapPin aria-hidden className="size-4 text-sky" /> {country}
              </h3>
              <ul className="flex flex-col gap-2">
                {cities.map((c: any) => (
                  <li key={c._id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-primary-foreground/85">{c.city}</span>
                    <span className="rounded-full bg-primary-foreground/10 px-2.5 py-0.5 text-xs text-primary-foreground/70">
                      {c.vertical === 'both' ? 'Stay + Move' : c.vertical === 'transport' ? 'Move' : 'Stay'}
                      {c.serviceStatus && c.serviceStatus !== 'active' ? ` · ${c.serviceStatus}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export async function TeamBlock({ data }: { data: D }) {
  const team = await listTeam()
  if (!team.length) return null
  return (
    <section className="bg-background py-20 md:py-28">
      <div className="container-x flex flex-col gap-12">
        <SectionHeading eyebrow={data.eyebrow} heading={data.heading} intro={data.intro} />
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {team.map((m: any) => (
            <li key={m._id} className="flex flex-col gap-3">
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-sky-soft">{m.photo ? <SmartImage src={m.photo} alt={m.name} sizes="(min-width: 1024px) 25vw, 50vw" /> : null}</div>
              <p className="font-display text-lg font-bold text-foreground">{m.name}</p>
              <p className="text-sm text-royal">{m.role}</p>
              {m.bio ? <p className="text-sm leading-relaxed text-muted-foreground">{m.bio}</p> : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

const CONTACT_LABELS: Record<string, string> = {
  email: 'General enquiries',
  salesEmail: 'Sales',
  accommodationEmail: 'Global accommodation',
  transportEmail: 'Local transportation',
  careersEmail: 'Careers',
  phone: 'Phone',
  whatsapp: 'WhatsApp',
  address: 'Office',
}

export async function ContactDetailsBlock({ data }: { data: D }) {
  const settings = await getSettings()
  const entries = Object.entries(settings.contact ?? {}).filter(([, v]) => typeof v === 'string' && v.trim())
  if (!entries.length) return null
  return (
    <section className="bg-background py-16 md:py-20">
      <div className="container-x flex flex-col gap-10">
        <SectionHeading eyebrow={data.eyebrow} heading={data.heading} intro={data.intro} />
        <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map(([key, value]) => {
            const isMail = value.includes('@')
            const isPhone = /^[+\d][\d\s()-]{5,}$/.test(value)
            const href = isMail ? `mailto:${value}` : isPhone ? `tel:${value.replace(/\s/g, '')}` : undefined
            const Icon = isMail ? Mail : isPhone ? Phone : MapPin
            return (
              <div key={key} className="flex flex-col gap-2 rounded-2xl border border-line p-6">
                <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Icon aria-hidden className="size-4 text-royal" />
                  {CONTACT_LABELS[key] ?? key}
                </dt>
                <dd className="font-display text-lg font-bold text-foreground">
                  {href ? (
                    <a href={href} className="break-words hover:text-royal">
                      {value}
                    </a>
                  ) : (
                    <span className="whitespace-pre-line">{value}</span>
                  )}
                </dd>
              </div>
            )
          })}
        </dl>
      </div>
    </section>
  )
}
