import { ICON_OPTIONS, VERTICAL_OPTIONS, type FieldDef } from './fields'

/** CMS block library (spec 7.3). Each block's data is validated against these fields on save. */
export type BlockDef = { type: string; label: string; description: string; fields: FieldDef[]; dynamic?: boolean }

const cta = (prefix: string, label: string): FieldDef[] => [
  { key: `${prefix}Label`, label: `${label} label`, kind: 'text', max: 60 },
  { key: `${prefix}Href`, label: `${label} link`, kind: 'url' },
]

const heading: FieldDef[] = [
  { key: 'eyebrow', label: 'Eyebrow', kind: 'text', max: 60 },
  { key: 'heading', label: 'Heading', kind: 'text', max: 160 },
  { key: 'intro', label: 'Intro', kind: 'textarea', max: 600 },
]

export const BLOCKS: BlockDef[] = [
  {
    type: 'hero',
    label: 'Hero',
    description: 'Page-opening headline with image and calls to action.',
    fields: [
      { key: 'variant', label: 'Style', kind: 'select', options: [{ value: 'page', label: 'Page hero' }, { value: 'home', label: 'Homepage hero (dual vertical)' }, { value: 'compact', label: 'Compact text hero' }] },
      { key: 'eyebrow', label: 'Eyebrow', kind: 'text', max: 60 },
      { key: 'title', label: 'Headline', kind: 'text', required: true, max: 140 },
      { key: 'highlight', label: 'Highlighted words (must appear in headline)', kind: 'text', max: 60 },
      { key: 'subtitle', label: 'Sub-heading', kind: 'textarea', max: 400 },
      { key: 'image', label: 'Image', kind: 'image' },
      { key: 'imageAlt', label: 'Image alt text', kind: 'text', max: 200 },
      ...cta('primary', 'Primary CTA'),
      ...cta('secondary', 'Secondary CTA'),
      {
        key: 'routes',
        label: 'Route choices (homepage style)',
        kind: 'list',
        maxItems: 2,
        itemLabel: 'Route',
        itemFields: [
          { key: 'label', label: 'Label', kind: 'text', max: 60 },
          { key: 'description', label: 'Description', kind: 'text', max: 140 },
          { key: 'href', label: 'Link', kind: 'url' },
          { key: 'image', label: 'Image', kind: 'image' },
        ],
      },
    ],
  },
  {
    type: 'verticals',
    label: 'Vertical cards',
    description: 'Two related feature blocks for the business verticals.',
    fields: [
      ...heading,
      {
        key: 'items',
        label: 'Verticals',
        kind: 'list',
        maxItems: 2,
        itemLabel: 'Vertical',
        itemFields: [
          { key: 'eyebrow', label: 'Eyebrow', kind: 'text' },
          { key: 'title', label: 'Title', kind: 'text', required: true },
          { key: 'body', label: 'Body', kind: 'textarea' },
          { key: 'points', label: 'Bullet points', kind: 'tags' },
          { key: 'image', label: 'Image', kind: 'image' },
          { key: 'imageAlt', label: 'Image alt', kind: 'text' },
          { key: 'href', label: 'Link', kind: 'url' },
          { key: 'ctaLabel', label: 'Link label', kind: 'text' },
        ],
      },
    ],
  },
  {
    type: 'richText',
    label: 'Rich text',
    description: 'Long-form Markdown content with optional side note.',
    fields: [
      { key: 'eyebrow', label: 'Eyebrow', kind: 'text' },
      { key: 'heading', label: 'Heading', kind: 'text' },
      { key: 'body', label: 'Body (Markdown)', kind: 'markdown', max: 60000 },
      { key: 'aside', label: 'Side note', kind: 'textarea', max: 600 },
      { key: 'width', label: 'Width', kind: 'select', options: [{ value: 'narrow', label: 'Reading width' }, { value: 'wide', label: 'Wide with side note' }] },
    ],
  },
  {
    type: 'imageText',
    label: 'Image + text split',
    description: 'Editorial split with image and copy.',
    fields: [
      { key: 'eyebrow', label: 'Eyebrow', kind: 'text' },
      { key: 'heading', label: 'Heading', kind: 'text', required: true },
      { key: 'body', label: 'Body (Markdown)', kind: 'markdown' },
      { key: 'image', label: 'Image', kind: 'image' },
      { key: 'imageAlt', label: 'Image alt', kind: 'text' },
      { key: 'reverse', label: 'Image on the right', kind: 'boolean' },
      { key: 'tone', label: 'Background', kind: 'select', options: [{ value: 'light', label: 'Light' }, { value: 'paper', label: 'Soft' }, { value: 'dark', label: 'Dark' }] },
      ...cta('cta', 'CTA'),
    ],
  },
  {
    type: 'features',
    label: 'Icon / value grid',
    description: 'Benefits, differentiators or service modules with icons.',
    fields: [
      ...heading,
      { key: 'columns', label: 'Columns', kind: 'select', options: [{ value: '3', label: '3' }, { value: '2', label: '2' }, { value: '4', label: '4' }] },
      { key: 'tone', label: 'Background', kind: 'select', options: [{ value: 'light', label: 'Light' }, { value: 'paper', label: 'Soft' }, { value: 'dark', label: 'Dark' }] },
      {
        key: 'items',
        label: 'Items',
        kind: 'list',
        itemLabel: 'Item',
        itemFields: [
          { key: 'icon', label: 'Icon', kind: 'select', options: ICON_OPTIONS },
          { key: 'title', label: 'Title', kind: 'text', required: true },
          { key: 'body', label: 'Body', kind: 'textarea' },
          { key: 'href', label: 'Link (optional)', kind: 'url' },
        ],
      },
    ],
  },
  {
    type: 'serviceCards',
    label: 'Services grid',
    description: 'Image cards linking to service pages.',
    fields: [
      ...heading,
      {
        key: 'items',
        label: 'Services',
        kind: 'list',
        itemLabel: 'Service',
        itemFields: [
          { key: 'title', label: 'Title', kind: 'text', required: true },
          { key: 'body', label: 'Summary', kind: 'textarea' },
          { key: 'href', label: 'Link', kind: 'url' },
          { key: 'image', label: 'Image', kind: 'image' },
          { key: 'imageAlt', label: 'Image alt', kind: 'text' },
          { key: 'tag', label: 'Tag', kind: 'text' },
        ],
      },
    ],
  },
  {
    type: 'steps',
    label: 'Timeline / how it works',
    description: 'Numbered process steps.',
    fields: [
      ...heading,
      { key: 'note', label: 'Footnote', kind: 'text', max: 300 },
      { key: 'items', label: 'Steps', kind: 'list', itemLabel: 'Step', itemFields: [{ key: 'title', label: 'Title', kind: 'text', required: true }, { key: 'body', label: 'Body', kind: 'textarea' }] },
    ],
  },
  {
    type: 'challenges',
    label: 'Challenges → solutions',
    description: 'Buyer problems mapped to solutions.',
    fields: [
      ...heading,
      {
        key: 'items',
        label: 'Challenges',
        kind: 'list',
        itemLabel: 'Challenge',
        itemFields: [
          { key: 'vertical', label: 'Vertical', kind: 'select', options: VERTICAL_OPTIONS },
          { key: 'problem', label: 'Challenge', kind: 'text', required: true },
          { key: 'detail', label: 'Detail', kind: 'textarea' },
          { key: 'solution', label: 'How we respond', kind: 'textarea' },
          { key: 'href', label: 'Related page', kind: 'url' },
        ],
      },
    ],
  },
  {
    type: 'stats',
    label: 'Verified metrics',
    description: 'Only publish figures with an evidence source. Hidden when empty.',
    fields: [
      ...heading,
      { key: 'items', label: 'Metrics', kind: 'list', itemLabel: 'Metric', itemFields: [{ key: 'value', label: 'Value', kind: 'text', required: true }, { key: 'label', label: 'Label', kind: 'text', required: true }, { key: 'source', label: 'Evidence source (internal)', kind: 'text', required: true }] },
    ],
  },
  { type: 'industries', label: 'Industry cards', description: 'Published industries from the Industries module.', dynamic: true, fields: [...heading, { key: 'limit', label: 'Max cards', kind: 'number', min: 1, max: 24 }] },
  { type: 'proof', label: 'Proof & case studies', description: 'Approved testimonials and case studies. Hidden when none are approved.', dynamic: true, fields: [...heading, { key: 'vertical', label: 'Vertical filter', kind: 'select', options: [{ value: '', label: 'All' }, ...VERTICAL_OPTIONS] }] },
  { type: 'logoWall', label: 'Client logo wall', description: 'Logos with granted permission. Hidden when empty.', dynamic: true, fields: [{ key: 'heading', label: 'Heading', kind: 'text' }] },
  {
    type: 'faq',
    label: 'FAQ accordion',
    description: 'Published FAQs filtered by category or vertical.',
    dynamic: true,
    fields: [...heading, { key: 'category', label: 'Category (blank for any)', kind: 'text' }, { key: 'vertical', label: 'Vertical', kind: 'select', options: [{ value: '', label: 'Any' }, ...VERTICAL_OPTIONS] }, { key: 'limit', label: 'Max questions', kind: 'number', min: 1, max: 30 }],
  },
  {
    type: 'posts',
    label: 'Related blog / editorial',
    description: 'Pinned or latest published articles.',
    dynamic: true,
    fields: [...heading, { key: 'vertical', label: 'Vertical', kind: 'select', options: [{ value: '', label: 'Any' }, ...VERTICAL_OPTIONS] }, { key: 'limit', label: 'Max posts', kind: 'number', min: 1, max: 6 }],
  },
  { type: 'resources', label: 'Downloadable resources', description: 'Published resources from the Resource Center.', dynamic: true, fields: [...heading, { key: 'vertical', label: 'Vertical', kind: 'select', options: [{ value: '', label: 'Any' }, ...VERTICAL_OPTIONS] }, { key: 'limit', label: 'Max', kind: 'number', min: 1, max: 6 }] },
  { type: 'coverage', label: 'Map / coverage', description: 'Published, reviewed service locations.', dynamic: true, fields: [...heading, { key: 'vertical', label: 'Vertical', kind: 'select', options: [{ value: '', label: 'Any' }, { value: 'accommodation', label: 'Accommodation' }, { value: 'transport', label: 'Transport' }] }] },
  { type: 'team', label: 'Team cards', description: 'Published leadership/team profiles.', dynamic: true, fields: [...heading] },
  {
    type: 'form',
    label: 'Quote / enquiry form',
    description: 'Embeds a lead form; submissions go to the lead pipeline.',
    fields: [
      { key: 'variant', label: 'Form', kind: 'select', options: [{ value: 'accommodation', label: 'Accommodation enquiry' }, { value: 'transport', label: 'Transport requirement' }, { value: 'demo', label: 'Transport ERP demo' }, { value: 'contact', label: 'General contact' }] },
      ...heading,
      { key: 'serviceType', label: 'Preselected service (optional)', kind: 'text' },
      { key: 'sideNote', label: 'Side note (Markdown)', kind: 'markdown', max: 2000 },
    ],
  },
  { type: 'contactDetails', label: 'Contact directory', description: 'Verified contact details from Site Settings.', dynamic: true, fields: [...heading] },
  { type: 'newsletter', label: 'Newsletter form', description: 'Double opt-in newsletter sign-up.', fields: [{ key: 'heading', label: 'Heading', kind: 'text' }, { key: 'intro', label: 'Intro', kind: 'textarea' }] },
  {
    type: 'ctaBand',
    label: 'CTA band',
    description: 'Conversion band with one or two actions.',
    fields: [
      { key: 'heading', label: 'Heading', kind: 'text', required: true },
      { key: 'body', label: 'Body', kind: 'textarea' },
      { key: 'tone', label: 'Tone', kind: 'select', options: [{ value: 'dark', label: 'Ink' }, { value: 'royal', label: 'Royal' }, { value: 'sky', label: 'Sky' }] },
      ...cta('primary', 'Primary CTA'),
      ...cta('secondary', 'Secondary CTA'),
    ],
  },
]

export const BLOCK_MAP: Record<string, BlockDef> = Object.fromEntries(BLOCKS.map((b) => [b.type, b]))

export type Block = { id: string; type: string; hidden?: boolean; data: Record<string, unknown> }
