// Shared primitives + helpers for the dashboard.

// ---- time helpers ----
function relTime(iso) {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return s + 's ago';
  const m = Math.floor(s / 60);
  if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h ago';
  const d = Math.floor(h / 24);
  return d + 'd ago';
}
function fmtTime(iso) {
  return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function fmtClock(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ---- badges ----
function SeverityBadge({ severity, mono }) {
  if (mono) {
    return (
      <span className="badge" style={{ background: 'var(--surface)', color: 'var(--text-soft)', boxShadow: 'inset 1px 1px 2px var(--neu-dark)' }}>
        <span className="dot" style={{ background: `var(--${severity === 'CRITICAL' ? 'danger' : severity === 'HIGH' ? 'high' : severity === 'MEDIUM' ? 'warning' : 'text-faint'})` }} />
        {severity}
      </span>
    );
  }
  return <span className={`badge sev-${severity}`}><span className="dot" />{severity}</span>;
}

function StatusBadge({ status }) {
  return <span className={`badge st-${status}`}>{status.replace('_', ' ')}</span>;
}

// ---- pill / segmented ----
function Segmented({ options, value, onChange, labels }) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button key={o} className={value === o ? 'on' : ''} onClick={() => onChange(o)}>
          {labels ? labels[o] : o}
        </button>
      ))}
    </div>
  );
}

// ---- KPI card variants ----
function KpiCard({ label, value, delta, deltaDir, spark, accent, variant, icon: IconC }) {
  const deltaCls = deltaDir === 'up' ? 'up' : deltaDir === 'down' ? 'down' : 'flat';
  const DeltaArrow = deltaDir === 'up' ? Icons.ArrowUp : deltaDir === 'down' ? Icons.ArrowDown : null;

  if (variant === 'minimal') {
    return (
      <div className="kpi">
        <span className="label-caps">{label}</span>
        <div className="row" style={{ alignItems: 'baseline', gap: 10 }}>
          <span className="kpi-val" style={accent ? { color: 'var(--accent)' } : {}}>{value}</span>
          {delta != null && (
            <span className={`kpi-delta ${deltaCls}`}>{DeltaArrow && <DeltaArrow size={12} />}{delta}</span>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'icon') {
    return (
      <div className="card kpi" style={{ padding: 'calc(var(--u) * 2)' }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span className="label-caps">{label}</span>
          {IconC && (
            <span className="neu-sunk" style={{ width: 32, height: 32, borderRadius: 8, display: 'grid', placeItems: 'center', color: accent ? 'var(--accent)' : 'var(--text-soft)' }}>
              <IconC size={16} />
            </span>
          )}
        </div>
        <div className="row" style={{ alignItems: 'baseline', gap: 10 }}>
          <span className="kpi-val" style={accent ? { color: 'var(--accent)' } : {}}>{value}</span>
          {delta != null && (
            <span className={`kpi-delta ${deltaCls}`}>{DeltaArrow && <DeltaArrow size={12} />}{delta}</span>
          )}
        </div>
      </div>
    );
  }

  // default: card with sparkline
  return (
    <div className="card kpi" style={{ padding: 'calc(var(--u) * 2)' }}>
      <span className="label-caps">{label}</span>
      <div className="row" style={{ alignItems: 'baseline', gap: 10 }}>
        <span className="kpi-val" style={accent ? { color: 'var(--accent)' } : {}}>{value}</span>
        {delta != null && (
          <span className={`kpi-delta ${deltaCls}`}>{DeltaArrow && <DeltaArrow size={12} />}{delta}</span>
        )}
      </div>
      {spark && <Sparkline points={spark} color={accent ? 'var(--accent)' : 'var(--text-faint)'} />}
    </div>
  );
}

// tiny sparkline
function Sparkline({ points, color = 'var(--accent)', h = 28, w = 120 }) {
  if (!points || points.length < 2) return null;
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const span = max - min || 1;
  const step = w / (points.length - 1);
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${(i * step).toFixed(1)} ${(h - ((p - min) / span) * h).toFixed(1)}`).join(' ');
  const area = `${d} L ${w} ${h} L 0 ${h} Z`;
  const id = 'sg' + Math.round(points[0] * 999 + points.length);
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ marginTop: 4, overflow: 'visible' }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// severity color map for charts/donuts
const SEV_COLOR = { LOW: '#a8acb3', MEDIUM: '#fe9900', HIGH: '#f06400', CRITICAL: '#ff2157' };
const STATUS_COLOR = { OPEN: '#0a8a8a', ACKNOWLEDGED: '#3f8f63', IN_PROGRESS: '#d99100', RESOLVED: '#9aa3ad' };

Object.assign(window, {
  relTime, fmtTime, fmtClock,
  SeverityBadge, StatusBadge, Segmented, KpiCard, Sparkline,
  SEV_COLOR, STATUS_COLOR,
});
