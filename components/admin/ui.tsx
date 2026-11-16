import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export const inputClass =
  'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-60'

export function Input(props: ComponentProps<'input'>) {
  return <input {...props} className={cn(inputClass, props.className)} />
}

export function Textarea(props: ComponentProps<'textarea'>) {
  return <textarea {...props} className={cn(inputClass, 'min-h-24 leading-relaxed', props.className)} />
}

export function Select(props: ComponentProps<'select'>) {
  return <select {...props} className={cn(inputClass, 'pr-8', props.className)} />
}

export function FieldShell({ id, label, help, error, required, children }: { id: string; label: string; help?: string; error?: string; required?: boolean; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </label>
      {children}
      {help && !error && <p className="text-xs text-muted-foreground">{help}</p>}
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export function Card({ className, ...props }: ComponentProps<'div'>) {
  return <div {...props} className={cn('rounded-xl border border-border bg-card p-5 text-card-foreground', className)} />
}

const tone: Record<string, string> = {
  published: 'bg-success/10 text-success',
  granted: 'bg-success/10 text-success',
  won: 'bg-success/10 text-success',
  active: 'bg-success/10 text-success',
  open: 'bg-success/10 text-success',
  new: 'bg-accent text-accent-foreground',
  draft: 'bg-muted text-muted-foreground',
  in_review: 'bg-warning/10 text-warning',
  editorial_review: 'bg-warning/10 text-warning',
  scheduled: 'bg-warning/10 text-warning',
  lost: 'bg-destructive/10 text-destructive',
  archived: 'bg-muted text-muted-foreground',
}

export function StatusBadge({ value }: { value: string }) {
  if (!value) return <span className="text-muted-foreground">—</span>
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize', tone[value] ?? 'bg-secondary text-secondary-foreground')}>
      {value.replace(/_/g, ' ')}
    </span>
  )
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold text-foreground text-balance">{title}</h1>
        {description && <p className="text-sm text-muted-foreground text-pretty">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Notice({ tone: t = 'info', children }: { tone?: 'info' | 'error' | 'success'; children: ReactNode }) {
  const cls = t === 'error' ? 'border-destructive/30 bg-destructive/5 text-destructive' : t === 'success' ? 'border-success/30 bg-success/5 text-success' : 'border-border bg-muted text-foreground'
  return (
    <div role={t === 'error' ? 'alert' : 'status'} className={cn('rounded-lg border px-4 py-3 text-sm', cls)}>
      {children}
    </div>
  )
}

export function formatDate(v: unknown, withTime = false) {
  if (!v) return '—'
  const d = new Date(String(v))
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-GB', withTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' })
}
