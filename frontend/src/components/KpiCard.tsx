import { IncidentStats } from '../types/incident';
import { Sparkline } from './Sparkline';

interface KpiCardProps {
  label: string;
  value: number | undefined;
  spark: number[];
  /** Semantic content tone for the value and sparkline (defaults to neutral). */
  color?: string;
}

function KpiCard({ label, value, spark, color }: KpiCardProps) {
  return (
    <div className="card kpi" style={{ padding: 'calc(var(--u) * 2)' }}>
      <span className="label-caps">{label}</span>
      <span className="kpi-val" style={color ? { color } : undefined}>
        {value ?? '—'}
      </span>
      <Sparkline points={spark} color={color ?? 'var(--text-faint)'} />
    </div>
  );
}

export interface KpiSparks {
  total: number[];
  open: number[];
  resolved: number[];
  crit: number[];
}

interface KpiRowProps {
  stats?: IncidentStats;
  sparks: KpiSparks;
}

export function KpiRow({ stats, sparks }: KpiRowProps) {
  // "Active" = all non-resolved cases (the API's `open` counts the OPEN status only).
  const active = stats ? stats.total - stats.resolved : undefined;
  return (
    <div className="kpi-grid">
      <KpiCard label="Total Incidents" value={stats?.total} spark={sparks.total} />
      <KpiCard label="Active" value={active} spark={sparks.open} color="var(--high-muted)" />
      <KpiCard label="Resolved" value={stats?.resolved} spark={sparks.resolved} color="var(--accent)" />
      <KpiCard label="Critical" value={stats?.bySeverity.CRITICAL} spark={sparks.crit} color="var(--danger-muted)" />
    </div>
  );
}
