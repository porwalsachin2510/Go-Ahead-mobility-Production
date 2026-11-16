import { absoluteUrl, canonicalUrl } from './config'
import type { SeoSettings } from './types'

export type JsonLd = Record<string, any>

/** Serialises JSON-LD for a script tag, escaping characters that could close the tag or break parsers. */
export function serializeJsonLd(data: JsonLd | JsonLd[]): string {
  return JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')
}

const clean = <T extends JsonLd>(obj: T): T => {
  for (const key of Object.keys(obj)) {
    const v = obj[key]
    if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)) delete obj[key]
  }
  return obj
}

export const organizationId = (site: SeoSettings) => `${site.siteUrl}/#organization`
export const websiteId = (site: SeoSettings) => `${site.siteUrl}/#website`

/** Only uses details the business has actually entered in Settings. No address, rating or price is ever invented. */
export function organizationSchema(site: SeoSettings): JsonLd {
  return clean({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': organizationId(site),
    name: site.brandName,
    legalName: site.organization.legalName,
    url: `${site.siteUrl}/`,
    logo: absoluteUrl(site.siteUrl, site.organization.logo),
    description: site.tagline,
    email: site.contact.email,
    telephone: site.contact.phone,
    sameAs: site.social,
  })
}

export function websiteSchema(site: SeoSettings): JsonLd {
  return clean({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': websiteId(site),
    url: `${site.siteUrl}/`,
    name: site.brandName,
    inLanguage: site.locale,
    publisher: { '@id': organizationId(site) },
  })
}

export function breadcrumbSchema(site: SeoSettings, trail: { name: string; path: string }[]): JsonLd | null {
  if (trail.length < 2) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.name, item: canonicalUrl(site.siteUrl, t.path) })),
  }
}

export function articleSchema(
  site: SeoSettings,
  a: { path: string; headline: string; description?: string; image?: string; published?: string | null; modified?: string | null; authorName?: string; authorUrl?: string; type?: 'BlogPosting' | 'Article' },
): JsonLd {
  return clean({
    '@context': 'https://schema.org',
    '@type': a.type ?? 'BlogPosting',
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl(site.siteUrl, a.path) },
    headline: a.headline.slice(0, 110),
    description: a.description,
    image: a.image ? [absoluteUrl(site.siteUrl, a.image)] : undefined,
    datePublished: a.published || undefined,
    dateModified: a.modified || a.published || undefined,
    author: a.authorName ? clean({ '@type': 'Person', name: a.authorName, url: a.authorUrl }) : { '@id': organizationId(site) },
    publisher: { '@id': organizationId(site) },
    inLanguage: site.locale,
  })
}

/** Public author profile only: no email, phone or account data is ever included. */
export function personSchema(site: SeoSettings, p: { path: string; name: string; jobTitle?: string; description?: string; image?: string; sameAs?: string[]; knowsAbout?: string[] }): JsonLd {
  const url = canonicalUrl(site.siteUrl, p.path)
  return clean({
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${url}#person`,
    name: p.name,
    url,
    jobTitle: p.jobTitle,
    description: p.description,
    image: p.image ? absoluteUrl(site.siteUrl, p.image) : undefined,
    sameAs: (p.sameAs ?? []).filter(Boolean),
    knowsAbout: (p.knowsAbout ?? []).filter(Boolean),
    worksFor: { '@id': organizationId(site) },
  })
}

export function serviceSchema(site: SeoSettings, s: { path: string; name: string; description?: string; serviceType?: string }): JsonLd {
  return clean({
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${canonicalUrl(site.siteUrl, s.path)}#service`,
    name: s.name,
    description: s.description,
    serviceType: s.serviceType,
    url: canonicalUrl(site.siteUrl, s.path),
    provider: { '@id': organizationId(site) },
  })
}

export function webPageSchema(site: SeoSettings, p: { path: string; name: string; description?: string; modified?: string | null; type?: 'WebPage' | 'AboutPage' | 'ContactPage' | 'CollectionPage' }): JsonLd {
  return clean({
    '@context': 'https://schema.org',
    '@type': p.type ?? 'WebPage',
    '@id': `${canonicalUrl(site.siteUrl, p.path)}#webpage`,
    url: canonicalUrl(site.siteUrl, p.path),
    name: p.name,
    description: p.description,
    dateModified: p.modified || undefined,
    isPartOf: { '@id': websiteId(site) },
    inLanguage: site.locale,
  })
}

/** Google requires a location for JobPosting; callers must only pass jobs that have one. */
export type JobPostingInput = {
  path: string
  id?: string
  title: string
  description: string
  responsibilities?: string
  requirements?: string
  datePosted: string
  validThrough?: string | null
  employmentType?: string
  location?: string
  workplaceType?: string
  street?: string
  city?: string
  region?: string
  postalCode?: string
  country?: string
  applicantCountries?: string[]
  salaryMin?: number | null
  salaryMax?: number | null
  salaryCurrency?: string
  salaryPeriod?: string
  showSalary?: boolean
  minExperienceYears?: number
  educationLevel?: string
  skills?: string[]
  benefits?: string[]
  department?: string
  openings?: number
}

const EDUCATION_MAP: Record<string, string> = { high_school: 'high school', diploma: 'associate degree', bachelor: 'bachelor degree', master: 'postgraduate degree', doctorate: 'postgraduate degree' }

