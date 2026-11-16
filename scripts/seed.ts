/**
 * Idempotent seed: run with `pnpm seed` (loads .env).
 * Content is upserted with $setOnInsert; the env-configured admin is created or reset to ADMIN_PASSWORD.
 */
import mongoose from 'mongoose'
import { upsertEnvAdmin } from '../lib/server/auth/admin-account'
import { connectDb, getDbName } from '../lib/server/db'
import { Navigation, Page, SiteSettings } from '../lib/server/models/content'
import { Author, CaseStudy, Category, Faq, Industry, Job, Location, Post, Resource, Tag, TeamMember } from '../lib/server/models/editorial'
import { EmailTemplate, RoutingRule } from '../lib/server/models/operations'
import { DEFAULT_TEMPLATES } from '../lib/server/services/email'
import { FOOTPRINT_FOOTER_LINK, LEGAL_MENU_ITEMS, LEGAL_PAGES } from '../lib/legal/defaults'

let n = 0
const id = () => `b${++n}`
const block = (type: string, data: Record<string, unknown>) => ({ id: id(), type, hidden: false, data })

async function upsert(model: mongoose.Model<any>, filter: Record<string, unknown>, doc: Record<string, unknown>) {
  await model.updateOne(filter, { $setOnInsert: { ...filter, ...doc } }, { upsert: true })
}

