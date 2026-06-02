import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IncidentEventRow, IncidentRow } from '../db/schema';
import { Paginated } from '../common/pagination';
import { QueryIncidentsDto } from './dto/query-incidents.dto';
import { IncidentsRepository } from './incidents.repository';
import {
  IncidentCreatedEvent,
  IncidentEvents,
  IncidentUpdatedEvent,
} from './incident.events';
import { EventType, IncidentStatus, Severity } from './incident.enums';

export interface OpenCaseInput {
  id: string;
  deviceId: string;
  location: string;
  eventType: EventType;
  severity: Severity;
  occurredAt: Date;
}

export type IncidentWithTimeline = IncidentRow & { events: IncidentEventRow[] };

@Injectable()
export class IncidentsService {
  constructor(
    private readonly repository: IncidentsRepository,
    private readonly events: EventEmitter2,
  ) {}

  async openCase(input: OpenCaseInput): Promise<void> {
    const incident = await this.repository.openCase({
      ...input,
      status: IncidentStatus.OPEN,
      lastEventAt: input.occurredAt,
    });
    if (incident) this.events.emit(IncidentEvents.Created, new IncidentCreatedEvent(incident));
  }

  async applyStatusEvent(
    id: string,
    status: IncidentStatus,
    occurredAt: Date,
  ): Promise<IncidentRow> {
    const incident = await this.repository.applyStatusEvent(id, status, occurredAt);
    if (!incident) throw new NotFoundException(`Incident ${id} not found`);
    this.events.emit(IncidentEvents.Updated, new IncidentUpdatedEvent(incident));
    return incident;
  }

  list(query: QueryIncidentsDto): Promise<Paginated<IncidentRow>> {
    return this.repository.findMany(query);
  }

  async getById(id: string): Promise<IncidentWithTimeline> {
    const incident = await this.repository.findById(id);
    if (!incident) throw new NotFoundException(`Incident ${id} not found`);
    const events = await this.repository.findEvents(id);
    return { ...incident, events };
  }

  deleteAll(): Promise<number> {
    return this.repository.deleteAll();
  }
}
