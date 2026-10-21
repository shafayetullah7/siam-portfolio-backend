import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthService } from '../../health/health.service';

@ApiTags('health')
@Controller('public/health')
export class PublicHealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Application and database health' })
  @ApiOkResponse({ description: 'Health status' })
  async getHealth() {
    const result = await this.healthService.check();
    if (result.database === 'down') {
      throw new ServiceUnavailableException(result);
    }
    return result;
  }
}
