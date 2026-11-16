import type { Metadata } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { ArrowLeft, ArrowRight, CalendarDays, Clock3, LockKeyhole, Mail, Share2 } from 'lucide-react'
import { redirectOrNotFound } from '@/lib/server/services/blog-slugs'
import { PostCard } from '@/components/blocks/dynamic-blocks'
import { CtaLink, Markdown, SmartImage, formatDate } from '@/components/site/primitives'
import { JsonLd } from '@/components/site/json-ld'
import { PostComments } from '@/components/site/post-comments'
import { ReadingProgress } from '@/components/site/reading-progress'
import { ArticleMotion, ArticleReveal } from '@/components/site/article-motion'
import { articleSchema, breadcrumbSchema } from '@/lib/seo/jsonld'
import { entitySchemaNodes } from '@/lib/seo/entity-schema'
import { buildMetadata, resolveEffectiveSeo } from '@/lib/seo/metadata'
import { getPost, listPopularPosts, listTermsWithCounts } from '@/lib/server/services/public'
import { getSeoSettings } from '@/lib/server/services/seo-inventory'
import { extractToc } from '@/lib/blog/toc'
import { canonicalUrl } from '@/lib/seo/config'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const data = await getPost(slug)
  if (!data) return { robots: { index: false } }
  const { post } = data
  const { site } = await getSeoSettings()
  const seo = post.seo ?? {}
  const eff = resolveEffectiveSeo('post', site, { name: post.title, summary: post.excerpt || post.content, explicitTitle: seo.title, explicitDescription: seo.description })
  return buildMetadata({
    site, path: `/blog/${post.slug}`, title: eff.title, description: eff.description,
    canonical: seo.canonical, noindex: seo.noindex, nofollow: seo.nofollow,
    ogTitle: seo.ogTitle, ogDescription: seo.ogDescription,
    ogImage: seo.ogImage || post.heroImage, ogImageAlt: post.heroAlt, type: 'article',
    publishedTime: post.publishedAt, modifiedTime: post.contentUpdatedAt || post.updatedAt,
    authors: post.authorId?.name ? [post.authorId.name] : undefined,
  })
}

