import 'server-only'
import nodemailer, { type Transporter } from 'nodemailer'
import { EmailLog, EmailTemplate } from '../models/operations'
import { maskEmail } from '../security/crypto'

/*
 * Template body markup (one block per blank-line-separated paragraph):
 *   ## Heading                 section heading
 *   [[Button label|{{url}}]]   call-to-action button
 *   ::Label|{{value}}          row in a summary table (consecutive rows are grouped)
 *   - item                     bullet list
 *   > text                     highlighted note
 *   **bold**, [text](url)      inline formatting; bare URLs are auto-linked
 * Variables: only allowedVariables plus the global siteUrl, supportEmail and year are interpolated.
 */

export type DefaultTemplate = {
  slug: string
  name: string
  subject: string
  preheader: string
  body: string
  allowedVariables: string[]
}

export const DEFAULT_TEMPLATES: DefaultTemplate[] = [
  {
    slug: 'lead_acknowledgement',
    name: 'Lead acknowledgement (customer)',
    subject: 'We have received your {{typeLabel}} | Ref. {{reference}}',
    preheader: 'Thank you for contacting GoAhead Mobility. Your reference is {{reference}}.',
    body: [
      'Dear {{name}},',
      'Thank you for contacting **GoAhead Mobility**. We have received your {{typeLabel}} and it has been assigned to our {{verticalLabel}} team. A summary of your submission is below for your records.',
      '::Reference number|{{reference}}\n::Request type|{{typeLabel}}\n::Company|{{company}}\n::City / region|{{city}}\n::Service required|{{serviceType}}',
      '## What happens next',
      '- A dedicated specialist will review your requirement, typically within one business day.\n- We may contact you to confirm details such as dates, headcount, locations or routes.\n- You will receive a tailored proposal aligned with your travel policy and budget.',
      '> Please quote reference **{{reference}}** in any correspondence. If your requirement changes in the meantime, simply reply to this email and we will update your request.',
      'Warm regards,\n**Client Services Team**\nGoAhead Mobility',
    ].join('\n\n'),
    allowedVariables: ['name', 'reference', 'typeLabel', 'vertical', 'verticalLabel', 'company', 'city', 'serviceType'],
  },
  {
    slug: 'lead_internal',
    name: 'New lead notification (internal)',
    subject: '[{{verticalLabel}}] New {{typeLabel}} from {{company}} | {{reference}}',
    preheader: 'New {{typeLabel}} from {{name}} ({{company}}) is waiting in the leads inbox.',
    body: [
      '## New {{typeLabel}} received',
      'A new enquiry has been submitted through the website and routed to the **{{verticalLabel}}** team. Please review and respond promptly.',
      '::Reference|{{reference}}\n::Contact name|{{name}}\n::Company|{{company}}\n::City / region|{{city}}\n::Service required|{{serviceType}}',
      '[[Open lead in admin|{{adminUrl}}]]',
      '> Replying to this email will respond directly to the contact.',
    ].join('\n\n'),
    allowedVariables: ['name', 'reference', 'typeLabel', 'vertical', 'verticalLabel', 'company', 'city', 'serviceType', 'adminUrl'],
  },
  {
    slug: 'application_acknowledgement',
    name: 'Application acknowledgement',
    subject: 'Application received: {{jobTitle}} | Ref. {{reference}}',
    preheader: 'Thank you for applying to GoAhead Mobility. Here is what happens next.',
    body: [
      'Dear {{name}},',
      'Thank you for applying for the position of **{{jobTitle}}** at GoAhead Mobility. We appreciate your interest in joining our team and confirm that your application has been received successfully.',
      '::Position|{{jobTitle}}\n::Application reference|{{reference}}',
      '## What to expect',
      '- Our Talent team personally reviews every application against the role requirements.\n- If your profile is a strong match, we will contact you to arrange the next steps.\n- You will receive an email whenever the status of your application changes.',
      '> Please keep reference **{{reference}}** for any correspondence regarding this application.',
      'Best regards,\n**Talent Acquisition Team**\nGoAhead Mobility',
    ].join('\n\n'),
    allowedVariables: ['name', 'jobTitle', 'reference'],
  },
  {
    slug: 'application_internal',
    name: 'New application (hiring team)',
    subject: 'New applicant for {{jobTitle}}: {{name}} | {{reference}}',
    preheader: '{{name}} has applied for {{jobTitle}}. Screening: {{screening}}.',
    body: [
      '## New application received',
      'A candidate has applied for **{{jobTitle}}** through the careers page.',
      '::Candidate|{{name}}\n::Position|{{jobTitle}}\n::Reference|{{reference}}\n::Screening result|{{screening}}',
      '[[Review candidate|{{adminUrl}}]]',
    ].join('\n\n'),
    allowedVariables: ['jobTitle', 'name', 'reference', 'screening', 'adminUrl'],
  },
  {
    slug: 'application_status_update',
    name: 'Application status update (candidate)',
    subject: 'Update on your application: {{jobTitle}}',
    preheader: 'There is an update on your application for {{jobTitle}} at GoAhead Mobility.',
    body: [
      'Dear {{name}},',
      '{{message}}',
      '::Position|{{jobTitle}}\n::Application reference|{{reference}}',
      'If you have any questions, simply reply to this email and a member of our Talent team will be glad to help.',
      'Kind regards,\n**Talent Acquisition Team**\nGoAhead Mobility',
    ].join('\n\n'),
    allowedVariables: ['name', 'jobTitle', 'reference', 'message'],
  },
  {
    slug: 'job_alert_confirm',
    name: 'Job alert double opt-in',
    subject: 'Please confirm your GoAhead Mobility job alerts',
    preheader: 'One click to start receiving new roles from GoAhead Mobility.',
    body: [
      '## Confirm your job alert',
      'Thank you for your interest in careers at GoAhead Mobility. You asked to be notified when new roles open{{criteria}}.',
      'Please confirm your email address to activate your alert:',
      '[[Confirm job alert|{{confirmUrl}}]]',
      '> If you did not request this, you can safely ignore this email. No alert will be created without your confirmation.',
    ].join('\n\n'),
    allowedVariables: ['confirmUrl', 'criteria'],
  },
  {
    slug: 'job_alert',
    name: 'New job alert',
    subject: 'New opening at GoAhead Mobility: {{jobTitle}}',
    preheader: 'A new role matching your job alert is now open: {{jobTitle}}.',
    body: [
      '## A new role matches your job alert',
      'We have just opened a position that matches the preferences you set. Review the details and apply while applications are open.',
      '::Position|{{jobTitle}}\n::Details|{{jobMeta}}',
      '[[View role and apply|{{jobUrl}}]]',
      'You are receiving this email because you subscribed to GoAhead Mobility job alerts. [Unsubscribe from job alerts]({{unsubscribeUrl}})',
    ].join('\n\n'),
    allowedVariables: ['jobTitle', 'jobMeta', 'jobUrl', 'unsubscribeUrl'],
  },
  {
    slug: 'newsletter_confirm',
    name: 'Newsletter double opt-in',
    subject: 'Confirm your subscription to Mobility Notes',
    preheader: 'One more step: confirm your email to receive Mobility Notes from GoAhead Mobility.',
    body: [
      '## Please confirm your subscription',
      'Thank you for subscribing to **Mobility Notes**, the monthly briefing from GoAhead Mobility for HR, travel and operations teams.',
      'To start receiving it, please confirm your email address:',
      '[[Confirm my subscription|{{confirmUrl}}]]',
      '## What you will receive',
      '- Practical guidance on corporate accommodation and employee transportation\n- Industry insights, checklists and planning resources\n- No more than one email a month, and you can unsubscribe at any time',
      '> If you did not request this subscription, simply ignore this email and you will not be added to our list.',
    ].join('\n\n'),
    allowedVariables: ['confirmUrl'],
  },
  {
    slug: 'password_reset',
    name: 'Admin password reset',
    subject: 'Reset your GoAhead Mobility admin password',
    preheader: 'Use this secure link within 30 minutes to reset your password.',
    body: [
      '## Reset your password',
      'We received a request to reset the password for your GoAhead Mobility admin account. Click the button below to choose a new password.',
      '[[Reset password|{{resetUrl}}]]',
      '> For your security, this link expires in **30 minutes** and can be used only once. If you did not request a reset, you can ignore this email. Your password will remain unchanged.',
    ].join('\n\n'),
    allowedVariables: ['resetUrl'],
  },
  {
    slug: 'user_invite',
    name: 'Admin account invitation',
    subject: 'You have been invited to the GoAhead Mobility admin panel',
    preheader: 'Set your password to activate your GoAhead Mobility admin account.',
    body: [
      'Dear {{name}},',
      'An administrator account has been created for you on the **GoAhead Mobility admin panel**. To get started, please set your password using the secure link below.',
      '[[Set up my account|{{setupUrl}}]]',
      '> This invitation is valid for **72 hours**. If it expires, please ask your administrator to send a new one.',
      'Welcome to the team,\n**GoAhead Mobility**',
    ].join('\n\n'),
    allowedVariables: ['name', 'setupUrl'],
  },
]

