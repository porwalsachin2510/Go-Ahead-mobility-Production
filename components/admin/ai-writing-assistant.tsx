'use client'

import { useState } from 'react'
import { Check, Copy, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/client/api'
import { Card, Notice } from './ui'

type Task = 'titles' | 'excerpt' | 'seo' | 'outline' | 'review'
type Result =
  | { suggestions: string[] }
  | { seoTitle: string; metaDescription: string; keywords: string[] }
  | { sections: { heading: string; summary: string }[] }
  | { issues: { severity: 'high' | 'medium' | 'low'; quote: string; problem: string; suggestion: string }[] }

const TASKS: { key: Task; label: string }[] = [
  { key: 'titles', label: 'Headlines' },
  { key: 'excerpt', label: 'Excerpt' },
  { key: 'seo', label: 'SEO meta' },
  { key: 'outline', label: 'Outline' },
  { key: 'review', label: 'Review draft' },
]

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false)
  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      aria-label={done ? 'Copied' : 'Copy to clipboard'}
      onClick={async () => { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500) }}
    >
      {done ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
    </Button>
  )
}

function Row({ children, copy }: { children: React.ReactNode; copy: string }) {
  return (
    <li className="flex items-start justify-between gap-2 rounded-md border border-border p-3 text-sm leading-relaxed">
      <div className="min-w-0 flex-1">{children}</div>
      <CopyButton text={copy} />
    </li>
  )
}

function ResultView({ result }: { result: Result }) {
  if ('suggestions' in result) {
    return <ul className="flex flex-col gap-2">{result.suggestions.map((s, i) => <Row key={i} copy={s}>{s}</Row>)}</ul>
  }
  if ('seoTitle' in result) {
    return (
      <ul className="flex flex-col gap-2">
        <Row copy={result.seoTitle}><span className="block text-xs text-muted-foreground">SEO title · {result.seoTitle.length} chars</span>{result.seoTitle}</Row>
        <Row copy={result.metaDescription}><span className="block text-xs text-muted-foreground">Meta description · {result.metaDescription.length} chars</span>{result.metaDescription}</Row>
        <Row copy={result.keywords.join(', ')}><span className="block text-xs text-muted-foreground">Keywords</span>{result.keywords.join(', ')}</Row>
      </ul>
    )
  }
  if ('sections' in result) {
    const md = result.sections.map((s) => `## ${s.heading}\n${s.summary}`).join('\n\n')
    return (
      <div className="flex flex-col gap-2">
        <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm leading-relaxed">
          {result.sections.map((s, i) => <li key={i}><span className="font-medium">{s.heading}</span> <span className="text-muted-foreground">{s.summary}</span></li>)}
        </ol>
        <div className="flex justify-end"><CopyButton text={md} /></div>
      </div>
    )
  }
  if (result.issues.length === 0) return <p className="text-sm text-muted-foreground">No significant issues found.</p>
  return (
    <ul className="flex flex-col gap-2">
      {result.issues.map((it, i) => (
        <Row key={i} copy={it.suggestion}>
          <span className={`mb-1 inline-block rounded px-1.5 py-0.5 text-xs capitalize ${it.severity === 'high' ? 'bg-destructive/10 text-destructive' : 'bg-muted'}`}>{it.severity}</span>
          {it.quote && <blockquote className="border-l-2 border-border pl-2 italic text-muted-foreground">{it.quote}</blockquote>}
          <p className="mt-1">{it.problem}</p>
          <p className="mt-1"><span className="font-medium">Suggestion:</span> {it.suggestion}</p>
        </Row>
      ))}
    </ul>
  )
}

export function AiWritingAssistant({ postId }: { postId: string }) {
  const [task, setTask] = useState<Task | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function run(t: Task) {
    setTask(t)
    setBusy(true)
    setError(null)
    setResult(null)
    const r = await api<{ result: Result }>(`/api/v1/admin/blog/posts/${postId}/ai`, { method: 'POST', json: { task: t } })
    setBusy(false)
    if (!r.ok) return setError(r.error.message)
    setResult(r.data.result)
  }

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex flex-col gap-1">
        <h2 className="flex items-center gap-2 text-lg font-semibold"><Sparkles className="size-4 text-primary" aria-hidden /> Writing assistant</h2>
        <p className="text-pretty text-sm text-muted-foreground">Optional suggestions based on the last saved version. Nothing changes in the post until you copy it in.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {TASKS.map((t) => (
          <Button key={t.key} size="sm" variant={task === t.key ? 'default' : 'outline'} disabled={busy} onClick={() => run(t.key)}>
            {busy && task === t.key ? 'Thinking…' : t.label}
          </Button>
        ))}
      </div>
      <div aria-live="polite">
        {error && <Notice tone="error">{error}</Notice>}
        {result && <ResultView result={result} />}
      </div>
      {result && <p className="text-xs text-muted-foreground">AI suggestions can be wrong. Check facts before you publish.</p>}
    </Card>
  )
}
