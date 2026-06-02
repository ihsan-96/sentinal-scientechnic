import { IncidentStatus } from '../types/incident';

const STYLES: Record<IncidentStatus, string> = {
  OPEN: 'bg-blue-100 text-blue-800',
  ACKNOWLEDGED: 'bg-indigo-100 text-indigo-800',
  IN_PROGRESS: 'bg-purple-100 text-purple-800',
  RESOLVED: 'bg-green-100 text-green-800',
};

export function StatusBadge({ status }: { status: IncidentStatus }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[status]}`}>
      {status.replace('_', ' ')}
    </span>
  );
}
