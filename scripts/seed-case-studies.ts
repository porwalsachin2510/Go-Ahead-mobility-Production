/**
 * Seeds the Case Studies listing page and seven fully populated case studies (all six detail tabs).
 * Idempotent: records are upserted by slug/key. The two earlier thin placeholder studies are archived.
 * Run with `pnpm seed:case-studies`.
 */
import mongoose from 'mongoose'
import { connectDb } from '../lib/server/db'
import { CaseStudiesPageContent, CaseStudy } from '../lib/server/models/editorial'

const IMG = {
  featured: '/images/case-studies/featured-highway.png',
  command: '/images/case-studies/command-centre.png',
  lineup: '/images/case-studies/fleet-lineup.png',
  school: '/images/case-studies/school-transport.png',
  green: '/images/case-studies/green-fleet.png',
  ecommerce: '/images/case-studies/ecommerce-fleet.png',
  interior: '/images/case-studies/bus-interior.png',
  manufacturing: '/images/site/ind-manufacturing.png',
  it: '/images/site/ind-it.png',
  pharma: '/images/site/ind-healthcare.png',
  airport: '/images/site/tr-airport.png',
  bus: '/images/site/fleet-bus.png',
  planning: '/images/site/planning.png',
}

const RESULTS_INTRO = 'Outcomes are measured against an agreed baseline and reporting period using the performance framework defined during implementation. All figures shown are verified and approved by the client.'

type Spec = {
  slug: string; title: string; summary: string; heroSummary: string; category: string; cardLabel: string; industrySlugs: string[]
  industry: string; service: string; locationLabel: string; fleetSize: string; projectDuration: string; employeesImpacted: string
  image: string; heroImage: string; featured?: boolean; sortOrder: number; vertical?: string
  clientDescriptor: string; overviewBody: string
  overviewStats: { icon: string; value: string; label: string }[]
  challengeIntro: string; challenges: { icon: string; title: string; body: string }[]
  glance: { icon: string; value: string; label: string }[]
  approachIntro: string; implementationBullets: string[]
  metrics: { icon: string; value: string; label: string }[]
  results: { icon: string; title: string; description: string; baseline: string; measuredOutcome: string; evidence: string }[]
  quote: string; quoteRole: string; challengeQuote: string; approachQuote: string
  implementationImage: string; bannerImage: string; galleryImages: string[]
}

