import { Suspense } from 'react'
import type { Block } from '@/lib/blocks'
import * as S from './static-blocks'
import * as Dy from './dynamic-blocks'

type Props = { data: Record<string, any>; first: boolean }

const REGISTRY: Record<string, (p: Props) => React.ReactNode | Promise<React.ReactNode>> = {
  hero: S.HeroBlock,
  verticals: S.VerticalsBlock,
  richText: S.RichTextBlock,
  imageText: S.ImageTextBlock,
  features: S.FeaturesBlock,
  serviceCards: S.ServiceCardsBlock,
  steps: S.StepsBlock,
  challenges: S.ChallengesBlock,
  stats: S.StatsBlock,
  form: S.FormBlock,
  newsletter: S.NewsletterBlock,
  ctaBand: S.CtaBandBlock,
  industries: Dy.IndustriesBlock,
  proof: Dy.ProofBlock,
  logoWall: Dy.LogoWallBlock,
  faq: Dy.FaqBlock,
  posts: Dy.PostsBlock,
  resources: Dy.ResourcesBlock,
  coverage: Dy.CoverageBlock,
  team: Dy.TeamBlock,
  contactDetails: Dy.ContactDetailsBlock,
}

export function RenderBlocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        const Component = REGISTRY[block.type] as React.ComponentType<Props> | undefined
        if (!Component) return null
        return (
          <Suspense key={block.id} fallback={<div className="min-h-40" aria-hidden />}>
            <Component data={block.data ?? {}} first={index === 0} />
          </Suspense>
        )
      })}
    </>
  )
}
