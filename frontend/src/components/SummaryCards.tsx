import { IncidentStats } from '../types/incident';

interface Props {
  stats?: IncidentStats;
}

export function SummaryCards({ stats }: Props) {
  const cards = [
    { label: 'Total', value: stats?.total, accent: 'text-slate-900' },
    { label: 'Open', value: stats?.open, accent: 'text-blue-700' },
    { label: 'Resolved', value: stats?.resolved, accent: 'text-green-700' },
    { label: 'Critical', value: stats?.bySeverity.CRITICAL, accent: 'text-red-700' },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">{card.label}</p>
          <p className={`mt-1 text-2xl font-semibold ${card.accent}`}>{card.value ?? '—'}</p>
        </div>
      ))}
    </div>
  );
}
