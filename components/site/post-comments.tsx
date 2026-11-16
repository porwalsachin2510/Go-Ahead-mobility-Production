'use client'

import { useState, type FormEvent } from 'react'
import useSWR from 'swr'
import { api, fetcher } from '@/lib/client/api'

type Comment = { id: string; parentId: string | null; authorName: string; body: string; createdAt: string }

const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

function CommentForm({ slug, parentId, onDone }: { slug: string; parentId?: string; onDone?: () => void }) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    setState('sending')
    setError(null)
    const r = await api(`/api/v1/blog/posts/${encodeURIComponent(slug)}/comments`, {
      method: 'POST',
      json: { name: fd.get('name'), email: fd.get('email'), body: fd.get('body'), website: fd.get('website'), parentId: parentId ?? null },
    })
    if (!r.ok) {
      setState('idle')
      return setError(r.error.message)
    }
    form.reset()
    setState('sent')
  }

  if (state === 'sent') {
    return (
      <p role="status" className="rounded-md bg-muted p-4 text-sm leading-relaxed">
        Thanks. Your comment will appear once a moderator approves it.
        {onDone && <button type="button" className="ml-2 underline underline-offset-4" onClick={onDone}>Close</button>}
      </p>
    )
  }

  const id = parentId ?? 'root'
  return (
    <form onSubmit={submit} className="flex flex-col gap-3" noValidate={false}>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-medium" htmlFor={`c-name-${id}`}>
          Name
          <input id={`c-name-${id}`} name="name" required minLength={2} maxLength={80} autoComplete="name" className="rounded-md border border-input bg-background px-3 py-2 text-base" />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium" htmlFor={`c-email-${id}`}>
          Email <span className="font-normal text-muted-foreground">(not published)</span>
          <input id={`c-email-${id}`} name="email" type="email" required maxLength={200} autoComplete="email" className="rounded-md border border-input bg-background px-3 py-2 text-base" />
        </label>
      </div>
      <div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden">
        <label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <label className="flex flex-col gap-1.5 text-sm font-medium" htmlFor={`c-body-${id}`}>
        {parentId ? 'Reply' : 'Comment'}
        <textarea id={`c-body-${id}`} name="body" required minLength={2} maxLength={4000} rows={parentId ? 3 : 5} className="rounded-md border border-input bg-background px-3 py-2 text-base leading-relaxed" />
      </label>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={state === 'sending'} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60">
          {state === 'sending' ? 'Sending…' : parentId ? 'Post reply' : 'Post comment'}
        </button>
        {onDone && <button type="button" onClick={onDone} className="rounded-md px-4 py-2 text-sm">Cancel</button>}
      </div>
    </form>
  )
}

function CommentItem({ comment, replies, slug }: { comment: Comment; replies: Comment[]; slug: string }) {
  const [replying, setReplying] = useState(false)
  return (
    <li className="flex flex-col gap-3">
      <article className="flex flex-col gap-1.5">
        <header className="flex flex-wrap items-baseline gap-x-3 text-sm">
          <span className="font-semibold">{comment.authorName}</span>
          <time dateTime={comment.createdAt} className="text-muted-foreground">{fmt(comment.createdAt)}</time>
        </header>
        <p className="whitespace-pre-wrap break-words leading-relaxed">{comment.body}</p>
        {!comment.parentId && !replying && (
          <button type="button" onClick={() => setReplying(true)} className="w-fit text-sm text-primary underline-offset-4 hover:underline">Reply</button>
        )}
      </article>
      {replying && <CommentForm slug={slug} parentId={comment.id} onDone={() => setReplying(false)} />}
      {replies.length > 0 && (
        <ul className="flex flex-col gap-5 border-l-2 border-border pl-5">
          {replies.map((r) => <CommentItem key={r.id} comment={r} replies={[]} slug={slug} />)}
        </ul>
      )}
    </li>
  )
}

export function PostComments({ slug }: { slug: string }) {
  const { data } = useSWR<{ enabled: boolean; items: Comment[] }>(`/api/v1/blog/posts/${encodeURIComponent(slug)}/comments`, fetcher)
  if (!data?.enabled) return null
  const roots = data.items.filter((c) => !c.parentId)
  const repliesOf = (id: string) => data.items.filter((c) => c.parentId === id)

  return (
    <section aria-labelledby="comments-h" className="mx-auto flex max-w-3xl flex-col gap-8 px-5 pb-20 md:px-8">
      <h2 id="comments-h" className="font-display text-2xl font-semibold">
        Comments {roots.length > 0 && <span className="text-muted-foreground">({data.items.length})</span>}
      </h2>
      {roots.length > 0 ? (
        <ul className="flex flex-col gap-8">
          {roots.map((c) => <CommentItem key={c.id} comment={c} replies={repliesOf(c.id)} slug={slug} />)}
        </ul>
      ) : (
        <p className="text-muted-foreground">No comments yet. Start the conversation.</p>
      )}
      <div className="flex flex-col gap-3 border-t border-border pt-6">
        <h3 className="text-lg font-semibold">Leave a comment</h3>
        <CommentForm slug={slug} />
      </div>
    </section>
  )
}
