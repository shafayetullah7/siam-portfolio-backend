import { Module } from '@nestjs/common';
import { SitePagesModule } from '../../domain/site-pages/site-pages.module';
import { PublicSitePagesController } from './public-site-pages.controller';
import { PublicSitePagesService } from './public-site-pages.service';

@Module({
  imports: [SitePagesModule],
  controllers: [PublicSitePagesController],
  providers: [PublicSitePagesService],
})
export class PublicSitePagesModule {}
