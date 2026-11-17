import 'server-only'
import { revalidatePath } from 'next/cache'
import { can } from '@/lib/rbac'
import type { SessionUser } from '../auth/session'
import { getResource } from '../admin/registry'
import { isValidObjectId } from '../db'
import { badRequest, escapeRegex, forbidden, notFound, pagination } from '../http'
import { audit, diffFields } from '../security/guards'
import { parseFields } from '../validation/fields'
import { DEFAULT_HOME_PAGE_CONTENT } from '@/lib/homepage/defaults'
import { DEFAULT_ACCOMMODATION_PAGE_CONTENT } from '@/lib/accommodation/defaults'
import { DEFAULT_TRANSPORTATION_PAGE_CONTENT } from '@/lib/transportation/defaults'
import { DEFAULT_FOOTPRINT_PAGE_CONTENT } from '@/lib/footprint/defaults'
import { DEFAULT_INDUSTRY_PAGE_CONTENT } from '@/lib/industries/defaults'
import { DEFAULT_WHY_CHOOSE_US_PAGE_CONTENT } from '@/lib/why-choose-us/defaults'

const plain = <T>(v: unknown): T => JSON.parse(JSON.stringify(v))

function withResourceDefaults(key: string, doc: Record<string, unknown>) {
  if (key === 'home-page') return { ...DEFAULT_HOME_PAGE_CONTENT, ...doc }
  if (key === 'accommodation-page') return { ...DEFAULT_ACCOMMODATION_PAGE_CONTENT, ...doc }
  if (key === 'transportation-page') return { ...DEFAULT_TRANSPORTATION_PAGE_CONTENT, ...doc }
  if (key === 'footprint-page') return { ...DEFAULT_FOOTPRINT_PAGE_CONTENT, ...doc }
  if (key === 'industries') return { ...DEFAULT_INDUSTRY_PAGE_CONTENT, ...doc }
  return doc
}

function toForm(key: string, doc: Record<string, any>) {
  if (key === 'posts' && doc.cta) {
    doc.ctaLabel = doc.cta.label ?? ''
    doc.ctaHref = doc.cta.href ?? ''
  }
  return doc
}