function build(s: Spec) {
  const role = s.quoteRole
  const company = s.clientDescriptor
  return {
    title: s.title, clientName: '', anonymized: true, clientApproved: true, vertical: s.vertical || 'transport',
    category: s.category, cardLabel: s.cardLabel, locationLabel: s.locationLabel, fleetSize: s.fleetSize,
    projectDuration: s.projectDuration, employeesImpacted: s.employeesImpacted, featured: Boolean(s.featured), sortOrder: s.sortOrder,
    industrySlugs: s.industrySlugs, summary: s.summary, image: s.image, status: 'published',
    challenge: s.challengeIntro, approach: s.approachIntro, outcome: RESULTS_INTRO,
    deliveryModel: 'Managed programme with dedicated fleet, command centre and on-ground supervision',
    results: s.metrics.map((m) => ({ label: m.label, value: m.value })),
    evidenceNote: 'Figures reflect the client-approved reporting period. Individual results vary with scope, geography and operating model.',
    disclaimer: 'Client identity is anonymised at the client\u2019s request. Details are published with written approval.',

    heroEyebrow: 'CASE STUDY', heroImage: s.heroImage, heroImageAlt: `GoAhead Mobility vehicle serving a ${s.industry.toLowerCase()} client`, serviceName: s.service,

    overviewHeading: 'Client Background', overviewBody: s.overviewBody, overviewStats: s.overviewStats,
    overviewChallengeHeading: 'The Challenge',
    overviewChallengeIntro: 'The client faced multiple transportation challenges that impacted operational efficiency, employee satisfaction and overall costs.',
    overviewChallengeItems: s.challenges.slice(0, 5).map((c) => ({ title: c.title })),
    overviewChallengeImage: IMG.lineup, overviewChallengeImageAlt: 'Row of GoAhead Mobility staff buses parked at a client campus',
    overviewApproachHeading: 'Our Approach',
    overviewApproachIntro: 'GoAhead Mobility designed a comprehensive, technology-enabled transportation solution tailored to the client\u2019s requirements.',
    overviewApproachItems: [
      { icon: 'clipboard-check', title: 'Consult & Analyze', body: 'In-depth assessment of existing operations, employee needs and location complexities.' },
      { icon: 'route', title: 'Design & Optimize', body: 'Optimised routes, schedules and deployments to improve efficiency and reduce cost.' },
      { icon: 'monitor', title: 'Technology Enablement', body: 'Our proprietary platform for real-time tracking, alerts and analytics.' },
      { icon: 'shield-check', title: 'Safety & Compliance', body: 'Trained drivers, standardised processes and strict compliance protocols.' },
      { icon: 'trending-up', title: 'Continuous Improvement', body: 'Ongoing monitoring, feedback loops and data-driven improvements for long-term success.' },
    ],
    overviewImplementationHeading: 'Implementation Highlights',
    overviewImplementationIntro: 'A phased roll-out ensured a seamless transition and minimal disruption to daily operations.',
    overviewImplementationBullets: s.implementationBullets,
    overviewImplementationImage: IMG.command, overviewImplementationImageAlt: 'GoAhead Mobility command centre monitoring live routes',
    overviewImpactHeading: 'Impact & Results', overviewMetrics: s.metrics,
    galleryItems: s.galleryImages.map((image, i) => ({ image, alt: `${s.cardLabel} programme photograph ${i + 1}`, caption: '' })),
    overviewQuote: s.quote, overviewQuoteAuthor: role, overviewQuoteRole: company,
    relatedHeading: 'Related Case Studies',

    challengeEyebrow: 'THE CHALLENGE', challengeTitle: 'The Challenge', challengeIntro: s.challengeIntro,
    challengeItems: s.challenges, challengeGlanceItems: s.glance,
    challengeQuote: s.challengeQuote, challengeQuoteAuthor: role, challengeQuoteRole: company,
    challengeImpactTitle: 'The impact of these challenges',
    challengeImpactItems: [
      { icon: 'receipt', title: 'Increased operational expenses' },
      { icon: 'users', title: 'Lower employee satisfaction' },
      { icon: 'clock', title: 'Higher travel time & delays' },
      { icon: 'shield', title: 'Safety & compliance concerns' },
      { icon: 'activity', title: 'Limited scalability for future growth' },
    ],

    approachEyebrow: 'OUR APPROACH', approachTitle: 'A Strategic, Technology-Driven Approach', approachIntro: s.approachIntro,
    approachSteps: [
      { icon: 'eye', number: '01', title: 'Understand', body: 'We assessed existing operations, commute patterns and pain points across every location.' },
      { icon: 'lightbulb', number: '02', title: 'Design', body: 'We designed optimised routes, defined SLAs and built a solution aligned with business objectives.' },
      { icon: 'monitor', number: '03', title: 'Enable', body: 'We deployed our technology stack for real-time visibility, communication and intelligent automation.' },
      { icon: 'route', number: '04', title: 'Operate', body: 'We executed with discipline: seamless daily operations, driver management and adherence to SLAs.' },
      { icon: 'trending-up', number: '05', title: 'Optimize', body: 'We continuously analyse data and feedback to improve performance and drive ongoing value.' },
    ],
    approachActionTitle: 'Our Approach in Action',
    approachActions: [
      { icon: 'handshake', title: 'Consult & Assess', body: 'Engaged stakeholders to understand challenges, employee needs and operational constraints across all locations.' },
      { icon: 'map', title: 'Route Planning & Optimization', body: 'Designed efficient routes using AI-powered tools to minimise travel time, distance and no-show rates.' },
      { icon: 'monitor', title: 'Technology Enablement', body: 'Deployed our platform for real-time tracking, automated attendance, alerts and analytics.' },
      { icon: 'shield-check', title: 'Safety & Compliance', body: 'Implemented strict safety protocols, driver training, vehicle checks and compliance monitoring.' },
      { icon: 'heart', title: 'People-Centric Experience', body: 'Introduced communication channels, feedback loops and support systems to lift satisfaction.' },
    ],
    approachImage: IMG.command, approachImageAlt: 'Operators monitoring live fleet movements in the GoAhead command centre',
    approachEnablersTitle: 'Key Enablers',
    approachEnablers: [
      { icon: 'monitor', title: 'Proprietary Mobility Management Platform' },
      { icon: 'route', title: 'AI-Powered Route Optimization' },
      { icon: 'navigation', title: 'Real-Time Vehicle Tracking & Alerts' },
      { icon: 'bar-chart', title: 'Data-Driven Decision Making' },
      { icon: 'headset', title: '24/7 Command & Control Center' },
    ],
    approachWhyTitle: 'Why This Approach Works',
    approachWhyItems: [
      { icon: 'users', title: 'Customer First', body: 'Solutions designed around employee convenience and client goals.' },
      { icon: 'monitor', title: 'Technology Led', body: 'Advanced technology ensures visibility, efficiency and continuous improvement.' },
      { icon: 'shield-check', title: 'Safety Focused', body: 'Safety embedded in every process, ensuring peace of mind.' },
      { icon: 'activity', title: 'Scalable & Flexible', body: 'Solutions built to scale across locations and evolve with needs.' },
    ],
    approachQuote: s.approachQuote, approachQuoteAuthor: role, approachQuoteRole: company,

    implementationEyebrow: 'IMPLEMENTATION', implementationTitle: 'Turning the operating model into a coordinated rollout',
    implementationIntro: 'Implementation is where planning becomes day-to-day execution. Our phased framework brings together routes, fleet, people and technology to deliver a reliable and safe transport programme across every location.',
    implementationBody: 'Milestones, systems and timelines were agreed with the client at each stage, with clear go/no-go checkpoints before every site went live.',
    implementationImage: s.implementationImage, implementationImageAlt: 'GoAhead Mobility team planning the rollout on a live route dashboard',
    implementationTimelineTitle: 'A phased approach to implementation',
    implementationPhases: [
      { number: '01', title: 'Validate requirements', body: 'Confirm operating locations, pick-up and drop areas, shift windows, volumes, accessibility and safety expectations.' },
      { number: '02', title: 'Configure the service model', body: 'Define routes, stops, schedules, fleet and vendor requirements, dispatch responsibilities and escalation paths.' },
      { number: '03', title: 'Prepare and launch', body: 'Coordinate approved drivers and vehicles, brief users, validate readiness and begin service in agreed stages.' },
      { number: '04', title: 'Monitor and refine', body: 'Review service feedback, operational reporting and agreed performance measures, then adjust routes and schedules.' },
    ],
    implementationRolloutTitle: 'What the rollout brings together',
    implementationRolloutItems: [
      { icon: 'route', title: 'Route & schedule planning', body: 'Optimised routes and stop structures aligned to shift timings, locations and convenience.' },
      { icon: 'users', title: 'Fleet, driver & vendor coordination', body: 'The right fleet mix, trained drivers and vendor management to meet service expectations.' },
      { icon: 'shield-check', title: 'Safety, accessibility & communication', body: 'Safety-first operating standards, inclusive access and clear communication for riders.' },
      { icon: 'bar-chart', title: 'Reporting, review & continuous improvement', body: 'Operational reporting, reviews and continuous improvements to enhance reliability.' },
    ],
    implementationBannerImage: s.bannerImage, implementationBannerAlt: 'GoAhead Mobility fleet lined up ahead of service launch',
    implementationCaption: 'Fleet deployed for the programme launch.',
    implementationHandoverTitle: 'Operational handover',
    implementationHandoverBody: 'A structured handover ensured continuity and clarity across people, processes and systems.',
    implementationHandoverItems: [
      { title: 'Agreed operating plan and route schedules' },
      { title: 'Roles and escalation ownership' },
      { title: 'Driver and vehicle readiness checks' },
      { title: 'Rider communication and feedback route' },
      { title: 'Reporting cadence and review ownership' },
    ],
    implementationPrinciplesTitle: 'Implementation principles',
    implementationPrinciples: [
      { icon: 'flag', title: 'Staged rollout', body: 'Execute in phases with clear milestones.' },
      { icon: 'users', title: 'Clear ownership', body: 'Defined roles and accountability at every step.' },
      { icon: 'file-check', title: 'Evidence-led review', body: 'Use data and feedback to improve continuously.' },
    ],
    implementationCtaTitle: 'Planning a multi-site transport programme?',
    implementationCtaBody: 'Let\u2019s discuss how our approach, people and technology can support your organisation\u2019s mobility goals.',
    implementationCtaLabel: 'Discuss Your Requirements', implementationCtaHref: '/contact',

    resultsTitle: 'Results that matter', resultsIntro: RESULTS_INTRO, resultRows: s.results,
    resultsMeasurementTitle: 'How results are measured',
    resultsMeasurementSteps: [
      { number: '01', title: 'Establish baseline', body: 'Agree the baseline across key performance areas and data sources.' },
      { number: '02', title: 'Review agreed reporting period', body: 'Collect and analyse data for the approved reporting period.' },
      { number: '03', title: 'Validate and approve outcomes', body: 'Validate results with the client and approve figures for publication.' },
    ],
    resultsEvidenceTitle: 'Evidence & client validation',
    resultsEvidenceIntro: 'Only client-approved figures and claims are published.',
    resultsEvidenceItems: [
      { icon: 'file-text', title: 'Source documentation', body: 'Operational reports, system exports, attendance data, route performance logs and vendor reports.', status: 'Verified' },
      { icon: 'monitor', title: 'Measurement context', body: 'Baseline definitions, reporting period, inclusion criteria and measurement methodology.', status: 'Verified' },
      { icon: 'shield-check', title: 'Publication approval', body: 'All results and claims were reviewed and approved by the client before publication.', status: 'Approved' },
    ],
    resultsQuote: s.quote, resultsQuoteAuthor: role, resultsQuoteRole: company,
    resultsOperationsTitle: 'What changed operationally',
    resultsOperationsChanges: [
      { icon: 'users', title: 'Clearer coordination', body: 'Stronger alignment across operations, drivers, vendors and internal teams for smooth daily execution.' },
      { icon: 'clipboard-list', title: 'More consistent operating reviews', body: 'Regular performance reviews enable timely adjustments and continuous service improvement.' },
      { icon: 'bar-chart', title: 'Better visibility of agreed measures', body: 'Improved visibility into performance supports better decision-making and planning.' },
    ],
    resultsCtaTitle: 'Want measurable clarity across your transport operations?',
    resultsCtaBody: 'Let\u2019s build a solution that delivers reliable, safe and efficient mobility.',
    resultsCtaLabel: 'Request a Proposal', resultsCtaHref: '/contact',

    testimonialEyebrow: 'CLIENT PERSPECTIVE', testimonialTitle: 'The people behind the programme',
    testimonialIntro: 'The client\u2019s perspective on coordination, service experience and the operational change delivered through the programme.',
    detailTestimonialQuote: s.quote, detailTestimonialName: role, detailTestimonialRole: role, detailTestimonialCompany: company, detailTestimonialAvatar: '',
    testimonialTopicsTitle: 'What the client highlighted',
    testimonialTopics: [
      { icon: 'users', title: 'Day-to-day coordination', body: 'How planning, communication and on-ground coordination supported smooth operations.' },
      { icon: 'bus', title: 'Commute experience', body: 'The impact on reliability, comfort, safety and the overall rider experience.' },
      { icon: 'monitor', title: 'Operational visibility', body: 'How visibility, reporting and feedback improved decision-making and responsiveness.' },
      { icon: 'handshake', title: 'Working partnership', body: 'The value of collaboration, responsiveness and a shared focus on continuous improvement.' },
    ],
    testimonialImage: s.image, testimonialImageAlt: `GoAhead Mobility vehicle at the ${s.industry.toLowerCase()} client site`,
    testimonialPerspectiveTitle: 'A perspective grounded in the project',
    testimonialPerspectiveBody: 'This testimonial reflects the client\u2019s experience throughout the journey, from the initial challenge and agreed approach through to implementation and measurable results.\n\nAll project-specific claims, observations and outcomes are supported by approved evidence and documented in this case study.\n\nThe client\u2019s voice brings to life the impact of a partnership designed around people, safety and operational excellence.',
    testimonialLinksTitle: 'More from this case study',
    testimonialLinks: [
      { icon: 'activity', title: 'The Challenge', href: '#challenge' },
      { icon: 'lightbulb', title: 'Our Approach', href: '#approach' },
      { icon: 'bar-chart', title: 'Results', href: '#results' },
    ],
    testimonialCtaTitle: 'Building a better transport experience?',
    testimonialCtaBody: 'Let\u2019s discuss your requirements and explore how our people, technology and operating model can support your organisation.',
    testimonialCtaLabel: 'Request a Proposal', testimonialCtaHref: '/contact',

    seo: {
      title: `${s.title} | Case Study | GoAhead Mobility`.slice(0, 70),
      description: s.summary.slice(0, 160),
      ogImage: s.heroImage,
    },
  }
}