let transporter: Transporter | null = null

const env = (...keys: string[]) => keys.map((k) => process.env[k]?.trim()).find(Boolean) ?? ''

const smtp = () => ({
  host: env('EMAIL_HOST', 'SMTP_HOST'),
  port: Number(env('EMAIL_PORT', 'SMTP_PORT') || 587),
  secureFlag: env('EMAIL_SECURE', 'SMTP_SECURE'),
  user: env('EMAIL_USER', 'SMTP_USER'),
  pass: env('EMAIL_PASS', 'SMTP_PASS'),
  from: env('EMAIL_FROM', 'EMAIL_USER', 'SMTP_USER'),
})

export function emailConfigured() {
  const s = smtp()
  return Boolean(s.host && s.from)
}

function getTransport() {
  if (!emailConfigured()) return null
  const s = smtp()
  transporter ??= nodemailer.createTransport({
    host: s.host,
    port: s.port,
    secure: s.secureFlag ? s.secureFlag === 'true' : s.port === 465,
    auth: s.user ? { user: s.user, pass: s.pass } : undefined,
  })
  return transporter
}

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

const C = {
  navy: '#0B1530',
  primary: '#334B93',
  accent: '#26ADE4',
  text: '#1F2A44',
  muted: '#5B6478',
  border: '#E3E7EF',
  canvas: '#F3F5F9',
  panel: '#F7F9FC',
}
const FONT = "'Segoe UI',Roboto,Helvetica,Arial,sans-serif"

