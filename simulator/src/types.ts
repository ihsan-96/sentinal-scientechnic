export const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export const STATUSES = ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED'] as const;
export const EVENT_TYPES = [
  'ACCIDENT',
  'CONGESTION',
  'ROAD_CLOSURE',
  'HAZARD',
  'BREAKDOWN',
] as const;

export const ROADS = [
  'Sheikh Zayed Road',
  'Al Khail Road',
  'Emirates Road',
  'Mohammed Bin Zayed Road',
  'Jumeirah Beach Road',
  'Al Wasl Road',
  'Airport Road',
  'Dubai-Al Ain Road',
] as const;

export type Severity = (typeof SEVERITIES)[number];
export type IncidentStatus = (typeof STATUSES)[number];
export type EventType = (typeof EVENT_TYPES)[number];

export interface OpenPayload {
  id: string;
  deviceId: string;
  location: string;
  eventType: EventType;
  severity: Severity;
  timestamp: string;
}

export interface StatusStep {
  status: IncidentStatus;
  timestamp: string;
}

export interface Overrides {
  severity?: Severity;
  eventType?: EventType;
  device?: string;
  location?: string;
}
