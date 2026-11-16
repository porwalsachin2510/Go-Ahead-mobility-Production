export type VitalName = 'LCP' | 'INP' | 'CLS' | 'FCP' | 'TTFB'
export type VitalRating = 'good' | 'needs-improvement' | 'poor'

/** Google's published "good" and "poor" boundaries, assessed at the 75th percentile. */
export const VITAL_THRESHOLDS: Record<VitalName, { good: number; poor: number; unit: 'ms' | '' ; label: string }> = {
  LCP: { good: 2500, poor: 4000, unit: 'ms', label: 'Largest Contentful Paint' },
  INP: { good: 200, poor: 500, unit: 'ms', label: 'Interaction to Next Paint' },
  CLS: { good: 0.1, poor: 0.25, unit: '', label: 'Cumulative Layout Shift' },
  FCP: { good: 1800, poor: 3000, unit: 'ms', label: 'First Contentful Paint' },
  TTFB: { good: 800, poor: 1800, unit: 'ms', label: 'Time to First Byte' },
}

export function rateVital(name: VitalName, value: number): VitalRating {
  const t = VITAL_THRESHOLDS[name]
  return value <= t.good ? 'good' : value <= t.poor ? 'needs-improvement' : 'poor'
}

export function p75(values: number[]): number {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.75) - 1)]
}

export function formatVital(name: VitalName, value: number): string {
  return name === 'CLS' ? value.toFixed(2) : value >= 1000 ? `${(value / 1000).toFixed(2)} s` : `${Math.round(value)} ms`
}
