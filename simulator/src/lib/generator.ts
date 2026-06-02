import { EVENT_TYPES, OpenPayload, Overrides, ROADS, Severity, StatusStep } from '../types';
import { uuidv7 } from './uuidv7';

const DEVICE_PREFIXES = ['CAM', 'SENSOR', 'ITS'];
const LIFECYCLE = ['ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED'] as const;

const SEVERITY_WEIGHTS: [Severity, number][] = [
  ['LOW', 45],
  ['MEDIUM', 35],
  ['HIGH', 15],
  ['CRITICAL', 5],
];

const pick = <T>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)];

function weightedPick<T>(weights: [T, number][]): T {
  const total = weights.reduce((sum, [, w]) => sum + w, 0);
  let roll = Math.random() * total;
  for (const [value, weight] of weights) {
    if ((roll -= weight) <= 0) return value;
  }
  return weights[0][0];
}

function randomDevice(): string {
  const id = String(Math.floor(Math.random() * 200) + 1).padStart(3, '0');
  return `${pick(DEVICE_PREFIXES)}-${id}`;
}

export function buildOpen(overrides: Overrides = {}): OpenPayload {
  return {
    id: uuidv7(),
    deviceId: overrides.device || randomDevice(),
    location: overrides.location ?? pick(ROADS),
    eventType: overrides.eventType ?? pick(EVENT_TYPES),
    severity: overrides.severity ?? weightedPick(SEVERITY_WEIGHTS),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Status steps after the open, advancing to a random stage so cases settle across
 * ACKNOWLEDGED / IN_PROGRESS / RESOLVED. Timestamps are spaced a minute apart.
 */
export function lifecycleSteps(): StatusStep[] {
  const stages = LIFECYCLE.slice(0, 1 + Math.floor(Math.random() * LIFECYCLE.length));
  const base = Date.now();
  return stages.map((status, i) => ({
    status,
    timestamp: new Date(base + (i + 1) * 60_000).toISOString(),
  }));
}
