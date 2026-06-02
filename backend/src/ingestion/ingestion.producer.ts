import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { INGESTION_JOB, INGESTION_QUEUE } from './ingestion.constants';
import { OpenJob, StatusJob } from './ingestion.types';

// Status events may reach the worker before the case's open is committed, so they retry.
const STATUS_OPTS = { attempts: 5, backoff: { type: 'exponential', delay: 200 } };

@Injectable()
export class IngestionProducer {
  constructor(@InjectQueue(INGESTION_QUEUE) private readonly queue: Queue) {}

  enqueueOpen(job: OpenJob): Promise<unknown> {
    return this.queue.add(INGESTION_JOB, job);
  }

  enqueueOpenBatch(jobs: OpenJob[]): Promise<unknown> {
    return this.queue.addBulk(jobs.map((data) => ({ name: INGESTION_JOB, data })));
  }

  enqueueStatus(job: StatusJob): Promise<unknown> {
    return this.queue.add(INGESTION_JOB, job, STATUS_OPTS);
  }
}
