/**
 * System roles and permission keys (spec 7.1). Roles are defined in code rather than
 * editable documents so that no admin can create an equal-or-higher privileged role.
 * Shared between server (enforcement) and client (UI visibility only).
 */
export const PERMISSIONS = [
  'dashboard.view',
  'content.read',
  'content.write',
  'content.publish',
  'blog.write',
  'blog.publish',
  'media.write',
  'navigation.write',
  'seo.write',
  'redirects.write',
  'leads.read.all',
  'leads.read.team',
  'leads.read.own',
  'leads.write',
  'leads.assign',
  'leads.export',
  'leads.routing',
  'careers.manage',
  'applications.read',
  'subscribers.read',
  'email.manage',
  'settings.write',
  'users.manage',
  'audit.read',
  'reports.read',
  'pii.view',
] as const
export type Permission = (typeof PERMISSIONS)[number]

export const ROLE_KEYS = [
  'super_admin',
  'site_admin',
  'content_manager',
  'seo_manager',
  'author',
  'sales_manager',
  'sales_agent',
  'hr_manager',
  'analyst',
  'auditor',
] as const
export type RoleKey = (typeof ROLE_KEYS)[number]

const CONTENT: Permission[] = ['content.read', 'content.write', 'content.publish', 'blog.write', 'blog.publish', 'media.write', 'navigation.write']

export const ROLES: Record<RoleKey, { label: string; description: string; permissions: Permission[]; rank: number }> = {
  super_admin: { label: 'Super Admin', rank: 100, description: 'All modules, settings, users and integrations. MFA mandatory.', permissions: [...PERMISSIONS] },
  site_admin: {
    label: 'Site Admin',
    rank: 80,
    description: 'CMS, media, forms, leads and settings. Cannot manage equal or higher roles.',
    permissions: PERMISSIONS.filter((p) => p !== 'audit.read'),
  },
  content_manager: { label: 'Content Manager', rank: 50, description: 'Pages, menus, FAQs, resources, industries, case studies and blog.', permissions: ['dashboard.view', ...CONTENT, 'careers.manage'] },
  seo_manager: { label: 'SEO Manager', rank: 50, description: 'Metadata, redirects, indexation and SEO reports. No lead payloads.', permissions: ['dashboard.view', 'content.read', 'seo.write', 'redirects.write', 'reports.read'] },
  author: { label: 'Author / Editor', rank: 20, description: 'Draft content and upload media; no publishing.', permissions: ['dashboard.view', 'content.read', 'blog.write', 'media.write'] },
  sales_manager: {
    label: 'Sales Manager',
    rank: 50,
    description: 'Team/vertical leads, assignment, stages, tasks, exports and reports.',
    permissions: ['dashboard.view', 'leads.read.team', 'leads.write', 'leads.assign', 'leads.export', 'leads.routing', 'reports.read', 'pii.view'],
  },
  sales_agent: { label: 'Sales Agent', rank: 20, description: 'View and update owned leads only.', permissions: ['dashboard.view', 'leads.read.own', 'leads.write', 'pii.view'] },
  hr_manager: { label: 'HR Manager', rank: 40, description: 'Vacancies and candidate pipeline.', permissions: ['dashboard.view', 'careers.manage', 'applications.read', 'pii.view'] },
  analyst: { label: 'Analyst / Read-only', rank: 10, description: 'Aggregate dashboards and reports; PII masked.', permissions: ['dashboard.view', 'reports.read', 'content.read'] },
  auditor: { label: 'Auditor', rank: 10, description: 'Audit logs and permission changes; no editing.', permissions: ['dashboard.view', 'audit.read', 'content.read'] },
}

export function can(role: RoleKey | undefined | null, permission: Permission): boolean {
  if (!role) return false
  return ROLES[role]?.permissions.includes(permission) ?? false
}

export function canAny(role: RoleKey | undefined | null, permissions: Permission[]): boolean {
  return permissions.some((p) => can(role, p))
}

export function canManageRole(actor: RoleKey, target: RoleKey): boolean {
  if (actor === 'super_admin') return true
  if (!can(actor, 'users.manage')) return false
  return ROLES[target].rank < ROLES[actor].rank
}