function publicPathsForResource(key: string, doc: Record<string, unknown>, config?: { publicPath?: (doc: Record<string, unknown>) => string | null }) {
  const paths = new Set<string>()
  const add = (path: unknown) => {
    if (typeof path === 'string' && path.startsWith('/') && !path.startsWith('//')) paths.add(path)
  }
  if (config?.publicPath) add(config.publicPath(doc))
  const slug = typeof doc.slug === 'string' ? doc.slug : ''
  switch (key) {
    case 'navigation':
      paths.add('/')
      break
    case 'home-page':
      paths.add('/')
      break
    case 'accommodation-page':
      paths.add('/global-accommodation')
      break
    case 'transportation-page':
      paths.add('/local-transportation')
      break
    case 'footprint-page':
      paths.add('/our-footprint')
      break
    case 'why-choose-us-page':
      paths.add('/company/why-choose-us')
      break
    case 'about-page':
      paths.add('/about-us')
      paths.add('/company/about-us')
      break
    case 'contact-page':
      paths.add('/contact')
      break
    case 'faq-page':
      paths.add('/faq')
      break
    case 'careers-page':
      paths.add('/careers')
      break
    case 'case-studies-page':
      paths.add('/case-studies')
      break
    case 'resource-centre-page':
      paths.add('/resources')
      paths.add('/learn')
      break
    case 'posts':
      paths.add('/blog')
      paths.add('/')
      if (doc.vertical === 'accommodation' || doc.vertical === 'both') paths.add('/global-accommodation')
      if (doc.vertical === 'transport' || doc.vertical === 'both') paths.add('/local-transportation')
      if (slug) paths.add(`/blog/${slug}`)
      break
    case 'authors':
      paths.add('/blog')
      paths.add('/blog/authors')
      if (slug) paths.add(`/blog/author/${slug}`)
      break
    case 'categories':
      paths.add('/blog')
      if (slug) paths.add(`/blog/category/${slug}`)
      break
    case 'tags':
      paths.add('/blog')
      if (slug) paths.add(`/blog/tag/${slug}`)
      break
    case 'series':
      paths.add('/blog/series')
      if (slug) paths.add(`/blog/series/${slug}`)
      break
    case 'faqs':
      paths.add('/faq')
      paths.add('/')
      if (doc.vertical === 'accommodation' || doc.vertical === 'both') paths.add('/global-accommodation')
      if (doc.vertical === 'transport' || doc.vertical === 'both') paths.add('/local-transportation')
      for (const path of (doc.relatedPaths as string[] | undefined) ?? []) add(path)
      break
    case 'industries':
      paths.add('/industries')
      if (slug) paths.add(`/industries/${slug}`)
      break
    case 'case-studies':
      paths.add('/case-studies')
      paths.add('/industries')
      for (const industrySlug of (doc.industrySlugs as string[] | undefined) ?? []) {
        if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(industrySlug)) paths.add(`/industries/${industrySlug}`)
      }
      if (slug) paths.add(`/case-studies/${slug}`)
      break
    case 'resources':
      paths.add('/resources')
      paths.add('/learn')
      paths.add('/')
      if (doc.vertical === 'accommodation' || doc.vertical === 'both') paths.add('/global-accommodation')
      if (doc.vertical === 'transport' || doc.vertical === 'both') paths.add('/local-transportation')
      if (slug) paths.add(`/resources/${slug}`)
      break
    case 'testimonials':
    case 'client-logos':
      for (const path of ['/', '/about-us', '/industries', '/contact', '/global-accommodation', '/local-transportation']) paths.add(path)
      for (const industrySlug of (doc.industrySlugs as string[] | undefined) ?? []) {
        if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(industrySlug)) paths.add(`/industries/${industrySlug}`)
      }
      break
    case 'team':
      paths.add('/about-us')
      break
    case 'locations':
      for (const path of ['/industries', '/contact', '/global-accommodation', '/local-transportation']) paths.add(path)
      break
    case 'jobs':
      paths.add('/careers')
      if (slug) paths.add(`/careers/${slug}`)
      break
    case 'redirects':
      add(doc.sourcePath)
      paths.add('/')
      break
  }
  return paths
}

function revalidateResource(key: string, doc: Record<string, unknown>, config?: { publicPath?: (doc: Record<string, unknown>) => string | null }) {
  for (const path of publicPathsForResource(key, doc, config)) revalidatePath(path)
  if (key === 'navigation') revalidatePath('/', 'layout')
}

