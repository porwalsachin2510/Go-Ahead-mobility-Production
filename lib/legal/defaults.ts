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
    seo: { title: 'Terms & Conditions | GoAhead Mobility', description: 'Terms governing access to and use of the GoAhead Mobility corporate website, enquiry forms and published resources.' },
    blocks: [{
      id: 'legal-terms',
      type: 'richText',
      hidden: false,
      data: {
        eyebrow: 'Terms of Service',
        heading: 'Terms & Conditions',
        lastUpdated: '[Date to be confirmed]',
        notice: 'Phase 1 website enquiries are not confirmed bookings or service orders.',
        sideNote: 'This website is intended for business use by organisations and corporate decision makers. For individual transport services, please contact the relevant operator directly.',
        ctaTitle: 'Questions about these Terms?',
        ctaDescription: 'Our team is here to help. Get in touch with us for any questions or clarifications.',
        ctaButtonLabel: 'Contact Us',
        ctaButtonHref: '/contact',
        width: 'wide',
        aside: 'These Terms & Conditions (“Terms”) govern your access to and use of the GoAhead Mobility corporate website, enquiry forms and the resources published on this website. By using this website or submitting an enquiry, you agree to these Terms.',
        body: "## 01. About these terms\n\nThese Terms & Conditions (“Terms”) are published by GoAhead Mobility [Legal Entity Name to be confirmed] (“GoAhead”, “we”, “us” or “our”). Our registered address is [Registered Address to be confirmed].\n\n“Website” means the GoAhead Mobility corporate website and any pages, subdomains or features under our control. “You” or “your” means any organisation or individual accessing the Website or submitting an enquiry.\n\n## 02. Website scope and service information\n\nThe Website provides information about our Global Accommodation and Local Transportation solutions.\n\nAll offerings, service locations, coverage areas, availability, pricing, service levels and capabilities are as published by GoAhead on the Website or as confirmed in a written proposal.\n\nNothing on this Website should be interpreted as a commitment or guarantee of availability in any specific location.\n\n## 03. Enquiries, proposals and communication\n\nSubmitting an enquiry form is a request for contact or for a proposal. It does not create a booking, reservation, contract or guarantee of service, capacity, pricing or availability.\n\nAll proposals, quotations or estimates are subject to review and written confirmation. A binding contract or service agreement will only come into effect upon signature or written acceptance by both parties.\n\n## 04. User responsibilities and acceptable use\n\n- Provide accurate and complete information when submitting enquiries or applications.\n- You must have the authority to act on behalf of your organisation.\n- Use the Website only for lawful business purposes.\n- Do not misuse, disrupt or attempt to gain unauthorised access to the Website or its systems.\n- Do not copy, scrape, harvest or reverse engineer any content or data from the Website.\n\n## 05. Service scope and operational arrangements\n\nService scope, coverage, delivery model, fleet or vendor involvement, schedules, safety requirements, support channels and other operational details are defined only in the accepted proposal, agreement or service documentation.\n\nGoAhead makes no unsupported promises or guarantees. Any commitments will be clearly stated in the final agreement and service documentation.\n\n## 06. Third-party services, links and providers\n\nThe Website may contain links to third-party websites or integrate with third-party services that are not owned or controlled by GoAhead. These third parties may have their own terms and privacy policies.\n\nOur responsibility for third-party services depends on our actual agreements with those providers. Where applicable, we will identify the relevant provider terms or documentation.\n\n## 07. Website content and intellectual property\n\nAll content on this Website, including text, graphics, logos, images, icons, downloads and software, is owned by or licensed to GoAhead and is protected by applicable intellectual property laws. You may view, print or download content for your personal or internal business reference only, provided all copyright and proprietary notices remain intact.\n\nYou may not reproduce, distribute, modify or create derivative works without our prior written permission.\n\n## 08. Disclaimers and liability\n\nThe Website and its content are provided on an “as is” and “as available” basis. To the maximum extent permitted by law, GoAhead disclaims all warranties, express or implied, including accuracy, completeness, reliability, merchantability and fitness for a particular purpose.\n\n> **Legal review required**\n>\n> The exact disclaimer wording, limitation of liability caps, exclusions and available remedies will be finalised by GoAhead legal counsel and may vary based on applicable laws and the nature of services.\n\n## 09. Privacy and cookies\n\nWe respect your privacy and handle personal information in accordance with our [Privacy Policy](/privacy). By using this Website, you also agree to the use of cookies and similar technologies as described in our [Cookies Policy](/cookies).\n\n## 10. Phase 1 and future Phase 2 services\n\n> **Phase 1 — Website information and enquiries**\n>\n> Phase 1 of this Website is a corporate information and enquiry platform. It does not provide live booking, supplier confirmation, ticketing, payment processing, cancellations, refunds or financial transactions.\n>\n> **Future Phase 2 services**\n>\n> Future Phase 2 services may include booking, supplier management, ticketing, payment, cancellation, refund and finance features. These services will be governed by separate terms and conditions after provider contracts, system workflows and operational policies are finalised and approved.\n\n## 11. Changes, suspension and website availability\n\nWe may update, modify or replace any part of the Website or these Terms at any time. Material updates will be reflected on this page with a revised “Last updated” date. Continued use of the Website after updates constitutes acceptance of the revised Terms.\n\nWe may suspend or discontinue the Website (or any part of it) for maintenance, security or operational reasons, or because content is withdrawn or changed.\n\n## 12. Governing law and dispute resolution\n\n> **To be completed by GoAhead legal counsel**\n>\n> The governing law, court jurisdiction and dispute resolution mechanism will be defined here after legal review.\n\n## 13. Contact and notices\n\nIf you have any questions about these Terms or any related matter, please contact us using the details on our [Contact Us](/contact) page.\n\nAll notices related to these Terms will be in writing and will be sent to the email address you provide or to other contact details we have on record.\n\n## Important distinction\n\nThis Website is an enquiry platform. Submitting an enquiry does not create a confirmed service agreement.\n\n| Website enquiry | Confirmed service agreement |\n| --- | --- |\n| You submit an enquiry through our website. | You receive and accept a written proposal or contract. |\n| We contact you to understand your requirements. | Both parties agree to the terms and scope of service. |\n| We may share a proposal or indicative information. | A formal service agreement or purchase order is issued. |\n| No booking, reservation or commitment is created. | The agreed terms set out the rights and obligations. |",
      },
    }],
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
