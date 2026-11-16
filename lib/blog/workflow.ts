/** Pure editorial workflow rules shared by the API (enforcement) and the admin UI (button visibility only). */

export const POST_WORKFLOW_STATES = [
  'idea',
  'brief',
  'draft',
  'editorial_review',
  'changes_requested',
  'seo_review',
  'approved',
  'scheduled',
  'published',
  'update_needed',
  'archived',
] as const
export type PostState = (typeof POST_WORKFLOW_STATES)[number]

export const STATE_LABELS: Record<PostState, string> = {
  idea: 'Idea',
  brief: 'Brief',
  draft: 'Draft',
  editorial_review: 'In review',
  changes_requested: 'Changes requested',
  seo_review: 'SEO review',
  approved: 'Approved',
  scheduled: 'Scheduled',
  published: 'Published',
  update_needed: 'Update needed',
  archived: 'Archived',
}

/** `write` = any blog author; `publish` = reviewer/publisher permission (blog.publish). */
type Need = 'write' | 'publish'
type Rule = { to: PostState; need: Need; label: string }

export const TRANSITIONS: Record<PostState, Rule[]> = {
  idea: [
    { to: 'brief', need: 'write', label: 'Move to brief' },
    { to: 'draft', need: 'write', label: 'Start draft' },
    { to: 'archived', need: 'write', label: 'Archive' },
  ],
  brief: [
    { to: 'draft', need: 'write', label: 'Start draft' },
    { to: 'archived', need: 'write', label: 'Archive' },
  ],
  draft: [
    { to: 'editorial_review', need: 'write', label: 'Submit for review' },
    { to: 'archived', need: 'write', label: 'Archive' },
  ],
  editorial_review: [
    { to: 'seo_review', need: 'publish', label: 'Pass to SEO review' },
    { to: 'approved', need: 'publish', label: 'Approve' },
    { to: 'changes_requested', need: 'publish', label: 'Request changes' },
    { to: 'draft', need: 'write', label: 'Withdraw to draft' },
  ],
  changes_requested: [
    { to: 'editorial_review', need: 'write', label: 'Resubmit for review' },
    { to: 'draft', need: 'write', label: 'Back to draft' },
  ],
  seo_review: [
    { to: 'approved', need: 'publish', label: 'Approve' },
    { to: 'changes_requested', need: 'publish', label: 'Request changes' },
  ],
  approved: [
    { to: 'scheduled', need: 'publish', label: 'Schedule' },
    { to: 'published', need: 'publish', label: 'Publish now' },
    { to: 'changes_requested', need: 'publish', label: 'Request changes' },
  ],
  scheduled: [
    { to: 'approved', need: 'publish', label: 'Unschedule' },
    { to: 'published', need: 'publish', label: 'Publish now' },
  ],
  published: [
    { to: 'update_needed', need: 'write', label: 'Flag for update' },
    { to: 'draft', need: 'publish', label: 'Unpublish to draft' },
    { to: 'archived', need: 'publish', label: 'Archive' },
  ],
  update_needed: [
    { to: 'published', need: 'publish', label: 'Mark as up to date' },
    { to: 'editorial_review', need: 'write', label: 'Submit update for review' },
    { to: 'archived', need: 'publish', label: 'Archive' },
  ],
  archived: [{ to: 'draft', need: 'publish', label: 'Restore as draft' }],
}

/** States whose content is (or will become) visible to anonymous visitors. */
export const LIVE_STATES: PostState[] = ['published', 'scheduled', 'update_needed']
/** States that need the publish permission to be edited because edits change live content. */
export const LIVE_EDIT_STATES: PostState[] = ['published', 'scheduled', 'update_needed']
/** States that run the publish quality gate before entering. */
export const GATED_TARGETS: PostState[] = ['approved', 'scheduled', 'published']

export function isPostState(value: unknown): value is PostState {
  return typeof value === 'string' && (POST_WORKFLOW_STATES as readonly string[]).includes(value)
}

export function availableTransitions(from: string, perms: { canWrite: boolean; canPublish: boolean }): Rule[] {
  if (!isPostState(from)) return []
  return TRANSITIONS[from].filter((r) => (r.need === 'publish' ? perms.canPublish : perms.canWrite || perms.canPublish))
}

export type TransitionCheck = { ok: true } | { ok: false; status: number; message: string }

export function checkTransition(
  from: string,
  to: string,
  ctx: { canWrite: boolean; canPublish: boolean; publishAt?: Date | null; now?: Date },
): TransitionCheck {
  if (!isPostState(from) || !isPostState(to)) return { ok: false, status: 400, message: 'Unknown workflow state' }
  const rule = TRANSITIONS[from].find((r) => r.to === to)
  if (!rule) return { ok: false, status: 409, message: `A post cannot move from "${STATE_LABELS[from]}" to "${STATE_LABELS[to]}".` }
  if (rule.need === 'publish' && !ctx.canPublish) return { ok: false, status: 403, message: 'Your role cannot perform this step. Ask a reviewer or publisher.' }
  if (rule.need === 'write' && !ctx.canWrite && !ctx.canPublish) return { ok: false, status: 403, message: 'You do not have permission to edit posts.' }
  if (to === 'scheduled') {
    const now = ctx.now ?? new Date()
    if (!ctx.publishAt || Number.isNaN(ctx.publishAt.getTime())) return { ok: false, status: 422, message: 'Choose a publish date and time to schedule this post.' }
    if (ctx.publishAt.getTime() <= now.getTime()) return { ok: false, status: 422, message: 'The scheduled time must be in the future.' }
  }
  return { ok: true }
}
