import { Global, Module } from '@nestjs/common';
import { AppConfigModule } from '../../config/app-config.module';
import { AppConfigService } from '../../config/app-config.service';
import { createMailTransport } from './create-mail-transport';
import { MAIL_TRANSPORT } from './mail-transport.types';

@Global()
@Module({
  imports: [AppConfigModule],
  providers: [
    {
      provide: MAIL_TRANSPORT,
      useFactory: (config: AppConfigService) => createMailTransport(config),
      inject: [AppConfigService],
    },
  ],
  exports: [MAIL_TRANSPORT],
})
export class MailModule {}
