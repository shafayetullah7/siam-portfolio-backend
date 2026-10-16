import { Module } from '@nestjs/common';
import { SitePagesModule } from '../../domain/site-pages/site-pages.module';
import { AdminApiSharedModule } from '../admin-api-shared.module';
import { AdminSitePagesController } from './admin-site-pages.controller';
import { AdminSitePagesService } from './admin-site-pages.service';

@Module({
  imports: [AdminApiSharedModule, SitePagesModule],
  controllers: [AdminSitePagesController],
  providers: [AdminSitePagesService],
})
export class AdminSitePagesModule {}
