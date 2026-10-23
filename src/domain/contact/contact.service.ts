import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { PaginatedResponse } from '../../common/pagination/paginated-response';
import { SiteService } from '../site/site.service';
import {
  buildReadOnOpenPatch,
  buildStatusPatch,
} from './contact-message-status.rules';
import { ContactRepository } from './contact.repository';
import {
  parseSubmitContactInquiry,
  type SubmitContactInquiryInput,
  type SubmitContactRequestContext,
} from './contact-submit.validation';
import { ContactTurnstileService } from './contact-turnstile.service';
import type {
  AdminContactMessageListQuery,
  AdminUpdateContactMessageInput,
  ContactMessageRow,
} from './contact.types';

@Injectable()
export class ContactService {
  constructor(
    private readonly repository: ContactRepository,
    private readonly siteService: SiteService,
    private readonly turnstile: ContactTurnstileService,
  ) {}

  async submitInquiry(
    input: SubmitContactInquiryInput,
    context: SubmitContactRequestContext = {},
  ): Promise<ContactMessageRow> {
    const settings = await this.siteService.getOrCreateSettings();
    if (!settings.contactFormEnabled) {
      throw new ServiceUnavailableException(
        'The contact form is not available',
      );
    }

    const { parsed, category, consentTextVersion } = parseSubmitContactInquiry(
      input,
      {
        contactCategories: settings.contactCategories,
        contactConsentText: settings.contactConsentText,
      },
    );

    await this.turnstile.verify(parsed.turnstileToken, context.ip);

    return this.repository.insert({
      senderName: parsed.name,
      senderEmail: parsed.email,
      body: parsed.message,
      category,
      affiliation: parsed.affiliation?.trim() || null,
      consentGiven: parsed.consent,
      consentTextVersion,
      status: 'new',
      isRead: false,
      metadata: {
        ip: context.ip,
        userAgent: context.userAgent,
        ...(this.turnstile.isEnabled
          ? { turnstile: { success: true } }
          : {}),
      },
    });
  }

  async listInbox(
    query: AdminContactMessageListQuery = {},
  ): Promise<PaginatedResponse<ContactMessageRow>> {
    const excludeSpam = query.excludeSpam ?? true;
    return this.repository.list({ ...query, excludeSpam });
  }

  async findByIdAdmin(id: string): Promise<ContactMessageRow> {
    const row = await this.repository.findByIdOrThrow(id);
    const readPatch = buildReadOnOpenPatch(row);
    if (!readPatch) {
      return row;
    }
    return this.repository.update(id, readPatch);
  }

  async updateMessage(
    id: string,
    patch: AdminUpdateContactMessageInput,
  ): Promise<ContactMessageRow> {
    const current = await this.repository.findByIdOrThrow(id);
    const merged = buildStatusPatch(current, patch);
    return this.repository.update(id, merged);
  }

  async deleteMessage(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async bulkUpdateMessages(
    ids: string[],
    patch: Pick<AdminUpdateContactMessageInput, 'status' | 'isRead'>,
  ): Promise<{ updated: number }> {
    if (ids.length === 0) {
      throw new BadRequestException('At least one message id is required');
    }
    if (ids.length > 100) {
      throw new BadRequestException('Too many message ids (max 100)');
    }
    let updated = 0;
    for (const id of ids) {
      const current = await this.repository.findByIdOrThrow(id);
      const merged = buildStatusPatch(current, patch);
      await this.repository.update(id, merged);
      updated += 1;
    }
    return { updated };
  }
}
