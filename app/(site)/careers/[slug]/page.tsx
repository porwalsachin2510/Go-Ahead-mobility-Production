import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Markdown } from '@/components/site/primitives'
import { JsonLd } from '@/components/site/json-ld'
import { ApplicationForm } from '@/components/site/application-form'
import { JobViewTracker } from '@/components/site/job-view-tracker'
import { getJobForPage, similarJobs } from '@/lib/server/services/careers'
import { getSeoSettings } from '@/lib/server/services/seo-inventory'
import { breadcrumbSchema, jobPostingSchema } from '@/lib/seo/jsonld'
import { canonicalUrl } from '@/lib/seo/config'
import { buildMetadata } from '@/lib/seo/metadata'
import { entitySchemaNodes } from '@/lib/seo/entity-schema'
import { EMPLOYMENT_LABELS, LEVEL_LABELS, WORKPLACE_LABELS, formatSalary, jobMeta, jobPlace } from '@/lib/careers/labels'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const data = await getJobForPage(slug)
  if (!data) return {}
  const { job, open } = data
  const place = jobPlace(job)
  const seo = job.seo ?? {}
  const title = seo.title || `${job.title}${place ? ` – ${place}` : ''}`
  const description = seo.description || job.summary || `${job.title}${place ? ` in ${place}` : ''} at GoAhead Mobility. ${EMPLOYMENT_LABELS[job.employmentType] ?? ''} role. Apply online today.`.trim()
  const { site } = await getSeoSettings()
  return buildMetadata({
    site,
    path: `/careers/${slug}`,
    title,
    description: description.slice(0, 160),
    canonical: seo.canonical,
    noindex: !open || Boolean(seo.noindex),
    nofollow: seo.nofollow,
    ogTitle: seo.ogTitle,
    ogDescription: seo.ogDescription,
    ogImage: seo.ogImage,
    ogImageAlt: job.title,
  })
}

