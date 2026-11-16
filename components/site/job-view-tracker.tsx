'use client'

import { useEffect } from 'react'

export function JobViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `job-viewed:${slug}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
    fetch(`/api/v1/careers/jobs/${encodeURIComponent(slug)}/view`, { method: 'POST', keepalive: true }).catch(() => {})
  }, [slug])
  return null
}
