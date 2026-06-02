import { IncidentStatus } from '../types/incident';

export function StatusBadge({ status }: { status: IncidentStatus }) {
  return <span className={`badge st-${status}`}>{status.replace('_', ' ')}</span>;
}
