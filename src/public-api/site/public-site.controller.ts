import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PublicSiteService } from './public-site.service';

@ApiTags('public-site')
@Controller('public')
export class PublicSiteController {
  constructor(private readonly publicSite: PublicSiteService) {}

  @Get('site')
  @ApiOperation({ summary: 'Site settings and navigation' })
  async getSite() {
    return await this.publicSite.getSite();
  }

  @Get('home')
  async getHome() {
    return await this.publicSite.getHome();
  }

  @Get('about')
  async getAbout() {
    return await this.publicSite.getAbout();
  }
}
