import { useState } from 'react';
import { useIncidents } from '../hooks/useIncidents';
import { useIncidentStream } from '../hooks/useIncidentStream';
import { useStats } from '../hooks/useStats';
import { useTimeseries } from '../hooks/useTimeseries';
import { Range } from '../lib/timeRange';
import { IncidentFilters as Filters } from '../types/incident';
import { IncidentCharts } from './IncidentCharts';
import { IncidentDetailDrawer } from './IncidentDetailDrawer';
import { IncidentFilters } from './IncidentFilters';
import { IncidentTable } from './IncidentTable';
import { LiveIndicator } from './LiveIndicator';
import { Pagination } from './Pagination';
import { SummaryCards } from './SummaryCards';
import { TimeRangeControl } from './TimeRangeControl';

const INITIAL_FILTERS: Filters = { page: 1, pageSize: 20 };

export function Dashboard() {
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [range, setRange] = useState<Range>('24h');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const incidents = useIncidents(filters, range);
  const stats = useStats(range);
  const timeseries = useTimeseries(range);
  const { connected, eventCount } = useIncidentStream();

  const setFilter = (patch: Partial<Filters>) => setFilters({ ...filters, ...patch, page: 1 });
  const setPage = (page: number) => setFilters({ ...filters, page });

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900">Traffic Incident Dashboard</h1>
        <div className="flex items-center gap-4">
          <TimeRangeControl value={range} onChange={setRange} />
          <LiveIndicator connected={connected} eventCount={eventCount} />
        </div>
      </header>

      <SummaryCards stats={stats.data} />
      <IncidentCharts data={timeseries.data} />

      <IncidentFilters filters={filters} onChange={setFilter} />

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {incidents.isError ? (
          <p className="p-8 text-center text-red-600">Failed to load incidents.</p>
        ) : (
          <IncidentTable
            incidents={incidents.data?.data ?? []}
            onSelect={(incident) => setSelectedId(incident.id)}
          />
        )}
        {incidents.data && (
          <Pagination
            page={incidents.data.page}
            pageSize={incidents.data.pageSize}
            total={incidents.data.total}
            onPageChange={setPage}
          />
        )}
      </div>

      {selectedId && (
        <IncidentDetailDrawer incidentId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}
