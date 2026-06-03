import { Icons } from '../lib/icons';
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
  count: number;
}

// Saved views: only severity/status presets the backend `GET /incidents` supports.
// (An event-type preset like "Accidents" is a future expansion; the list API has no
// eventType filter yet.)
type SavedPatch = Pick<Filters, 'severity' | 'status'>;
const SAVED_VIEWS: { id: string; label: string; patch: SavedPatch }[] = [
  { id: 'crit', label: 'Critical Open', patch: { severity: 'CRITICAL', status: 'OPEN' } },
  { id: 'triage', label: 'Needs Triage', patch: { status: 'OPEN' } },
  { id: 'progress', label: 'In Progress', patch: { status: 'IN_PROGRESS' } },
];

export function IncidentFilters({ filters, onChange, count }: Props) {
  const activeKeys = (['severity', 'status'] as const).filter((k) => filters[k]);
  const isActive = (patch: SavedPatch) => {
    const keys = Object.keys(patch) as (keyof SavedPatch)[];
    return keys.length === activeKeys.length && keys.every((k) => filters[k] === patch[k]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="row" style={{ gap: 9, flexWrap: 'wrap' }}>
        <span className="label-caps" style={{ marginRight: 2 }}>
          Saved
        </span>
        {SAVED_VIEWS.map((v) => {
          const active = isActive(v.patch);
          return (
            <button
              key={v.id}
              className={`chip ${active ? 'on' : ''}`}
              onClick={() =>
                onChange(active ? { severity: undefined, status: undefined } : { severity: undefined, status: undefined, ...v.patch })
              }
            >
              {v.label}
            </button>
          );
        })}
      </div>

      <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 280 }}>
          <Icons.Search
            size={14}
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }}
          />
          <input
            className="field"
            style={{ width: '100%', paddingLeft: 34 }}
            placeholder="Search device ID…"
            value={filters.deviceId ?? ''}
            onChange={(e) => onChange({ deviceId: e.target.value || undefined })}
          />
        </div>
        <select
          className="field"
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
          className="field"
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
        <span className="spacer" />
        <span className="label-caps" style={{ alignSelf: 'center' }}>
          {count} results
        </span>
      </div>
    </div>
  );
}
