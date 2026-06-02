import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { QueryIncidentsDto } from './dto/query-incidents.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { IncidentsService } from './incidents.service';

@ApiTags('incidents')
@Controller('incidents')
export class IncidentsController {
  constructor(private readonly incidents: IncidentsService) {}

  @Get()
  @ApiOkResponse({ description: 'Paginated, filtered list of incidents' })
  list(@Query() query: QueryIncidentsDto) {
    return this.incidents.list(query);
  }

  @Get(':id')
  @ApiOkResponse({ description: 'A single incident with its status timeline' })
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.incidents.getById(id);
  }

  @Patch(':id/status')
  @ApiOkResponse({ description: 'Updated incident (operator action, applied immediately)' })
  updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateStatusDto) {
    return this.incidents.applyStatusEvent(id, dto.status, new Date());
  }
}
