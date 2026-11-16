/**
 * Safe, focused content migration for the IT & Technology industry page.
 * Unlike the full seed command, this script does not create/reset admin users or alter other content.
 * Existing non-empty editor-managed fields are preserved.
 */
import mongoose from 'mongoose'
import { connectDb } from '../lib/server/db'
import { Industry } from '../lib/server/models/editorial'

const content = {
  slug: 'technology',
  title: 'IT & Technology',
  summary: 'Supporting IT & Tech companies with seamless accommodation and transportation for project teams, employees and executives — anywhere in the world.',
  heroTitle: 'Travel solutions built for',
  heroHighlight: 'IT & Technology',
  heroTitleSuffix: 'companies',
  heroEyebrow: 'Industry solutions',
  image: '/images/site/ind-it.png',
  icon: 'cpu',
  faqCategory: 'general',
  ctaLabel: 'Request a Proposal',
  context: 'From product launches to long-term development projects, we deliver reliable stay and mobility solutions that keep your teams focused and productive.',
  heroHighlights: [
    { icon: 'globe', label: 'Global Reach', value: '150+ Cities' },
    { icon: 'headset', label: '24/7 Support', value: 'Always Available' },
    { icon: 'calendar', label: 'Flexible Solutions', value: 'Scalable & Custom' },
    { icon: 'shield', label: 'Trusted by Tech Leaders', value: 'Worldwide' },
  ],
  benefits: [
    { icon: 'users', title: 'Project teams deployed faster', body: 'Reduce travel & stay coordination time' },
    { icon: 'receipt', title: 'Cost-efficient travel programs', body: 'Optimised rates and transparent pricing' },
    { icon: 'globe', title: 'Global coverage you can rely on', body: 'Strong network across 150+ countries' },
    { icon: 'heart', title: 'Employee comfort & productivity', body: 'Safe, comfortable and convenient experiences' },
    { icon: 'shield', title: 'End-to-end support', body: 'One partner for all your travel needs' },
  ],
  solutions: [
    { title: 'Project Team Travel', summary: 'End-to-end travel and stay arrangements for onsite implementations.', image: '/images/site/ind-it.png', icon: 'users', href: '/contact' },
    { title: 'Long-Term Stays', summary: 'Comfortable long-stay apartments for extended assignments.', image: '/images/project-stays.webp', icon: 'bed', href: '/global-accommodation' },
    { title: 'Employee Transport', summary: 'Daily commute and shuttle solutions for employees across locations.', image: '/images/employee-shuttle.webp', icon: 'car', href: '/local-transportation' },
    { title: 'Airport Transfers', summary: 'Punctual and reliable airport pick-ups and drop-offs for worldwide teams.', image: '/images/site/tr-airport.png', icon: 'plane', href: '/local-transportation' },
    { title: 'Events & Offsites', summary: 'Travel and stay management for corporate events, conferences and offsites.', image: '/images/event-transport.webp', icon: 'calendar', href: '/contact' },
    { title: 'Visa & Travel Support', summary: 'Visa assistance and travel documentation support for international teams.', image: '/images/site/planning.png', icon: 'briefcase', href: '/contact' },
  ],
  processSteps: [
    { title: 'Project Requirements', body: 'Tell us your project, team size, locations and preferences.' },
    { title: 'We Plan & Recommend', body: 'We find the best stay and transport options for you.' },
    { title: 'Confirm & Book', body: 'We handle bookings, contracts and travel logistics.' },
    { title: 'We Manage & Support', body: '24/7 support throughout your project lifecycle.' },
    { title: 'Review & Optimize', body: 'We review performance and continuously optimise.' },
  ],
  accommodationNeeds: ['Long-term project accommodation', 'Serviced apartments for visiting teams'],
  mobilityNeeds: ['Employee commute and shuttle programmes', 'Airport and event transfers'],
  governance: 'Coordinated travel support with clear points of contact, supplier oversight and escalation routes.',
  sortOrder: 2,
  status: 'published',
  seo: {
    title: 'IT & Technology Travel Solutions | GoAhead Mobility',
    description: 'Coordinated accommodation and transportation for IT and technology companies, project teams and employees.',
  },
}

async function main() {
  await connectDb()
  const existing = await Industry.findOne({ slug: content.slug }).lean<any>()
  if (!existing) {
    await Industry.create(content)
    console.log('[industry-migration] created published IT & Technology page')
  } else {
    const patch = Object.fromEntries(
      Object.entries(content).filter(([key, value]) => {
        if (key === 'slug' || key === 'status' || key === 'sortOrder') return false
        const current = existing[key]
        return current == null || current === '' || (Array.isArray(current) && current.length === 0)
      }),
    )
    if (Object.keys(patch).length) {
      await Industry.updateOne({ slug: content.slug }, { $set: patch }, { runValidators: true })
      console.log(`[industry-migration] filled ${Object.keys(patch).length} empty IT & Technology fields`)
    } else {
      console.log('[industry-migration] IT & Technology content already populated; no changes made')
    }
  }
}

main().catch((error) => {
  console.error('[industry-migration] failed', error)
  process.exitCode = 1
}).finally(async () => {
  await mongoose.disconnect()
})
