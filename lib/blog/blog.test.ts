import { describe, expect, it } from 'vitest'
import { availableTransitions, checkTransition } from './workflow'
import { analysePost, countWords, hasBlockers, markdownHeadings, markdownImages } from './quality'

const writer = { canWrite: true, canPublish: false }
const publisher = { canWrite: true, canPublish: true }

describe('editorial workflow', () => {
  it('lets a writer submit a draft for review', () => {
    expect(checkTransition('draft', 'editorial_review', writer)).toEqual({ ok: true })
  })

  it('blocks a writer from publishing directly (cannot bypass review)', () => {
    const res = checkTransition('approved', 'published', writer)
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.status).toBe(403)
  })

  it('rejects transitions that do not exist', () => {
    const res = checkTransition('draft', 'published', publisher)
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.status).toBe(409)
  })

  it('rejects unknown states', () => {
    const res = checkTransition('draft', 'nonsense', publisher)
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.status).toBe(400)
  })

  it('requires a future date to schedule', () => {
    const now = new Date('2026-01-01T00:00:00Z')
    expect(checkTransition('approved', 'scheduled', { ...publisher, now }).ok).toBe(false)
    expect(checkTransition('approved', 'scheduled', { ...publisher, now, publishAt: new Date('2025-12-31T00:00:00Z') }).ok).toBe(false)
    expect(checkTransition('approved', 'scheduled', { ...publisher, now, publishAt: new Date('2026-02-01T00:00:00Z') }).ok).toBe(true)
  })

  it('only offers buttons the role may actually use', () => {
    const labels = availableTransitions('editorial_review', writer).map((t) => t.to)
    expect(labels).toEqual(['draft'])
    expect(availableTransitions('editorial_review', publisher).map((t) => t.to)).toContain('approved')
  })
})

describe('content quality', () => {
  it('parses headings outside code fences only', () => {
    const md = '## One\n```\n# not a heading\n```\n### Two'
    expect(markdownHeadings(md)).toEqual([
      { level: 2, text: 'One' },
      { level: 3, text: 'Two' },
    ])
  })

  it('counts words without image or code markup', () => {
    expect(countWords('Hello **world** ![alt text](/x.png)\n```\ncode block\n```')).toBe(2)
  })

  it('extracts images with their alt text', () => {
    expect(markdownImages('![A bus](/bus.jpg) and ![](/x.jpg)')).toEqual([
      { alt: 'A bus', src: '/bus.jpg' },
      { alt: '', src: '/x.jpg' },
    ])
  })

  it('flags blockers on an empty post', () => {
    const issues = analysePost({})
    const codes = issues.map((i) => i.code)
    expect(codes).toEqual(expect.arrayContaining(['missing_title', 'empty_content', 'missing_author', 'missing_description']))
    expect(hasBlockers(issues)).toBe(true)
  })

  it('requires alt text when a featured image is set', () => {
    const issues = analysePost({ title: 'T', content: 'word '.repeat(400), excerpt: 'e', authorId: 'a', heroImage: '/h.jpg' })
    expect(issues.some((i) => i.code === 'missing_hero_alt' && i.level === 'blocker')).toBe(true)
  })
})