function SidebarCard({ children, title, className = '' }: { children: ReactNode; title: string; className?: string }) {
  return <section data-article-reveal className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(8,28,59,.045)] ${className}`}><h2 className="mb-4 text-base font-bold text-slate-950">{title}</h2>{children}</section>
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params
  const data = await getPost(slug)
  if (!data) return redirectOrNotFound(`/blog/${slug}`)
  const { post, related, older, newer, series } = data
  const [popular, categories] = await Promise.all([listPopularPosts(5), listTermsWithCounts('category')])
  const takeaways = (post.keyTakeaways ?? []).map((t: any) => t?.text?.trim()).filter(Boolean)
  const partIndex = series ? series.parts.findIndex((p: any) => String(p._id) === String(post._id)) : -1
  const { site } = await getSeoSettings()
  const path = `/blog/${post.slug}`
  const author = post.authorId?.status === 'published' ? post.authorId : post.authorId?.name ? { ...post.authorId, slug: null } : null
  const authorPath = author?.slug ? `/blog/author/${author.slug}` : undefined
  const category = post.categoryIds?.[0]
  const trail = [{ name: 'Home', path: '/' }, { name: 'Blog & Insights', path: '/blog' }, ...(category ? [{ name: category.name, path: `/blog/category/${category.slug}` }] : []), { name: post.title, path }]
  const toc = extractToc(post.content || '')
  const updated = post.contentUpdatedAt && post.publishedAt && new Date(post.contentUpdatedAt).getTime() - new Date(post.publishedAt).getTime() > 86_400_000 ? post.contentUpdatedAt : null
  const shareUrl = canonicalUrl(site.siteUrl, path)
  const jsonLd = [
    articleSchema(site, { path, headline: post.title, description: post.excerpt, image: post.heroImage, published: post.publishedAt, modified: post.contentUpdatedAt || post.updatedAt, authorName: author?.name, authorUrl: authorPath ? canonicalUrl(site.siteUrl, authorPath) : undefined }),
    breadcrumbSchema(site, trail),
    ...entitySchemaNodes(site, path, post.seo),
  ]

  return (
    <ArticleMotion>
      <article className="bg-[#f7f9fc] text-slate-900">
        <JsonLd data={jsonLd} />
        <ReadingProgress slug={post.slug} targetId="article-body" />
        <header className="relative isolate min-h-[390px] overflow-hidden bg-[#03132d] text-white md:min-h-[430px]">
          {post.heroImage ? <div data-article-parallax className="absolute inset-0 -right-[12%] left-[28%] opacity-75"><SmartImage src={post.heroImage} alt={post.heroAlt || ''} sizes="(min-width: 1024px) 75vw, 100vw" priority /></div> : null}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#03132d_0%,rgba(3,19,45,.98)_30%,rgba(3,19,45,.78)_54%,rgba(3,19,45,.18)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(2,12,31,.42),transparent_55%)]" />
          <div className="relative mx-auto flex min-h-[390px] max-w-7xl flex-col justify-end gap-5 px-5 pb-10 pt-24 md:min-h-[430px] md:px-8 md:pb-12">
            <nav aria-label="Breadcrumb" className="text-xs text-white/65">
              <ol className="flex flex-wrap items-center gap-2">
                {trail.map((item, index) => <li key={item.path} className="flex items-center gap-2">{index > 0 ? <span aria-hidden>/</span> : null}{index === trail.length - 1 ? <span aria-current="page" className="max-w-[240px] truncate text-white/90">{item.name}</span> : <Link href={item.path} className="transition hover:text-sky-300">{item.name}</Link>}</li>)}
              </ol>
            </nav>
            {category ? <Link href={`/blog/category/${category.slug}`} className="w-fit rounded-full border border-sky-300/30 bg-blue-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[.12em] text-sky-200">{category.name}</Link> : <span className="eyebrow text-sky-300">Blog & Insights</span>}
            <h1 className="max-w-3xl break-words font-display text-4xl font-bold leading-[1.08] tracking-tight text-balance md:text-5xl lg:text-[3.5rem]">{post.title}</h1>
            {post.subtitle || post.excerpt ? <p className="max-w-2xl text-base leading-relaxed text-white/75 md:text-lg">{post.subtitle || post.excerpt}</p> : null}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-white/75">
              <span className="inline-flex items-center gap-2"><CalendarDays className="size-4 text-sky-300" /><time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time></span>
              {post.readingMinutes ? <span className="inline-flex items-center gap-2"><Clock3 className="size-4 text-sky-300" />{post.readingMinutes} min read</span> : null}
              {author ? <span className="inline-flex items-center gap-2">{author.avatar ? <span className="relative size-7 overflow-hidden rounded-full border border-white/30"><SmartImage src={author.avatar} alt="" sizes="28px" /></span> : null}<span>By {author.name}</span></span> : null}
              {updated ? <span>Updated {formatDate(updated)}</span> : null}
            </div>
          </div>
        </header>

        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-9 md:px-8 md:py-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-9">
          <main className="min-w-0">
            {post.heroImage ? <ArticleReveal className="mb-7"><figure className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_14px_38px_rgba(8,28,59,.08)]"><div className="relative aspect-[16/8]"><SmartImage src={post.heroImage} alt={post.heroAlt || ''} sizes="(min-width: 1024px) 850px, 100vw" priority /></div>{post.heroCaption ? <figcaption className="px-5 py-3 text-xs text-slate-500">{post.heroCaption}</figcaption> : null}</figure></ArticleReveal> : null}

            {series && series.parts.length > 1 ? <ArticleReveal><nav aria-label={`Series: ${series.title}`} className="mb-7 rounded-2xl border border-blue-100 bg-blue-50/70 p-5"><p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">{`Part ${partIndex + 1} of ${series.parts.length}`}</p><Link href={`/blog/series/${series.slug}`} className="mt-1 block font-semibold hover:underline">{series.title}</Link><ol className="mt-3 grid gap-2 text-sm sm:grid-cols-2">{series.parts.map((p: any, i: number) => <li key={p._id}>{i === partIndex ? <span aria-current="page" className="font-semibold text-slate-900">{i + 1}. {p.title}</span> : <Link href={`/blog/${p.slug}`} className="text-slate-600 hover:text-blue-700">{i + 1}. {p.title}</Link>}</li>)}</ol></nav></ArticleReveal> : null}

            {takeaways.length ? <ArticleReveal><aside aria-labelledby="takeaways-heading" className="mb-8 rounded-2xl border border-blue-100 bg-blue-50/70 p-6"><h2 id="takeaways-heading" className="font-display text-lg font-bold">Key takeaways</h2><ul className="mt-3 grid gap-2 text-sm leading-relaxed text-slate-700">{takeaways.map((text: string, index: number) => <li key={index} className="flex gap-2"><span className="mt-1 size-2 shrink-0 rounded-full bg-blue-600" />{text}</li>)}</ul></aside></ArticleReveal> : null}

            <ArticleReveal className="rounded-2xl border border-slate-200 bg-white px-5 py-7 shadow-[0_8px_28px_rgba(8,28,59,.035)] md:px-8 md:py-9">
              <div id="article-body" className="prose-ga max-w-none">
                <Markdown anchors>{post.content || ''}</Markdown>
              </div>
            </ArticleReveal>

            {post.references?.length ? <ArticleReveal><aside className="mt-7 rounded-2xl border border-slate-200 bg-white p-6"><h2 className="font-display text-lg font-bold">References & further reading</h2><ul className="mt-3 grid gap-2 text-sm">{post.references.map((reference: any, index: number) => <li key={index}>{reference.url ? <a href={reference.url} rel="noopener noreferrer nofollow" target="_blank" className="text-blue-700 underline decoration-blue-200 underline-offset-4 hover:decoration-blue-600">{reference.label || reference.url}</a> : reference.label}</li>)}</ul></aside></ArticleReveal> : null}

            {post.categoryIds?.length || post.tagIds?.length ? <div className="mt-7 flex flex-wrap gap-2" aria-label="Article topics">{(post.categoryIds ?? []).map((item: any) => <Link key={item._id} href={`/blog/category/${item.slug}`} className="rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-800 transition hover:border-blue-600 hover:bg-blue-50">{item.name}</Link>)}{(post.tagIds ?? []).map((item: any) => <Link key={item._id} href={`/blog/tag/${item.slug}`} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-600 transition hover:bg-blue-50 hover:text-blue-800">#{item.name}</Link>)}</div> : null}

            <ArticleReveal className="mt-7 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5">
              <span className="inline-flex items-center gap-2 text-sm font-semibold"><Share2 className="size-4 text-blue-600" />Share this article</span>
              <div className="flex flex-wrap gap-2 text-xs font-semibold"><a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="rounded-full bg-[#0a66c2] px-4 py-2 text-white transition hover:-translate-y-0.5">LinkedIn</a><a href={`https://x.com/intent/post?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.title)}`} target="_blank" rel="noopener noreferrer" className="rounded-full bg-slate-950 px-4 py-2 text-white transition hover:-translate-y-0.5">X</a><a href={`mailto:?subject=${encodeURIComponent(post.title)}&body=${encodeURIComponent(shareUrl)}`} className="rounded-full border border-slate-200 px-4 py-2 text-slate-700 transition hover:border-blue-500"><Mail className="inline size-3.5" /> Email</a></div>
            </ArticleReveal>

            {author && (author.bio || authorPath) ? <ArticleReveal><aside aria-label="About the author" className="mt-7 flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-6">{author.avatar ? <div className="relative size-16 shrink-0 overflow-hidden rounded-full bg-slate-100 ring-4 ring-blue-50"><SmartImage src={author.avatar} alt="" sizes="64px" /></div> : null}<div className="min-w-0"><p className="font-display text-lg font-bold">{authorPath ? <Link href={authorPath} className="hover:text-blue-700">{author.name}</Link> : author.name}</p>{author.jobTitle ? <p className="mt-0.5 text-xs font-semibold text-blue-700">{author.jobTitle}</p> : null}{author.bio ? <p className="mt-2 text-sm leading-relaxed text-slate-600">{author.bio}</p> : null}{authorPath ? <Link href={authorPath} className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-blue-700">More articles by {author.name} <ArrowRight className="size-3.5" /></Link> : null}</div></aside></ArticleReveal> : null}

            {older || newer ? <nav aria-label="More articles" className="mt-8 grid gap-3 sm:grid-cols-2">{older ? <Link href={`/blog/${older.slug}`} rel="prev" className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:border-blue-300"><span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-700"><ArrowLeft className="size-3" /> Previous article</span><span className="mt-2 block text-sm font-bold leading-snug group-hover:text-blue-700">{older.title}</span></Link> : <span />}{newer ? <Link href={`/blog/${newer.slug}`} rel="next" className="group rounded-2xl border border-slate-200 bg-white p-5 text-right transition hover:-translate-y-1 hover:border-blue-300"><span className="flex items-center justify-end gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-700">Next article <ArrowRight className="size-3" /></span><span className="mt-2 block text-sm font-bold leading-snug group-hover:text-blue-700">{newer.title}</span></Link> : null}</nav> : null}

            <ArticleReveal className="mt-8 rounded-2xl bg-[#041632] p-6 text-white md:flex md:items-center md:justify-between md:gap-6 md:p-8"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-sky-300">Move forward with confidence</p><h2 className="mt-2 font-display text-xl font-bold md:text-2xl">{post.cta?.label ? 'Continue the conversation' : 'Ready to put these insights into action?'}</h2><p className="mt-2 max-w-xl text-sm leading-relaxed text-white/70">Talk with GoAhead Mobility about a smarter, safer and more connected transportation programme.</p></div><CtaLink href={post.cta?.href || '/contact'} label={post.cta?.label || 'Request a Proposal'} variant="sky" className="mt-5 shrink-0 md:mt-0" /></ArticleReveal>
          </main>

          <aside className="flex min-w-0 flex-col gap-5">
            {toc.length >= 2 ? <SidebarCard title="Table of Contents"><ol className="flex flex-col gap-3 border-l-2 border-blue-100 pl-4 text-xs">{toc.map((item, index) => <li key={item.id} className={item.depth === 3 ? 'pl-3' : undefined}><a href={`#${item.id}`} className="group flex gap-2 leading-relaxed text-slate-600 transition hover:text-blue-700"><span className="shrink-0 font-bold text-blue-600">{String(index + 1).padStart(2, '0')}</span><span>{item.text}</span></a></li>)}</ol></SidebarCard> : null}

            <section data-article-reveal className="rounded-2xl bg-[#041632] p-5 text-white shadow-[0_12px_34px_rgba(4,22,50,.15)]"><h2 className="font-display text-lg font-bold">Stay Updated</h2><p className="mt-2 text-xs leading-relaxed text-white/70">Get the latest mobility insights, trends and company updates delivered to your inbox.</p><Link href="/newsletter" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-xs font-bold text-white transition hover:bg-blue-500">Subscribe to updates <ArrowRight className="size-4" /></Link><p className="mt-3 flex items-center gap-2 text-[10px] text-white/55"><LockKeyhole className="size-3" />We respect your privacy.</p></section>

            {author ? <SidebarCard title="About the author"><div className="flex items-center gap-3">{author.avatar ? <div className="relative size-14 shrink-0 overflow-hidden rounded-full bg-slate-100"><SmartImage src={author.avatar} alt="" sizes="56px" /></div> : null}<div className="min-w-0"><p className="text-sm font-bold">{author.name}</p><p className="mt-0.5 text-[11px] text-blue-700">{author.jobTitle || 'GoAhead Mobility'}</p></div></div>{author.bio ? <p className="mt-3 text-xs leading-relaxed text-slate-600">{author.bio}</p> : null}{authorPath ? <Link href={authorPath} className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-blue-700">View author profile <ArrowRight className="size-3" /></Link> : null}</SidebarCard> : null}

            {related?.length ? <SidebarCard title="Related Articles"><div className="flex flex-col gap-4">{related.map((item: any) => <Link key={item._id} href={`/blog/${item.slug}`} className="group flex gap-3"><div className="relative h-[68px] w-[88px] shrink-0 overflow-hidden rounded-lg bg-slate-100">{item.heroImage ? <SmartImage src={item.heroImage} alt={item.heroAlt || ''} sizes="88px" /> : null}</div><div className="min-w-0"><p className="line-clamp-2 text-xs font-bold leading-snug group-hover:text-blue-700">{item.title}</p><p className="mt-2 text-[10px] text-slate-500">{formatDate(item.publishedAt)}{item.readingMinutes ? ` · ${item.readingMinutes} min read` : ''}</p></div></Link>)}</div><Link href="/blog" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-blue-700">View all articles <ArrowRight className="size-3.5" /></Link></SidebarCard> : null}

            <SidebarCard title="Popular Topics"><div className="flex flex-wrap gap-2">{(post.categoryIds ?? []).map((item: any) => <Link key={item._id} href={`/blog/category/${item.slug}`} className="rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-semibold text-blue-800 hover:bg-blue-100">{item.name}</Link>)}{(post.tagIds ?? []).map((item: any) => <Link key={item._id} href={`/blog/tag/${item.slug}`} className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-semibold text-slate-600 hover:bg-blue-50 hover:text-blue-800">#{item.name}</Link>)}{!post.categoryIds?.length && !post.tagIds?.length ? <p className="text-xs text-slate-500">Topics will appear here when assigned in the article editor.</p> : null}</div><div className="mt-4 border-t border-slate-100 pt-3"><p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Explore categories</p><div className="flex flex-col gap-2">{categories.filter((item: any) => item.postCount > 0).slice(0, 5).map((item: any) => <Link key={item._id} href={`/blog/category/${item.slug}`} className="flex items-center justify-between gap-2 text-xs text-slate-600 hover:text-blue-700"><span>{item.name}</span><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] tabular-nums">{item.postCount}</span></Link>)}</div></div></SidebarCard>

            {popular.length ? <SidebarCard title="Popular reads"><ol className="flex flex-col gap-3">{popular.map((item: any, index: number) => <li key={item._id} className="flex gap-3"><span className="font-display text-lg font-bold text-blue-200">{String(index + 1).padStart(2, '0')}</span><Link href={`/blog/${item.slug}`} className="text-xs font-semibold leading-relaxed text-slate-700 hover:text-blue-700">{item.title}</Link></li>)}</ol></SidebarCard> : null}
          </aside>
        </div>

        {related?.length ? <section aria-labelledby="related-reading" className="mx-auto max-w-7xl px-5 pb-12 md:px-8"><ArticleReveal><div className="mb-6 flex items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-blue-700">Keep exploring</p><h2 id="related-reading" className="mt-1 font-display text-2xl font-bold">Related reading</h2></div><Link href="/blog" className="inline-flex items-center gap-1 text-xs font-bold text-blue-700">All articles <ArrowRight className="size-3.5" /></Link></div><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{related.map((item: any) => <PostCard key={item._id} post={item} />)}</div></ArticleReveal></section> : null}
        <PostComments slug={post.slug} />
      </article>
    </ArticleMotion>
  )
}
