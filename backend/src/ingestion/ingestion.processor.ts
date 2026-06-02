import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { IncidentsService } from '../incidents/incidents.service';
import { INGESTION_QUEUE } from './ingestion.constants';
import { IngestionJob } from './ingestion.types';

@Processor(INGESTION_QUEUE, {
  concurrency: Number(process.env.INGESTION_CONCURRENCY ?? 10),
})
export class IngestionProcessor extends WorkerHost {
  constructor(private readonly incidents: IncidentsService) {
    super();
  }

  async process(job: Job<IngestionJob>): Promise<void> {
    const data = job.data;
    if (data.kind === 'open') {
      await this.incidents.openCase({
        id: data.id,
        deviceId: data.deviceId,
        location: data.location,
        eventType: data.eventType,
        severity: data.severity,
        occurredAt: new Date(data.occurredAt),
      });
    } else {
      await this.incidents.applyStatusEvent(data.id, data.status, new Date(data.occurredAt));
    }
  }
}
