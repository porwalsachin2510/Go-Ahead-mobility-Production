import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ArrowRight, ChevronRight, FileCheck2, Scale, Info, CheckCircle2, MessageCircle } from 'lucide-react'
import { Reveal } from '@/components/motion/reveal'
import { ScrollReveal } from '@/components/motion/gsap-effects'

type TermsPage = {
  title: string
  path: string
  blocks: Array<{ id: string; type: string; hidden?: boolean; data?: Record<string, unknown> }>
}

const cleanHeading = (value: string) => value.replace(/^\d{1,2}\.\s*/, '').trim()
const slugify = (value: string) => cleanHeading(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

function parseSections(markdown: string) {
  const chunks = markdown.split(/(?=^##\s+)/m).map((part) => part.trim()).filter(Boolean)
  return chunks.map((chunk, index) => {
    const match = chunk.match(/^##\s+(.+?)(?:\r?\n|$)/)
    const heading = match?.[1]?.trim() || `Section ${index + 1}`
    return {
      heading,
      id: slugify(heading),
      body: chunk.replace(/^##\s+.+?(?:\r?\n|$)/, '').trim(),
      number: cleanHeading(heading).toLowerCase() === 'important distinction' ? '' : String(index + 1).padStart(2, '0'),
    }
  })
}

export function TermsConditionsPage({ page }: { page: TermsPage }) {
  const block = page.blocks.find((item) => item.type === 'richText' && !item.hidden)
  const data = block?.data ?? {}
  const sections = parseSections(String(data.body ?? ''))
  const navSections = sections.filter((section) => cleanHeading(section.heading).toLowerCase() !== 'important distinction')
  const title = String(data.heading || page.title)
  const intro = String(data.aside ?? '')
  const subtitle = String(data.eyebrow || 'Terms of Service')

  return (
    <div className="bg-white text-[#14234b]" data-page="terms-conditions">
      <div className="mx-auto max-w-[1240px] px-5 pb-7 pt-5 sm:px-7 lg:px-10">
        <nav aria-label="Breadcrumb" className="mb-7 flex items-center gap-2 text-[11px] text-[#64708b]">
          <Link href="/" className="transition-colors hover:text-[#0864f7]">Home</Link>
          <ChevronRight className="size-3" aria-hidden />
          <Link href="/privacy" className="transition-colors hover:text-[#0864f7]">Legal</Link>
          <ChevronRight className="size-3" aria-hidden />
          <span aria-current="page" className="font-medium text-[#14234b]">Terms &amp; Conditions</span>
        </nav>

        <header className="grid gap-5 border-b border-[#e6ebf3] pb-7 sm:grid-cols-[112px_minmax(0,1fr)] sm:gap-8 lg:grid-cols-[150px_minmax(0,1fr)]">
          <div className="hidden pt-2 text-[#14234b] sm:block" aria-hidden>
            <FileCheck2 className="size-[76px] stroke-[1.15]" />
            <Scale className="-mt-8 ml-10 size-9 bg-white text-[#0864f7]" strokeWidth={1.2} />
          </div>
          <div className="max-w-[790px]">
            <Reveal y={18}>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#0864f7]">Legal · {subtitle}</p>
              <h1 className="text-[clamp(2rem,4vw,2.8rem)] font-semibold leading-tight tracking-[-.045em]">{title}</h1>
              <p className="mt-3 max-w-[760px] text-[13px] leading-[1.75] text-[#405071]">{intro}</p>
              <p className="mt-3 text-[11px] font-semibold text-[#14234b]">Last updated: <span className="font-medium text-[#0864f7]">{String(data.lastUpdated || '[Date to be confirmed]')}</span></p>
            </Reveal>
            <div className="mt-5 flex items-center gap-3 rounded-md border border-[#dce8ff] bg-[#eff5ff] px-4 py-3 text-[11px] text-[#263c67]">
              <Info className="size-4 shrink-0 text-[#0864f7]" aria-hidden />
              <span>{String(data.notice || 'Phase 1 website enquiries are not confirmed bookings or service orders.')}</span>
            </div>
          </div>
        </header>

        <div className="grid gap-7 pt-7 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <nav aria-label="On this page" className="rounded-xl bg-[#f7f9fc] p-4 sm:p-5">
              <h2 className="mb-4 text-[12px] font-bold">On this page</h2>
              <ol className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-3 lg:grid-cols-1">
                {navSections.map((section) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`} className="group flex min-h-9 items-center gap-2 rounded-md px-1.5 py-1 text-[10px] leading-snug text-[#405071] transition-colors hover:bg-white hover:text-[#0864f7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0864f7]">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-[#c9d8f2] bg-white text-[9px] font-semibold text-[#0864f7]">{section.number}</span>
                      <span>{cleanHeading(section.heading)}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
            <div className="mt-4 hidden rounded-xl border border-[#dce3ef] p-4 lg:block">
              <Scale className="mb-2 size-5 text-[#0864f7]" aria-hidden />
              <h3 className="text-[11px] font-bold">Important note</h3>
              <p className="mt-2 text-[10px] leading-[1.7] text-[#52617d]">{String(data.sideNote || 'This website is intended for business use by organisations and corporate decision makers. For individual transport services, please contact the relevant operator directly.')}</p>
            </div>
          </aside>

          <main className="min-w-0">
            <div className="divide-y divide-[#e5eaf2]">
              {sections.map((section, index) => (
                <section id={section.id} key={section.id} className={`scroll-mt-28 py-4 first:pt-0 ${cleanHeading(section.heading).toLowerCase() === 'important distinction' ? 'my-4 rounded-lg border border-[#8fc5ff] bg-[#f5faff] px-4 sm:px-5' : ''}`}>
                  <Reveal y={14} delay={Math.min(index * 28, 220)}>
                    <div className="flex gap-3">
                      {section.number ? <span className="pt-0.5 text-[13px] font-bold text-[#0864f7]">{section.number}.</span> : null}
                      <div className="min-w-0 flex-1">
                        <h2 className="text-[16px] font-semibold leading-snug tracking-[-.02em] text-[#14234b]">{cleanHeading(section.heading)}</h2>
                        <div className="terms-prose mt-2 text-[11px] leading-[1.7] text-[#354665]">
                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                            h2: ({children}) => <h3 className="mb-2 mt-4 text-[13px] font-semibold text-[#14234b]">{children}</h3>,
                            p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                            ul: ({children}) => <ul className="mb-2 ml-4 list-disc space-y-1 marker:text-[#0864f7]">{children}</ul>,
                            ol: ({children}) => <ol className="mb-2 ml-4 list-decimal space-y-1">{children}</ol>,
                            strong: ({children}) => <strong className="font-semibold text-[#14234b]">{children}</strong>,
                            blockquote: ({children}) => <blockquote className="my-3 flex gap-3 rounded-md border border-[#dce5f3] bg-[#f5f8ff] px-4 py-3 text-[10px] [&>p]:mb-0">{children}</blockquote>,
                            a: ({href, children}) => <Link href={href || '#'} className="font-semibold text-[#0864f7] underline underline-offset-2">{children}</Link>,
                            table: ({children}) => <div className="my-3 overflow-x-auto rounded-lg border border-[#dce5f3]"><table className="w-full min-w-[440px] border-collapse text-left">{children}</table></div>,
                            th: ({children}) => <th className="border-b border-[#dce5f3] bg-[#f5f8ff] px-3 py-2 font-semibold text-[#14234b]">{children}</th>,
                            td: ({children}) => <td className="border-b border-[#e8edf5] px-3 py-2 align-top">{children}</td>,
                          }}>{section.body}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  </Reveal>
                </section>
              ))}
            </div>

          </main>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 rounded-lg bg-[#f5f8fd] px-4 py-3 text-[10px] text-[#405071]">
          <span className="font-semibold">Helpful links:</span>
          <Link href="/privacy" className="text-[#0864f7] hover:underline">Privacy Policy</Link>
          <Link href="/cookies" className="text-[#0864f7] hover:underline">Cookie Preferences</Link>
          <Link href="/contact" className="text-[#0864f7] hover:underline">Contact Us</Link>
        </div>

        <ScrollReveal className="mt-5">
          <section data-scroll-reveal className="flex flex-col gap-4 rounded-xl border border-[#d5e3fa] bg-[#f5f8ff] p-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div className="flex items-center gap-4">
              <MessageCircle className="size-10 shrink-0 text-[#14234b]" strokeWidth={1.3} aria-hidden />
              <div><h2 className="text-[14px] font-semibold text-[#14234b]">{String(data.ctaTitle || 'Questions about these Terms?')}</h2><p className="mt-1 text-[11px] text-[#52617d]">{String(data.ctaDescription || 'Our team is here to help. Get in touch with us for any questions or clarifications.')}</p></div>
            </div>
            <Link href={String(data.ctaButtonHref || '/contact')} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#0864f7] px-5 text-[11px] font-semibold text-white transition-colors hover:bg-[#2478ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0864f7]">{String(data.ctaButtonLabel || 'Contact Us')} <ArrowRight className="size-3.5" aria-hidden /></Link>
          </section>
        </ScrollReveal>
      </div>
    </div>
  )
}
