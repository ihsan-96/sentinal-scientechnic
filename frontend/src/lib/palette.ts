// Severity / status color maps used by charts, donuts, and the live ticker.
import { IncidentStatus, Severity } from '../types/incident';

export const SEV_COLOR: Record<Severity, string> = {
  LOW: '#a8acb3',
  MEDIUM: '#fe9900',
  HIGH: '#f06400',
  CRITICAL: '#ff2157',
};

export const STATUS_COLOR: Record<IncidentStatus, string> = {
  OPEN: '#0a8a8a',
  ACKNOWLEDGED: '#3f8f63',
  IN_PROGRESS: '#d99100',
  RESOLVED: '#9aa3ad',
};
