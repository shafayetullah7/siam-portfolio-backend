import { Module } from '@nestjs/common';
import { ContactModule } from '../../domain/contact/contact.module';
import { AdminApiSharedModule } from '../admin-api-shared.module';
import { AdminMessagesController } from './admin-messages.controller';
import { AdminMessagesService } from './admin-messages.service';

@Module({
  imports: [AdminApiSharedModule, ContactModule],
  controllers: [AdminMessagesController],
  providers: [AdminMessagesService],
})
export class AdminMessagesModule {}
