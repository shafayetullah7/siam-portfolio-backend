import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';
import {
  contactSubmitBodySchema,
  type ContactSubmitBody,
} from './dto/contact-submit-body.dto';
import { PUBLIC_CONTACT_THROTTLE } from './public-contact-throttle.constants';
import { PublicContactService } from './public-contact.service';

@ApiTags('public-contact')
@Controller('public/contact')
export class PublicContactController {
  constructor(private readonly publicContact: PublicContactService) {}

  @Get('config')
  @ApiOperation({ summary: 'Public contact page configuration (P16)' })
  async getConfig() {
    return await this.publicContact.getConfig();
  }

  @Post()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: PUBLIC_CONTACT_THROTTLE.submit })
  @ApiOperation({ summary: 'Submit a contact inquiry' })
  async submit(
    @Body({ schema: contactSubmitBodySchema }) body: ContactSubmitBody,
    @Req() req: Request,
  ) {
    const forwarded = req.headers['x-forwarded-for'];
    const ip =
      (typeof forwarded === 'string'
        ? forwarded.split(',')[0]?.trim()
        : undefined) || req.ip;
    const userAgent = req.headers['user-agent'];
    return await this.publicContact.submit(body, { ip, userAgent });
  }
}
