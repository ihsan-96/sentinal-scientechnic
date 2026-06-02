import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Queue } from 'bullmq';
import { RedisCacheService } from '../cache/redis-cache.service';
import { IncidentEvents } from '../incidents/incident.events';
import { IncidentsService } from '../incidents/incidents.service';
import { INGESTION_QUEUE } from '../ingestion/ingestion.constants';
import { STATS_CACHE_KEY } from '../stats/stats.constants';

@Injectable()
export class MaintenanceService {
  constructor(
    private readonly incidents: IncidentsService,
    @InjectQueue(INGESTION_QUEUE) private readonly queue: Queue,
    private readonly cache: RedisCacheService,
    private readonly events: EventEmitter2,
  ) {}

  async clearAll(): Promise<number> {
    await this.queue.obliterate({ force: true });
    const cleared = await this.incidents.deleteAll();
    await this.cache.del(STATS_CACHE_KEY);
    this.events.emit(IncidentEvents.Cleared);
    return cleared;
  }
}
