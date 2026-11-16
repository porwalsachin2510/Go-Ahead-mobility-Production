import { Plus } from 'lucide-react'
import { Markdown } from './primitives'

export function FaqList({ items }: { items: { _id: string; question: string; answer: string }[] }) {
  return (
    <div className="flex flex-col divide-y divide-line border-y border-line">
      {items.map((f) => (
        <details key={f._id} className="group py-1">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-left font-display text-lg font-bold text-foreground [&::-webkit-details-marker]:hidden">
            {f.question}
            <Plus aria-hidden className="size-5 shrink-0 text-royal transition-transform group-open:rotate-45" />
          </summary>
          <div className="pb-6 pr-10">
            <Markdown>{f.answer}</Markdown>
          </div>
        </details>
      ))}
    </div>
  )
}
