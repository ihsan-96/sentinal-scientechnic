import { IncidentStatus } from '../types/incident';

/** The operator workflow: OPEN → ACKNOWLEDGED → IN_PROGRESS → RESOLVED. */
export const NEXT_STATUS: Record<IncidentStatus, IncidentStatus | null> = {
  OPEN: 'ACKNOWLEDGED',
  ACKNOWLEDGED: 'IN_PROGRESS',
  IN_PROGRESS: 'RESOLVED',
  RESOLVED: null,
};

/** Short verb for the inline "advance" action button. */
export const NEXT_LABEL: Record<IncidentStatus, string | null> = {
  OPEN: 'Ack',
  ACKNOWLEDGED: 'Start',
  IN_PROGRESS: 'Resolve',
  RESOLVED: null,
};