const PAGES: { path: string; pageType: string; title: string; seo: { title: string; description: string }; blocks: any[] }[] = [
  {
    path: '/',
    pageType: 'home',
    title: 'Global stays. Local movement. One accountable partner.',
    seo: { title: 'GoAhead Mobility — Corporate Accommodation & Transportation', description: 'Global accommodation and local transportation programmes for organisations, project teams and event groups.' },
    blocks: [
      block('hero', {
        variant: 'home',
        eyebrow: 'Corporate mobility partner',
        title: 'Global stays. Local movement. One accountable partner.',
        highlight: 'One accountable partner.',
        subtitle: 'GoAhead Mobility plans and operates accommodation and ground transportation for organisations that move people at scale — from project crews and relocating employees to daily shuttles and event delegations.',
        image: '/images/accommodation-hero.webp',
        imageAlt: 'Serviced corporate apartment with city view',
        primaryLabel: 'Request a proposal',
        primaryHref: '/contact',
        secondaryLabel: 'Talk to our team',
        secondaryHref: '/contact#directory',
        routes: [
          { label: 'Global Accommodation', description: 'Corporate housing, project stays and group bookings worldwide.', href: '/global-accommodation', image: '/images/project-stays.webp' },
          { label: 'Local Transportation', description: 'Employee shuttles, executive cars, event and industrial transport.', href: '/local-transportation', image: '/images/transport-hero.webp' },
        ],
      }),
      block('verticals', {
        eyebrow: 'Two verticals, one operating model',
        heading: 'Where your people stay, and how they get there.',
        intro: 'Each vertical has its own specialist team. Both share one account structure, one service standard and one point of escalation.',
        items: [
          { eyebrow: 'Vertical 01', title: 'Global Accommodation', body: 'Sourcing, contracting and duty-of-care for stays from one night to eighteen months.', points: ['Corporate & serviced apartments', 'Project and crew housing', 'Group and event room blocks', 'Relocation stays'], image: '/images/project-stays.webp', imageAlt: 'Project team accommodation', href: '/global-accommodation', ctaLabel: 'Explore accommodation' },
          { eyebrow: 'Vertical 02', title: 'Local Transportation', body: 'Scheduled and on-demand ground movement with vetted drivers and real-time coordination.', points: ['Employee shuttle programmes', 'Executive and airport transfers', 'Event transport', 'Industrial and site logistics'], image: '/images/employee-shuttle.webp', imageAlt: 'Employee shuttle bus', href: '/local-transportation', ctaLabel: 'Explore transportation' },
        ],
      }),
      block('challenges', {
        eyebrow: 'What buyers tell us',
        heading: 'The problems we are hired to solve.',
        items: [
          { vertical: 'accommodation', problem: 'Fragmented suppliers across cities', detail: 'Every location has its own landlord, contract and invoice.', solution: 'One contracting layer, consolidated billing and a single service standard.', href: '/global-accommodation' },
          { vertical: 'transport', problem: 'Shuttles that run late or empty', detail: 'Routes designed once and never revisited as shift patterns change.', solution: 'Route reviews against actual ridership and shift rosters.', href: '/local-transportation' },
          { vertical: 'both', problem: 'No visibility on where people are', detail: 'Duty-of-care obligations without a live picture of stays and trips.', solution: 'Booking and trip records your HR and security teams can query.', href: '/contact' },
        ],
      }),
      block('steps', {
        eyebrow: 'How we work',
        heading: 'From requirement to running programme.',
        items: [
          { title: 'Discover', body: 'We map headcount, locations, durations and policy constraints.' },
          { title: 'Design', body: 'A programme proposal with supply options, service levels and cost model.' },
          { title: 'Mobilise', body: 'Contracting, onboarding, driver and property checks, and go-live.' },
          { title: 'Operate & review', body: 'Day-to-day coordination with scheduled performance reviews.' },
        ],
        note: 'Timelines depend on scope and are agreed during discovery.',
      }),
      block('industries', { eyebrow: 'Industries', heading: 'Built for organisations that move people for work.', limit: 6 }),
      block('posts', { eyebrow: 'Insights', heading: 'Notes from the operations floor.', limit: 3 }),
      block('faq', { eyebrow: 'FAQ', heading: 'Common questions', limit: 5 }),
      block('ctaBand', { heading: 'Tell us what you need to move — people, places, timelines.', body: 'A specialist from the right vertical will respond with next steps.', tone: 'royal', primaryLabel: 'Request a proposal', primaryHref: '/contact', secondaryLabel: 'Browse insights', secondaryHref: '/blog' }),
    ],
  },
  {
    path: '/global-accommodation',
    pageType: 'vertical',
    title: 'Global Accommodation',
    seo: { title: 'Global Corporate Accommodation', description: 'Corporate housing, project stays, group bookings and relocation accommodation managed end to end.' },
    blocks: [
      block('hero', { variant: 'page', eyebrow: 'Global Accommodation', title: 'Stays that work as hard as your teams do.', highlight: 'work as hard', subtitle: 'From a three-night site visit to a year-long project rotation, we source, contract and manage accommodation that meets your policy and your people.', image: '/images/accommodation-hero.webp', imageAlt: 'Corporate apartment living room', primaryLabel: 'Request accommodation', primaryHref: '#enquiry', secondaryLabel: 'See FAQs', secondaryHref: '/faq' }),
      block('serviceCards', {
        eyebrow: 'Services',
        heading: 'Accommodation services',
        items: [
          { title: 'Corporate housing', body: 'Furnished apartments for medium and long stays.', image: '/images/accommodation-hero.webp', imageAlt: 'Furnished apartment', tag: '30+ nights' },
          { title: 'Project & crew stays', body: 'Block housing near sites with shift-friendly services.', image: '/images/project-stays.webp', imageAlt: 'Crew housing', tag: 'Projects' },
          { title: 'Group & event blocks', body: 'Room blocks with attrition terms negotiated for you.', image: '/images/event-transport.webp', imageAlt: 'Event venue', tag: 'Events' },
        ],
      }),
      block('features', {
        eyebrow: 'Why GoAhead',
        heading: 'Duty of care built into every booking.',
        columns: '3',
        tone: 'paper',
        items: [
          { icon: 'shield', title: 'Vetted properties', body: 'Safety, location and amenity checks before a property enters our network.' },
          { icon: 'receipt', title: 'Consolidated billing', body: 'One invoice structure across cities and suppliers.' },
          { icon: 'headset', title: 'Guest support', body: 'A named coordinator and an escalation path for every stay.' },
        ],
      }),
      block('coverage', { eyebrow: 'Coverage', heading: 'Where we deliver accommodation', vertical: 'accommodation' }),
      block('faq', { eyebrow: 'FAQ', heading: 'Accommodation questions', vertical: 'accommodation', limit: 6 }),
      block('form', { variant: 'accommodation', eyebrow: 'Enquiry', heading: 'Tell us about your accommodation requirement', intro: 'Share as much as you know. Dates and headcount can be estimates.', sideNote: '**What happens next**\n\n1. You receive a reference number by email.\n2. A specialist reviews your requirement.\n3. We follow up with questions or options.' }),
    ],
  },
  {
    path: '/local-transportation',
    pageType: 'vertical',
    title: 'Local Transportation',
    seo: { title: 'Corporate Ground Transportation', description: 'Employee shuttles, executive transfers, event transport and industrial logistics with vetted drivers.' },
    blocks: [
      block('hero', { variant: 'page', eyebrow: 'Local Transportation', title: 'Every route on time. Every rider accounted for.', highlight: 'on time', subtitle: 'Scheduled shuttles, executive cars and event fleets — planned against your shift patterns and operated with vetted drivers.', image: '/images/transport-hero.webp', imageAlt: 'Fleet of corporate vehicles', primaryLabel: 'Share a requirement', primaryHref: '#enquiry', secondaryLabel: 'Book an ERP demo', secondaryHref: '/contact?type=demo' }),
      block('serviceCards', {
        eyebrow: 'Services',
        heading: 'Transportation services',
        items: [
          { title: 'Employee shuttles', body: 'Fixed and dynamic routes aligned to shift rosters.', image: '/images/employee-shuttle.webp', imageAlt: 'Employee shuttle', tag: 'Daily' },
          { title: 'Event transport', body: 'Delegation movement, airport meet-and-greet and venue loops.', image: '/images/event-transport.webp', imageAlt: 'Event coaches', tag: 'Events' },
          { title: 'Industrial & site transport', body: 'Crew movement to plants, mines and project sites.', image: '/images/industrial-transport.webp', imageAlt: 'Industrial site transport', tag: 'Sites' },
        ],
      }),
      block('features', {
        eyebrow: 'Operating standard',
        heading: 'What every trip includes.',
        columns: '4',
        tone: 'dark',
        items: [
          { icon: 'users', title: 'Vetted drivers', body: 'Background checks and route familiarisation.' },
          { icon: 'route', title: 'Route planning', body: 'Designed against rosters, reviewed against ridership.' },
          { icon: 'clock', title: 'Live coordination', body: 'A control desk for delays and changes.' },
          { icon: 'chart', title: 'Reporting', body: 'Trip, punctuality and utilisation records.' },
        ],
      }),
      block('coverage', { eyebrow: 'Coverage', heading: 'Where we operate transport', vertical: 'transport' }),
      block('faq', { eyebrow: 'FAQ', heading: 'Transportation questions', vertical: 'transport', limit: 6 }),
      block('form', { variant: 'transport', eyebrow: 'Requirement', heading: 'Share your transportation requirement', intro: 'Route, headcount and schedule details help us respond faster.' }),
    ],
  },
  {
    path: '/about-us',
    pageType: 'company',
    title: 'About GoAhead Mobility',
    seo: { title: 'About Us', description: 'Who we are, how we operate and the standards we hold ourselves to.' },
    blocks: [
      block('hero', { variant: 'compact', eyebrow: 'Company', title: 'We exist so your people can focus on the work.', highlight: 'focus on the work', subtitle: 'GoAhead Mobility brings accommodation and ground transportation under one accountable operating model.' }),
      block('imageText', { eyebrow: 'Our approach', heading: 'Operators first, intermediaries second.', body: 'We run the programmes we sell. Every account has a named lead, every supplier is reviewed, and every escalation has an owner.\n\nWhere we use partner networks, we say so — and we hold partners to the same service standard.', image: '/images/industrial-transport.webp', imageAlt: 'Operations team coordinating transport', tone: 'light' }),
      block('features', { eyebrow: 'Values', heading: 'How we make decisions', columns: '3', tone: 'paper', items: [{ icon: 'check', title: 'Say what is true', body: 'We publish only claims we can evidence.' }, { icon: 'heart', title: 'People before logistics', body: 'Comfort and safety come before convenience.' }, { icon: 'shield', title: 'Own the outcome', body: 'One accountable partner, no hand-offs.' }] }),
      block('team', { eyebrow: 'Leadership', heading: 'The team accountable to you' }),
      block('ctaBand', { heading: 'Want to work with us — or for us?', tone: 'dark', primaryLabel: 'Contact us', primaryHref: '/contact', secondaryLabel: 'See careers', secondaryHref: '/careers' }),
    ],
  },
  {
    path: '/contact',
    pageType: 'company',
    title: 'Contact',
    seo: { title: 'Contact Us', description: 'Request a proposal for accommodation or transportation, or reach the right team directly.' },
    blocks: [
      block('hero', { variant: 'compact', eyebrow: 'Contact', title: 'Tell us what you need. We route it to the right specialist.', highlight: 'right specialist', subtitle: 'Every enquiry receives a reference number and is reviewed by the relevant vertical team.' }),
      block('form', { variant: 'contact', heading: 'Send an enquiry', intro: 'Choose a topic and share a few details.' }),
      block('contactDetails', { eyebrow: 'Directory', heading: 'Reach a team directly' }),
    ],
  },
  {
    path: '/industries',
    pageType: 'standard',
    title: 'Industries',
    seo: { title: 'Industries we serve', description: 'Accommodation and transportation programmes tailored to the operating rhythm of each industry.' },
    blocks: [
      block('industries', { eyebrow: 'Industries', heading: 'Built around how your sector actually operates.', intro: 'Every industry moves people differently. Explore how we adapt accommodation and transport programmes.' }),
      block('ctaBand', { heading: 'Not seeing your industry?', body: 'Tell us how your teams travel and stay. We will scope a programme around it.', tone: 'royal', primaryLabel: 'Talk to us', primaryHref: '/contact' }),
    ],
  },
  {
    path: '/case-studies',
    pageType: 'standard',
    title: 'Case Studies',
    seo: { title: 'Case studies', description: 'Client-approved results from accommodation and transportation programmes.' },
    blocks: [
      block('proof', { eyebrow: 'Proof', heading: 'Outcomes our clients have approved us to share.' }),
      block('ctaBand', { heading: 'Want results like these?', body: 'Share your requirement and our team will respond within one business day.', tone: 'dark', primaryLabel: 'Start an enquiry', primaryHref: '/contact' }),
    ],
  },
  {
    path: '/learn',
    pageType: 'standard',
    title: 'Resource Center',
    seo: { title: 'Resource Center', description: 'Guides, checklists and insights for HR, travel and operations teams.' },
    blocks: [
      block('resources', { eyebrow: 'Resource Center', heading: 'Practical guides for mobility teams.', limit: 6 }),
      block('posts', { eyebrow: 'Insights', heading: 'Latest from the blog', limit: 3 }),
      block('newsletter', { heading: 'Mobility notes, monthly', intro: 'Double opt-in. Unsubscribe anytime.' }),
    ],
  },
  {
    path: '/faq',
    pageType: 'standard',
    title: 'FAQ',
    seo: { title: 'Frequently asked questions', description: 'Answers about GoAhead Mobility accommodation and transportation services.' },
    blocks: [
      block('faq', { eyebrow: 'FAQ', heading: 'Accommodation', vertical: 'accommodation', limit: 30 }),
      block('faq', { eyebrow: 'FAQ', heading: 'Transportation', vertical: 'transport', limit: 30 }),
      block('ctaBand', { heading: 'Still have a question?', body: 'Our team is happy to help.', tone: 'sky', primaryLabel: 'Contact us', primaryHref: '/contact' }),
    ],
  },
  {
    path: '/privacy',
    pageType: 'legal',
    title: 'Privacy Notice',
    seo: { title: 'Privacy Notice', description: 'How GoAhead Mobility collects, uses and protects personal data.' },
    blocks: [
      block('richText', { heading: 'Privacy Notice', width: 'narrow', body: '_Version v1. This notice must be reviewed by your legal counsel before launch._\n\n## What we collect\nContact and requirement details you submit through our forms, and limited technical data needed to operate the site securely.\n\n## Why we collect it\nTo respond to your enquiry, provide services you request, and — only with consent — send updates.\n\n## Retention\nEnquiries are retained for up to 24 months after last activity. Job applications are retained for 12 months.\n\n## Your rights\nYou may request access, correction or deletion by contacting us via the contact page.' }),
    ],
  },
  ...LEGAL_PAGES,
]

