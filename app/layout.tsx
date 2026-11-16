import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Archivo, Inter } from 'next/font/google'
import { absoluteUrl, toOgLocale } from '@/lib/seo/config'
import { getSeoSettings } from '@/lib/server/services/seo-inventory'
import './globals.css'

const display = Archivo({ subsets: ['latin'], weight: ['600', '700', '800', '900'], style: ['normal', 'italic'], variable: '--font-display-face', display: 'swap' })
const body = Inter({ subsets: ['latin'], variable: '--font-body', display: 'swap' })

export async function generateMetadata(): Promise<Metadata> {
  const { site } = await getSeoSettings()
  const ogImage = absoluteUrl(site.siteUrl, site.ogImage)
  return {
    metadataBase: new URL(site.siteUrl),
    applicationName: site.brandName,
    title: { default: site.defaultTitle, template: site.titleTemplate.includes('%s') ? site.titleTemplate : `%s | ${site.brandName}` },
    description: site.defaultDescription,
    openGraph: { type: 'website', siteName: site.brandName, locale: toOgLocale(site.locale), images: ogImage ? [{ url: ogImage }] : undefined },
    twitter: { card: ogImage ? 'summary_large_image' : 'summary' },
    icons: {
      icon: [
        { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
        { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
        { url: '/icon.svg', type: 'image/svg+xml' },
      ],
      apple: '/apple-icon.png',
    },
    formatDetection: { telephone: false, email: false, address: false },
    verification: verificationMetadata(site.verification),
  }
}

function verificationMetadata(v: { google: string; bing: string; yandex: string; pinterest: string; baidu: string } | undefined): Metadata['verification'] {
  if (!v) return undefined
  const other: Record<string, string> = {}
  if (v.bing) other['msvalidate.01'] = v.bing
  if (v.pinterest) other['p:domain_verify'] = v.pinterest
  if (v.baidu) other['baidu-site-verification'] = v.baidu
  const out = { google: v.google || undefined, yandex: v.yandex || undefined, other: Object.keys(other).length ? other : undefined }
  return out.google || out.yandex || out.other ? out : undefined
}

export const viewport: Viewport = {
  themeColor: '#334b93',
  colorScheme: 'light',
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { site } = await getSeoSettings()
  return (
    <html lang={site.locale || 'en'} className={`${display.variable} ${body.variable} bg-background`} suppressHydrationWarning>
      {/* Browser extensions may add attributes before React hydrates the root shell. */}
      <body className="antialiased" suppressHydrationWarning>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
