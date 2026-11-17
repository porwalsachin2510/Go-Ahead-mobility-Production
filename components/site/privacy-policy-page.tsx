import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ArrowRight, FileText, LockKeyhole, Mail, ShieldCheck, UserRound, Cookie, ChevronRight } from 'lucide-react'
import { Reveal } from '@/components/motion/reveal'

type PrivacyPage = {
  title: string
  path: string
  blocks: Array<{ id: string; type: string; data?: Record<string, unknown> }>
}

const slugify = (value: string) => value.toLowerCase().replace(/^\\d+\\.\\s*/, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

function parseSections(markdown: string) {
  const chunks = markdown.split(/(?=^##\\s+)/m).map((part) => part.trim()).filter(Boolean)
  return chunks.map((chunk, index) => {
    const match = chunk.match(/^##\\s+(.+?)(?:\\r?\\n|$)/)
    const heading = match?.[1]?.trim() || `Section ${index + 1}`
    return { heading, id: slugify(heading), body: chunk.replace(/^##\\s+.+?(?:\\r?\\n|$)/, '').trim(), number: String(index + 1).padStart(2, '0') }
  })
}

export function PrivacyPolicyPage({ page }: { page: PrivacyPage }) {
  const block = page.blocks.find((item) => item.type === 'richText')
  const data = block?.data ?? {}
  const intro = String(data.aside ?? '')
  const markdown = String(data.body ?? '')
  const sections = parseSections(markdown)

  return (
    <div className="bg-white text-[#14234b]" data-page="privacy-policy">
      <div className="mx-auto max-w-[1240px] px-5 pb-8 pt-5 sm:px-7 lg:px-10">
        <nav aria-label="Breadcrumb" className="mb-7 flex items-center gap-2 text-[11px] text-[#64708b]">
          <Link href="/" className="transition-colors hover:text-[#0864f7]">Home</Link><ChevronRight className="size-3" aria-hidden />
          <span>Legal</span><ChevronRight className="size-3" aria-hidden /><span aria-current="page" className="font-medium text-[#14234b]">Privacy Policy</span>
        </nav>

        <header className="grid gap-5 border-b border-[#e6ebf3] pb-7 sm:grid-cols-[112px_minmax(0,1fr)] sm:gap-8 lg:grid-cols-[150px_minmax(0,1fr)]">
          <div className="hidden pt-2 text-[#0864f7] sm:block"><FileText className="size-[76px] stroke-[1.15]" /><ShieldCheck className="-mt-8 ml-10 size-9 fill-white stroke-[1.4]" /></div>
          <div className="max-w-[780px]">
            <Reveal y={18}><p className="mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#0864f7]">Legal · Your information</p>
              <h1 className="text-[clamp(2rem,4vw,2.8rem)] font-semibold leading-tight tracking-[-.045em]">{String(data.heading || page.title)}</h1>
              <p className="mt-3 max-w-[760px] text-[13px] leading-[1.75] text-[#405071]">{intro}</p>
              <p className="mt-3 text-[11px] font-semibold text-[#14234b]">Last updated: <span className="font-medium text-[#0864f7]">Date to be confirmed</span></p>
            </Reveal>
            <div className="mt-5 flex items-center gap-3 rounded-md border border-[#dce8ff] bg-[#eff5ff] px-4 py-3 text-[11px] text-[#263c67]">
              <ShieldCheck className="size-4 shrink-0 text-[#0864f7]" aria-hidden /><span>Your information is handled for defined purposes, with marketing choices kept optional.</span>
            </div>
          </div>
        </header>

        <div className="grid gap-7 pt-7 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <nav aria-label="On this page" className="rounded-xl bg-[#f7f9fc] p-4 sm:p-5">
              <h2 className="mb-4 text-[12px] font-bold">On this page</h2>
              <ol className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-3 lg:grid-cols-1">
                {sections.map((section) => <li key={section.id}><a href={`#${section.id}`} className="group flex min-h-9 items-center gap-2 rounded-md px-1.5 py-1 text-[10px] leading-snug text-[#405071] transition-colors hover:bg-white hover:text-[#0864f7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0864f7]"><span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-[#c9d8f2] bg-white text-[9px] font-semibold text-[#0864f7]">{section.number}</span><span>{section.heading.replace(/^\\d+\\.\\s*/, '')}</span></a></li>)}
              </ol>
            </nav>
            <div className="mt-4 hidden rounded-xl border border-[#dce3ef] p-4 lg:block">
              <LockKeyhole className="mb-2 size-5 text-[#0864f7]" aria-hidden /><h3 className="text-[11px] font-bold">Data minimization</h3>
              <p className="mt-2 text-[10px] leading-[1.7] text-[#52617d]">We collect only the personal information that is necessary for the specific purpose, and we do not request sensitive information that is not required for the service you are seeking.</p>
            </div>
            <div className="mt-3 hidden rounded-xl border border-[#dce3ef] p-4 lg:block">
              <ShieldCheck className="mb-2 size-5 text-[#f46b73]" aria-hidden /><h3 className="text-[11px] font-bold">Important note</h3>
              <p className="mt-2 text-[10px] leading-[1.7] text-[#52617d]">This design is not a legal-approved final policy. Jurisdiction, controller details, legal bases, contact address, exact providers, cross-border transfer terms and retention periods require client/legal sign-off.</p>
            </div>
          </aside>

          <main className="min-w-0">
            <div className="divide-y divide-[#e5eaf2]">
              {sections.map((section, index) => <section id={section.id} key={section.id} className="scroll-mt-28 py-4 first:pt-0">
                <Reveal y={14} delay={Math.min(index * 35, 210)}>
                  <div className="flex gap-3">
                    <span className="pt-0.5 text-[13px] font-bold text-[#0864f7]">{section.number}.</span>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-[17px] font-semibold leading-snug tracking-[-.02em] text-[#14234b]">{section.heading.replace(/^\\d+\\.\\s*/, '')}</h2>
                      <div className="privacy-prose mt-2 text-[11px] leading-[1.7] text-[#354665]">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                          h2: ({children}) => <h3 className="mb-2 mt-4 text-[13px] font-semibold text-[#14234b]">{children}</h3>,
                          p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                          ul: ({children}) => <ul className="mb-2 ml-4 list-disc space-y-1 marker:text-[#0864f7]">{children}</ul>,
                          ol: ({children}) => <ol className="mb-2 ml-4 list-decimal space-y-1">{children}</ol>,
                          strong: ({children}) => <strong className="font-semibold text-[#14234b]">{children}</strong>,
                          blockquote: ({children}) => <blockquote className="my-3 flex gap-3 rounded-lg border border-[#d8e2f1] bg-[#f8faff] px-4 py-3 text-[10px]">{children}</blockquote>,
                          a: ({href, children}) => <a href={href} className="font-semibold text-[#0864f7] underline underline-offset-2">{children}</a>,
                        }}>{section.body}</ReactMarkdown>
                      </div>
                      {index === 4 ? <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#dce5f3] bg-[#fafcff] p-3"><div className="flex items-center gap-2 text-[10px] text-[#405071]"><Cookie className="size-4 text-[#0864f7]" aria-hidden /><span>Manage your cookie choices at any time.</span></div><Link href="/cookies" className="inline-flex min-h-9 items-center gap-2 rounded-md border border-[#8bb5ff] px-3 text-[10px] font-semibold text-[#0864f7] transition-colors hover:bg-[#eff5ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0864f7]">Cookie Preferences <ArrowRight className="size-3" aria-hidden /></Link></div> : null}
                      {index === 6 ? <div className="mt-3 flex flex-wrap gap-2">{['Leads and enquiries','CVs / resumes','Email communications and consent logs','Audit and system logs','Inactive user accounts','Failed jobs / error logs','Temporary files and uploads'].map((item) => <span key={item} className="rounded-md border border-[#dce3ef] bg-[#fafcff] px-3 py-2 text-[9px] font-medium text-[#405071]">{item}</span>)}</div> : null}
                    </div>
                  </div>
                </Reveal>
              </section>)}
            </div>
          </main>
        </div>

        <section className="mt-8 grid gap-3 lg:grid-cols-[1.2fr_.9fr]">
          <div className="rounded-xl border border-[#cbdcff] bg-[#f4f8ff] p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-[1fr_1fr] sm:items-center">
              <div><h2 className="text-[17px] font-semibold">Privacy request or question?</h2><p className="mt-2 text-[11px] leading-relaxed text-[#405071]">If you have any question, request or concern about your personal information, please contact our privacy team.</p><span className="mt-3 inline-flex items-center gap-2 text-[11px] font-semibold text-[#0864f7]"><Mail className="size-4" aria-hidden />privacy contact email to be confirmed</span></div>
              <div className="border-t border-[#cbdcff] pt-4 text-[11px] leading-relaxed text-[#405071] sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">We will acknowledge your request and respond within a reasonable timeframe in accordance with applicable laws.</div>
            </div>
          </div>
          <div className="relative isolate overflow-hidden rounded-xl bg-[#041b49] p-5 text-white sm:p-6">
            <div className="absolute -right-8 -top-8 size-48 rounded-full border border-white/10" /><div className="absolute -right-2 -top-2 size-36 rounded-full border border-white/10" />
            <div className="relative flex items-center justify-between gap-4"><div><h2 className="max-w-[250px] text-[18px] font-semibold leading-snug">Need help with a privacy request? Contact GoAhead.</h2><Link href="/contact" className="mt-4 inline-flex min-h-9 items-center gap-2 rounded-md bg-[#0864f7] px-4 text-[10px] font-semibold text-white transition-colors hover:bg-[#2478ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Contact Us <ArrowRight className="size-3" aria-hidden /></Link></div><UserRound className="size-14 shrink-0 text-[#9fc4ff]" strokeWidth={1.1} aria-hidden /></div>
          </div>
        </section>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 rounded-lg bg-[#f5f8fd] px-4 py-3 text-[10px] text-[#405071]"><span className="font-semibold">Helpful links:</span><Link href="/cookies" className="text-[#0864f7] hover:underline">Cookie Preferences</Link><Link href="/contact" className="text-[#0864f7] hover:underline">Contact Us</Link><Link href="/terms" className="text-[#0864f7] hover:underline">Terms &amp; Conditions</Link></div>
      </div>
    </div>
  )
}
