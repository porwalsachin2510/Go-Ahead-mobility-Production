import { requireApiUser } from '@/lib/server/auth/session'
import { handler } from '@/lib/server/http'
import { exportPosts, toMarkdown } from '@/lib/server/services/blog-tools'

export const GET = handler(async (req) => {
  await requireApiUser('blog.write')
  const params = req.nextUrl.searchParams
  const format = params.get('format') === 'markdown' ? 'markdown' : 'json'
  const ids = (params.get('ids') ?? '').split(',').filter(Boolean).slice(0, 500)
  const posts = await exportPosts(ids)
  const stamp = new Date().toISOString().slice(0, 10)

  if (format === 'markdown') {
    const body = posts.map((p) => toMarkdown(p as Record<string, any>)).join('\n\n<!-- next post -->\n\n')
    return new Response(body, {
      headers: { 'content-type': 'text/markdown; charset=utf-8', 'content-disposition': `attachment; filename="blog-export-${stamp}.md"`, 'cache-control': 'no-store' },
    })
  }
  return new Response(JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), posts }, null, 2), {
    headers: { 'content-type': 'application/json; charset=utf-8', 'content-disposition': `attachment; filename="blog-export-${stamp}.json"`, 'cache-control': 'no-store' },
  })
})
