export const LEAD_TYPES = ['accommodation', 'transport', 'contact', 'demo', 'resource_download', 'newsletter', 'webinar_registration'] as const
export type LeadType = (typeof LEAD_TYPES)[number]

export const LEAD_STATUSES = [
  'new',
  'assigned',
  'contacted',
  'qualified',
  'disqualified',
  'proposal_in_progress',
  'proposal_sent',
  'won',
  'lost',
  'nurture',
] as const
export type LeadStatus = (typeof LEAD_STATUSES)[number]

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  assigned: 'Assigned',
  contacted: 'Contacted',
  qualified: 'Qualified',
  disqualified: 'Disqualified',
  proposal_in_progress: 'Proposal in progress',
  proposal_sent: 'Proposal sent',
  won: 'Won',
  lost: 'Lost',
  nurture: 'Nurture',
}

export const LEAD_TYPE_LABELS: Record<LeadType, string> = {
  accommodation: 'Accommodation enquiry',
  transport: 'Transport requirement',
  contact: 'General contact',
  demo: 'ERP demo request',
  resource_download: 'Resource download',
  newsletter: 'Newsletter subscription',
  webinar_registration: 'Webinar registration',
}

export const REFERENCE_PREFIX: Record<LeadType, string> = {
  accommodation: 'ACC',
  transport: 'TRN',
  contact: 'GEN',
  demo: 'DEM',
  resource_download: 'RES',
  newsletter: 'NWS',
  webinar_registration: 'WEB',
}
