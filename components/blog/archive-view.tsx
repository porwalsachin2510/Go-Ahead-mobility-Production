import Link from 'next/link'
import { PostCard } from '@/components/blocks/dynamic-blocks'
import { EmptyState } from '@/components/site/primitives'

export function ArchivePosts({ items, page, pages, basePath, emptyTitle = 'No published articles yet' }: { items: any[]; page: number; pages: number; basePath: string; emptyTitle?: string }) {
  const href = (p: number) => (p <= 1 ? basePath : `${basePath}?page=${p}`)
  return (
    <section className="mx-auto flex max-w-7xl flex-col gap-10 px-5 pb-24 md:px-8">
      {items.length ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <PostCard key={p._id} post={p} />
          ))}
        </div>
      ) : (
        <EmptyState title={emptyTitle} body="Browse all insights for the latest articles." />
      )}
      {pages > 1 ? (
        <nav aria-label="Pagination" className="flex items-center justify-center gap-4 text-sm">
          {page > 1 ? (
            <Link href={href(page - 1)} rel="prev" className="rounded-full border border-line px-4 py-2 hover:bg-muted">
              Newer articles
            </Link>
          ) : null}
          <span className="text-muted-foreground">
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link href={href(page + 1)} rel="next" className="rounded-full border border-line px-4 py-2 hover:bg-muted">
              Older articles
            </Link>
          ) : null}
        </nav>
      ) : null}
    </section>
  )
}

export function ArchiveCrumbs({ trail }: { trail: { name: string; path: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mx-auto max-w-7xl px-5 pt-6 text-sm text-muted-foreground md:px-8">
      <ol className="flex flex-wrap items-center gap-1">
        {trail.map((t, i) => (
          <li key={t.path} className="flex items-center gap-1">
            {i > 0 ? <span aria-hidden>/</span> : null}
            {i < trail.length - 1 ? (
              <Link href={t.path} className="hover:text-foreground hover:underline">
                {t.name}
              </Link>
            ) : (
              <span aria-current="page" className="text-foreground">
                {t.name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