const siteUrl = () => (env('NEXT_PUBLIC_SITE_URL', 'SITE_URL') || 'https://goaheadmobility.com').replace(/\/+$/, '')
const supportEmail = () => env('EMAIL_REPLY_TO', 'CONTACT_INBOX') || 'info@goaheadmobility.com'
const GLOBAL_VARS = ['siteUrl', 'supportEmail', 'year']
const isSafeUrl = (u: string) => /^(https?:\/\/|mailto:)/i.test(u.trim())

type Tpl = { slug?: string; subject: string; body: string; allowedVariables: string[]; preheader?: string }

/** Only whitelisted variables are interpolated; values are HTML-escaped (spec 7.12). */
export function renderTemplate(tpl: Tpl, rawVars: Record<string, string>) {
  const vars: Record<string, string> = { siteUrl: siteUrl(), supportEmail: supportEmail(), year: String(new Date().getFullYear()), ...rawVars }
  const allowed = new Set([...tpl.allowedVariables, ...GLOBAL_VARS])
  const sub = (text: string) =>
    text.replace(/\{\{(\w+)\}\}/g, (_, k: string) => (allowed.has(k) ? String(vars[k] ?? '').trim() : ''))

  const stripInline = (s: string) => s.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '$1 ($2)')

  const inline = (raw: string) => {
    const links: string[] = []
    let out = escapeHtml(sub(raw)).replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label: string, url: string) => {
      const href = url.replace(/&amp;/g, '&')
      if (!isSafeUrl(href)) return label
      links.push(`<a href="${escapeHtml(href)}" style="color:${C.primary};text-decoration:underline">${label}</a>`)
      return `\u0000${links.length - 1}\u0000`
    })
    out = out
      .replace(/\*\*(.+?)\*\*/g, `<strong style="color:${C.navy};font-weight:600">$1</strong>`)
      .replace(/(https?:\/\/[^\s<]+)/g, `<a href="$1" style="color:${C.primary};text-decoration:underline;word-break:break-all">$1</a>`)
      .replace(/\u0000(\d+)\u0000/g, (_, i: string) => links[Number(i)])
    return out.replace(/\n/g, '<br>')
  }

  const htmlBlocks: string[] = []
  const textBlocks: string[] = []
  const blocks = tpl.body.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean)

  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim())
    if (block.startsWith('## ')) {
      const t = block.slice(3)
      htmlBlocks.push(`<h2 style="margin:28px 0 12px;font-family:${FONT};font-size:18px;line-height:1.35;font-weight:700;color:${C.navy}">${inline(t)}</h2>`)
      textBlocks.push(sub(t).toUpperCase())
    } else if (lines.every((l) => /^\[\[.+\|.+\]\]$/.test(l))) {
      for (const l of lines) {
        const [, label, url] = l.match(/^\[\[(.+?)\|(.+)\]\]$/)!
        const href = sub(url)
        if (!isSafeUrl(href)) continue
        htmlBlocks.push(
          `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0"><tr><td style="border-radius:8px;background:${C.primary}"><a href="${escapeHtml(href)}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px">${escapeHtml(sub(label))} &rarr;</a></td></tr></table>` +
            `<p style="margin:0 0 16px;font-family:${FONT};font-size:12px;line-height:1.6;color:${C.muted}">If the button does not work, copy and paste this link into your browser:<br><a href="${escapeHtml(href)}" style="color:${C.primary};word-break:break-all">${escapeHtml(href)}</a></p>`,
        )
        textBlocks.push(`${sub(label)}:\n${href}`)
      }
    } else if (lines.every((l) => l.startsWith('::'))) {
      const rows = lines
        .map((l) => l.slice(2).split('|'))
        .map(([label, ...rest]) => [sub(label), sub(rest.join('|'))] as const)
        .filter(([, value]) => value && value !== '—' && value !== '-')
      if (!rows.length) continue
      htmlBlocks.push(
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 20px;background:${C.panel};border:1px solid ${C.border};border-radius:10px;border-collapse:separate">` +
          rows
            .map(
              ([label, value], i) =>
                `<tr><td style="padding:12px 18px;${i ? `border-top:1px solid ${C.border};` : ''}font-family:${FONT};font-size:13px;color:${C.muted};width:42%;vertical-align:top">${escapeHtml(label)}</td><td style="padding:12px 18px;${i ? `border-top:1px solid ${C.border};` : ''}font-family:${FONT};font-size:14px;font-weight:600;color:${C.navy};vertical-align:top">${escapeHtml(value)}</td></tr>`,
            )
            .join('') +
          '</table>',
      )
      textBlocks.push(rows.map(([l, v]) => `${l}: ${v}`).join('\n'))
    } else if (lines.every((l) => l.startsWith('- '))) {
      htmlBlocks.push(
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px">` +
          lines
            .map(
              (l) =>
                `<tr><td width="22" style="vertical-align:top;padding:4px 0"><div style="width:8px;height:8px;margin-top:7px;border-radius:50%;background:${C.accent}"></div></td><td style="padding:4px 0;font-family:${FONT};font-size:15px;line-height:1.6;color:${C.text}">${inline(l.slice(2))}</td></tr>`,
            )
            .join('') +
          '</table>',
      )
      textBlocks.push(lines.map((l) => `- ${stripInline(sub(l.slice(2)))}`).join('\n'))
    } else if (block.startsWith('> ')) {
      const t = lines.map((l) => l.replace(/^>\s?/, '')).join('\n')
      htmlBlocks.push(
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 20px"><tr><td style="padding:14px 18px;background:#EEF7FC;border-left:3px solid ${C.accent};border-radius:6px;font-family:${FONT};font-size:14px;line-height:1.6;color:${C.text}">${inline(t)}</td></tr></table>`,
      )
      textBlocks.push(stripInline(sub(t)))
    } else {
      htmlBlocks.push(`<p style="margin:0 0 16px;font-family:${FONT};font-size:15px;line-height:1.65;color:${C.text}">${inline(block)}</p>`)
      textBlocks.push(stripInline(sub(block)))
    }
  }

  const internal = /_internal$/.test(tpl.slug ?? '')
  const subject = stripInline(sub(tpl.subject)).replace(/[\r\n]+/g, ' ').replace(/\s{2,}/g, ' ').trim().slice(0, 200)
  const preheader = stripInline(sub(tpl.preheader || textBlocks[0] || '')).slice(0, 140)
  const site = vars.siteUrl
  const help = vars.supportEmail
  const footerNote = internal
    ? 'This is an automated internal notification from the GoAhead Mobility website.'
    : 'You are receiving this email because of a request made on the GoAhead Mobility website. This is a service message related to that request.'

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:${C.canvas};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapeHtml(preheader)}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.canvas}"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px">
<tr><td style="background:${C.navy};border-radius:14px 14px 0 0;padding:26px 36px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td><a href="${escapeHtml(site)}" style="text-decoration:none;font-family:${FONT};font-size:24px;font-weight:800;font-style:italic;color:#ffffff;letter-spacing:-0.5px">Go<span style="color:${C.accent}">Ahead</span></a><div style="font-family:${FONT};font-size:10px;font-weight:600;letter-spacing:3px;color:#9AA6C4;margin-top:2px">MOBILITY</div></td>
<td align="right" style="font-family:${FONT};font-size:12px;color:#9AA6C4">${internal ? 'Internal notification' : 'Corporate travel, connected'}</td>
</tr></table></td></tr>
<tr><td style="height:4px;background:${C.accent};line-height:4px;font-size:0">&nbsp;</td></tr>
<tr><td style="background:#ffffff;padding:36px 36px 20px">${htmlBlocks.join('')}</td></tr>
<tr><td style="background:#ffffff;border-radius:0 0 14px 14px;padding:0 36px 32px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:1px solid ${C.border};padding-top:20px;font-family:${FONT};font-size:13px;line-height:1.6;color:${C.muted}">
Need help? Contact us at <a href="mailto:${escapeHtml(help)}" style="color:${C.primary};text-decoration:none;font-weight:600">${escapeHtml(help)}</a> or visit <a href="${escapeHtml(site)}" style="color:${C.primary};text-decoration:none;font-weight:600">${escapeHtml(site.replace(/^https?:\/\//, ''))}</a>.
</td></tr></table></td></tr>
<tr><td style="padding:24px 36px;text-align:center;font-family:${FONT};font-size:12px;line-height:1.7;color:${C.muted}">
<strong style="color:${C.text}">GoAhead Mobility</strong> &middot; Corporate accommodation and transportation<br>
${footerNote}<br>
<a href="${escapeHtml(site)}" style="color:${C.muted}">Website</a> &nbsp;&middot;&nbsp; <a href="${escapeHtml(site)}/privacy" style="color:${C.muted}">Privacy Policy</a> &nbsp;&middot;&nbsp; <a href="${escapeHtml(site)}/terms" style="color:${C.muted}">Terms</a> &nbsp;&middot;&nbsp; <a href="${escapeHtml(site)}/contact" style="color:${C.muted}">Contact</a><br>
&copy; ${vars.year} GoAhead Mobility. All rights reserved.
</td></tr>
</table></td></tr></table>
</body></html>`

  const text = [
    'GoAhead Mobility',
    '',
    textBlocks.join('\n\n'),
    '',
    '---',
    `Need help? ${help} | ${site}`,
    footerNote,
    `(c) ${vars.year} GoAhead Mobility. All rights reserved.`,
  ].join('\n')

  return { subject, text, html }
}

async function getTemplate(slug: string): Promise<Tpl | null> {
  const fallback = DEFAULT_TEMPLATES.find((t) => t.slug === slug)
  const db = await EmailTemplate.findOne({ slug, enabled: true }).lean<any>()
  if (db) return { slug, subject: db.subject, body: db.body, allowedVariables: db.allowedVariables ?? fallback?.allowedVariables ?? [], preheader: db.preheader || fallback?.preheader }
  return fallback ?? null
}

/** Persists to the outbox first, then attempts delivery. A failed send never loses the record. */
export async function queueEmail(input: { templateSlug: string; to: string; vars: Record<string, string>; relatedType?: string; relatedId?: string; replyTo?: string }) {
  if (!input.to) return null
  const tpl = await getTemplate(input.templateSlug)
  if (!tpl) return null
  const rendered = renderTemplate(tpl, input.vars)
  const log = await EmailLog.create({
    templateSlug: input.templateSlug,
    to: input.to,
    toMasked: maskEmail(input.to),
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    status: emailConfigured() ? 'queued' : 'not_configured',
    relatedType: input.relatedType ?? '',
    relatedId: input.relatedId ?? '',
  })
  if (emailConfigured()) await deliver(String(log._id), input.replyTo)
  return String(log._id)
}

export async function deliver(logId: string, replyTo?: string) {
  const transport = getTransport()
  const log = await EmailLog.findOneAndUpdate({ _id: logId, status: { $in: ['queued', 'failed', 'not_configured'] } }, { $set: { status: 'sending' }, $inc: { attempts: 1 } }, { returnDocument: 'after' }).select('+to +html +text')
  if (!log) return false
  if (!transport) {
    await EmailLog.updateOne({ _id: logId }, { $set: { status: 'not_configured', lastError: 'SMTP is not configured' } })
    return false
  }
  try {
    const info = await transport.sendMail({
      from: `${env('EMAIL_FROM_NAME') || 'GoAhead Mobility'} <${smtp().from}>`,
      to: log.to,
      replyTo: replyTo || process.env.EMAIL_REPLY_TO || undefined,
      subject: log.subject,
      html: log.html,
      text: log.text,
    })
    await EmailLog.updateOne({ _id: logId }, { $set: { status: 'sent', sentAt: new Date(), providerMessageId: info.messageId ?? '', lastError: '' } })
    return true
  } catch (error) {
    const attempts = log.attempts ?? 1
    const dead = attempts >= 5
    await EmailLog.updateOne(
      { _id: logId },
      { $set: { status: dead ? 'dead' : 'failed', lastError: String((error as Error).message).slice(0, 300), nextAttemptAt: new Date(Date.now() + 2 ** attempts * 60_000) } },
    )
    console.error('[email] delivery failed', logId, (error as Error).message)
    return false
  }
}

/** Retries due failed messages; called from the cron route and the admin "retry" button. */
export async function processOutbox(limit = 20) {
  if (!emailConfigured()) return { attempted: 0, sent: 0 }
  const due = await EmailLog.find({ status: 'failed', nextAttemptAt: { $lte: new Date() } }, { _id: 1 }).limit(limit).lean<any[]>()
  let sent = 0
  for (const d of due) if (await deliver(String(d._id))) sent++
  return { attempted: due.length, sent }
}
