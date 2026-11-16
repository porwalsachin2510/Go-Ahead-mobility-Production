import { z } from 'zod'
import { requireApiUser } from '@/lib/server/auth/session'
import { assertSameOrigin, badRequest, handler, ok, readJson } from '@/lib/server/http'
import { importPosts, parseMarkdown } from '@/lib/server/services/blog-tools'

const schema = z.object({
  format: z.enum(['json', 'markdown']),
  content: z.string().min(1).max(5_000_000),
  overwrite: z.boolean().default(false),
  createTerms: z.boolean().default(true),
})

export const POST = handler(async (req) => {
  assertSameOrigin(req)
  const user = await requireApiUser('blog.write')
  const parsed = schema.safeParse(await readJson(req))
  if (!parsed.success) throw badRequest('Upload a JSON or Markdown file to import')
  const { format, content, overwrite, createTerms } = parsed.data

  let items: Record<string, any>[]
  if (format === 'json') {
    let data: unknown
    try {
      data = JSON.parse(content)
    } catch {
      throw badRequest('The file is not valid JSON')
    }
    const list = Array.isArray(data) ? data : (data as any)?.posts
    if (!Array.isArray(list)) throw badRequest('Expected an array of posts or an object with a "posts" array')
    items = list.filter((x) => x && typeof x === 'object')
  } else {
    items = content.split(/\n\s*<!-- next post -->\s*\n/).map((chunk) => parseMarkdown(chunk.trim())).filter((x) => x.title || x.content)
  }
  if (!items.length) throw badRequest('No posts found in the file')
  return ok(await importPosts(user, items, { overwrite, createTerms }))
})
