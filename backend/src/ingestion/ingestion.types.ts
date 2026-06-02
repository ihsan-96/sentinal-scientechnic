import { EventType, IncidentStatus, Severity } from '../incidents/incident.enums';

export interface OpenJob {
  kind: 'open';
  id: string;
  deviceId: string;
  location: string;
  eventType: EventType;
  severity: Severity;
  occurredAt: string;
}

export interface StatusJob {
  kind: 'status';
  id: string;
  status: IncidentStatus;
  occurredAt: string;
}

export type IngestionJob = OpenJob | StatusJob;
