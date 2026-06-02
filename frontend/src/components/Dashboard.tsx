import { useMemo, useState } from 'react';
import { useIncidents } from '../hooks/useIncidents';
import { useIncidentStream } from '../hooks/useIncidentStream';
import { useRecentIncidents } from '../hooks/useRecentIncidents';
import { useStats } from '../hooks/useStats';
import { useTimeseries } from '../hooks/useTimeseries';
import { useUpdateStatus } from '../hooks/useUpdateStatus';
import { relTime } from '../lib/format';
import { SEV_COLOR, STATUS_COLOR } from '../lib/palette';
import { Range } from '../lib/timeRange';
import { IncidentFilters as Filters, IncidentStatus } from '../types/incident';
import { Donut } from './Donut';
import { IncidentDetailDrawer } from './IncidentDetailDrawer';
import { IncidentFilters } from './IncidentFilters';
import { IncidentTable } from './IncidentTable';
import { KpiRow } from './KpiCard';
import { LiveIndicator } from './LiveIndicator';
import { LiveTicker } from './LiveTicker';
import { Pagination } from './Pagination';
import { Placeholder } from './Placeholder';
import { NavId, Sidebar } from './Sidebar';
import { TimeRangeControl } from './TimeRangeControl';
import { TimeseriesChart } from './TimeseriesChart';

const INITIAL_FILTERS: Filters = { page: 1, pageSize: 20 };

const NAV_TITLES: Record<NavId, string> = {
  overview: 'Operations Overview',
  incidents: 'Incident Queue',
  map: 'Live Map',
  devices: 'Device Fleet',
  alerts: 'Alert Rules',
  settings: 'Settings',
};

export function Dashboard() {
  const [nav, setNav] = useState<NavId>('overview');
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [range, setRange] = useState<Range>('24h');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const incidents = useIncidents(filters, range);
  const stats = useStats(range);
  const timeseries = useTimeseries(range);
  const recent = useRecentIncidents();
  const { connected, eventCount } = useIncidentStream();
  const updateStatus = useUpdateStatus();

  const feed = recent.data?.data ?? [];
  // "Active" = all non-resolved cases (the API's `open` is the OPEN status only).
  const active = stats.data ? stats.data.total - stats.data.resolved : 0;

  const setFilter = (patch: Partial<Filters>) => setFilters({ ...filters, ...patch, page: 1 });
  const setPage = (page: number) => setFilters({ ...filters, page });

  const sparks = useMemo(() => {
    const points = timeseries.data?.points ?? [];
    return {
      total: points.map((p) => p.opened + p.resolved),
      open: points.map((p) => p.active),
      resolved: points.map((p) => p.resolved),
      crit: points.map((p) => p.bySeverity.CRITICAL),
    };
  }, [timeseries.data]);

  const advance = (id: string, status: IncidentStatus) => updateStatus.mutate({ id, status });

  const total = incidents.data?.total ?? 0;
  const showOverview = nav === 'overview';
  const isContentTab = nav === 'overview' || nav === 'incidents';

  const tableCard = (
    <div className="card" style={{ padding: 'calc(var(--u)*2)' }}>
      <div className="card-head">
        <span className="card-title">Incidents</span>
        {incidents.data && (
          <Pagination
            page={incidents.data.page}
            pageSize={incidents.data.pageSize}
            total={incidents.data.total}
            onPageChange={setPage}
          />
        )}
      </div>
      <IncidentFilters filters={filters} onChange={setFilter} count={total} />
      <div style={{ marginTop: 14 }}>
        {incidents.isError ? (
          <p style={{ padding: 32, textAlign: 'center', color: 'var(--danger)' }}>Failed to load incidents.</p>
        ) : (
          <IncidentTable
            incidents={incidents.data?.data ?? []}
            onSelect={(incident) => setSelectedId(incident.id)}
            selectedId={selectedId}
            onAdvance={advance}
          />
        )}
      </div>
    </div>
  );

  return (
    <div className="app">
      <Sidebar
        active={nav}
        onNav={setNav}
        criticalCount={stats.data?.bySeverity.CRITICAL}
        connected={connected}
        eventCount={eventCount}
      />

      <div className="main">
        <header className="topbar">
          <div>
            <h1>{NAV_TITLES[nav]}</h1>
            <div className="sub">
              {active} active · {stats.data?.total ?? 0} in range · updated{' '}
              {feed.length ? relTime(feed[0].occurredAt) : 'now'}
            </div>
          </div>
          <div className="row gap2">
            <TimeRangeControl value={range} onChange={(r) => { setRange(r); setPage(1); }} />
            <LiveIndicator connected={connected} />
          </div>
        </header>

        <div className="scroll">
          {!isContentTab ? (
            <Placeholder title={NAV_TITLES[nav]} />
          ) : (
            <>
              {showOverview && <KpiRow stats={stats.data} sparks={sparks} />}

              {showOverview && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'calc(var(--u)*2.5)' }}>
                  <div className="card">
                    <div className="card-head">
                      <span className="card-title">Incident Volume by Severity</span>
                      <span className="label-caps">per bucket</span>
                    </div>
                    <TimeseriesChart points={timeseries.data?.points ?? []} bucket={timeseries.data?.bucket} />
                  </div>
                  <LiveTicker feed={feed} />
                </div>
              )}

              {showOverview && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'calc(var(--u)*2.5)' }}>
                  <div className="card">
                    <div className="card-head">
                      <span className="card-title">Severity Mix</span>
                    </div>
                    {stats.data && <Donut data={stats.data.bySeverity} colorMap={SEV_COLOR} />}
                  </div>
                  <div className="card">
                    <div className="card-head">
                      <span className="card-title">Status Breakdown</span>
                    </div>
                    {stats.data && <Donut data={stats.data.byStatus} colorMap={STATUS_COLOR} />}
                  </div>
                </div>
              )}

              {tableCard}
            </>
          )}
        </div>
      </div>

      {selectedId && <IncidentDetailDrawer incidentId={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  );
}