export async function listResource(key: string, user: SessionUser, sp: URLSearchParams) {
  const { config, model } = getResource(key)
  if (!can(user.role, config.readPermission)) throw forbidden()
  const { page, limit, skip } = pagination(sp)
  if (key === 'transportation-page') {
    const doc = await model.findOneAndUpdate(
      { key: 'transportation-page' },
      { $setOnInsert: DEFAULT_TRANSPORTATION_PAGE_CONTENT },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
    ).lean()
    return { items: [withResourceDefaults(key, plain<Record<string, unknown>>(doc))], total: 1, page: 1, limit }
  }
  if (key === 'accommodation-page') {
    const doc = await model.findOneAndUpdate(
      { key: 'accommodation-page' },
      { $setOnInsert: DEFAULT_ACCOMMODATION_PAGE_CONTENT },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
    ).lean()
    return { items: [withResourceDefaults(key, plain<Record<string, unknown>>(doc))], total: 1, page: 1, limit }
  }
  if (key === 'home-page') {
    const doc = await model.findOneAndUpdate(
      { key: 'home-page' },
      { $setOnInsert: DEFAULT_HOME_PAGE_CONTENT },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
    ).lean()
    return { items: [withResourceDefaults(key, plain<Record<string, unknown>>(doc))], total: 1, page: 1, limit }
  }
  if (key === 'why-choose-us-page') {
    const doc = await model.findOneAndUpdate(
      { key: 'why-choose-us-page' },
      { $setOnInsert: DEFAULT_WHY_CHOOSE_US_PAGE_CONTENT },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
    ).lean()
    return { items: [plain<Record<string, unknown>>(doc)], total: 1, page: 1, limit }
  }
  if (key === 'footprint-page') {
    const doc = await model.findOneAndUpdate(
      { key: 'footprint-page' },
      { $setOnInsert: DEFAULT_FOOTPRINT_PAGE_CONTENT },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
    ).lean()
    return { items: [withResourceDefaults(key, plain<Record<string, unknown>>(doc))], total: 1, page: 1, limit }
  }
  if (key === 'careers-page') {
    const initialContent = {
      key: 'careers-page',
      heroFeatures: [
        { icon: 'target', title: 'Purpose Driven', body: 'Making mobility smarter and more sustainable' },
        { icon: 'users', title: 'People First', body: 'Empowering talent and nurturing growth' },
        { icon: 'lightbulb', title: 'Innovation Led', body: 'Solving real-world problems with technology' },
        { icon: 'handshake', title: 'Inclusive Culture', body: 'Diversity, respect and equal opportunity for all' },
        { icon: 'chart-no-axes-combined', title: 'Impact at Scale', body: 'Millions of journeys. Countless possibilities.' },
      ],
      departments: [
        { slug: 'technology', title: 'Technology', description: 'Build scalable platforms and intelligent mobility solutions.', icon: 'code', sortOrder: 1, visible: true },
        { slug: 'operations', title: 'Operations', description: 'Ensure safe, reliable and efficient transportation operations.', icon: 'users', sortOrder: 2, visible: true },
        { slug: 'customer-experience', title: 'Customer Experience', description: 'Deliver exceptional experiences to our clients and passengers.', icon: 'headset', sortOrder: 3, visible: true },
        { slug: 'sales-business-development', title: 'Sales & Business Development', description: 'Drive growth and build lasting client partnerships.', icon: 'chart-no-axes-combined', sortOrder: 4, visible: true },
        { slug: 'corporate-functions', title: 'Corporate Functions', description: 'Power our mission through people, finance and strategy.', icon: 'file-text', sortOrder: 5, visible: true },
        { slug: 'internships', title: 'Internships', description: 'Kickstart your career with real-world learning and mentorship.', icon: 'graduation-cap', sortOrder: 6, visible: true },
      ],
      perks: [
        { icon: 'book-open', title: 'Learning & Growth', body: 'Continuous learning with training, certifications and mentorship.' },
        { icon: 'user-round', title: 'Work–Life Balance', body: 'Flexible schedules and wellness initiatives for a balanced life.' },
        { icon: 'award', title: 'Recognition & Rewards', body: 'Celebrate achievements and contributions that create impact.' },
        { icon: 'heart-pulse', title: 'Health & Wellbeing', body: 'Comprehensive health coverage and wellness programs.' },
        { icon: 'users-round', title: 'Diversity & Inclusion', body: 'An inclusive culture that values diverse perspectives and backgrounds.' },
        { icon: 'sprout', title: 'Purpose & Impact', body: 'Be part of a mission that drives sustainable mobility for a better tomorrow.' },
      ],
      testimonials: [
        { quote: 'GoAhead has given me the platform to solve meaningful problems and work with an amazing team that feels like family.', name: 'Neha Sharma', role: 'Product Manager', photo: '' },
        { quote: 'The learning opportunities and supportive leadership here help me push my limits and grow every day.', name: 'Arjun Mehta', role: 'Software Engineer', photo: '' },
        { quote: 'I love the purpose behind what we do. Knowing our work impacts millions of journeys is truly motivating.', name: 'Priya Nair', role: 'Operations Manager', photo: '' },
      ],
    }
    const doc = await model.findOneAndUpdate({ key: 'careers-page' }, { $setOnInsert: initialContent }, { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }).lean()
    return { items: [plain<Record<string, unknown>>(doc)], total: 1, page: 1, limit }
  }
  if (key === 'case-studies-page') {
    const initialContent = {
      key: 'case-studies-page', status: 'published', showHero: true, showHighlights: true, showFeatured: true, showFilters: true, showImpact: true, showTestimonial: true, showCta: true,
      heroEyebrow: 'CASE STUDIES', heroTitle: 'Real Challenges.', heroHighlight: 'Proven Impact.', heroTitleSuffix: 'Stronger Journeys.',
      heroDescription: 'Explore how leading organisations partner with GoAhead Mobility to solve complex transportation challenges and deliver measurable, sustainable results.',
      heroImage: '/images/site/home-hero.png', heroImageAlt: 'GoAhead Mobility coach travelling through a city at dusk',
      heroStats: [{ icon: 'briefcase', value: '250+', label: 'Successful Projects' }, { icon: 'chart', value: '15+', label: 'Industries Served' }, { icon: 'users', value: '12M+', label: 'Lives Connected Daily' }, { icon: 'shield', value: '98%', label: 'Client Satisfaction' }],
      featuredEyebrow: 'FEATURED CASE STUDY', featuredButtonLabel: 'View Full Story', listingTitle: 'All Case Studies', allStoriesLabel: 'All Stories', searchPlaceholder: 'Search case studies...',
      categories: [
        { slug: 'employee-transportation', label: 'Employee Transportation', icon: 'bus', sortOrder: 1, visible: true },
        { slug: 'airport-transfers', label: 'Airport Transfers', icon: 'plane', sortOrder: 2, visible: true },
        { slug: 'event-transportation', label: 'Event Transportation', icon: 'calendar', sortOrder: 3, visible: true },
        { slug: 'school-transportation', label: 'School Transportation', icon: 'users', sortOrder: 4, visible: true },
        { slug: 'sustainability', label: 'Sustainability', icon: 'heart', sortOrder: 5, visible: true },
        { slug: 'technology-driven', label: 'Technology Driven', icon: 'cpu', sortOrder: 6, visible: true },
      ],
      impactTitle: 'Impact That Drives Change', impactBody: 'Our data-driven approach delivers measurable results that create lasting value for our clients and their communities.',
      impactMetrics: [
        { icon: 'chart', value: '25%', label: 'Reduction in Operational Cost' }, { icon: 'chart', value: '30%', label: 'Increase in Operational Efficiency' },
        { icon: 'clock', value: '99.5%', label: 'On-time Performance' }, { icon: 'users', value: '12K+', label: 'Employees Impacted' },
        { icon: 'route', value: '50M+', label: 'Kilometers Driven Annually' }, { icon: 'bus', value: '1,000+', label: 'Modern Fleet Strength' },
      ],
      testimonialQuote: 'GoAhead Mobility has been a true partner in our growth journey. Their technology-driven approach, reliability, and commitment to safety have transformed our employee transportation experience.',
      testimonialName: 'Rohit Sharma', testimonialRole: 'Head – Administration, Global Manufacturing Company',
      testimonialVideoTitle: 'Client Success Video', testimonialVideoLabel: 'Explore the story', testimonialVideoPoster: '/images/site/ind-manufacturing.png',
      ctaTitle: 'Ready to create your success story?', ctaBody: 'Partner with GoAhead Mobility for tailored transportation solutions that drive efficiency, safety and satisfaction.',
      ctaButtonLabel: 'Request a Proposal', ctaButtonHref: '/contact',
      seoTitle: 'Case Studies | Real Challenges. Proven Impact. | GoAhead Mobility',
      seoDescription: 'Explore how organisations partner with GoAhead Mobility to solve complex transportation challenges and deliver measurable, sustainable results.',
      ogImage: '/images/site/home-hero.png', seoNoindex: false,
    }
    const doc = await model.findOneAndUpdate({ key: 'case-studies-page' }, { $setOnInsert: initialContent }, { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }).lean()
    return { items: [plain<Record<string, unknown>>(doc)], total: 1, page: 1, limit }
  }

  if (key === 'contact-page') {
    const initialContent = {
      key: 'contact-page',
      heroFeatures: [
        { icon: 'clock-3', title: 'Quick Response', body: 'We respond to your enquiry promptly.' },
        { icon: 'users-round', title: 'Expert Support', body: 'Speak with our mobility team.' },
        { icon: 'shield-check', title: 'Tailored Solutions', body: 'Support shaped around your needs.' },
      ],
      presenceMetrics: [
        { icon: 'map-pin', value: '120+', label: 'Cities' },
        { icon: 'building-2', value: '20+', label: 'States' },
        { icon: 'users-round', value: '5000+', label: 'Corporate Clients' },
        { icon: 'bus-front', value: '6500+', label: 'Fleet Strength' },
      ],
    }
    const doc = await model.findOneAndUpdate(
      { key: 'contact-page' },
      { $setOnInsert: initialContent },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
    ).lean()
    return { items: [plain<Record<string, unknown>>(doc)], total: 1, page: 1, limit }
  }
  if (key === 'faq-page') {
    const initialContent = {
      key: 'faq-page',
      heroFeatures: [
        { icon: 'messages-square', title: 'Quick Answers', body: 'Find answers fast' },
        { icon: 'headset', title: 'Expert Support', body: 'We’re here to help' },
        { icon: 'shield-check', title: 'Transparent Information', body: 'Clear & reliable details' },
        { icon: 'refresh-cw', title: 'Updated Frequently', body: 'Latest information always' },
      ],
      topics: [
        { category: 'services-solutions', title: 'Services & Solutions', description: 'Learn about our transportation services', icon: 'bus-front', sortOrder: 1, visible: true },
        { category: 'booking-operations', title: 'Booking & Operations', description: 'Booking process, scheduling & on-ground operations', icon: 'calendar-days', sortOrder: 2, visible: true },
        { category: 'safety-compliance', title: 'Safety & Compliance', description: 'Safety measures, policies and compliance standards', icon: 'shield-check', sortOrder: 3, visible: true },
        { category: 'technology-platform', title: 'Technology & Platform', description: 'Our technology, platform and integrations', icon: 'tablet-smartphone', sortOrder: 4, visible: true },
        { category: 'billing-payments', title: 'Billing & Payments', description: 'Invoices, payments and pricing related questions', icon: 'indian-rupee', sortOrder: 5, visible: true },
        { category: 'partnerships', title: 'Partnerships', description: 'Vendor registration, partnerships and collaborations', icon: 'handshake', sortOrder: 6, visible: true },
      ],
      helpFeatures: [
        { icon: 'headset', title: 'Talk to an Expert', body: 'Speak with our mobility experts for personalized assistance.' },
        { icon: 'mail-check', title: 'Email Support', body: 'We aim to respond to all emails within 24 hours.' },
        { icon: 'file-text', title: 'Submit a Request', body: 'Share your query and we’ll get back to you shortly.' },
      ],
    }
    const doc = await model.findOneAndUpdate(
      { key: 'faq-page' },
      { $setOnInsert: initialContent },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
    ).lean()
    return { items: [plain<Record<string, unknown>>(doc)], total: 1, page: 1, limit }
  }
  if (key === 'resource-centre-page') {
    const initialContent = {
      key: 'resource-centre',
      heroFeatures: [
        { icon: 'shield-check', title: 'Curated by Experts', body: 'Industry insights you can trust' },
        { icon: 'lightbulb', title: 'Practical & Actionable', body: 'Tools you can use right away' },
        { icon: 'sparkles', title: 'Always Updated', body: 'Latest trends and innovations' },
        { icon: 'clipboard-list', title: 'For Every Need', body: 'Guides, templates & more' },
      ],
      categories: [
        { slug: 'guides-playbooks', title: 'Guides & Playbooks', description: 'Step-by-step guides and best practices.', icon: 'book-open', sortOrder: 1, visible: true },
        { slug: 'whitepapers', title: 'Whitepapers', description: 'In-depth research and industry reports.', icon: 'file-text', sortOrder: 2, visible: true },
        { slug: 'case-studies', title: 'Case Studies', description: 'Real success stories from our customers.', icon: 'newspaper', sortOrder: 3, visible: true },
        { slug: 'templates', title: 'Templates', description: 'Ready-to-use templates and checklists.', icon: 'clipboard-list', sortOrder: 4, visible: true },
        { slug: 'reports-insights', title: 'Reports & Insights', description: 'Market trends and industry intelligence.', icon: 'chart-no-axes-combined', sortOrder: 5, visible: true },
        { slug: 'videos-webinars', title: 'Videos & Webinars', description: 'On-demand sessions and expert talks.', icon: 'file-video', sortOrder: 6, visible: true },
      ],
      requestFeatures: [
        { icon: 'shield-check', title: 'Custom Research', body: 'Tailored reports and insights for your business.' },
        { icon: 'users', title: 'Expert Consultation', body: 'Connect with our mobility experts.' },
        { icon: 'file-text', title: 'Resource Request', body: 'Tell us what you need and we’ll get it for you.' },
      ],
    }
    const doc = await model.findOneAndUpdate({ key: 'resource-centre' }, { $setOnInsert: initialContent }, { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }).lean()
    return { items: [plain<Record<string, unknown>>(doc)], total: 1, page: 1, limit }
  }
  if (key === 'about-page') {
    const initialContent = {
      key: 'about-us',
      heroBadges: [
        { icon: 'globe', label: 'Trusted by Businesses Worldwide' },
        { icon: 'layers', label: 'End-to-End Mobility Solutions' },
        { icon: 'users', label: 'People-Centric Service Approach' },
        { icon: 'shield-check', label: 'Safety, Compliance & Reliability' },
      ],
      metrics: [
        { icon: 'building', value: '1M+', label: 'Happy Corporate Clients' },
        { icon: 'globe', value: '150+', label: 'Cities Served' },
        { icon: 'clock', value: '99.6%', label: 'On-time Performance' },
      ],
      values: [
        { icon: 'users', title: 'Customer First', body: 'Our clients’ success is our success.' },
        { icon: 'shield-check', title: 'Integrity', body: 'We operate with honesty, transparency and respect.' },
        { icon: 'star', title: 'Excellence', body: 'We go the extra mile to deliver the best.' },
        { icon: 'lightbulb', title: 'Innovation', body: 'We embrace technology to create smarter solutions.' },
        { icon: 'handshake', title: 'Teamwork', body: 'We collaborate to achieve more together.' },
        { icon: 'leaf', title: 'Responsibility', body: 'We care for people, communities and our planet.' },
      ],
      milestones: [
        { icon: 'flag', year: '2010', description: 'GoAhead Mobility was founded.' },
        { icon: 'globe', year: '2013', description: 'Expanded accommodation network globally.' },
        { icon: 'car-front', year: '2016', description: 'Launched local transportation services.' },
        { icon: 'users', year: '2019', description: 'Reached 50+ countries and 1000+ corporate clients.' },
        { icon: 'monitor', year: '2022', description: 'Technology platform enhancements.' },
        { icon: 'rocket', year: '2024+', description: 'Continuing to innovate for the future.' },
      ],
    }
    const doc = await model.findOneAndUpdate(
      { key: 'about-us' },
      { $setOnInsert: initialContent },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
    ).lean()
    return { items: [plain<Record<string, unknown>>(doc)], total: 1, page: 1, limit }
  }
  const filter: Record<string, unknown> = {}
  const q = sp.get('q')?.trim().slice(0, 100)
  if (q && config.searchFields.length) {
    filter.$or = config.searchFields.map((f) => ({ [f]: { $regex: escapeRegex(q), $options: 'i' } }))
  }
  for (const f of config.filters ?? []) {
    const v = sp.get(f.key)
    if (v && f.options.some((o) => o.value === v)) filter[f.key] = v
  }
  const [items, total] = await Promise.all([
    model.find(filter).sort(config.defaultSort).skip(skip).limit(limit).lean(),
    model.countDocuments(filter),
  ])
  const rows = plain<Record<string, unknown>[]>(items)
  return { items: key === 'industries' ? rows.map((doc) => withResourceDefaults(key, doc)) : rows, total, page, limit }
}

