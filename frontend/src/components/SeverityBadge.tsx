import { Severity } from '../types/incident';

const STYLES: Record<Severity, string> = {
  LOW: 'bg-slate-100 text-slate-700',
  MEDIUM: 'bg-amber-100 text-amber-800',
  HIGH: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800',
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[severity]}`}>
      {severity}
    </span>
  );
}
