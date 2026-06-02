import { Body, Controller, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiAcceptedResponse, ApiTags } from '@nestjs/swagger';
import { uuidv7 } from '../common/uuidv7';
import { BatchOpenIncidentDto } from '../incidents/dto/batch-open-incident.dto';
import { OpenIncidentDto } from '../incidents/dto/open-incident.dto';
import { StatusEventDto } from '../incidents/dto/status-event.dto';
import { IngestionProducer } from './ingestion.producer';
import { OpenJob } from './ingestion.types';

@ApiTags('ingestion')
@Controller('incidents')
export class IngestionController {
  constructor(private readonly producer: IngestionProducer) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiAcceptedResponse({ description: 'Incident queued; returns the case id' })
  async open(@Body() dto: OpenIncidentDto) {
    const job = this.toOpenJob(dto);
    await this.producer.enqueueOpen(job);
    return { id: job.id };
  }

  @Post('batch')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiAcceptedResponse({ description: 'Incidents queued; returns the case ids' })
  async openBatch(@Body() dto: BatchOpenIncidentDto) {
    const jobs = dto.incidents.map((incident) => this.toOpenJob(incident));
    await this.producer.enqueueOpenBatch(jobs);
    return { accepted: jobs.length, ids: jobs.map((job) => job.id) };
  }

  @Post(':id/events')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiAcceptedResponse({ description: 'Status event queued for the case' })
  async ingestStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: StatusEventDto) {
    await this.producer.enqueueStatus({
      kind: 'status',
      id,
      status: dto.status,
      occurredAt: dto.timestamp ?? new Date().toISOString(),
    });
    return { accepted: 1 };
  }

  private toOpenJob(dto: OpenIncidentDto): OpenJob {
    return {
      kind: 'open',
      id: dto.id ?? uuidv7(),
      deviceId: dto.deviceId,
      location: dto.location,
      eventType: dto.eventType,
      severity: dto.severity,
      occurredAt: dto.timestamp,
    };
  }
}
