import { Module } from '@nestjs/common';
import { PublicationsModule } from '../../domain/publications/publications.module';
import { PublicPublicationsController } from './public-publications.controller';
import { PublicPublicationsService } from './public-publications.service';

@Module({
  imports: [PublicationsModule],
  controllers: [PublicPublicationsController],
  providers: [PublicPublicationsService],
  exports: [PublicPublicationsService],
})
export class PublicPublicationsModule {}
