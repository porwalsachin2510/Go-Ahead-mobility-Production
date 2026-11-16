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
