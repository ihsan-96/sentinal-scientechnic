import { ReactNode } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { SEVERITIES, Severity, Timeseries } from '../types/incident';

const SEVERITY_COLOR: Record<Severity, string> = {
  LOW: '#94a3b8',
  MEDIUM: '#f59e0b',
  HIGH: '#f97316',
  CRITICAL: '#ef4444',
};

const formatTick = (t: string) =>
  new Date(t).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

export function IncidentCharts({ data }: { data?: Timeseries }) {
  const points = data?.points ?? [];
  if (points.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        No activity in this time range.
      </div>
    );
  }

  const volume = points.map((p) => ({ t: p.t, ...p.bySeverity }));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Chart title="Opened by severity">
        <AreaChart data={volume}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="t" tickFormatter={formatTick} fontSize={11} minTickGap={48} />
          <YAxis allowDecimals={false} fontSize={11} width={28} />
          <Tooltip labelFormatter={(label) => formatTick(String(label))} />
          {SEVERITIES.map((s) => (
            <Area key={s} dataKey={s} stackId="sev" stroke={SEVERITY_COLOR[s]} fill={SEVERITY_COLOR[s]} />
          ))}
        </AreaChart>
      </Chart>

      <Chart title="Opened / Resolved / Open">
        <LineChart data={points}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="t" tickFormatter={formatTick} fontSize={11} minTickGap={48} />
          <YAxis allowDecimals={false} fontSize={11} width={28} />
          <Tooltip labelFormatter={(label) => formatTick(String(label))} />
          <Legend />
          <Line name="Opened" dataKey="opened" stroke="#3b82f6" dot={false} />
          <Line name="Resolved" dataKey="resolved" stroke="#22c55e" dot={false} />
          <Line name="Open" dataKey="active" stroke="#6366f1" dot={false} />
        </LineChart>
      </Chart>
    </div>
  );
}

function Chart({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="mb-2 text-sm font-medium text-slate-600">{title}</p>
      <ResponsiveContainer width="100%" height={220}>
        {children as React.ReactElement}
      </ResponsiveContainer>
    </div>
  );
}
