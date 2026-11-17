export const FOOTPRINT_FOOTER_LINK = { id: 'f3d', label: 'Our Footprint', href: '/our-footprint' }

export const LEGAL_MENU_ITEMS = [
  { id: 'l1', label: 'Privacy Policy', href: '/privacy', children: [] },
  { id: 'l2', label: 'Terms & Conditions', href: '/terms', children: [] },
  { id: 'l3', label: 'Cookies Policy', href: '/cookies', children: [] },
  { id: 'l4', label: 'Our Footprint', href: '/our-footprint', children: [] },
]

const legalBlock = (id: string, heading: string, body: string) => ({
  id,
  type: 'richText',
  hidden: false,
  data: { heading, width: 'narrow', body },
})

export const LEGAL_PAGES = [
  {
    path: '/privacy',
    pageType: 'legal',
    title: 'Privacy Policy',
    seo: { title: 'Privacy Policy | GoAhead Mobility', description: 'How GoAhead Mobility collects, uses, stores and protects personal information when you use our website and services.' },
    blocks: [{
      id: 'legal-privacy',
      type: 'richText',
      hidden: false,
      data: {
        heading: 'Privacy Policy',
        width: 'wide',
        aside: 'This Privacy Policy describes how GoAhead Mobility collects, uses, stores, shares and protects personal information when you interact with our corporate website, submit enquiries, apply for roles, download resources, subscribe to updates or use analytics-enabled features.',
        body: `## 01. About this notice

This Privacy Policy applies to the corporate website operated by GoAhead Mobility (together with its subsidiaries and affiliates, “GoAhead”, “we”, “us” or “our”). It explains what personal information we collect, how we use it, the choices you have and how we protect it.

This website is intended for business users, partners, employees and job applicants. This notice does not cover consumer-facing or traveller features which are planned for a future phase of our platforms.

## 02. Information we collect

We collect the following types of personal information:

- **Contact and company information:** name, business email, job title, company name, work phone, country and other information submitted through enquiry forms.
- **Transport and accommodation enquiry data:** requirements, service locations, travel dates (if provided), headcount estimates and other details needed to respond to your request.
- **Application / CV data:** name, email, phone, work experience, skills, education, resume/CV and any other information you provide when applying for a role.
- **Email and subscription data:** email address, subscription preferences and consent records for newsletters or updates.
- **Resource and download data:** information submitted to access white papers, guides, templates, reports, videos and webinars (including consent where required).
- **Technical and device data:** IP address, browser type, device information, pages visited, timestamps and behaviour data collected through cookies and similar technologies, subject to your consent choices.

> **What we do not request in public forms (Phase 1)**  
> Our public enquiry forms do not request passport data, payment card details, health information or any other sensitive information that is not necessary for the purpose of your request.

## 03. How we use information

We use personal information to:

- Respond to enquiries and provide information;
- Manage business relationships and communications;
- Process job applications and communicate updates;
- Deliver requested resources and content;
- Send newsletters or updates (only with consent);
- Analyse website usage and improve our services;
- Comply with legal obligations and enforce our policies;
- Detect, prevent and respond to security or misuse.

## 04. Sharing and service providers

We share personal information only with authorised internal teams and trusted service providers who help us operate our website and business, such as hosting/data providers, media storage (e.g., Cloudinary), email service providers, analytics providers and CRM platforms (only where enabled). These providers process data on our instructions, under confidentiality obligations and appropriate security safeguards.

We do not sell personal information. We do not share personal information for cross-context behavioural advertising.

## 05. Cookies and analytics

We use cookies and similar technologies to ensure our website functions properly, remember preferences, understand usage and improve our services. Non-essential cookies and analytics will not be placed before you provide consent where the applicable legal regime requires opt-in.

You can manage your cookie preferences at any time.

## 06. Marketing choices

Marketing communications (such as newsletters and webinar invitations) are optional. Consent is separate, specific, freely given and unchecked by default.

We record consent, version, time and source. You can unsubscribe at any time using the link in our emails or by contacting us. Unsubscribes and bounces are honoured and suppressed.

## 07. Retention

We retain personal information only for as long as necessary for the purposes listed above, unless a longer retention period is required or permitted by law. Retention periods for the following data types will be defined and approved by our clients and legal advisors:

- Leads and enquiries
- CVs / resumes
- Email communications and consent logs
- Audit and system logs
- Inactive user accounts
- Failed jobs / error logs
- Temporary files and uploads

Legal holds, regulatory inquiries, litigation and backup/archival requirements may require us to retain information for longer periods.

## 08. Security

We implement appropriate technical and organisational measures to protect personal information, including access controls, encryption in transit, role-based permissions, monitoring and regular security reviews.

## 09. Your privacy requests

You have the right to access, correct, update, delete or restrict the processing of your personal information, and to object to or withdraw consent. To make a request or raise a concern, contact us using the details below. We will respond in accordance with applicable laws.

## 10. Future booking services (Phase 2)

Future traveller features (such as profiles, passport details and itineraries) will require additional information. We will apply data minimization, stronger access controls, strict retention rules and incident response measures. Payment card details will be tokenized by a compliant payment provider and will not be stored in our databases (e.g., MongoDB). These services are not live at this time.

## 11. Contact and policy updates

We may update this Privacy Policy from time to time. The “Last updated” date and version will be revised. Material changes will be communicated through our website or by email where appropriate. Continued use of our website constitutes acceptance of the updated policy.`,
      },
    }],
  },

  {
    path: '/terms',
    pageType: 'legal',
    title: 'Terms & Conditions',
    seo: { title: 'Terms & Conditions', description: 'Terms governing the use of the GoAhead Mobility website and enquiry services.' },
    blocks: [
      legalBlock(
        'legal-terms',
        'Terms & Conditions',
        '_Version v1. These terms must be reviewed by your legal counsel before launch._\n\n## Use of this website\nThis website provides information about GoAhead Mobility accommodation and transportation services. Content is offered for general information and may change without notice.\n\n## Enquiries and proposals\nSubmitting an enquiry does not create a booking or a contract. Rates, availability and service scope are confirmed only in a written proposal accepted by both parties.\n\n## Intellectual property\nAll text, imagery and trademarks on this site belong to GoAhead Mobility or its licensors and may not be reused without permission.\n\n## Limitation of liability\nWe take care to keep information accurate, but we do not accept liability for decisions made solely on the basis of website content.\n\n## Contact\nQuestions about these terms can be sent through our contact page.',
      ),
    ],
  },
  {
    path: '/cookies',
    pageType: 'legal',
    title: 'Cookies Policy',
    seo: { title: 'Cookies Policy', description: 'How GoAhead Mobility uses cookies and similar technologies on this website.' },
    blocks: [
      legalBlock(
        'legal-cookies',
        'Cookies Policy',
        '_Version v1. This policy must be reviewed by your legal counsel before launch._\n\n## What cookies are\nCookies are small files stored by your browser that help a website work and understand how it is used.\n\n## Cookies we use\n- **Strictly necessary:** keep the site secure and remember form progress.\n- **Analytics:** privacy-friendly, aggregated measurement of page performance and visits. No advertising cookies are set.\n\n## Managing cookies\nYou can block or delete cookies in your browser settings. Blocking strictly necessary cookies may stop some forms from working.\n\n## Changes\nWe will update this page when the cookies we use change.',
      ),
    ],
  },
]
