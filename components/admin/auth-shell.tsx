import Image from 'next/image'

export function AuthShell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-sidebar px-4 py-12">
      <div className="flex w-full max-w-sm flex-col gap-6 rounded-2xl bg-card p-8 text-card-foreground shadow-2xl">
        <Image src="/brand/goahead-logo.png" alt="GoAhead Mobility" width={140} height={40} className="h-9 w-auto self-start" priority />
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-xl font-semibold text-balance">{title}</h1>
          <p className="text-sm text-muted-foreground text-pretty">{description}</p>
        </div>
        {children}
      </div>
    </main>
  )
}
