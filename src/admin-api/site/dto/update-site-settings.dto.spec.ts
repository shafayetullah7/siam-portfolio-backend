import { describe, expect, it } from 'vitest';
import { updateSiteSettingsBodySchema } from './update-site-settings.dto';

describe('updateSiteSettingsBodySchema', () => {
  it('rejects more than 20 contact categories', () => {
    const categories = Array.from({ length: 21 }, (_, i) => `Cat${i}`);
    const result = updateSiteSettingsBodySchema.safeParse({
      contactCategories: categories,
    });
    expect(result.success).toBe(false);
  });

  it('normalizes contact categories on parse', () => {
    const result = updateSiteSettingsBodySchema.safeParse({
      contactCategories: [' Media ', 'Media', 'Speaking'],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.contactCategories).toEqual(['Media', 'Speaking']);
    }
  });

  it('maps empty contact email to null', () => {
    const result = updateSiteSettingsBodySchema.safeParse({
      contactPublicEmail: '',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.contactPublicEmail).toBe(null);
    }
  });
});
