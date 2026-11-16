import { SiteHeader } from '@/components/site/header'
import { SiteFooter } from '@/components/site/footer'
import { JsonLd } from '@/components/site/json-ld'
import { WebVitalsReporter } from '@/components/site/web-vitals'
import { organizationSchema, websiteSchema } from '@/lib/seo/jsonld'
import { getMenu, getSettings } from '@/lib/server/services/public'
import { getSeoSettings } from '@/lib/server/services/seo-inventory'

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, primary, footer, legal, { site }] = await Promise.all([getSettings(), getMenu('primary'), getMenu('footer'), getMenu('legal'), getSeoSettings()])
  return (
    <>
      <JsonLd data={[organizationSchema(site), websiteSchema(site)]} />
      <WebVitalsReporter />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">
        Skip to content
      </a>
      {settings.maintenanceNotice ? <div className="bg-sky px-4 py-2 text-center text-sm text-foreground">{settings.maintenanceNotice}</div> : null}
      <SiteHeader items={primary} ctaLabel={settings.header.primaryCtaLabel} ctaHref={settings.header.primaryCtaHref} brandName={settings.brandName} />
      <main id="main" className="min-h-[60vh]">
        {children}
      </main>
      <SiteFooter settings={settings} footer={footer} legal={legal} />
    </>
  )
}