const stripMarkdown = (md: string) => md.replace(/[#*_`>]/g, '').trim()

/** Google for Jobs JobPosting. Description is rendered as HTML-safe paragraphs because Google requires rich text, not plain text. */
export function jobPostingSchema(site: SeoSettings, j: JobPostingInput): JsonLd | null {
  const remote = j.workplaceType === 'remote'
  const hasPlace = Boolean(j.city || j.location)
  if (!j.description || !j.datePosted || (!remote && !hasPlace)) return null
  const typeMap: Record<string, string> = { full_time: 'FULL_TIME', part_time: 'PART_TIME', contract: 'CONTRACTOR', internship: 'INTERN' }
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const section = (title: string, body?: string) => (body?.trim() ? `<h3>${title}</h3>${body.split(/\n{2,}/).map((p) => `<p>${esc(stripMarkdown(p)).replace(/\n/g, '<br>')}</p>`).join('')}` : '')
  const description = [
    j.description.split(/\n{2,}/).map((p) => `<p>${esc(stripMarkdown(p)).replace(/\n/g, '<br>')}</p>`).join(''),
    section('Responsibilities', j.responsibilities),
    section('Requirements', j.requirements),
    j.benefits?.length ? `<h3>Benefits</h3><ul>${j.benefits.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : '',
  ].join('')
  const showPay = j.showSalary !== false && (j.salaryMin || j.salaryMax) && j.salaryCurrency
  const address = clean({
    '@type': 'PostalAddress',
    streetAddress: j.street || undefined,
    addressLocality: j.city || j.location || undefined,
    addressRegion: j.region || undefined,
    postalCode: j.postalCode || undefined,
    addressCountry: j.country || undefined,
  })
  return clean({
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: j.title,
    description,
    identifier: j.id ? { '@type': 'PropertyValue', name: site.brandName, value: j.id } : undefined,
    datePosted: j.datePosted,
    validThrough: j.validThrough || undefined,
    employmentType: j.employmentType ? typeMap[j.employmentType] : undefined,
    hiringOrganization: clean({ '@type': 'Organization', name: site.brandName, sameAs: `${site.siteUrl}/`, logo: absoluteUrl(site.siteUrl, site.organization.logo) }),
    jobLocation: hasPlace ? { '@type': 'Place', address } : undefined,
    jobLocationType: remote ? 'TELECOMMUTE' : undefined,
    applicantLocationRequirements: remote && j.applicantCountries?.length ? j.applicantCountries.map((c) => ({ '@type': 'Country', name: c })) : undefined,
    baseSalary: showPay
      ? {
          '@type': 'MonetaryAmount',
          currency: j.salaryCurrency,
          value: clean({
            '@type': 'QuantitativeValue',
            minValue: j.salaryMin || undefined,
            maxValue: j.salaryMax || undefined,
            value: j.salaryMin && j.salaryMax ? undefined : j.salaryMin || j.salaryMax,
            unitText: j.salaryPeriod || 'YEAR',
          }),
        }
      : undefined,
    experienceRequirements: j.minExperienceYears ? { '@type': 'OccupationalExperienceRequirements', monthsOfExperience: j.minExperienceYears * 12 } : undefined,
    educationRequirements: j.educationLevel && EDUCATION_MAP[j.educationLevel] ? { '@type': 'EducationalOccupationalCredential', credentialCategory: EDUCATION_MAP[j.educationLevel] } : undefined,
    skills: j.skills?.length ? j.skills.join(', ') : undefined,
    jobBenefits: j.benefits?.length ? j.benefits.join(', ') : undefined,
    occupationalCategory: j.department || undefined,
    totalJobOpenings: j.openings && j.openings > 1 ? j.openings : undefined,
    directApply: true,
    url: canonicalUrl(site.siteUrl, j.path),
  })
}

const REQUIRED: Record<string, string[]> = {
  Organization: ['name', 'url'],
  WebSite: ['name', 'url'],
  BreadcrumbList: ['itemListElement'],
  BlogPosting: ['headline', 'datePublished', 'author', 'publisher'],
  Article: ['headline', 'datePublished', 'author', 'publisher'],
  Service: ['name', 'provider'],
  WebPage: ['name', 'url'],
  AboutPage: ['name', 'url'],
  ContactPage: ['name', 'url'],
  CollectionPage: ['name', 'url'],
  JobPosting: ['title', 'description', 'datePosted', 'hiringOrganization', 'jobLocation'],
}

/** Structural validation for generated schema. Complements, never replaces, Google's Rich Results Test. */
export function validateJsonLd(node: JsonLd): string[] {
  const issues: string[] = []
  if (node['@context'] !== 'https://schema.org') issues.push('Missing or incorrect @context')
  const type = node['@type']
  if (typeof type !== 'string') {
    issues.push('Missing @type')
    return issues
  }
  for (const field of REQUIRED[type] ?? []) if (node[field] === undefined || node[field] === '') issues.push(`${type} is missing required field "${field}"`)
  if (type === 'BreadcrumbList') {
    const items = (node.itemListElement ?? []) as JsonLd[]
    items.forEach((it, i) => {
      if (it.position !== i + 1) issues.push(`Breadcrumb item ${i + 1} has an incorrect position`)
      if (!it.name || !it.item) issues.push(`Breadcrumb item ${i + 1} needs name and item URL`)
    })
  }
  for (const [k, v] of Object.entries(node)) {
    if ((k === 'url' || k === 'logo') && typeof v === 'string' && !/^https?:\/\//.test(v)) issues.push(`"${k}" must be an absolute URL`)
  }
  return issues
}
