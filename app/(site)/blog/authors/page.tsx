import type { Metadata } from 'next'
import Link from 'next/link'
import { ArchiveCrumbs } from '@/components/blog/archive-view'
import { JsonLd } from '@/components/site/json-ld'
import { EmptyState, PageIntro, SmartImage } from '@/components/site/primitives'
import { archiveJsonLd, archiveMetadata } from '@/lib/server/services/blog-archive'
import { listPublicAuthors } from '@/lib/server/services/public'
import { applyRouteSeoMetadata, routeSeoJsonLd } from '@/lib/server/services/seo-page'

const PATH = '/blog/authors'

export async function generateMetadata(): Promise<Metadata> {
  const authors = await listPublicAuthors()
  const base = await archiveMetadata({ path: PATH, title: 'Our authors', description: 'The specialists behind Go Ahead Mobility insights.', total: authors.length, page: 1 })
  return applyRouteSeoMetadata(PATH, base, { preserveNoindex: authors.length < 2 })
}

export default async function AuthorsPage() {
  const authors = await listPublicAuthors()
  const trail = [
    { name: 'Home', path: '/' },
    { name: 'Insights', path: '/blog' },
    { name: 'Authors', path: PATH },
  ]
  return (
    <>
      <JsonLd data={[...(await archiveJsonLd({ path: PATH, name: 'Authors', trail })), ...(await routeSeoJsonLd(PATH))]} />
      <ArchiveCrumbs trail={trail} />
      <PageIntro eyebrow="Insights" title="Our authors" intro="The accommodation and transportation specialists who write our field notes." />
      <section className="mx-auto max-w-7xl px-5 pb-24 md:px-8">
        {authors.length ? (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {authors.map((a: any) => (
              <li key={a._id}>
                <Link href={`/blog/author/${a.slug}`} className="group flex h-full items-start gap-4 rounded-2xl border border-line p-5 transition-colors hover:border-royal">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-full bg-muted">
                    {a.avatar ? <SmartImage src={a.avatar} alt="" sizes="56px" /> : null}
                  </div>
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="font-display text-lg font-semibold group-hover:text-royal">{a.name}</span>
                    {a.jobTitle ? <span className="text-sm text-muted-foreground">{a.jobTitle}</span> : null}
                    <span className="text-xs text-muted-foreground">
                      {a.postCount} {a.postCount === 1 ? 'article' : 'articles'}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No authors yet" body="Author profiles appear here once they have published articles." />
        )}
      </section>
    </>
  )
}
