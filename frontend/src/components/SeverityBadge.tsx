import { Severity } from '../types/incident';

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={`badge sev-${severity}`}>
      <span className="dot" />
      {severity}
    </span>
  );
}
