export const EMPLOYMENT_LABELS: Record<string, string> = { full_time: 'Full-time', part_time: 'Part-time', contract: 'Contract', internship: 'Internship' }
export const WORKPLACE_LABELS: Record<string, string> = { onsite: 'On-site', hybrid: 'Hybrid', remote: 'Remote' }
export const LEVEL_LABELS: Record<string, string> = { entry: 'Entry level', mid: 'Mid level', senior: 'Senior', lead: 'Lead / Manager', executive: 'Executive' }
export const PERIOD_LABELS: Record<string, string> = { HOUR: 'hour', DAY: 'day', WEEK: 'week', MONTH: 'month', YEAR: 'year' }

export const APPLICATION_STATES = ['received', 'screening', 'interview', 'offer', 'hired', 'rejected', 'withdrawn'] as const
export type ApplicationState = (typeof APPLICATION_STATES)[number]
export const STATE_LABELS: Record<ApplicationState, string> = {
  received: 'New',
  screening: 'Screening',
  interview: 'Interview',
  offer: 'Offer',
  hired: 'Hired',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
}

export function jobPlace(j: { city?: string; region?: string; country?: string; location?: string }) {
  return j.location || [j.city, j.region, j.country].filter(Boolean).join(', ')
}

export function formatSalary(j: { salaryMin?: number | null; salaryMax?: number | null; salaryCurrency?: string; salaryPeriod?: string; showSalary?: boolean }) {
  if (j.showSalary === false || (!j.salaryMin && !j.salaryMax)) return ''
  const fmt = (n: number) => new Intl.NumberFormat('en', { maximumFractionDigits: 0 }).format(n)
  const cur = j.salaryCurrency ? `${j.salaryCurrency} ` : ''
  const range = j.salaryMin && j.salaryMax && j.salaryMin !== j.salaryMax ? `${fmt(j.salaryMin)} – ${fmt(j.salaryMax)}` : fmt((j.salaryMin || j.salaryMax) as number)
  const per = j.salaryPeriod ? ` / ${PERIOD_LABELS[j.salaryPeriod] ?? j.salaryPeriod.toLowerCase()}` : ''
  return `${cur}${range}${per}`
}

export function jobMeta(j: Record<string, any>) {
  return [j.department, jobPlace(j), WORKPLACE_LABELS[j.workplaceType] ?? (j.remote ? 'Remote' : ''), EMPLOYMENT_LABELS[j.employmentType]].filter(Boolean).join(' · ')
}