export async function getResourceDoc(key: string, user: SessionUser, id: string) {
  const { config, model } = getResource(key)
  if (!can(user.role, config.readPermission)) throw forbidden()
  if (!isValidObjectId(id)) throw notFound(config.singular)
  const doc = await model.findById(id).lean()
  if (!doc) throw notFound(config.singular)
  return toForm(key, withResourceDefaults(key, plain(doc)))
}

export async function saveResource(key: string, user: SessionUser, body: unknown, id?: string) {
  const { config, model, hooks } = getResource(key)
  if (!can(user.role, config.writePermission)) throw forbidden()
  const singletonKey = key === 'footprint-page' ? 'footprint-page' : key === 'transportation-page' ? 'transportation-page' : key === 'accommodation-page' ? 'accommodation-page' : key === 'home-page' ? 'home-page' : key === 'about-page' ? 'about-us' : key === 'why-choose-us-page' ? 'why-choose-us-page' : key === 'resource-centre-page' ? 'resource-centre' : key === 'faq-page' ? 'faq-page' : key === 'contact-page' ? 'contact-page' : key === 'careers-page' ? 'careers-page' : key === 'case-studies-page' ? 'case-studies-page' : ''
  const singletonId = !id && singletonKey
    ? String((await model.findOne({ key: singletonKey }, '_id').lean<any>())?._id ?? '')
    : ''
  const targetId = id || singletonId || undefined
  let existing: Record<string, unknown> | null = null
  if (targetId) {
    if (!isValidObjectId(targetId)) throw notFound(config.singular)
    existing = plain(await model.findById(targetId).lean())
    if (!existing) throw notFound(config.singular)
  }
  const data = parseFields(config.fields, body, { partial: Boolean(id) })
  await hooks.beforeSave?.(data, { user, existing, config })

  let saved: Record<string, unknown>
  if (targetId) {
    saved = plain(await model.findByIdAndUpdate(targetId, { $set: data }, { returnDocument: 'after', runValidators: true }).lean())
  } else {
    const created = await model.create(data)
    saved = plain(created.toObject())
  }
  await hooks.afterSave?.(saved, { user, existing })
  if (existing) revalidateResource(key, existing, config)
  revalidateResource(key, saved, config)
  await audit({
    actor: user,
    action: targetId ? 'update' : 'create',
    entityType: key,
    entityId: String(saved._id),
    summary: `${targetId ? 'Updated' : 'Created'} ${config.singular} "${String(saved[config.titleField] ?? '')}"`,
    diff: existing ? diffFields(existing, data) : undefined,
  })
  return toForm(key, saved)
}

