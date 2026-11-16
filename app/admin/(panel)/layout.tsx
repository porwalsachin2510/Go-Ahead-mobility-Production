import { AdminSidebar, type NavGroup } from '@/components/admin/sidebar'
import { NotificationBell } from '@/components/admin/notification-bell'
import { RESOURCES } from '@/lib/admin/resources'
import { can, ROLES } from '@/lib/rbac'
import { requirePageUser } from '@/lib/server/auth/session'

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser()
  const core: NavGroup = {
    label: 'Overview',
    items: [
      { href: '/admin', label: 'Dashboard' },
      ...(can(user.role, 'leads.read.own') || can(user.role, 'leads.read.team') || can(user.role, 'leads.read.all') ? [{ href: '/admin/leads', label: 'Leads' }] : []),
      ...(can(user.role, 'content.read') ? [{ href: '/admin/pages', label: 'Custom pages' }, { href: '/admin/blog', label: 'Blog dashboard' }] : []),
      ...(can(user.role, 'blog.write') ? [{ href: '/admin/blog/tools', label: 'Blog tools' }] : []),
      ...(can(user.role, 'blog.publish') ? [{ href: '/admin/blog/comments', label: 'Comments' }] : []),
      ...(can(user.role, 'applications.read') ? [{ href: '/admin/careers', label: 'Careers dashboard' }, { href: '/admin/careers/applications', label: 'Applications' }] : []),
      ...(can(user.role, 'media.write') ? [{ href: '/admin/media', label: 'Media library' }] : []),
      ...(can(user.role, 'seo.write') ? [{ href: '/admin/seo', label: 'SEO overview' }, { href: '/admin/seo/pages', label: 'SEO pages' }, { href: '/admin/seo/vitals', label: 'Web Vitals' }, { href: '/admin/seo/settings', label: 'SEO settings' }, { href: '/admin/seo/links', label: 'Internal links' }] : []),
    ],
  }
  const grouped = new Map<string, NavGroup>()
  for (const r of RESOURCES) {
    if (!can(user.role, r.readPermission)) continue
    if (!grouped.has(r.group)) grouped.set(r.group, { label: r.group, items: [] })
    grouped.get(r.group)!.items.push({ href: `/admin/c/${r.key}`, label: r.label })
  }
  if (can(user.role, 'settings.write')) {
    if (!grouped.has('System')) grouped.set('System', { label: 'System', items: [] })
    grouped.get('System')!.items.unshift({ href: '/admin/settings', label: 'Site settings' })
  }

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <AdminSidebar groups={[core, ...grouped.values()]} user={{ name: user.name, role: ROLES[user.role]?.label ?? user.role }} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 hidden items-center justify-end gap-3 border-b border-border bg-background/90 px-8 py-3 backdrop-blur lg:flex">
          <span className="text-sm text-muted-foreground">{user.name}</span>
          <NotificationBell />
        </header>
        <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  )
}
