import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';
import { ContactService } from '../../domain/contact/contact.service';
import type { SubmitContactRequestContext } from '../../domain/contact/contact-submit.validation';
import { SiteService } from '../../domain/site/site.service';
import type { ContactConfigResponse } from './dto/contact-config-response.dto';
import type { ContactSubmitBody } from './dto/contact-submit-body.dto';
import type { ContactSubmitResponse } from './dto/contact-submit-response.dto';

@Injectable()
export class PublicContactService {
  constructor(
    private readonly contactService: ContactService,
    private readonly siteService: SiteService,
    private readonly appConfig: AppConfigService,
  ) {}

  async getConfig(): Promise<ContactConfigResponse> {
    const config = await this.siteService.getContactConfig();
    return {
      ...config,
      turnstileSiteKey: this.appConfig.isTurnstileEnabled
        ? (this.appConfig.turnstileSiteKey ?? null)
        : null,
    };
  }

  async submit(
    body: ContactSubmitBody,
    context: SubmitContactRequestContext,
  ): Promise<ContactSubmitResponse> {
    await this.contactService.submitInquiry(body, context);
    return { acknowledged: true };
  }
}
