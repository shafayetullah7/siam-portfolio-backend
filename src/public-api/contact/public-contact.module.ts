import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppConfigModule } from '../../config/app-config.module';
import { ContactModule } from '../../domain/contact/contact.module';
import { SiteModule } from '../../domain/site/site.module';
import {
  PUBLIC_CONTACT_THROTTLE_MODULE_DEFAULT,
} from './public-contact-throttle.constants';
import { PublicContactController } from './public-contact.controller';
import { PublicContactService } from './public-contact.service';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: PUBLIC_CONTACT_THROTTLE_MODULE_DEFAULT.ttl,
        limit: PUBLIC_CONTACT_THROTTLE_MODULE_DEFAULT.limit,
      },
    ]),
    ContactModule,
    SiteModule,
    AppConfigModule,
  ],
  controllers: [PublicContactController],
  providers: [PublicContactService],
})
export class PublicContactModule {}
