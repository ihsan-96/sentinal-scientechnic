export const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export const STATUSES = ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED'] as const;
export const EVENT_TYPES = [
  'ACCIDENT',
  'CONGESTION',
  'ROAD_CLOSURE',
  'HAZARD',
  'BREAKDOWN',
] as const;

export type Severity = (typeof SEVERITIES)[number];
export type IncidentStatus = (typeof STATUSES)[number];
export type EventType = (typeof EVENT_TYPES)[number];

export interface Incident {
  id: string;
  deviceId: string;
  location: string;
  eventType: EventType;
  severity: Severity;
  status: IncidentStatus;
  occurredAt: string;
  lastEventAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface IncidentEvent {
  id: string;
  incidentId: string;
  status: IncidentStatus;
  occurredAt: string;
  createdAt: string;
}

export type IncidentDetail = Incident & { events: IncidentEvent[] };

export interface Paginated<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface IncidentFilters {
  severity?: Severity;
  status?: IncidentStatus;
  deviceId?: string;
  page: number;
  pageSize: number;
}

export interface IncidentStats {
  total: number;
  open: number;
  resolved: number;
  bySeverity: Record<Severity, number>;
  byStatus: Record<IncidentStatus, number>;
  byEventType: Record<EventType, number>;
}

export interface TimeseriesPoint {
  t: string;
  opened: number;
  resolved: number;
  active: number;
  bySeverity: Record<Severity, number>;
}

export interface Timeseries {
  bucket: string;
  points: TimeseriesPoint[];
}
