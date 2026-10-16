import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { apiSuccess } from '../../common/http/api-response';
import { PublicSiteService } from './public-site.service';

@ApiTags('public-site')
@Controller('public')
export class PublicSiteController {
  constructor(private readonly publicSite: PublicSiteService) {}

  @Get('site')
  @ApiOperation({ summary: 'Site settings and navigation' })
  async getSite() {
    return apiSuccess(await this.publicSite.getSite());
  }

  @Get('home')
  async getHome() {
    return apiSuccess(await this.publicSite.getHome());
  }

  @Get('about')
  async getAbout() {
    return apiSuccess(await this.publicSite.getAbout());
  }
}
