// Main dashboard app — state, live stream, layout, and all variation tweaks.
const { useState, useEffect, useRef, useMemo, useCallback } = React;
const DATA = window.INCIDENT_DATA;

const RANGES = ['1h', '6h', '24h', '7d', 'all'];
const RANGE_LABELS = { '1h': '1H', '6h': '6H', '24h': '24H', '7d': '7D', all: 'ALL' };

// accent hex -> lighter companion for the gradient
const ACCENT_SOFT = {
  '#006666': '#0a7a7a',
  '#3a4a9e': '#4659b8',
  '#7a3a6e': '#924684',
  '#3f4756': '#4d5666',
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "neu": 1,
  "accent": "#006666",
  "density": "comfortable",
  "radius": 10,
  "font": "mono",
  "layout": "sidebar",
  "kpiVariant": "sparkline",
  "chartStyle": "area",
  "tableDensity": "comfortable",
  "detailMode": "drawer",
  "colorMode": "color",
  "liveTicker": true
}/*EDITMODE-END*/;

// spawn a fresh random incident for the live stream
let spawnSeed = 9001;
function spawn() {
  spawnSeed = (spawnSeed * 1103515245 + 12345) & 0x7fffffff;
  const r = () => ((spawnSeed = (spawnSeed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const sev = (() => { const x = r(); return x < 0.4 ? 'LOW' : x < 0.7 ? 'MEDIUM' : x < 0.88 ? 'HIGH' : 'CRITICAL'; })();
  const ev = DATA.EVENT_TYPES[Math.floor(r() * DATA.EVENT_TYPES.length)];
  const loc = DATA.LOCATIONS[Math.floor(r() * DATA.LOCATIONS.length)];
  const now = new Date().toISOString();
  const id = 'INC-' + (5200 + Math.floor(r() * 4000));
  return {
    id, deviceId: 'CAM-' + (2000 + Math.floor(r() * 7000)), location: loc, eventType: ev,
    severity: sev, status: 'OPEN', occurredAt: now, lastEventAt: now, createdAt: now, updatedAt: now,
    events: [{ id: id + '-0', status: 'OPEN', occurredAt: now }],
  };
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [nav, setNav] = useState('overview');
  const [range, setRange] = useState('24h');
  const [filters, setFilters] = useState({ page: 1 });
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const [incidents, setIncidents] = useState(() => DATA.incidents.slice());
  const [feed, setFeed] = useState([]);
  const [flash, setFlash] = useState(null);

  // ---- apply style tweaks to :root ----
  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty('--neu', String(t.neu));
    const a = t.accent;
    root.setProperty('--accent', a);
    root.setProperty('--accent-soft', ACCENT_SOFT[a] || a);
    root.setProperty('--radius', t.radius + 'px');
    const compact = t.density === 'compact';
    root.setProperty('--u', compact ? '6px' : '8px');
    const sans = "'Inter', system-ui, -apple-system, sans-serif";
    if (t.font === 'sans') {
      root.setProperty('--font-body', sans);
      root.setProperty('--font-display', sans);
    } else {
      root.setProperty('--font-body', "'Space Mono', monospace");
      root.setProperty('--font-display', "'Space Mono', monospace");
    }
  }, [t.neu, t.accent, t.radius, t.density, t.font]);

  useEffect(() => {
    document.documentElement.style.setProperty('--row-h', t.tableDensity === 'compact' ? '40px' : '50px');
  }, [t.tableDensity]);

  // ---- live stream ----
  useEffect(() => {
    let timer;
    const tick = () => {
      const inc = spawn();
      setIncidents((prev) => [inc, ...prev]);
      setFeed((prev) => [{ ...inc, key: inc.id + '-' + Date.now(), at: inc.occurredAt }, ...prev].slice(0, 12));
      setFlash(inc.id);
      setTimeout(() => setFlash(null), 1400);
      timer = setTimeout(tick, 4500 + Math.random() * 5000);
    };
    timer = setTimeout(tick, 3500);
    return () => clearTimeout(timer);
  }, []);

  // ---- derived data ----
  const RANGE_MS = { '1h': 3600000, '6h': 6 * 3600000, '24h': 86400000, '7d': 7 * 86400000, all: 30 * 86400000 };
  const inRange = useMemo(() => {
    const cutoff = Date.now() - RANGE_MS[range];
    return range === 'all' ? incidents : incidents.filter((i) => new Date(i.occurredAt).getTime() >= cutoff);
  }, [incidents, range]);

  const stats = useMemo(() => DATA.computeStats(inRange), [inRange]);
  const timeseries = useMemo(() => DATA.getTimeseries(range), [range, incidents.length]);

  // KPI sparkline data
  const sparks = useMemo(() => ({
    total: timeseries.map((p) => p.opened + p.resolved),
    open: timeseries.map((p) => p.active),
    resolved: timeseries.map((p) => p.resolved),
    crit: timeseries.map((p) => p.bySeverity.CRITICAL),
  }), [timeseries]);

  // ---- filtering ----
  const filtered = useMemo(() => {
    return inRange.filter((i) => {
      if (filters.severity && i.severity !== filters.severity) return false;
      if (filters.status && i.status !== filters.status) return false;
      if (filters.eventType && i.eventType !== filters.eventType) return false;
      if (filters.q) {
        const q = filters.q.toLowerCase();
        if (!i.location.toLowerCase().includes(q) && !i.deviceId.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [inRange, filters]);

  const PAGE_SIZE = t.tableDensity === 'compact' ? 12 : 9;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageClamped = Math.min(page, totalPages);
  const pageItems = filtered.slice((pageClamped - 1) * PAGE_SIZE, pageClamped * PAGE_SIZE);

  const setFilter = (patch) => { setFilters((f) => ({ ...f, ...patch })); setPage(1); };

  // ---- status mutations ----
  const setStatus = useCallback((id, status) => {
    setIncidents((prev) => prev.map((i) => {
      if (i.id !== id) return i;
      const now = new Date().toISOString();
      const events = i.events.some((e) => e.status === status) ? i.events : [...i.events, { id: id + '-' + status, status, occurredAt: now }];
      return { ...i, status, lastEventAt: now, updatedAt: now, events };
    }));
  }, []);
  const advance = setStatus;

  const selected = incidents.find((i) => i.id === selectedId) || null;

  // close detail on Esc
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') setSelectedId(null); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const isInline = t.detailMode === 'inline' && selected;
  const navTitle = { overview: 'Operations Overview', incidents: 'Incident Queue', map: 'Live Map', devices: 'Device Fleet', alerts: 'Alert Rules', settings: 'Settings' }[nav];

  return (
    <div className={`app ${t.layout === 'topnav' ? 'topnav' : ''}`}>
      {t.layout !== 'topnav' && <Sidebar active={nav} onNav={setNav} stats={stats} />}

      <div className="main">
        {t.layout === 'topnav' && <TopNav active={nav} onNav={setNav} stats={stats} />}

        <header className="topbar">
          <div>
            <h1>{navTitle}</h1>
            <div className="sub">{stats.open} active · {stats.total} in range · updated {feed.length ? relTime(feed[0].at) : 'now'}</div>
          </div>
          <div className="row gap2">
            <Segmented options={RANGES} value={range} onChange={(r) => { setRange(r); setPage(1); }} labels={RANGE_LABELS} />
            <div className="row" style={{ gap: 8, fontFamily: 'var(--font-mono)', fontSize: 11.5, fontWeight: 600, color: 'var(--text-soft)' }}>
              <span className="live-dot" /> LIVE
            </div>
          </div>
        </header>

        <div className="scroll">
          {nav === 'overview' || nav === 'incidents' ? (
            <MainContent
              t={t} nav={nav} stats={stats} timeseries={timeseries} sparks={sparks}
              feed={feed} filters={filters} setFilter={setFilter} filtered={filtered}
              pageItems={pageItems} selectedId={selectedId} setSelectedId={setSelectedId}
              advance={advance} flash={flash}
              page={pageClamped} totalPages={totalPages} setPage={setPage}
              selected={selected} setStatus={setStatus} isInline={isInline}
            />
          ) : (
            <Placeholder title={navTitle} />
          )}
        </div>
      </div>

      {/* overlay detail modes */}
      {selected && t.detailMode !== 'inline' && (
        <Detail incident={selected} mode={t.detailMode} onClose={() => setSelectedId(null)} onAdvance={advance} onSetStatus={setStatus} />
      )}

      <TweaksUI t={t} setTweak={setTweak} />
    </div>
  );
}

// ---- main content area ----
function MainContent(props) {
  const { t, nav, stats, timeseries, sparks, feed, filters, setFilter, filtered, pageItems, selectedId, setSelectedId, advance, flash, page, totalPages, setPage, selected, setStatus, isInline } = props;
  const showOverview = nav === 'overview';

  const tableCard = (
    <div className="card" style={{ padding: 'calc(var(--u)*2)' }}>
      <div className="card-head">
        <span className="card-title">Incidents</span>
        <Pagination page={page} totalPages={totalPages} setPage={setPage} count={filtered.length} />
      </div>
      <FiltersBar filters={filters} onChange={setFilter} count={filtered.length} showChips={true} />
      <div style={{ marginTop: 14 }}>
        <IncidentTable incidents={pageItems} onSelect={(i) => setSelectedId(i.id)} selectedId={selectedId}
          density={t.tableDensity} colorMode={t.colorMode} onAdvance={advance} inlineActions={true} />
      </div>
    </div>
  );

  return (
    <>
      {showOverview && <KpiRow stats={stats} variant={t.kpiVariant} sparks={sparks} />}

      {showOverview && (
        <div style={{ display: 'grid', gridTemplateColumns: t.liveTicker ? '1fr 320px' : '1fr', gap: 'calc(var(--u)*2.5)' }}>
          <div className="card">
            <div className="card-head">
              <span className="card-title">{t.chartStyle === 'line' ? 'Opened · Resolved · Active' : 'Incident Volume by Severity'}</span>
              <span className="label-caps">per bucket</span>
            </div>
            <ChartArea style={t.chartStyle} points={timeseries} />
          </div>
          {t.liveTicker && <LiveTicker feed={feed} />}
        </div>
      )}

      {showOverview && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'calc(var(--u)*2.5)' }}>
          <div className="card">
            <div className="card-head"><span className="card-title">Severity Mix</span></div>
            <Donut data={stats.bySeverity} colorMap={SEV_COLOR} label="total" />
          </div>
          <div className="card">
            <div className="card-head"><span className="card-title">Status Breakdown</span></div>
            <Donut data={stats.byStatus} colorMap={STATUS_COLOR} label="total" />
          </div>
        </div>
      )}

      {/* table + optional inline detail */}
      {isInline ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 400px', gap: 'calc(var(--u)*2.5)', alignItems: 'start' }}>
          {tableCard}
          <Detail incident={selected} mode="inline" onClose={() => setSelectedId(null)} onAdvance={advance} onSetStatus={setStatus} />
        </div>
      ) : tableCard}
    </>
  );
}

function KpiRow({ stats, variant, sparks }) {
  const cards = [
    { label: 'Total Incidents', value: stats.total, delta: '+12%', deltaDir: 'up', spark: sparks.total, icon: Icons.Activity },
    { label: 'Active', value: stats.open, delta: '+5', deltaDir: 'up', accent: true, spark: sparks.open, icon: Icons.Bell },
    { label: 'Resolved', value: stats.resolved, delta: '+18%', deltaDir: 'down', spark: sparks.resolved, icon: Icons.Check },
    { label: 'Critical', value: stats.bySeverity.CRITICAL, delta: stats.bySeverity.CRITICAL > 6 ? 'high' : 'ok', deltaDir: stats.bySeverity.CRITICAL > 6 ? 'up' : 'flat', spark: sparks.crit, icon: Icons.Alert },
  ];
  if (variant === 'minimal') {
    return (
      <div className="card kpi-grid" style={{ padding: 'calc(var(--u)*2.5)' }}>
        {cards.map((c) => <KpiCard key={c.label} {...c} variant="minimal" />)}
      </div>
    );
  }
  return (
    <div className="kpi-grid">
      {cards.map((c) => <KpiCard key={c.label} {...c} variant={variant} />)}
    </div>
  );
}

// chart style switcher
function ChartArea({ style, points }) {
  if (style === 'tiles') return <SparkTiles points={points} />;
  return <TimeseriesChart points={points} mode={style === 'line' ? 'line' : 'area'} tooltips={true} />;
}

function SparkTiles({ points }) {
  const tiles = [
    { label: 'Opened', data: points.map((p) => p.opened), color: '#0a8a8a' },
    { label: 'Resolved', data: points.map((p) => p.resolved), color: 'var(--success)' },
    { label: 'Active', data: points.map((p) => p.active), color: '#c66' },
    { label: 'Critical', data: points.map((p) => p.bySeverity.CRITICAL), color: 'var(--danger)' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 'calc(var(--u)*1.5)' }}>
      {tiles.map((tl) => {
        const total = tl.data.reduce((s, v) => s + v, 0);
        const last = tl.data[tl.data.length - 1] || 0;
        return (
          <div key={tl.label} className="neu-sunk" style={{ borderRadius: 'var(--radius)', padding: 16 }}>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
              <span className="label-caps">{tl.label}</span>
              <span className="mono" style={{ fontSize: 11, fontWeight: 700 }}>{total}</span>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{last}<span className="faint" style={{ fontSize: 11, fontWeight: 400 }}> now</span></div>
            <Sparkline points={tl.data} color={tl.color} h={34} />
          </div>
        );
      })}
    </div>
  );
}

function Pagination({ page, totalPages, setPage, count }) {
  return (
    <div className="row" style={{ gap: 8 }}>
      <button className="btn btn-icon" disabled={page <= 1} style={{ opacity: page <= 1 ? 0.4 : 1 }} onClick={() => setPage(page - 1)}><Icons.ChevronLeft size={15} /></button>
      <span className="mono faint" style={{ fontSize: 11, minWidth: 54, textAlign: 'center' }}>{page} / {totalPages}</span>
      <button className="btn btn-icon" disabled={page >= totalPages} style={{ opacity: page >= totalPages ? 0.4 : 1 }} onClick={() => setPage(page + 1)}><Icons.ChevronRight size={15} /></button>
    </div>
  );
}

// top nav variant
function TopNav({ active, onNav, stats }) {
  const items = [
    { id: 'overview', label: 'Overview', icon: Icons.Grid },
    { id: 'incidents', label: 'Incidents', icon: Icons.List },
    { id: 'map', label: 'Live Map', icon: Icons.Map },
    { id: 'devices', label: 'Devices', icon: Icons.Pin },
    { id: 'alerts', label: 'Alerts', icon: Icons.Bell },
  ];
  return (
    <div className="topnav-bar row" style={{ padding: 'calc(var(--u)*1.5) calc(var(--u)*3)', gap: 'calc(var(--u)*3)', boxShadow: 'inset 0 calc(var(--d1)*-1) var(--b1) var(--neu-dark)' }}>
      <div className="brand" style={{ padding: 0 }}>
        <span className="brand-mark neu-raise-sm"><Icons.Activity size={20} sw={2.4} /></span>
        <div><div className="brand-name">SENTINEL</div></div>
      </div>
      <nav className="row" style={{ gap: 4 }}>
        {items.map((it) => (
          <button key={it.id} className={`nav-item ${active === it.id ? 'active' : ''}`} style={{ width: 'auto' }} onClick={() => onNav(it.id)}>
            <it.icon size={17} /><span>{it.label}</span>
          </button>
        ))}
      </nav>
      <span className="spacer" />
      <div className="neu-sunk row" style={{ padding: '8px 14px', borderRadius: 99, gap: 8 }}>
        <span className="live-dot" /><span className="label-caps" style={{ color: 'var(--success)' }}>218 live</span>
      </div>
    </div>
  );
}

function Placeholder({ title }) {
  return (
    <div className="card" style={{ display: 'grid', placeItems: 'center', minHeight: 360, textAlign: 'center' }}>
      <div>
        <div className="neu-sunk" style={{ width: 64, height: 64, borderRadius: 16, display: 'grid', placeItems: 'center', margin: '0 auto 18px', color: 'var(--text-faint)' }}>
          <Icons.Sliders size={28} />
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>{title}</div>
        <div className="faint mono" style={{ fontSize: 12, marginTop: 8, maxWidth: 320 }}>This section is scaffolded. The Overview and Incidents views are fully interactive.</div>
      </div>
    </div>
  );
}

// ---- Tweaks panel ----
function TweaksUI({ t, setTweak }) {
  return (
    <TweaksPanel>
      <TweakSection label="Variations" />
      <TweakRadio label="Layout" value={t.layout} options={['sidebar', 'topnav']} onChange={(v) => setTweak('layout', v)} />
      <TweakSelect label="KPI cards" value={t.kpiVariant} options={['sparkline', 'icon', 'minimal']} onChange={(v) => setTweak('kpiVariant', v)} />
      <TweakSelect label="Chart style" value={t.chartStyle} options={['area', 'line', 'tiles']} onChange={(v) => setTweak('chartStyle', v)} />
      <TweakSelect label="Detail view" value={t.detailMode} options={['drawer', 'modal', 'inline']} onChange={(v) => setTweak('detailMode', v)} />
      <TweakRadio label="Severity color" value={t.colorMode} options={['color', 'mono']} onChange={(v) => setTweak('colorMode', v)} />
      <TweakRadio label="Table rows" value={t.tableDensity} options={['comfortable', 'compact']} onChange={(v) => setTweak('tableDensity', v)} />
      <TweakToggle label="Live feed ticker" value={t.liveTicker} onChange={(v) => setTweak('liveTicker', v)} />

      <TweakSection label="Style" />
      <TweakSlider label="Shadow depth" value={t.neu} min={0} max={1.6} step={0.1} onChange={(v) => setTweak('neu', v)} />
      <TweakSlider label="Corner radius" value={t.radius} min={2} max={20} step={1} unit="px" onChange={(v) => setTweak('radius', v)} />
      <TweakRadio label="Density" value={t.density} options={['comfortable', 'compact']} onChange={(v) => setTweak('density', v)} />
      <TweakRadio label="Font" value={t.font} options={['mono', 'sans']} onChange={(v) => setTweak('font', v)} />
      <TweakColor label="Accent" value={t.accent} options={['#006666', '#3a4a9e', '#7a3a6e', '#3f4756']} onChange={(v) => setTweak('accent', v)} />
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
