import type { AppConfigService } from './app-config.service';
import { validateCloudinaryConfigForBoot } from './validate-cloudinary-config';

function mockConfig(partial: Partial<AppConfigService>): AppConfigService {
  return partial as AppConfigService;
}

describe('validateCloudinaryConfigForBoot', () => {
  it('allows placeholders in development', () => {
    expect(() =>
      validateCloudinaryConfigForBoot(
        mockConfig({
          isProduction: false,
          cloudinaryCloudName: 'placeholder_cloud_name',
          cloudinaryApiKey: 'placeholder_api_key',
          cloudinaryApiSecret: 'placeholder_api_secret',
        }),
      ),
    ).not.toThrow();
  });

  it('allows placeholders in production when not production flag', () => {
    expect(() =>
      validateCloudinaryConfigForBoot(
        mockConfig({
          isProduction: false,
          cloudinaryCloudName: 'real',
          cloudinaryApiKey: 'real',
          cloudinaryApiSecret: 'real',
        }),
      ),
    ).not.toThrow();
  });

  it('rejects placeholders in production', () => {
    expect(() =>
      validateCloudinaryConfigForBoot(
        mockConfig({
          isProduction: true,
          cloudinaryCloudName: 'placeholder_cloud_name',
          cloudinaryApiKey: 'key',
          cloudinaryApiSecret: 'secret',
        }),
      ),
    ).toThrow(/Invalid Cloudinary configuration/);
  });
});
