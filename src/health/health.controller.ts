import {
  Controller,
  Get,
  SerializeOptions,
  ServiceUnavailableException,
  StandardSchemaSerializerInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { healthResponseSchema } from './health.schemas';

@ApiTags('health')
@Controller('public/health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Application and database health' })
  @ApiOkResponse({ description: 'Health status' })
  @UseInterceptors(StandardSchemaSerializerInterceptor)
  @SerializeOptions({ schema: healthResponseSchema })
  async getHealth() {
    const result = await this.healthService.check();
    if (result.database === 'down') {
      throw new ServiceUnavailableException(result);
    }
    return result;
  }
}