export default async function JobPage({ params }: Props) {
  const { slug } = await params
  const data = await getJobForPage(slug)
  if (!data) notFound()
  const { job, open } = data
  const [{ site }, similar] = await Promise.all([getSeoSettings(), similarJobs(job)])
  const path = `/careers/${slug}`
  const pay = formatSalary(job)
  const shareUrl = encodeURIComponent(canonicalUrl(site.siteUrl, path))
  const shareText = encodeURIComponent(`${job.title} at ${site.brandName}`)

  const facts = [
    ['Location', jobPlace(job)],
    ['Workplace', WORKPLACE_LABELS[job.workplaceType] ?? (job.remote ? 'Remote' : '')],
    ['Employment', EMPLOYMENT_LABELS[job.employmentType]],
    ['Experience', [LEVEL_LABELS[job.experienceLevel], job.minExperienceYears ? `${job.minExperienceYears}+ years` : ''].filter(Boolean).join(', ')],
    ['Salary', pay],
    ['Openings', job.openings > 1 ? String(job.openings) : ''],
    ['Apply by', job.closeAt ? new Date(job.closeAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''],
  ].filter(([, v]) => v) as [string, string][]

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-16">
      <JsonLd
        data={[
          open
            ? jobPostingSchema(site, { ...job, id: String(job._id), path, datePosted: job.publishedAt ?? job.createdAt, validThrough: job.closeAt })
            : null,
          breadcrumbSchema(site, [
            { name: 'Home', path: '/' },
            { name: 'Careers', path: '/careers' },
            { name: job.title, path },
          ]),
          ...entitySchemaNodes(site, path, job.seo),
        ]}
      />
      {open ? <JobViewTracker slug={slug} /> : null}

      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
        <ol className="flex flex-wrap gap-2">
          <li><Link href="/" className="hover:underline">Home</Link></li>
          <li aria-hidden>/</li>
          <li><Link href="/careers" className="hover:underline">Careers</Link></li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="text-foreground">{job.title}</li>
        </ol>
      </nav>

      <div className="grid gap-12 lg:grid-cols-[1fr_420px]">
        <article className="flex min-w-0 flex-col gap-8">
          <header className="flex flex-col gap-3">
            {job.department ? <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">{job.department}</p> : null}
            <h1 className="font-display text-4xl font-bold tracking-tight text-balance md:text-5xl">{job.title}</h1>
            {job.summary ? <p className="text-lg leading-relaxed text-muted-foreground text-pretty">{job.summary}</p> : null}
          </header>

          {!open ? (
            <p role="status" className="rounded-2xl border border-line bg-muted p-5 text-sm leading-relaxed">
              This role is no longer accepting applications.{' '}
              <Link href="/careers" className="font-medium underline">
                See current openings
              </Link>{' '}
              or set up a job alert there.
            </p>
          ) : null}

          <dl className="grid grid-cols-2 gap-4 rounded-2xl border border-line bg-card p-5 md:grid-cols-3">
            {facts.map(([k, v]) => (
              <div key={k} className="flex flex-col gap-1">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">{k}</dt>
                <dd className="text-sm font-medium">{v}</dd>
              </div>
            ))}
          </dl>

          <section className="flex flex-col gap-3">
            <h2 className="font-display text-2xl font-semibold">About the role</h2>
            <Markdown>{job.description || ''}</Markdown>
          </section>
          {job.responsibilities ? (
            <section className="flex flex-col gap-3">
              <h2 className="font-display text-2xl font-semibold">What you will do</h2>
              <Markdown>{job.responsibilities}</Markdown>
            </section>
          ) : null}
          {job.requirements ? (
            <section className="flex flex-col gap-3">
              <h2 className="font-display text-2xl font-semibold">What you bring</h2>
              <Markdown>{job.requirements}</Markdown>
            </section>
          ) : null}
          {job.skills?.length ? (
            <section className="flex flex-col gap-3">
              <h2 className="font-display text-2xl font-semibold">Skills</h2>
              <ul className="flex flex-wrap gap-2">
                {job.skills.map((s: string) => (
                  <li key={s} className="rounded-full border border-line px-3 py-1 text-sm">{s}</li>
                ))}
              </ul>
            </section>
          ) : null}
          {job.benefits?.length ? (
            <section className="flex flex-col gap-3">
              <h2 className="font-display text-2xl font-semibold">Benefits</h2>
              <ul className="grid gap-2 md:grid-cols-2">
                {job.benefits.map((b: string) => (
                  <li key={b} className="rounded-xl bg-muted px-4 py-3 text-sm">{b}</li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="flex flex-wrap items-center gap-3 border-t border-line pt-6 text-sm">
            <span className="font-medium">Share this role</span>
            <a className="rounded-full border border-line px-3 py-1 hover:bg-muted" href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`} target="_blank" rel="noopener noreferrer">LinkedIn</a>
            <a className="rounded-full border border-line px-3 py-1 hover:bg-muted" href={`https://wa.me/?text=${shareText}%20${shareUrl}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
            <a className="rounded-full border border-line px-3 py-1 hover:bg-muted" href={`https://x.com/intent/post?url=${shareUrl}&text=${shareText}`} target="_blank" rel="noopener noreferrer">X</a>
            <a className="rounded-full border border-line px-3 py-1 hover:bg-muted" href={`mailto:?subject=${shareText}&body=${shareUrl}`}>Email</a>
          </section>
        </article>

        <aside id="apply" className="h-fit rounded-3xl border border-line bg-card p-6 lg:sticky lg:top-24">
          {open ? (
            <>
              <h2 className="mb-1 font-display text-xl font-semibold">Apply for this role</h2>
              <p className="mb-5 text-sm text-muted-foreground">{jobMeta(job)}</p>
              <ApplicationForm jobId={String(job._id)} questions={job.screeningQuestions ?? []} />
            </>
          ) : (
            <p className="text-sm leading-relaxed text-muted-foreground">Applications for this role have closed.</p>
          )}
        </aside>
      </div>

      {similar.length ? (
        <section className="mt-20 flex flex-col gap-5" aria-labelledby="similar-heading">
          <h2 id="similar-heading" className="font-display text-2xl font-semibold">Similar roles</h2>
          <ul className="grid gap-4 md:grid-cols-3">
            {similar.map((s: any) => (
              <li key={s._id}>
                <Link href={`/careers/${s.slug}`} className="flex h-full flex-col gap-2 rounded-2xl border border-line bg-card p-5 hover:border-foreground/30">
                  <span className="font-display text-lg font-semibold text-balance">{s.title}</span>
                  <span className="text-sm text-muted-foreground">{jobMeta(s)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
