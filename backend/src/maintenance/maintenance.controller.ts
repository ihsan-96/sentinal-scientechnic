import { Controller, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MaintenanceService } from './maintenance.service';

@ApiTags('maintenance')
@Controller('incidents')
export class MaintenanceController {
  constructor(private readonly maintenance: MaintenanceService) {}

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete ALL incidents, drain the ingestion queue, reset stats cache' })
  @ApiOkResponse({ description: 'Number of incidents cleared' })
  async clear() {
    return { cleared: await this.maintenance.clearAll() };
  }
}
