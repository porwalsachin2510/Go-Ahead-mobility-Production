import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-start justify-center gap-5 px-6">
      <p className="text-sm font-semibold uppercase tracking-widest text-royal">404</p>
      <h1 className="font-display text-4xl font-bold tracking-tight text-balance">This page took a different route</h1>
      <p className="leading-relaxed text-muted-foreground">The page you are looking for has moved or no longer exists.</p>
      <div className="flex gap-3">
        <Link href="/" className="btn-primary">
          Go home
        </Link>
        <Link href="/contact" className="btn-secondary">
          Contact us
        </Link>
      </div>
    </main>
  )
}
