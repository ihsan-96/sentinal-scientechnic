import { EventType, Severity } from '../incidents/incident.enums';

const ROADS = [
  'Sheikh Zayed Road',
  'Al Khail Road',
  'Emirates Road',
  'Mohammed Bin Zayed Road',
  'Jumeirah Beach Road',
  'Al Wasl Road',
  'Airport Road',
  'Dubai-Al Ain Road',
];

const DEVICE_PREFIXES = ['CAM', 'SENSOR', 'ITS'];

const SEVERITY_WEIGHTS: [Severity, number][] = [
  [Severity.LOW, 45],
  [Severity.MEDIUM, 35],
  [Severity.HIGH, 15],
  [Severity.CRITICAL, 5],
];

const pick = <T>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)];

const weightedPick = (weights: [Severity, number][]): Severity => {
  const total = weights.reduce((sum, [, w]) => sum + w, 0);
  let roll = Math.random() * total;
  for (const [value, weight] of weights) {
    if ((roll -= weight) <= 0) return value;
  }
  return weights[0][0];
};

export interface GeneratedIncident {
  deviceId: string;
  location: string;
  eventType: EventType;
  severity: Severity;
  timestamp: string;
}

export function randomIncident(): GeneratedIncident {
  const prefix = pick(DEVICE_PREFIXES);
  const id = String(Math.floor(Math.random() * 200) + 1).padStart(3, '0');
  return {
    deviceId: `${prefix}-${id}`,
    location: pick(ROADS),
    eventType: pick(Object.values(EventType)),
    severity: weightedPick(SEVERITY_WEIGHTS),
    timestamp: new Date().toISOString(),
  };
}
