import type { Metadata } from 'next'
import { NewsletterForm } from '@/components/site/newsletter-form'
import { PageIntro } from '@/components/site/primitives'
import { JsonLd } from '@/components/site/json-ld'
import { applyRouteSeoMetadata, routeSeoJsonLd } from '@/lib/server/services/seo-page'

export async function generateMetadata(): Promise<Metadata> {
  return applyRouteSeoMetadata('/newsletter', { title: 'Newsletter', robots: { index: false, follow: true } }, { preserveNoindex: true })
}

const MESSAGES: Record<string, { title: string; intro: string }> = {
  confirmed: { title: 'You are subscribed', intro: 'Thanks for confirming. Our next issue will land in your inbox.' },
  unsubscribed: { title: 'You have been unsubscribed', intro: 'You will no longer receive our newsletter. You can resubscribe at any time.' },
  invalid: { title: 'That link has expired', intro: 'The confirmation link is invalid or already used. Subscribe again below.' },
}

export default async function NewsletterPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams
  const msg = MESSAGES[status || ''] ?? { title: 'The GoAhead briefing', intro: 'A short monthly note on corporate accommodation and employee mobility.' }
  return (
    <>
      <JsonLd data={await routeSeoJsonLd('/newsletter')} />
      <PageIntro eyebrow="Newsletter" title={msg.title} intro={msg.intro} />
      <div className="mx-auto max-w-md px-5 pb-24">
        <NewsletterForm source="newsletter_page" />
      </div>
    </>
  )
}