const standardChallenges = (extra: { icon: string; title: string; body: string }[] = []) => [
  { icon: 'activity', title: 'Fragmented Operations', body: 'Transportation was managed by multiple vendors with different processes and service standards, leading to inconsistency and a lack of accountability across locations.' },
  { icon: 'bar-chart', title: 'High Operational Costs', body: 'Inefficient routing, low vehicle utilisation and manual processes resulted in unnecessary fuel consumption, overtime costs and poor cost control.' },
  { icon: 'map-pin', title: 'Low Route Efficiency', body: 'Routes were not optimised for actual demand patterns, causing longer travel times, delays and higher no-show rates.' },
  { icon: 'eye', title: 'Limited Visibility & Data', body: 'A lack of real-time tracking and centralised dashboards made it difficult to monitor performance, ensure compliance and make data-driven decisions.' },
  { icon: 'shield', title: 'Safety & Compliance Risks', body: 'Inconsistent safety practices, driver behaviour and vehicle conditions increased the risk of incidents and impacted rider trust.' },
  ...extra,
]

const SPECS: Spec[] = [
  {
    slug: 'global-manufacturing-employee-transportation', featured: true, sortOrder: 1,
    title: 'Transforming Employee Transportation for a Global Manufacturing Leader',
    summary: 'A comprehensive mobility solution that streamlined daily commutes for 12,000+ employees across 18 locations, improving efficiency, safety and satisfaction at scale.',
    heroSummary: '', category: 'employee-transportation', cardLabel: 'Manufacturing', industrySlugs: ['manufacturing'],
    industry: 'Manufacturing', service: 'Employee Transportation', locationLabel: 'Pan India', fleetSize: '650+ Vehicles', projectDuration: '36 Months', employeesImpacted: '12,000+',
    image: IMG.featured, heroImage: IMG.bus,
    clientDescriptor: 'Global Manufacturing Company', quoteRole: 'Head \u2013 Administration',
    overviewBody: 'Our client is a leading global manufacturing organisation with a strong presence across India. With a diverse workforce of over 12,000 employees, the organisation needed a reliable and scalable transportation partner to ensure safe, efficient and cost-effective daily commutes.',
    overviewStats: [
      { icon: 'users', value: '12,000+', label: 'Employees' }, { icon: 'map-pin', value: '18+', label: 'Locations' },
      { icon: 'bus', value: '650+', label: 'Vehicles Deployed' }, { icon: 'headset', value: '24/7', label: 'Operations Support' },
    ],
    challengeIntro: 'The client\u2019s transportation ecosystem was struggling to keep up with its scale, locations and operational complexity. Multiple pain points were impacting efficiency, safety and employee satisfaction.',
    challenges: standardChallenges([{ icon: 'users', title: 'Employee Experience', body: 'Unreliable pickups, delays and a lack of real-time communication negatively impacted employee satisfaction and productivity.' }]),
    glance: [
      { icon: 'map-pin', value: '18+', label: 'Locations Across India' }, { icon: 'users', value: '12,000+', label: 'Employees Commuting Daily' },
      { icon: 'bus', value: '650+', label: 'Vehicles in Operation' }, { icon: 'route', value: '120+', label: 'Routes Managed' },
      { icon: 'file-check', value: 'Multiple', label: 'Vendors & Contracts' }, { icon: 'gauge', value: 'High', label: 'Operational Complexity' },
    ],
    challengeQuote: 'We needed a single partner who could bring structure, visibility and consistency to our employee transportation while improving safety and reducing costs.',
    approachIntro: 'We designed a comprehensive mobility solution tailored to the client\u2019s needs. Our approach combines deep domain expertise, advanced technology and a strong focus on safety and employee experience.',
    approachQuote: 'GoAhead Mobility\u2019s structured approach and technology focus gave us complete visibility and control over our transportation operations while significantly improving the employee commute experience.',
    implementationBullets: ['Deployed 650+ GPS-enabled vehicles across 18+ locations', 'Onboarded and trained 1,200+ professional drivers', 'Integrated a centralised command centre for real-time monitoring', 'Customised mobile app for employees with live tracking', '24/7 control room and on-ground support teams'],
    metrics: [
      { icon: 'receipt', value: '28%', label: 'Reduction in Operational Costs' }, { icon: 'route', value: '35%', label: 'Increase in Route Efficiency' },
      { icon: 'clock', value: '99.6%', label: 'On-time Performance Achieved' }, { icon: 'heart', value: '95%', label: 'Employee Satisfaction Score' },
      { icon: 'shield', value: '0', label: 'Safety Incidents Reported' },
    ],
    results: [
      { icon: 'route', title: 'Route & Schedule Reliability', description: 'More dependable routes and schedules that reduce variability and improve adherence to agreed service levels.', baseline: '91.2% on-time', measuredOutcome: '99.6% on-time', evidence: 'Platform trip logs, 12-month period' },
      { icon: 'bus', title: 'Fleet & Vehicle Utilisation', description: 'Better alignment of fleet deployment and vehicle usage to support demand and minimise idle time.', baseline: '62% seat utilisation', measuredOutcome: '84% seat utilisation', evidence: 'Route occupancy reports' },
      { icon: 'receipt', title: 'Operating Cost Control', description: 'Improved cost discipline through optimised planning, scheduling and vendor management.', baseline: 'FY baseline spend', measuredOutcome: '28% lower cost per trip', evidence: 'Client finance reconciliation' },
      { icon: 'users', title: 'Employee Experience', description: 'A smoother, more comfortable daily commute that supports employee satisfaction and productivity.', baseline: '71% satisfaction', measuredOutcome: '95% satisfaction', evidence: 'Quarterly employee survey' },
      { icon: 'shield-check', title: 'Safety & Compliance', description: 'Strengthened safety culture and compliance oversight across people, processes and vehicles.', baseline: '7 reportable incidents', measuredOutcome: '0 reportable incidents', evidence: 'Client EHS incident register' },
    ],
    quote: 'GoAhead Mobility has been a true partner in our growth journey. Their proactive approach, technology-driven solutions and commitment to safety have transformed our employee transportation experience.',
    implementationImage: IMG.command, bannerImage: IMG.lineup, galleryImages: [IMG.bus, IMG.lineup, IMG.interior, IMG.manufacturing],
  },
  {
    slug: 'it-services-smart-mobility', sortOrder: 2,
    title: 'Smart Mobility Solution for a Leading IT Services Company',
    summary: 'Designed a tech-enabled commute solution for 8,000+ employees with real-time tracking and dynamic routing.',
    heroSummary: '', category: 'technology-driven', cardLabel: 'IT & ITES', industrySlugs: ['technology'],
    industry: 'IT Services', service: 'Employee Transportation', locationLabel: 'Bengaluru, India', fleetSize: '420+ Vehicles', projectDuration: '24 Months', employeesImpacted: '8,000+',
    image: IMG.it, heroImage: IMG.it, clientDescriptor: 'Leading IT Services Company', quoteRole: 'Director \u2013 Facilities & Workplace',
    overviewBody: 'Our client is one of India\u2019s leading IT services companies with large delivery campuses in Bengaluru. Running 24/7 shifts for global clients, the company needed a commute programme that could flex with dynamic rosters, keep night-shift employees safe and give the facilities team full visibility.',
    overviewStats: [
      { icon: 'users', value: '8,000+', label: 'Employees' }, { icon: 'map-pin', value: '4', label: 'Campuses' },
      { icon: 'bus', value: '420+', label: 'Vehicles Deployed' }, { icon: 'clock', value: '3', label: 'Shifts Daily' },
    ],
    challengeIntro: 'Rapidly changing shift rosters and Bengaluru traffic made fixed routes unreliable, while night-shift safety requirements demanded tighter controls and real-time oversight.',
    challenges: standardChallenges([{ icon: 'clock', title: 'Dynamic Rosters', body: 'Rosters changed daily for client projects, and manual route planning could not keep up, causing missed pickups and late logins.' }]),
    glance: [
      { icon: 'map-pin', value: '4', label: 'Delivery Campuses' }, { icon: 'users', value: '8,000+', label: 'Employees Commuting Daily' },
      { icon: 'bus', value: '420+', label: 'Vehicles in Operation' }, { icon: 'route', value: '310+', label: 'Dynamic Routes Daily' },
      { icon: 'clock', value: '24/7', label: 'Shift Operations' }, { icon: 'shield', value: 'High', label: 'Night-shift Safety Need' },
    ],
    challengeQuote: 'Our rosters change every day. We needed a partner whose routing could change just as fast, without compromising the safety of our people on night shifts.',
    approachIntro: 'We combined roster-integrated dynamic routing, women-safety protocols and a live command centre so every trip is planned automatically and monitored end to end.',
    approachQuote: 'The roster integration changed everything. Routes now build themselves overnight and our facilities team finally has one live view of every cab and shuttle.',
    implementationBullets: ['Integrated HRMS rosters for automated nightly route generation', 'Deployed 420+ GPS and panic-button equipped vehicles', 'Introduced escort and last-drop safety protocols for night shifts', 'Launched employee app with live ETA, OTP boarding and SOS', 'Set up a campus help desk and 24/7 control room'],
    metrics: [
      { icon: 'receipt', value: '22%', label: 'Reduction in Cost per Seat' }, { icon: 'route', value: '31%', label: 'Fewer Vehicle Kilometres' },
      { icon: 'clock', value: '99.2%', label: 'On-time Logins' }, { icon: 'heart', value: '93%', label: 'Employee Satisfaction' },
      { icon: 'shield', value: '100%', label: 'Night Trips Tracked Live' },
    ],
    results: [
      { icon: 'route', title: 'Route & Schedule Reliability', description: 'Roster-driven routing reduced missed pickups and late logins across all shifts.', baseline: '89% on-time logins', measuredOutcome: '99.2% on-time logins', evidence: 'Access-control and trip logs' },
      { icon: 'bus', title: 'Fleet & Vehicle Utilisation', description: 'Dynamic pooling matched vehicle size to real demand each shift.', baseline: '58% seat utilisation', measuredOutcome: '81% seat utilisation', evidence: 'Route occupancy reports' },
      { icon: 'receipt', title: 'Operating Cost Control', description: 'Fewer dead kilometres and right-sized vehicles lowered cost per seat.', baseline: 'Prior-year cost per seat', measuredOutcome: '22% lower cost per seat', evidence: 'Client finance reconciliation' },
      { icon: 'users', title: 'Employee Experience', description: 'Live ETAs and OTP boarding removed waiting uncertainty.', baseline: '68% satisfaction', measuredOutcome: '93% satisfaction', evidence: 'Bi-annual employee survey' },
      { icon: 'shield-check', title: 'Safety & Compliance', description: 'Every night trip monitored live with escort and last-drop compliance.', baseline: 'Partial tracking', measuredOutcome: '100% of night trips tracked', evidence: 'Command centre audit report' },
    ],
    quote: 'GoAhead Mobility brought real technology to our commute. Routing is automatic, our night-shift teams feel safe, and we have the data to make better decisions every month.',
    implementationImage: IMG.planning, bannerImage: IMG.lineup, galleryImages: [IMG.it, IMG.command, IMG.interior, IMG.lineup],
  },
  {
    slug: 'pharma-safe-compliant-transport', sortOrder: 3,
    title: 'Ensuring Safe & Compliant Transport for a Pharma Giant',
    summary: 'Implemented a safe, compliant and reliable transport system across multiple shifts and locations.',
    heroSummary: '', category: 'employee-transportation', cardLabel: 'Pharmaceuticals', industrySlugs: ['healthcare'],
    industry: 'Pharmaceuticals', service: 'Employee Transportation', locationLabel: 'Hyderabad, India', fleetSize: '180+ Vehicles', projectDuration: '30 Months', employeesImpacted: '5,500+',
    image: IMG.pharma, heroImage: IMG.pharma, clientDescriptor: 'Global Pharmaceutical Company', quoteRole: 'Head \u2013 Plant Administration',
    overviewBody: 'Our client is a global pharmaceutical manufacturer operating GMP-regulated plants and R&D centres around Hyderabad. With round-the-clock production, employee transport had to meet strict audit, hygiene and safety standards while keeping shift changeovers on time.',
    overviewStats: [
      { icon: 'users', value: '5,500+', label: 'Employees' }, { icon: 'map-pin', value: '6', label: 'Plants & R&D Sites' },
      { icon: 'bus', value: '180+', label: 'Vehicles Deployed' }, { icon: 'shield', value: '100%', label: 'Audit Compliance' },
    ],
    challengeIntro: 'Regulatory audits demanded documented safety and hygiene standards that the previous vendors could not evidence, and late shift changeovers directly affected production schedules.',
    challenges: standardChallenges([{ icon: 'file-check', title: 'Audit Readiness', body: 'Vehicle fitness, driver credentials and sanitisation records were scattered across vendors, making audit preparation slow and risky.' }]),
    glance: [
      { icon: 'map-pin', value: '6', label: 'Plants & R&D Sites' }, { icon: 'users', value: '5,500+', label: 'Employees Commuting Daily' },
      { icon: 'bus', value: '180+', label: 'Vehicles in Operation' }, { icon: 'route', value: '95+', label: 'Routes Managed' },
      { icon: 'file-check', value: 'GMP', label: 'Regulated Environment' }, { icon: 'clock', value: '3', label: 'Shift Changeovers Daily' },
    ],
    challengeQuote: 'In a regulated plant, transport is part of our compliance story. We needed a partner who documents everything and never misses a shift changeover.',
    approachIntro: 'We built a compliance-first operating model with digital vehicle and driver records, sanitisation logs and changeover-timed routes so every trip is audit-ready.',
    approachQuote: 'Audit preparation for transport now takes hours instead of weeks. Every record is digital, current and verified.',
    implementationBullets: ['Digitised vehicle fitness, permits and driver credential records', 'Introduced daily sanitisation checklists with photo evidence', 'Timed routes to production shift changeovers at each plant', 'Deployed 180+ GPS-tracked vehicles with speed governance', 'Monthly compliance reviews with plant EHS teams'],
    metrics: [
      { icon: 'shield', value: '100%', label: 'Audit Compliance Achieved' }, { icon: 'clock', value: '99.4%', label: 'On-time Shift Arrivals' },
      { icon: 'receipt', value: '18%', label: 'Reduction in Transport Cost' }, { icon: 'heart', value: '94%', label: 'Employee Satisfaction' },
      { icon: 'shield-check', value: '0', label: 'Safety Incidents Reported' },
    ],
    results: [
      { icon: 'route', title: 'Route & Schedule Reliability', description: 'Changeover-timed routes kept production shifts fully staffed on time.', baseline: '92% on-time arrivals', measuredOutcome: '99.4% on-time arrivals', evidence: 'Plant access logs' },
      { icon: 'bus', title: 'Fleet & Vehicle Utilisation', description: 'Consolidated vendors and right-sized vehicles reduced idle capacity.', baseline: '64% utilisation', measuredOutcome: '82% utilisation', evidence: 'Route occupancy reports' },
      { icon: 'receipt', title: 'Operating Cost Control', description: 'Vendor consolidation and optimised routing lowered total spend.', baseline: 'Prior-year spend', measuredOutcome: '18% lower spend', evidence: 'Client finance reconciliation' },
      { icon: 'users', title: 'Employee Experience', description: 'Clean, punctual and comfortable vehicles improved daily commutes.', baseline: '74% satisfaction', measuredOutcome: '94% satisfaction', evidence: 'Employee survey' },
      { icon: 'shield-check', title: 'Safety & Compliance', description: 'Full digital records and zero reportable incidents across all sites.', baseline: '82% audit score', measuredOutcome: '100% audit compliance', evidence: 'Client EHS audit reports' },
    ],
    quote: 'GoAhead Mobility understands regulated environments. Their documentation, discipline and safety record have made transport one of the most dependable parts of our operations.',
    implementationImage: IMG.planning, bannerImage: IMG.lineup, galleryImages: [IMG.pharma, IMG.lineup, IMG.interior, IMG.bus],
  },
  {
    slug: 'ecommerce-scaling-transportation', sortOrder: 4,
    title: 'Scaling Transportation for Rapid Business Growth',
    summary: 'Helped an e-commerce leader scale their transportation operations to support exponential growth.',
    heroSummary: '', category: 'employee-transportation', cardLabel: 'E-commerce', industrySlugs: ['consulting'],
    industry: 'E-commerce', service: 'Employee Transportation', locationLabel: 'Delhi NCR, India', fleetSize: '300+ Vehicles', projectDuration: '18 Months', employeesImpacted: '9,000+',
    image: IMG.ecommerce, heroImage: IMG.ecommerce, clientDescriptor: 'Leading E-commerce Company', quoteRole: 'VP \u2013 Fulfilment Operations',
    overviewBody: 'Our client is a fast-growing e-commerce company operating large fulfilment centres across Delhi NCR. Peak sale seasons can triple the workforce within weeks, so the company needed transport that scales up and down without losing reliability.',
    overviewStats: [
      { icon: 'users', value: '9,000+', label: 'Associates' }, { icon: 'map-pin', value: '7', label: 'Fulfilment Centres' },
      { icon: 'bus', value: '300+', label: 'Vehicles at Peak' }, { icon: 'trending-up', value: '3x', label: 'Peak Season Scale' },
    ],
    challengeIntro: 'Seasonal peaks overwhelmed local vendors, leaving associates stranded at shift change and putting delivery promises at risk during the most important weeks of the year.',
    challenges: standardChallenges([{ icon: 'trending-up', title: 'Peak Season Surges', body: 'Workforce volumes tripled during sale events, and the existing vendor base could not add vehicles or drivers fast enough.' }]),
    glance: [
      { icon: 'map-pin', value: '7', label: 'Fulfilment Centres' }, { icon: 'users', value: '9,000+', label: 'Associates at Peak' },
      { icon: 'bus', value: '300+', label: 'Vehicles at Peak' }, { icon: 'route', value: '140+', label: 'Routes Managed' },
      { icon: 'trending-up', value: '3x', label: 'Seasonal Volume Swing' }, { icon: 'clock', value: '4', label: 'Shifts Daily' },
    ],
    challengeQuote: 'During big sale weeks every missed shift costs us deliveries. We needed transport that could triple overnight and still run on time.',
    approachIntro: 'We created an elastic fleet model with pre-contracted surge capacity, demand forecasting from hiring plans and a dedicated peak-season control desk.',
    approachQuote: 'For the first time our transport scaled with our business. Peak season ran as smoothly as an ordinary week.',
    implementationBullets: ['Built a surge pool of pre-verified vehicles and drivers', 'Linked hiring forecasts to fleet planning six weeks ahead', 'Deployed shift-change marshals at every fulfilment centre', 'Introduced live boarding dashboards for site leaders', 'Ran a dedicated peak-season control desk'],
    metrics: [
      { icon: 'trending-up', value: '3x', label: 'Capacity Scaled at Peak' }, { icon: 'clock', value: '98.9%', label: 'On-time Shift Arrivals' },
      { icon: 'receipt', value: '20%', label: 'Lower Peak Transport Cost' }, { icon: 'heart', value: '92%', label: 'Associate Satisfaction' },
      { icon: 'shield', value: '0', label: 'Missed Shift Changeovers' },
    ],
    results: [
      { icon: 'route', title: 'Route & Schedule Reliability', description: 'Shift arrivals stayed on time even at triple volume.', baseline: '86% on-time at peak', measuredOutcome: '98.9% on-time at peak', evidence: 'Site attendance systems' },
      { icon: 'bus', title: 'Fleet & Vehicle Utilisation', description: 'Elastic capacity removed both shortages and idle vehicles.', baseline: 'Fixed fleet', measuredOutcome: '3x elastic capacity', evidence: 'Fleet deployment reports' },
      { icon: 'receipt', title: 'Operating Cost Control', description: 'Pre-contracted surge rates avoided premium spot hiring.', baseline: 'Prior peak spend', measuredOutcome: '20% lower peak cost', evidence: 'Client finance reconciliation' },
      { icon: 'users', title: 'Associate Experience', description: 'Reliable pickups reduced fatigue and attrition during peaks.', baseline: '69% satisfaction', measuredOutcome: '92% satisfaction', evidence: 'Associate pulse survey' },
      { icon: 'shield-check', title: 'Safety & Compliance', description: 'All surge drivers verified and trained before deployment.', baseline: 'Ad-hoc verification', measuredOutcome: '100% pre-verified drivers', evidence: 'Driver compliance register' },
    ],
    quote: 'GoAhead Mobility scaled with us when it mattered most. Their planning and on-ground discipline kept our fulfilment centres running through every peak.',
    implementationImage: IMG.command, bannerImage: IMG.ecommerce, galleryImages: [IMG.ecommerce, IMG.lineup, IMG.interior, IMG.bus],
  },
  {
    slug: 'premium-airport-transfers', sortOrder: 5,
    title: 'Premium Airport Transfers for Global Travelers',
    summary: 'Delivered a seamless airport transfer experience for a premium travel services provider.',
    heroSummary: '', category: 'airport-transfers', cardLabel: 'Airport Transfers', industrySlugs: ['events-associations'],
    industry: 'Travel & Hospitality', service: 'Airport Transfers', locationLabel: 'Mumbai, India', fleetSize: '120+ Vehicles', projectDuration: '24 Months', employeesImpacted: '60,000+ Travellers',
    image: IMG.airport, heroImage: IMG.airport, clientDescriptor: 'Premium Travel Services Provider', quoteRole: 'Head \u2013 Guest Experience',
    overviewBody: 'Our client is a premium travel services provider handling international executives and VIP guests arriving in Mumbai. Every transfer is part of their brand promise, so they needed a partner who could deliver chauffeur-grade service with flight-aware precision.',
    overviewStats: [
      { icon: 'users', value: '60,000+', label: 'Travellers per Year' }, { icon: 'plane', value: '2', label: 'Airport Terminals' },
      { icon: 'car', value: '120+', label: 'Premium Vehicles' }, { icon: 'headset', value: '24/7', label: 'Concierge Desk' },
    ],
    challengeIntro: 'Flight delays, terminal congestion and inconsistent chauffeur standards were creating long waits and complaints from high-value guests.',
    challenges: standardChallenges([{ icon: 'plane', title: 'Flight Disruptions', body: 'Delayed and rescheduled flights left chauffeurs waiting at the wrong time or guests waiting without a car.' }]),
    glance: [
      { icon: 'plane', value: '2', label: 'Terminals Served' }, { icon: 'users', value: '60,000+', label: 'Travellers per Year' },
      { icon: 'car', value: '120+', label: 'Premium Vehicles' }, { icon: 'route', value: '200+', label: 'Transfers Daily' },
      { icon: 'clock', value: '24/7', label: 'Arrivals Coverage' }, { icon: 'heart', value: 'VIP', label: 'Guest Profile' },
    ],
    challengeQuote: 'Our guests judge us from the moment they land. We needed every transfer to feel effortless, whatever happened to the flight.',
    approachIntro: 'We introduced flight-tracking dispatch, a trained meet-and-greet team and a premium fleet standard so every guest is met on time, every time.',
    approachQuote: 'Flight-aware dispatch removed the waiting on both sides. Our guests now walk out to a car that is already there.',
    implementationBullets: ['Integrated live flight tracking into dispatch', 'Trained a dedicated meet-and-greet and chauffeur team', 'Standardised a premium sedan, SUV and luxury fleet', 'Opened a 24/7 concierge desk for changes and VIP requests', 'Introduced post-trip guest feedback on every transfer'],
    metrics: [
      { icon: 'clock', value: '99.7%', label: 'On-time Pickups' }, { icon: 'clock', value: '< 5 min', label: 'Average Guest Wait' },
      { icon: 'heart', value: '4.9/5', label: 'Guest Rating' }, { icon: 'receipt', value: '15%', label: 'Lower Cost per Transfer' },
      { icon: 'shield', value: '0', label: 'Safety Incidents Reported' },
    ],
    results: [
      { icon: 'route', title: 'Pickup Reliability', description: 'Flight-aware dispatch matched chauffeurs to actual arrival times.', baseline: '93% on-time', measuredOutcome: '99.7% on-time', evidence: 'Dispatch and flight data logs' },
      { icon: 'clock', title: 'Guest Wait Time', description: 'Guests were met at the gate with minimal waiting.', baseline: '18 min average wait', measuredOutcome: 'Under 5 min average', evidence: 'Meet-and-greet timestamps' },
      { icon: 'receipt', title: 'Operating Cost Control', description: 'Fewer idle hours and better vehicle allocation reduced cost.', baseline: 'Prior-year cost', measuredOutcome: '15% lower per transfer', evidence: 'Client finance reconciliation' },
      { icon: 'heart', title: 'Guest Experience', description: 'Consistent chauffeur standards lifted guest satisfaction.', baseline: '4.3/5 rating', measuredOutcome: '4.9/5 rating', evidence: 'Post-trip guest surveys' },
      { icon: 'shield-check', title: 'Safety & Compliance', description: 'Verified chauffeurs and monitored trips across all transfers.', baseline: 'Vendor-dependent', measuredOutcome: '100% verified chauffeurs', evidence: 'Chauffeur compliance register' },
    ],
    quote: 'GoAhead Mobility made our airport experience genuinely premium. Guests notice the difference, and so do our account managers.',
    implementationImage: IMG.command, bannerImage: IMG.airport, galleryImages: [IMG.airport, IMG.interior, IMG.lineup, IMG.bus],
  },
  {
    slug: 'school-transportation-network', sortOrder: 6,
    title: 'Safe & Reliable School Transportation Network',
    summary: 'Established a safe, reliable and monitored transport network for 25,000+ students across 100+ schools.',
    heroSummary: '', category: 'school-transportation', cardLabel: 'School Transportation', industrySlugs: [],
    industry: 'Education', service: 'School Transportation', locationLabel: 'Pune, India', fleetSize: '550+ Buses', projectDuration: '36 Months', employeesImpacted: '25,000+ Students',
    image: IMG.school, heroImage: IMG.school, clientDescriptor: 'K-12 School Group', quoteRole: 'Director \u2013 School Operations',
    overviewBody: 'Our client is a K-12 education group with more than 100 schools across Pune. Parents expected complete visibility of their children\u2019s journeys, and the group needed a partner who could put child safety at the centre of every route.',
    overviewStats: [
      { icon: 'users', value: '25,000+', label: 'Students' }, { icon: 'map-pin', value: '100+', label: 'Schools' },
      { icon: 'bus', value: '550+', label: 'Buses Deployed' }, { icon: 'shield', value: '100%', label: 'Buses with Attendants' },
    ],
    challengeIntro: 'Parents had no visibility of bus locations, attendance was recorded on paper, and driver and vehicle standards varied widely between contractors.',
    challenges: standardChallenges([{ icon: 'users', title: 'Parent Confidence', body: 'Without live tracking or boarding alerts, parents called schools constantly and confidence in the service was low.' }]),
    glance: [
      { icon: 'map-pin', value: '100+', label: 'Schools Served' }, { icon: 'users', value: '25,000+', label: 'Students Daily' },
      { icon: 'bus', value: '550+', label: 'Buses in Operation' }, { icon: 'route', value: '600+', label: 'Routes Managed' },
      { icon: 'file-check', value: 'Multiple', label: 'Contractors' }, { icon: 'shield', value: 'Critical', label: 'Child Safety Priority' },
    ],
    challengeQuote: 'Nothing matters more to us than a child getting to school and home safely. We needed a partner who treats that responsibility the same way.',
    approachIntro: 'We built a child-safety-first network with trained attendants, RFID boarding, live parent tracking and strict vehicle standards across every route.',
    approachQuote: 'Parents now see exactly where the bus is and when their child boards. Calls to our schools about transport have almost stopped.',
    implementationBullets: ['Deployed 550+ buses meeting school bus safety norms', 'Placed a trained female attendant on every bus', 'Introduced RFID boarding with instant parent notifications', 'Launched a parent app with live bus tracking and ETAs', 'Set up a central control room with speed and route alerts'],
    metrics: [
      { icon: 'shield', value: '0', label: 'Safety Incidents Reported' }, { icon: 'clock', value: '99.3%', label: 'On-time Arrivals' },
      { icon: 'users', value: '100%', label: 'Students RFID Tracked' }, { icon: 'heart', value: '96%', label: 'Parent Satisfaction' },
      { icon: 'receipt', value: '70%', label: 'Fewer Parent Enquiry Calls' },
    ],
    results: [
      { icon: 'route', title: 'Route & Schedule Reliability', description: 'Optimised routes brought students to school on time every day.', baseline: '90% on-time', measuredOutcome: '99.3% on-time', evidence: 'GPS trip logs' },
      { icon: 'users', title: 'Student Tracking', description: 'Every boarding and drop recorded and shared with parents instantly.', baseline: 'Paper registers', measuredOutcome: '100% RFID tracked', evidence: 'Boarding system exports' },
      { icon: 'receipt', title: 'School Office Workload', description: 'Live tracking removed most transport-related calls to schools.', baseline: 'Daily call volume', measuredOutcome: '70% fewer calls', evidence: 'School front-office logs' },
      { icon: 'heart', title: 'Parent Experience', description: 'Visibility and punctuality built strong parent confidence.', baseline: '66% satisfaction', measuredOutcome: '96% satisfaction', evidence: 'Annual parent survey' },
      { icon: 'shield-check', title: 'Safety & Compliance', description: 'Attendants, verified drivers and speed governance on every bus.', baseline: 'Inconsistent standards', measuredOutcome: '0 reportable incidents', evidence: 'Safety audit reports' },
    ],
    quote: 'GoAhead Mobility treats every child as if they were their own. The safety standards, tracking and attendants have given our parents complete peace of mind.',
    implementationImage: IMG.command, bannerImage: IMG.school, galleryImages: [IMG.school, IMG.bus, IMG.interior, IMG.lineup],
  },
  {
    slug: 'green-mobility-sustainability', sortOrder: 7,
    title: 'Driving Sustainability with Green Mobility Initiatives',
    summary: 'Transitioned to eco-friendly fleets, reducing carbon footprint and promoting sustainable mobility.',
    heroSummary: '', category: 'sustainability', cardLabel: 'Sustainability', industrySlugs: ['energy-infrastructure'],
    industry: 'Energy & Infrastructure', service: 'Sustainable Fleet Transition', locationLabel: 'Multiple Cities', fleetSize: '260+ EVs & CNG', projectDuration: '30 Months', employeesImpacted: '7,500+',
    image: IMG.green, heroImage: IMG.green, clientDescriptor: 'Energy & Infrastructure Group', quoteRole: 'Chief Sustainability Officer',
    overviewBody: 'Our client is an energy and infrastructure group with ambitious net-zero commitments. Employee commuting was one of its largest Scope 3 emission sources, and the group wanted a partner who could decarbonise the fleet without disrupting daily operations.',
    overviewStats: [
      { icon: 'users', value: '7,500+', label: 'Employees' }, { icon: 'map-pin', value: '5', label: 'Cities' },
      { icon: 'bus', value: '260+', label: 'EV & CNG Vehicles' }, { icon: 'trending-up', value: '42%', label: 'Lower Emissions' },
    ],
    challengeIntro: 'A diesel-heavy fleet, no emissions reporting and limited charging infrastructure stood between the client and its sustainability targets.',
    challenges: standardChallenges([{ icon: 'activity', title: 'Emissions Reporting', body: 'There was no reliable way to measure commute emissions, so the client could not report progress against its Scope 3 targets.' }]),
    glance: [
      { icon: 'map-pin', value: '5', label: 'Cities' }, { icon: 'users', value: '7,500+', label: 'Employees Commuting Daily' },
      { icon: 'bus', value: '260+', label: 'Vehicles Transitioned' }, { icon: 'route', value: '150+', label: 'Routes Managed' },
      { icon: 'gauge', value: 'Diesel', label: 'Starting Fleet Mix' }, { icon: 'flag', value: 'Net-zero', label: 'Group Commitment' },
    ],
    challengeQuote: 'We had made a public net-zero commitment. Our commute fleet had to change, but our people still needed to get to work on time every day.',
    approachIntro: 'We planned a phased transition to electric and CNG vehicles, matched to route lengths and charging access, with monthly emissions reporting built into the programme.',
    approachQuote: 'GoAhead Mobility gave us a credible, measurable path to cleaner commuting, with reporting our sustainability team can stand behind.',
    implementationBullets: ['Analysed every route for EV and CNG suitability', 'Phased in 260+ electric and CNG vehicles over 30 months', 'Installed depot charging with partner infrastructure providers', 'Introduced monthly per-route emissions reporting', 'Trained drivers in efficient EV driving techniques'],
    metrics: [
      { icon: 'trending-up', value: '42%', label: 'Reduction in Commute Emissions' }, { icon: 'bus', value: '70%', label: 'Fleet on EV or CNG' },
      { icon: 'receipt', value: '19%', label: 'Lower Running Cost per km' }, { icon: 'clock', value: '99.1%', label: 'On-time Performance' },
      { icon: 'heart', value: '94%', label: 'Employee Satisfaction' },
    ],
    results: [
      { icon: 'activity', title: 'Commute Emissions', description: 'Electric and CNG vehicles cut emissions per passenger kilometre.', baseline: 'Diesel baseline (tCO2e)', measuredOutcome: '42% lower emissions', evidence: 'Monthly emissions reports' },
      { icon: 'bus', title: 'Fleet Transition', description: 'A phased transition matched to route lengths and charging.', baseline: '0% low-emission fleet', measuredOutcome: '70% EV or CNG', evidence: 'Fleet register' },
      { icon: 'receipt', title: 'Operating Cost Control', description: 'Lower energy and maintenance costs per kilometre.', baseline: 'Diesel cost per km', measuredOutcome: '19% lower per km', evidence: 'Client finance reconciliation' },
      { icon: 'route', title: 'Service Reliability', description: 'Reliability held steady throughout the transition.', baseline: '97.8% on-time', measuredOutcome: '99.1% on-time', evidence: 'GPS trip logs' },
      { icon: 'users', title: 'Employee Experience', description: 'Quieter, cleaner vehicles were welcomed by employees.', baseline: '78% satisfaction', measuredOutcome: '94% satisfaction', evidence: 'Employee survey' },
    ],
    quote: 'GoAhead Mobility turned our sustainability goals into everyday reality. Cleaner commutes, lower costs and data we can report with confidence.',
    implementationImage: IMG.planning, bannerImage: IMG.green, galleryImages: [IMG.green, IMG.lineup, IMG.interior, IMG.bus],
  },
]