async function main() {
  await connectDb()
  console.log('[seed] connected')

  await upsert(SiteSettings, { key: 'site' }, {
    brandName: 'GoAhead Mobility',
    tagline: 'Global accommodation and local transportation for organisations.',
    contact: { email: 'hello@goaheadmobility.com', phone: '', address: '', hours: 'Mon–Fri, 09:00–18:00 IST', accommodationEmail: 'stays@goaheadmobility.com', transportEmail: 'transport@goaheadmobility.com', careersEmail: 'careers@goaheadmobility.com' },
    social: { linkedin: 'https://www.linkedin.com' },
    footer: { blurb: 'One accountable partner for where your people stay and how they move.', newsletterHeading: 'Mobility notes, monthly', newsletterCopy: 'Practical guidance for HR, travel and operations teams. Double opt-in, unsubscribe anytime.' },
    seo: { defaultTitle: 'GoAhead Mobility', titleTemplate: '%s | GoAhead Mobility', defaultDescription: 'Global accommodation and local transportation programmes for organisations.', ogImage: '/images/accommodation-hero.webp', robotsMode: 'allow', extraDisallow: [] },
  })

  await upsert(Navigation, { menuKey: 'primary' }, {
    items: [
      { id: 'n1', label: 'Accommodation', href: '/global-accommodation', children: [] },
      { id: 'n2', label: 'Transportation', href: '/local-transportation', children: [] },
      { id: 'n3', label: 'Industries', href: '/industries', children: [] },
      { id: 'n4', label: 'Insights', href: '/blog', children: [{ id: 'n4a', label: 'Blog', href: '/blog', description: 'Articles and operating notes' }, { id: 'n4b', label: 'Resources', href: '/learn', description: 'Guides and checklists' }, { id: 'n4c', label: 'Case studies', href: '/case-studies', description: 'Programmes we run' }, { id: 'n4d', label: 'FAQ', href: '/faq', description: 'Common questions' }] },
      { id: 'n5', label: 'Company', href: '/about-us', children: [{ id: 'n5a', label: 'About', href: '/about-us' }, { id: 'n5b', label: 'Careers', href: '/careers' }, { id: 'n5c', label: 'Contact', href: '/contact' }] },
    ],
  })
  await upsert(Navigation, { menuKey: 'footer' }, {
    items: [
      { id: 'f1', label: 'Services', href: '', children: [{ id: 'f1a', label: 'Global Accommodation', href: '/global-accommodation' }, { id: 'f1b', label: 'Local Transportation', href: '/local-transportation' }, { id: 'f1c', label: 'Industries', href: '/industries' }] },
      { id: 'f2', label: 'Insights', href: '', children: [{ id: 'f2a', label: 'Blog', href: '/blog' }, { id: 'f2b', label: 'Resources', href: '/learn' }, { id: 'f2c', label: 'Case studies', href: '/case-studies' }, { id: 'f2d', label: 'FAQ', href: '/faq' }] },
      { id: 'f3', label: 'Company', href: '', children: [{ id: 'f3a', label: 'About', href: '/about-us' }, FOOTPRINT_FOOTER_LINK, { id: 'f3b', label: 'Careers', href: '/careers' }, { id: 'f3c', label: 'Contact', href: '/contact' }] },
    ],
  })
  await upsert(Navigation, { menuKey: 'legal' }, { items: LEGAL_MENU_ITEMS })

  for (const p of PAGES) {
    const content = { title: p.title, blocks: p.blocks, seo: p.seo }
    await upsert(Page, { path: p.path }, { pageType: p.pageType, draft: content, published: content, state: 'published', publishedAt: new Date(), isSystem: true, searchText: JSON.stringify(p.blocks.map((b) => b.data)).replace(/[{}"[\]:,]/g, ' ').slice(0, 20000) })
  }

  const industries = [
    { slug: 'technology', title: 'Technology & IT services', icon: 'cpu', summary: 'Onboarding cohorts, project deployments and 24/7 shift shuttles.', accommodationNeeds: ['Onboarding cohort housing', 'Client-site project stays'], mobilityNeeds: ['Night-shift shuttles', 'Airport transfers'] },
    { slug: 'manufacturing', title: 'Manufacturing & industrial', icon: 'factory', summary: 'Crew housing near plants and reliable shift transport.', accommodationNeeds: ['Crew housing', 'Commissioning team stays'], mobilityNeeds: ['Plant shuttles', 'Site logistics'] },
    { slug: 'energy-infrastructure', title: 'Energy & infrastructure', icon: 'building', summary: 'Remote project rotations with duty-of-care controls.', accommodationNeeds: ['Rotation housing', 'Remote site camps via partners'], mobilityNeeds: ['Crew change transport', 'Site access vehicles'] },
    { slug: 'events-associations', title: 'Events & associations', icon: 'calendar', summary: 'Room blocks and delegation movement for conferences.', accommodationNeeds: ['Room blocks', 'VIP stays'], mobilityNeeds: ['Venue loops', 'Meet-and-greet'] },
    { slug: 'healthcare', title: 'Healthcare & life sciences', icon: 'heart', summary: 'Locum and clinical-trial staff accommodation and transfers.', accommodationNeeds: ['Locum housing'], mobilityNeeds: ['Staff transfers'] },
    { slug: 'consulting', title: 'Consulting & professional services', icon: 'briefcase', summary: 'Client-site stays and executive transfers.', accommodationNeeds: ['Serviced apartments'], mobilityNeeds: ['Executive cars'] },
  ]
  for (const [i, ind] of industries.entries()) {
    await upsert(Industry, { slug: ind.slug }, { ...ind, context: `${ind.summary}\n\nWe tailor programmes to the operating rhythm of ${ind.title.toLowerCase()} teams.`, governance: 'Supplier checks, consolidated reporting and a named escalation owner.', image: ['/images/project-stays.webp', '/images/industrial-transport.webp', '/images/transport-hero.webp', '/images/event-transport.webp', '/images/accommodation-hero.webp', '/images/employee-shuttle.webp'][i], sortOrder: i, status: 'published', ctaLabel: 'Discuss your programme' })
  }

  const faqs = [
    ['How quickly can you source accommodation?', 'For standard corporate housing in established cities, options are usually shared within a few business days. Large group or remote-site requirements take longer and are scoped during discovery.', 'accommodation'],
    ['Do you handle long stays as well as short stays?', 'Yes. We manage stays from a few nights to extended project rotations, with terms negotiated for the expected duration.', 'accommodation'],
    ['Can you consolidate invoices across cities?', 'Yes. Consolidated billing is a standard part of managed accommodation programmes.', 'accommodation'],
    ['How are drivers vetted?', 'Drivers go through identity and background checks and route familiarisation before assignment. Exact checks vary by country and are documented in your service agreement.', 'transport'],
    ['Can shuttle routes change with our shift patterns?', 'Yes. Routes are reviewed against rosters and ridership, and changes are agreed with your facilities team.', 'transport'],
    ['Do you offer a transport ERP or app?', 'We can demonstrate our transport management tooling. Request a demo through the contact page.', 'transport'],
    ['Which locations do you cover?', 'Coverage is listed on each vertical page and distinguishes direct delivery from partner-network delivery.', 'general'],
    ['What happens after I submit an enquiry?', 'You receive a reference number by email. A specialist from the relevant vertical reviews your requirement and follows up.', 'general'],
  ] as const
  for (const [i, [question, answer, vertical]] of faqs.entries()) {
    await upsert(Faq, { question }, { answer, vertical, category: vertical, sortOrder: i, status: 'published' })
  }

  const locations = [
    { country: 'India', city: 'Bengaluru', vertical: 'both', serviceStatus: 'direct', services: ['Corporate housing', 'Employee shuttles'] },
    { country: 'India', city: 'Pune', vertical: 'both', serviceStatus: 'direct', services: ['Project stays', 'Shift transport'] },
    { country: 'India', city: 'Hyderabad', vertical: 'transport', serviceStatus: 'direct', services: ['Employee shuttles', 'Airport transfers'] },
    { country: 'United Arab Emirates', city: 'Dubai', vertical: 'accommodation', serviceStatus: 'partner_network', services: ['Serviced apartments'] },
    { country: 'United Kingdom', city: 'London', vertical: 'accommodation', serviceStatus: 'partner_network', services: ['Corporate housing'] },
    { country: 'Singapore', city: 'Singapore', vertical: 'accommodation', serviceStatus: 'case_by_case', services: ['Group bookings'] },
  ]
  for (const [i, loc] of locations.entries()) await upsert(Location, { country: loc.country, city: loc.city }, { ...loc, sortOrder: i, status: 'published', reviewedAt: new Date() })

  await upsert(Author, { slug: 'editorial-team' }, { name: 'GoAhead Editorial Team', jobTitle: 'Operations & programme specialists', bio: 'Written by the people who plan and run our accommodation and transport programmes.', expertise: ['Corporate housing', 'Ground transportation'] })
  const author = await Author.findOne({ slug: 'editorial-team' })
  const cats = [{ slug: 'accommodation', name: 'Accommodation' }, { slug: 'transportation', name: 'Transportation' }, { slug: 'operations', name: 'Operations' }]
  for (const c of cats) await upsert(Category, { slug: c.slug }, { name: c.name, description: `${c.name} articles from GoAhead Mobility.` })
  await upsert(Tag, { slug: 'duty-of-care' }, { name: 'Duty of care' })
  const catDocs = await Category.find().lean<any[]>()
  const catId = (slug: string) => catDocs.find((c) => c.slug === slug)?._id

  const posts = [
    { slug: 'planning-project-crew-accommodation', title: 'Planning accommodation for a project crew: a practical checklist', vertical: 'accommodation', cat: 'accommodation', heroImage: '/images/project-stays.webp', excerpt: 'Headcount, rotation patterns and proximity to site matter more than nightly rate. Here is how to scope it.', content: '## Start with the rotation, not the rate\nCrew accommodation succeeds or fails on how well it fits the work pattern. Before comparing properties, document:\n\n- Headcount by role and shift\n- Rotation length and changeover days\n- Maximum acceptable commute to site\n\n## Agree on service levels early\nHousekeeping frequency, laundry, meal options and quiet hours for night-shift workers should be in the contract — not negotiated later.\n\n## Plan for change\nProjects slip. Negotiate extension and early-release terms so headcount changes do not become penalty costs.\n\n> A good crew-housing plan is one your site manager never has to think about.' },
    { slug: 'designing-employee-shuttle-routes', title: 'Designing employee shuttle routes that people actually use', vertical: 'transport', cat: 'transportation', heroImage: '/images/employee-shuttle.webp', excerpt: 'Ridership drops when routes ignore shift rosters. A review cadence fixes most of it.', content: '## Map demand from rosters\nUse shift rosters and home-location clusters — not last year\'s route map — as the starting point.\n\n## Review against ridership\nSchedule monthly reviews comparing planned versus actual riders per stop. Remove or merge stops that consistently fall below threshold.\n\n## Communicate changes\nRiders tolerate route changes when they hear about them early, through channels they already use.' },
    { slug: 'duty-of-care-for-travelling-employees', title: 'Duty of care for travelling employees: what HR teams should own', vertical: 'general', cat: 'operations', heroImage: '/images/accommodation-hero.webp', excerpt: 'Who knows where your people are tonight? Duty of care starts with the booking record.', content: '## Visibility first\nDuty of care depends on knowing where employees are staying and how they are moving. Centralised booking records are the foundation.\n\n## Vet suppliers consistently\nUse the same safety and location criteria for every property and transport provider.\n\n## Define escalation\nEvery traveller should know who to call, and every call should have an owner.' },
  ]
  for (const [i, p] of posts.entries()) {
    const words = p.content.split(/\s+/).length
    await upsert(Post, { slug: p.slug }, { title: p.title, excerpt: p.excerpt, content: p.content, heroImage: p.heroImage, heroAlt: p.title, vertical: p.vertical, categoryIds: [catId(p.cat)], authorId: author?._id, state: 'published', publishedAt: new Date(Date.now() - i * 86400000 * 9), readingMinutes: Math.max(1, Math.round(words / 220)), featured: i === 0, seo: { title: p.title, description: p.excerpt } })
  }

  const resources = [
    { slug: 'corporate-housing-rfp-checklist', title: 'Corporate housing RFP checklist', resourceType: 'checklist', vertical: 'accommodation', summary: 'The questions to put to every accommodation supplier before you sign.', body: '## Inside this checklist\n- Property standards and safety checks\n- Cancellation and extension terms\n- Billing and reporting requirements\n- Guest support and escalation', gated: true, image: '/images/accommodation-hero.webp' },
    { slug: 'shuttle-programme-scoping-guide', title: 'Employee shuttle programme scoping guide', resourceType: 'guide', vertical: 'transport', summary: 'How to scope a shuttle programme from rosters, locations and service levels.', body: '## What this guide covers\n- Demand mapping from rosters\n- Fleet sizing assumptions\n- Service level definitions\n- Review cadence', gated: true, image: '/images/employee-shuttle.webp' },
    { slug: 'event-transport-planning-template', title: 'Event transport planning template', resourceType: 'template', vertical: 'transport', summary: 'A run-sheet structure for delegation arrivals, venue loops and departures.', body: '## Template sections\n- Arrival manifests\n- Venue loop timings\n- Contingency vehicles\n- Contact sheet', gated: false, image: '/images/event-transport.webp' },
  ]
  for (const [i, r] of resources.entries()) await upsert(Resource, { slug: r.slug }, { ...r, sortOrder: i, status: 'published', publishedAt: new Date(), featured: i === 0, isSample: true })

  await upsert(CaseStudy, { slug: 'multi-city-onboarding-housing' }, { title: 'Housing onboarding cohorts across three cities', anonymized: true, clientApproved: true, vertical: 'accommodation', industrySlugs: ['technology'], summary: 'Illustrative example of a multi-city onboarding housing programme.', challenge: 'A technology employer needed short-stay housing for recurring onboarding cohorts in three cities, with consistent standards and one invoice.', approach: 'We set up a shortlist of vetted serviced apartments per city, standardised check-in and support, and consolidated billing.', outcome: 'Cohort coordinators had one point of contact and one booking process across locations.', deliveryModel: 'Managed programme with partner properties', disclaimer: 'Illustrative example. Replace with an approved client case study before launch.', image: '/images/project-stays.webp', status: 'published' })
  await upsert(CaseStudy, { slug: 'plant-shift-shuttle-redesign' }, { title: 'Redesigning shift shuttles for a manufacturing plant', anonymized: true, clientApproved: true, vertical: 'transport', industrySlugs: ['manufacturing'], summary: 'Illustrative example of a shuttle route review against shift rosters.', challenge: 'Shuttle routes had not changed in years while shift patterns and employee locations had.', approach: 'We mapped rosters and home clusters, proposed revised routes, and agreed a monthly ridership review.', outcome: 'Routes aligned to current shifts, with a review process to keep them aligned.', deliveryModel: 'Direct operation', disclaimer: 'Illustrative example. Replace with an approved client case study before launch.', image: '/images/industrial-transport.webp', status: 'published' })

  await upsert(Industry, { slug: 'technology' }, {
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
    seo: { title: 'IT & Technology Travel Solutions | GoAhead Mobility', description: 'Coordinated accommodation and transportation for IT and technology companies, project teams and employees.' },
  })

  await upsert(TeamMember, { name: 'Leadership profile' }, { role: 'Replace with a real leader', bio: 'Publish verified leadership profiles from the admin Team module.', sortOrder: 0, status: 'draft' })

  await upsert(Job, { slug: 'transport-operations-coordinator' }, { title: 'Transport Operations Coordinator', department: 'Transportation', location: 'Bengaluru, India', employmentType: 'full_time', description: 'Coordinate daily shuttle and executive transport operations, manage driver rosters and act as the first escalation point for clients.', requirements: '- 2+ years in transport or logistics operations\n- Strong communication in English\n- Comfortable with shift-based escalation', status: 'published', isSample: true })
  await upsert(Job, { slug: 'accommodation-account-specialist' }, { title: 'Accommodation Account Specialist', department: 'Accommodation', location: 'Pune, India (hybrid)', employmentType: 'full_time', remote: false, description: 'Own client accommodation programmes: sourcing, contracting and guest support across cities.', requirements: '- Experience in corporate housing, hospitality or travel management\n- Supplier negotiation experience', status: 'published', isSample: true })

  for (const t of DEFAULT_TEMPLATES) await upsert(EmailTemplate, { slug: t.slug }, { name: t.name, subject: t.subject, preheader: t.preheader, body: t.body, allowedVariables: t.allowedVariables, version: 2 })

  await upsert(RoutingRule, { name: 'Accommodation team' }, { vertical: 'accommodation', team: 'accommodation', reminderHours: 24, priority: 10 })
  await upsert(RoutingRule, { name: 'Transport team' }, { vertical: 'transport', team: 'transport', reminderHours: 24, priority: 20 })

  const admin = await upsertEnvAdmin({ resetPassword: true })
  if (!admin) throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env')
  console.log(`[seed] super admin ready: ${admin.email} (password from ADMIN_PASSWORD)`)

  console.log(`[seed] done (database: ${getDbName()})`)
  await mongoose.disconnect()
}

main().catch(async (e) => {
  console.error(e)
  await mongoose.disconnect()
  process.exit(1)
})
