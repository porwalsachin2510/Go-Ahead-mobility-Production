'use client'

import { useId, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Markdown } from '@/components/site/primitives'

export type FaqItem = { _id: string; question: string; answer: string }

export function FaqAccordion({ items, columns = 3, defaultOpenFirst = false }: { items: FaqItem[]; columns?: 1 | 2 | 3; defaultOpenFirst?: boolean }) {
  const [open, setOpen] = useState<string | null>(() => defaultOpenFirst ? items[0]?._id ?? null : null)
  const reduce = useReducedMotion()
  const base = useId()
  return (
    <ul className={cn('grid items-start gap-0', columns === 1 ? 'grid-cols-1' : columns === 3 ? 'gap-4 md:grid-cols-3' : 'gap-4 md:grid-cols-2')}>
      {items.map((item) => {
        const isOpen = open === item._id
        const panelId = `${base}-${item._id}`
        return (
          <li key={item._id} className={cn('border bg-background transition-colors', columns === 1 ? 'rounded-none border-x-0 first:rounded-t-xl last:rounded-b-xl' : 'rounded-xl', isOpen ? 'border-azure/50 shadow-lg shadow-azure/5' : 'border-line hover:border-azure/40')}>
            <h3>
              <button type="button" aria-expanded={isOpen} aria-controls={panelId} onClick={() => setOpen(isOpen ? null : item._id)} className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left text-[13px] font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-azure sm:px-5">
                <span className="text-pretty">{item.question}</span>
                <Plus aria-hidden className={cn('size-4 shrink-0 text-azure transition-transform duration-300', isOpen && 'rotate-45')} />
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen ? (
                <motion.div
                  id={panelId}
                  role="region"
                  key="panel"
                  initial={reduce ? false : { height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 text-[11px] leading-relaxed text-muted-foreground sm:px-5"><Markdown>{item.answer}</Markdown></div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </li>
        )
      })}
    </ul>
  )
}