export async function deleteResource(key: string, user: SessionUser, id: string) {
  if (key === 'navigation') throw badRequest('Navigation menu records cannot be deleted. Edit the menu or hide individual links instead.')
  if (key === 'transportation-page') throw badRequest('The Local Transportation page is a singleton record and cannot be deleted.')
  if (key === 'accommodation-page') throw badRequest('The Global Accommodation page is a singleton record and cannot be deleted.')
  if (key === 'home-page') throw badRequest('The Home page is a singleton record and cannot be deleted.')
  if (key === 'footprint-page') throw badRequest('The Our Footprint page is a singleton record and cannot be deleted.')
  if (key === 'contact-page') throw badRequest('The Contact Us page is a singleton record and cannot be deleted. Archive it instead.')
  if (key === 'faq-page') throw badRequest('The FAQ page is a singleton record and cannot be deleted. Archive it instead.')
  if (key === 'about-page') throw badRequest('The About Us page is a singleton record and cannot be deleted. Archive it instead.')
  if (key === 'why-choose-us-page') throw badRequest('The Why Choose Us page is a singleton record and cannot be deleted. Archive it instead.')
  if (key === 'resource-centre-page') throw badRequest('The Resource Centre page is a singleton record and cannot be deleted. Archive it instead.')
  if (key === 'careers-page') throw badRequest('The Careers page is a singleton record and cannot be deleted. Archive it instead.')
  if (key === 'case-studies-page') throw badRequest('The Case Studies page is a singleton record and cannot be deleted. Archive it instead.')
  const { config, model } = getResource(key)
  if (!can(user.role, config.writePermission)) throw forbidden()
  if (!isValidObjectId(id)) throw notFound(config.singular)
  const doc = await model.findById(id).lean<Record<string, unknown>>()
  if (!doc) throw notFound(config.singular)
  if (config.statusField && doc[config.statusField] === 'published' && config.publishPermission && !can(user.role, config.publishPermission)) {
    throw badRequest('Only publishers can delete published items. Archive it instead.')
  }
  await model.deleteOne({ _id: id })
  revalidateResource(key, doc, config)
  await audit({ actor: user, action: 'delete', entityType: key, entityId: id, summary: `Deleted ${config.singular} "${String(doc[config.titleField] ?? '')}"` })
}
