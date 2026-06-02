import { IncidentRow } from '../db/schema';

export const IncidentEvents = {
  Created: 'incident.created',
  Updated: 'incident.updated',
  Cleared: 'incidents.cleared',
} as const;

export class IncidentCreatedEvent {
  constructor(public readonly incident: IncidentRow) {}
}

export class IncidentUpdatedEvent {
  constructor(public readonly incident: IncidentRow) {}
}