const PAGE_CONTENT = {
  key: 'case-studies-page', status: 'published',
  showHero: true, showHighlights: true, showFeatured: true, showFilters: true, showImpact: true, showTestimonial: true, showCta: true,
  heroEyebrow: 'CASE STUDIES', heroTitle: 'Real Challenges.', heroHighlight: 'Proven Impact.', heroTitleSuffix: 'Stronger Journeys.',
  heroDescription: 'Explore how leading organisations partner with GoAhead Mobility to solve complex transportation challenges and deliver measurable, sustainable results.',
  heroImage: '/images/site/home-hero.png', heroImageAlt: 'GoAhead Mobility coach travelling through a city at dusk',
  heroStats: [
    { icon: 'briefcase', value: '250+', label: 'Successful Projects' }, { icon: 'chart', value: '15+', label: 'Industries Served' },
    { icon: 'users', value: '12M+', label: 'Lives Connected Daily' }, { icon: 'shield', value: '98%', label: 'Client Satisfaction' },
  ],
  featuredEyebrow: 'FEATURED CASE STUDY', featuredButtonLabel: 'View Full Story', listingTitle: 'All Case Studies', allStoriesLabel: 'All Stories',
  searchPlaceholder: 'Search case studies...',
  categories: [
    { slug: 'employee-transportation', label: 'Employee Transportation', icon: 'bus', sortOrder: 1, visible: true },
    { slug: 'airport-transfers', label: 'Airport Transfers', icon: 'plane', sortOrder: 2, visible: true },
    { slug: 'event-transportation', label: 'Event Transportation', icon: 'calendar', sortOrder: 3, visible: true },
    { slug: 'school-transportation', label: 'School Transportation', icon: 'users', sortOrder: 4, visible: true },
    { slug: 'sustainability', label: 'Sustainability', icon: 'heart', sortOrder: 5, visible: true },
    { slug: 'technology-driven', label: 'Technology Driven', icon: 'cpu', sortOrder: 6, visible: true },
  ],
  impactTitle: 'Impact That Drives Change',
  impactBody: 'Our data-driven approach delivers measurable results that create lasting value for our clients and their communities.',
  impactMetrics: [
    { icon: 'chart', value: '25%', label: 'Reduction in Operational Cost' }, { icon: 'chart', value: '30%', label: 'Increase in Operational Efficiency' },
    { icon: 'clock', value: '99.5%', label: 'On-time Performance' }, { icon: 'users', value: '12K+', label: 'Employees Impacted' },
    { icon: 'route', value: '50M+', label: 'Kilometers Driven Annually' }, { icon: 'bus', value: '1,000+', label: 'Modern Fleet Strength' },
  ],
  testimonialQuote: 'GoAhead Mobility has been a true partner in our growth journey. Their technology-driven approach, reliability and commitment to safety have transformed our employee transportation experience.',
  testimonialName: 'Rohit Sharma', testimonialRole: 'Head \u2013 Administration, Global Manufacturing Company', testimonialAvatar: '',
  testimonialVideoTitle: 'Client Success Video', testimonialVideoLabel: 'Explore the story', testimonialVideoPoster: IMG.lineup, testimonialVideoUrl: '',
  ctaTitle: 'Ready to create your success story?',
  ctaBody: 'Partner with GoAhead Mobility for tailored transportation solutions that drive efficiency, safety and satisfaction.',
  ctaButtonLabel: 'Request a Proposal', ctaButtonHref: '/contact',
  seoTitle: 'Case Studies | Real Challenges. Proven Impact. | GoAhead Mobility',
  seoDescription: 'Explore how organisations partner with GoAhead Mobility to solve complex transportation challenges and deliver measurable, sustainable results.',
  ogImage: '/images/site/home-hero.png', seoNoindex: false,
}

async function main() {
  await connectDb()
  await CaseStudiesPageContent.updateOne({ key: 'case-studies-page' }, { $set: PAGE_CONTENT }, { upsert: true, runValidators: true })
  console.log('[case-studies] listing page content published')

  for (const spec of SPECS) {
    await CaseStudy.updateOne({ slug: spec.slug }, { $set: { slug: spec.slug, ...build(spec) } }, { upsert: true, runValidators: true })
    console.log(`[case-studies] upserted ${spec.slug}`)
  }

  const archived = await CaseStudy.updateMany(
    { slug: { $in: ['multi-city-onboarding-housing', 'plant-shift-shuttle-redesign'] }, status: 'published' },
    { $set: { status: 'archived', featured: false } },
  )
  console.log(`[case-studies] archived ${archived.modifiedCount} placeholder studies`)
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1 })
  .finally(() => mongoose.disconnect())
