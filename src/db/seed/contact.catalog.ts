/**
 * Dev seed for contact inbox (P16 / A11). Requires MSG1 migration:
 * contact_messages, contact_message_status enum, site_settings contact columns.
 */

export type ContactMessageSeedEntry = {
  seedKey: string;
  status: 'new' | 'read' | 'replied' | 'archived' | 'spam';
  isRead: boolean;
  category: string;
  senderName: string;
  senderEmail: string;
  affiliation?: string;
  body: string;
  consentGiven: boolean;
  consentTextVersion: string;
  /** ISO date string; staggered for list ordering */
  submittedAt: string;
  readAt?: string;
  adminNotes?: string;
};

export const contactSiteDefaults = {
  contactFormEnabled: true,
  contactShowEmailOnPage: false,
  contactCategories: [
    'Collaboration',
    'Speaking',
    'Media',
    'Other',
  ] as const,
  contactPageIntro:
    'I welcome professional inquiries about research collaborations, speaking, and mentorship. Use the form below with enough context for a thoughtful reply.',
  contactCollaborationGuidance:
    'Include your timeline, funding model (if any), and what you hope to explore together.',
  contactResponseTimeNote:
    'Typical reply within 3–5 business days during the academic term.',
  contactConsentText:
    'I agree that my message and contact details may be stored so the site owner can respond. Inquiry content is not published.',
  contactSuccessMessage:
    'Thank you — your message was received. You should hear back if your note requires a reply.',
  contactPublicEmail: 'dev-admin@example.com',
};

export const contactMessagesCatalog: ContactMessageSeedEntry[] = [
  {
    seedKey: 'dev-inquiry-new',
    status: 'new',
    isRead: false,
    category: 'Collaboration',
    senderName: 'Jordan Lee',
    senderEmail: 'jordan.lee@university.example',
    affiliation: 'Example University',
    body:
      'We are exploring a joint benchmark on robustness under distribution shift. Would you be open to a short call next month?',
    consentGiven: true,
    consentTextVersion: 'dev-seed-v1',
    submittedAt: '2026-10-20T14:00:00.000Z',
  },
  {
    seedKey: 'dev-inquiry-read',
    status: 'read',
    isRead: true,
    category: 'Speaking',
    senderName: 'Morgan Patel',
    senderEmail: 'morgan@conference.example',
    body:
      'Our ML safety meetup would love a 30-minute talk on interpretability in production systems. Dates flexible in Q1.',
    consentGiven: true,
    consentTextVersion: 'dev-seed-v1',
    submittedAt: '2026-10-18T09:30:00.000Z',
    readAt: '2026-10-19T11:00:00.000Z',
    adminNotes: 'Replied via personal email — marked read for inbox demo.',
  },
  {
    seedKey: 'dev-inquiry-spam',
    status: 'spam',
    isRead: true,
    category: 'Other',
    senderName: 'Bulk Offers',
    senderEmail: 'promo@spam.example',
    body:
      'Buy cheap backlinks now! This seed row exercises the spam tab and default list exclusion.',
    consentGiven: false,
    consentTextVersion: 'dev-seed-v1',
    submittedAt: '2026-10-15T02:00:00.000Z',
  },
];
