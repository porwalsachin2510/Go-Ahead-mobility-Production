'use client'

import { useReportWebVitals } from 'next/web-vitals'

const TRACKED = new Set(['LCP', 'INP', 'CLS', 'FCP', 'TTFB'])

/** Sends real-user Core Web Vitals to the app so the admin dashboard reflects actual visitors. */
export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    if (!TRACKED.has(metric.name)) return
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      path: window.location.pathname,
      device: window.matchMedia('(max-width: 767px)').matches ? 'mobile' : 'desktop',
    })
    const url = '/api/v1/seo/vitals'
    if (navigator.sendBeacon) navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }))
    else fetch(url, { method: 'POST', body, headers: { 'content-type': 'application/json' }, keepalive: true }).catch(() => {})
  })
  return null
}
