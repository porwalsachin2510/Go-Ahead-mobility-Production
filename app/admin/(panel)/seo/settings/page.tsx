import { PageHeader } from '@/components/admin/ui'
import { SeoSettingsForm, type SeoSettingsValues } from '@/components/admin/seo/seo-settings-form'
import { requirePageUser } from '@/lib/server/auth/session'
import { getSeoSettings } from '@/lib/server/services/seo-inventory'

export const dynamic = 'force-dynamic'

export default async function SeoSettingsPage() {
  await requirePageUser('seo.write')
  const { site, raw } = await getSeoSettings()
  const seo = raw?.seo ?? {}
  const initial: SeoSettingsValues = {
    defaultTitle: seo.defaultTitle ?? '',
    titleTemplate: seo.titleTemplate ?? '',
    defaultDescription: seo.defaultDescription ?? '',
    ogImage: seo.ogImage ?? '',
    robotsMode: site.robotsMode === 'disallow_all' ? 'disallow_all' : 'allow',
    extraDisallow: site.extraDisallow,
    indexing: site.indexing,
    sitemap: site.sitemap,
    imageSitemap: site.imageSitemap !== false,
    organization: { legalName: seo.organization?.legalName ?? '', logo: seo.organization?.logo ?? site.organization.logo },
    integrations: site.integrations,
    verification: site.verification ?? { google: '', bing: '', yandex: '', pinterest: '', baidu: '' },
    indexNow: {
      enabled: Boolean(site.indexNow?.enabled),
      key: site.indexNow?.key ?? '',
      lastSubmittedAt: seo.indexNow?.lastSubmittedAt ? new Date(seo.indexNow.lastSubmittedAt).toISOString() : null,
      lastStatus: seo.indexNow?.lastStatus ?? '',
    },
    llms: { enabled: site.llms?.enabled !== false, intro: site.llms?.intro ?? '' },
  }
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="SEO settings" description="Site-wide metadata, verification, crawling rules, sitemaps, llms.txt and IndexNow." />
      <SeoSettingsForm initial={initial} siteUrl={site.siteUrl} />
    </div>
  )
}
