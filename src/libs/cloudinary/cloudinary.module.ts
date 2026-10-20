import { Global, Module } from '@nestjs/common';
import { AppConfigModule } from '../../config/app-config.module';
import { CloudinaryService } from './cloudinary.service';

@Global()
@Module({
  imports: [AppConfigModule],
  providers: [CloudinaryService],
  exports: [CloudinaryService],
})
export class CloudinaryModule {}
