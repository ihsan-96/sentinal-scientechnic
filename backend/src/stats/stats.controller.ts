import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { StatsQueryDto } from './dto/stats-query.dto';
import { TimeseriesQueryDto } from './dto/timeseries-query.dto';
import { StatsService } from './stats.service';

@ApiTags('stats')
@Controller('stats')
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  @Get()
  @ApiOkResponse({ description: 'Summary metrics (windowed when from/to given)' })
  getSummary(@Query() query: StatsQueryDto) {
    return this.stats.getSummary(query);
  }

  @Get('timeseries')
  @ApiOkResponse({ description: 'Bucketed opened / resolved / currently-open + severity volume' })
  getTimeseries(@Query() query: TimeseriesQueryDto) {
    return this.stats.getTimeseries(query);
  }
}
