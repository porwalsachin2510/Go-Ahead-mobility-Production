import Image from 'next/image'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createSlugger } from '@/lib/blog/toc'

const OPTIMIZABLE = /^(\/images\/|\/brand\/|\/api\/v1\/media\/|https:\/\/res\.cloudinary\.com\/)/

export function SmartImage({ src, alt, className, sizes = '100vw', priority }: { src: string; alt: string; className?: string; sizes?: string; priority?: boolean }) {
  if (!src) return null
  if (OPTIMIZABLE.test(src)) {
    return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={cn('object-cover', className)} />
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading={priority ? 'eager' : 'lazy'} className={cn('absolute inset-0 h-full w-full object-cover', className)} />
}

function nodeText(node: React.ReactNode): string {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(nodeText).join('')
  if (typeof node === 'object' && 'props' in node) return nodeText((node as { props: { children?: React.ReactNode } }).props.children)
  return ''
}

/**
 * `anchors` gives headings stable ids matching `extractToc`, and demotes body h1s to h2 because the
 * page template already renders the document h1.
 */
export function Markdown({ children, className, anchors = false }: { children: string; className?: string; anchors?: boolean }) {
  if (!children) return null
  const slug = anchors ? createSlugger() : null
  const heading = (Tag: 'h2' | 'h3' | 'h4' | 'h5' | 'h6') =>
    function Heading({ children: kids }: { children?: React.ReactNode }) {
      const id = slug ? slug(nodeText(kids).trim()) : undefined
      return (
        <Tag id={id} className={id ? 'scroll-mt-24' : undefined}>
          {kids}
        </Tag>
      )
    }
  const components = anchors ? { h1: heading('h2'), h2: heading('h2'), h3: heading('h3'), h4: heading('h4'), h5: heading('h5'), h6: heading('h6') } : undefined
  return (
    <div className={cn('prose-ga', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  )
}

export function SectionHeading({ eyebrow, heading, intro, tone = 'light', align = 'left' }: { eyebrow?: string; heading?: string; intro?: string; tone?: 'light' | 'dark'; align?: 'left' | 'center' }) {
  if (!eyebrow && !heading && !intro) return null
  return (
    <div className={cn('flex max-w-3xl flex-col gap-4', align === 'center' && 'mx-auto items-center text-center')}>
      {eyebrow ? <span className={cn('eyebrow', tone === 'dark' ? 'text-sky' : 'text-royal')}>{eyebrow}</span> : null}
      {heading ? <h2 className={cn('display-md text-balance', tone === 'dark' ? 'text-primary-foreground' : 'text-foreground')}>{heading}</h2> : null}
      {intro ? <p className={cn('text-lg leading-relaxed', tone === 'dark' ? 'text-primary-foreground/75' : 'text-muted-foreground')}>{intro}</p> : null}
    </div>
  )
}

export function CtaLink({ href, label, variant = 'primary', className }: { href?: string; label?: string; variant?: 'primary' | 'secondary' | 'ghost-dark' | 'sky'; className?: string }) {
  if (!href || !label) return null
  const styles = {
    primary: 'bg-royal text-primary-foreground hover:bg-royal-deep',
    sky: 'bg-sky text-ink hover:bg-sky-soft',
    secondary: 'border border-line bg-background text-foreground hover:border-royal hover:text-royal',
    'ghost-dark': 'border border-primary-foreground/25 text-primary-foreground hover:border-sky hover:text-sky',
  }[variant]
  return (
    <Link href={href} className={cn('group inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors', styles, className)}>
      {label}
      <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}

export function PageIntro({ eyebrow, title, intro }: { eyebrow?: string; title: string; intro?: string }) {
  return (
    <section className="route-grid border-b border-line bg-paper">
      <div className="container-x flex flex-col gap-5 py-16 md:py-24">
        {eyebrow ? <span className="eyebrow text-royal">{eyebrow}</span> : null}
        <h1 className="display-lg slant max-w-4xl text-balance text-foreground">{title}</h1>
        {intro ? <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">{intro}</p> : null}
      </div>
    </section>
  )
}

export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line px-6 py-16 text-center">
      <p className="font-display text-lg font-bold text-foreground">{title}</p>
      {body ? <p className="max-w-md text-sm leading-relaxed text-muted-foreground">{body}</p> : null}
    </div>
  )
}

export function formatDate(value?: string | Date | null) {
  if (!value) return ''
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value))
}
