import { describe, expect, it } from 'vitest';
import {
  contactMessagesCatalog,
  contactSiteDefaults,
} from './contact.catalog';

describe('contact.catalog', () => {
  it('includes new, read, and spam statuses for inbox demos', () => {
    const statuses = new Set(contactMessagesCatalog.map((e) => e.status));
    expect(statuses.has('new')).toBe(true);
    expect(statuses.has('read')).toBe(true);
    expect(statuses.has('spam')).toBe(true);
    expect(contactMessagesCatalog.length).toBeGreaterThanOrEqual(2);
  });

  it('uses bodies that meet public submit minimum length', () => {
    for (const entry of contactMessagesCatalog) {
      expect(entry.body.trim().length).toBeGreaterThanOrEqual(10);
      expect(entry.seedKey.length).toBeGreaterThan(0);
    }
  });

  it('keeps site default categories within admin limits', () => {
    expect(contactSiteDefaults.contactCategories.length).toBeLessThanOrEqual(20);
    for (const cat of contactSiteDefaults.contactCategories) {
      expect(cat.trim().length).toBeGreaterThan(0);
      expect(cat.length).toBeLessThanOrEqual(100);
    }
  });
});
