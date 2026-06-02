import {
  IncidentFilters as Filters,
  IncidentStatus,
  SEVERITIES,
  Severity,
  STATUSES,
} from '../types/incident';

interface Props {
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
}

const selectClass =
  'rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-400 focus:outline-none';

export function IncidentFilters({ filters, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        className={selectClass}
        value={filters.severity ?? ''}
        onChange={(e) => onChange({ severity: (e.target.value || undefined) as Severity })}
      >
        <option value="">All severities</option>
        {SEVERITIES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <select
        className={selectClass}
        value={filters.status ?? ''}
        onChange={(e) => onChange({ status: (e.target.value || undefined) as IncidentStatus })}
      >
        <option value="">All statuses</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.replace('_', ' ')}
          </option>
        ))}
      </select>

      <input
        className={selectClass}
        placeholder="Device ID"
        value={filters.deviceId ?? ''}
        onChange={(e) => onChange({ deviceId: e.target.value || undefined })}
      />
    </div>
  );
}
