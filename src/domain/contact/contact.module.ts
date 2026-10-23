import { Module } from '@nestjs/common';
import { SiteModule } from '../site/site.module';
import { ContactRepository } from './contact.repository';
import { ContactService } from './contact.service';
import { ContactTurnstileService } from './contact-turnstile.service';

@Module({
  imports: [SiteModule],
  providers: [ContactRepository, ContactService, ContactTurnstileService],
  exports: [ContactRepository, ContactService, ContactTurnstileService],
})
export class ContactModule {}
