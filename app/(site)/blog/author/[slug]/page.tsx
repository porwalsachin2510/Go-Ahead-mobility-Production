import type { Metadata } from 'next'
import { redirectOrNotFound } from '@/lib/server/services/blog-slugs'
import { ArchiveCrumbs, ArchivePosts } from '@/components/blog/archive-view'
import { JsonLd } from '@/components/site/json-ld'
import { SmartImage } from '@/components/site/primitives'
import { personSchema } from '@/lib/seo/jsonld'
import { archiveJsonLd, archiveMetadata, parsePage } from '@/lib/server/services/blog-archive'
import { applyRouteSeoMetadata, routeSeoJsonLd } from '@/lib/server/services/seo-page'
import { getTaxonomy, listPosts } from '@/lib/server/services/public'
import { getSeoSettings } from '@/lib/server/services/seo-inventory'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> }

async function load({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams])
  const author = await getTaxonomy('author', slug)
  if (!author || author.status !== 'published') return null
  const page = parsePage(sp.page)
  const result = await listPosts({ author: slug, page, limit: 12 })
  return { author, page, result, path: `/blog/author/${author.slug}` }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const d = await load(props)
  if (!d) return { robots: { index: false } }
  const desc = d.author.bio || `Articles written by ${d.author.name}${d.author.jobTitle ? `, ${d.author.jobTitle}` : ''}.`
  const base = await archiveMetadata({ path: d.path, title: `${d.author.name}, author`, description: desc, total: d.result.total, page: d.page, image: d.author.avatar })
  return applyRouteSeoMetadata(d.path, base, { preserveNoindex: d.page > 1 || d.result.total < 2 })
}

export default async function AuthorPage(props: Props) {
  const d = await load(props)
  if (!d) return redirectOrNotFound(`/blog/author/${slug}`)
  const { author } = d
  const { site } = await getSeoSettings()
  const trail = [
    { name: 'Home', path: '/' },
    { name: 'Insights', path: '/blog' },
    { name: 'Authors', path: '/blog/authors' },
    { name: author.name, path: d.path },
  ]
  const person = personSchema(site, { path: d.path, name: author.name, jobTitle: author.jobTitle, description: author.bio, image: author.avatar, sameAs: author.linkedin ? [author.linkedin] : [], knowsAbout: author.expertise })
  return (
    <>
      <JsonLd data={[...(await archiveJsonLd({ path: d.path, name: author.name, description: author.bio, trail, extra: [person] })), ...(await routeSeoJsonLd(d.path))]} />
      <ArchiveCrumbs trail={trail} />
      <section className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-12 md:flex-row md:items-center md:gap-10 md:px-8 md:py-16">
        {author.avatar ? (
          <div className="relative size-28 shrink-0 overflow-hidden rounded-full bg-muted md:size-36">
            <SmartImage src={author.avatar} alt={`Portrait of ${author.name}`} sizes="144px" priority />
          </div>
        ) : null}
        <div className="flex max-w-3xl flex-col gap-3">
          <span className="eyebrow text-royal">Author</span>
          <h1 className="display-md text-balance">{author.name}</h1>
          {author.jobTitle ? <p className="font-medium text-foreground">{author.jobTitle}</p> : null}
          {author.bio ? <p className="leading-relaxed text-muted-foreground text-pretty">{author.bio}</p> : null}
          <div className="flex flex-wrap items-center gap-2">
            {(author.expertise ?? []).map((e: string) => (
              <span key={e} className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                {e}
              </span>
            ))}
            {author.linkedin ? (
              <a href={author.linkedin} rel="me noopener noreferrer" target="_blank" className="text-sm font-medium text-royal underline underline-offset-4">
                LinkedIn profile
              </a>
            ) : null}
          </div>
        </div>
      </section>
      <h2 className="mx-auto max-w-7xl px-5 pb-6 font-display text-2xl font-semibold md:px-8">Articles by {author.name}</h2>
      <ArchivePosts items={d.result.items} page={d.page} pages={d.result.pages} basePath={d.path} />
    </>
  )
}
