// SVG charts: timeseries (area/line variants) with crosshair + tooltip, donut, distribution bars.

function useHover(points) {
  const [idx, setIdx] = React.useState(null);
  const ref = React.useRef(null);
  const onMove = (e) => {
    const svg = ref.current;
    if (!svg || !points.length) return;
    const rect = svg.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const i = Math.min(points.length - 1, Math.max(0, Math.round(x * (points.length - 1))));
    setIdx(i);
  };
  return { idx, setIdx, ref, onMove, onLeave: () => setIdx(null) };
}

// Stacked area by severity, OR line chart of opened/resolved/active.
function TimeseriesChart({ points, mode, tooltips = true, height = 230 }) {
  const W = 760, H = height, PAD_L = 34, PAD_B = 26, PAD_T = 12, PAD_R = 12;
  const iw = W - PAD_L - PAD_R, ih = H - PAD_T - PAD_B;
  const hover = useHover(points);

  if (!points || points.length === 0) {
    return <div className="faint" style={{ textAlign: 'center', padding: 40, fontFamily: 'var(--font-mono)', fontSize: 12 }}>No activity in this range.</div>;
  }

  const n = points.length;
  const xAt = (i) => PAD_L + (i / (n - 1)) * iw;

  const SEVS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  // domain
  let maxY = 1;
  if (mode === 'line') {
    points.forEach((p) => { maxY = Math.max(maxY, p.opened, p.resolved, p.active); });
  } else {
    points.forEach((p) => { maxY = Math.max(maxY, SEVS.reduce((s, k) => s + p.bySeverity[k], 0)); });
  }
  maxY = Math.ceil(maxY * 1.15);
  const yAt = (v) => PAD_T + ih - (v / maxY) * ih;

  const gridLines = 4;
  const ticks = Array.from({ length: gridLines + 1 }, (_, i) => Math.round((maxY / gridLines) * i));
  const xTicks = [0, Math.floor(n / 3), Math.floor((2 * n) / 3), n - 1];

  let series = [];
  if (mode === 'line') {
    series = [
      { key: 'opened', label: 'Opened', color: '#0a8a8a', get: (p) => p.opened },
      { key: 'resolved', label: 'Resolved', color: 'var(--success)', get: (p) => p.resolved },
      { key: 'active', label: 'Active', color: '#c66', get: (p) => p.active },
    ];
  }

  function linePath(get) {
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(1)} ${yAt(get(p)).toFixed(1)}`).join(' ');
  }

  // stacked area paths
  function stackedAreas() {
    let cum = points.map(() => 0);
    return SEVS.map((sev) => {
      const top = points.map((p, i) => cum[i] + p.bySeverity[sev]);
      const bottom = cum.slice();
      const path =
        top.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(1)} ${yAt(v).toFixed(1)}`).join(' ') +
        ' ' +
        bottom.map((v, i) => `L ${xAt(n - 1 - i).toFixed(1)} ${yAt(bottom[n - 1 - i]).toFixed(1)}`).join(' ') +
        ' Z';
      cum = top;
      return { sev, path, color: SEV_COLOR[sev] };
    });
  }

  const hi = hover.idx;

  return (
    <div style={{ position: 'relative' }}>
      <svg ref={hover.ref} viewBox={`0 0 ${W} ${H}`} width="100%" height={H}
        onMouseMove={tooltips ? hover.onMove : undefined} onMouseLeave={hover.onLeave}
        style={{ display: 'block', overflow: 'visible' }}>
        {/* grid */}
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={PAD_L} x2={W - PAD_R} y1={yAt(t)} y2={yAt(t)} stroke="var(--line)" strokeWidth="1" strokeDasharray={i === 0 ? '0' : '2 4'} />
            <text x={PAD_L - 8} y={yAt(t) + 3} textAnchor="end" fontSize="9.5" fontFamily="var(--font-mono)" fill="var(--text-faint)">{t}</text>
          </g>
        ))}
        {xTicks.map((i) => (
          <text key={i} x={xAt(i)} y={H - 8} textAnchor="middle" fontSize="9.5" fontFamily="var(--font-mono)" fill="var(--text-faint)">
            {new Date(points[i].t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </text>
        ))}

        {mode === 'line' ? (
          series.map((s) => (
            <g key={s.key}>
              <path d={linePath(s.get)} fill="none" stroke={s.color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
            </g>
          ))
        ) : (
          stackedAreas().map((a) => (
            <path key={a.sev} d={a.path} fill={a.color} fillOpacity="0.82" stroke={a.color} strokeWidth="0.5" />
          ))
        )}

        {/* crosshair */}
        {hi != null && (
          <g>
            <line x1={xAt(hi)} x2={xAt(hi)} y1={PAD_T} y2={PAD_T + ih} stroke="var(--text-soft)" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
            {mode === 'line'
              ? series.map((s) => <circle key={s.key} cx={xAt(hi)} cy={yAt(s.get(points[hi]))} r="4" fill="var(--surface)" stroke={s.color} strokeWidth="2.2" />)
              : <circle cx={xAt(hi)} cy={yAt(SEVS.reduce((acc, k) => acc + points[hi].bySeverity[k], 0))} r="3.5" fill="var(--text)" />}
          </g>
        )}
      </svg>

      {/* legend */}
      <div className="row" style={{ gap: 16, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        {(mode === 'line' ? series.map((s) => ({ label: s.label, color: s.color })) : SEVS.map((s) => ({ label: s, color: SEV_COLOR[s] }))).map((l) => (
          <span key={l.label} className="row" style={{ gap: 6, fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--text-soft)', fontWeight: 600, letterSpacing: '0.04em' }}>
            <span style={{ width: 9, height: 9, borderRadius: 3, background: l.color }} />{l.label}
          </span>
        ))}
      </div>

      {/* tooltip */}
      {tooltips && hi != null && (
        <ChartTooltip points={points} hi={hi} xAt={xAt} mode={mode} W={W} SEVS={SEVS} series={series} />
      )}
    </div>
  );
}

function ChartTooltip({ points, hi, xAt, mode, W, SEVS, series }) {
  const p = points[hi];
  const leftPct = (xAt(hi) / W) * 100;
  const flip = leftPct > 62;
  const rows = mode === 'line'
    ? series.map((s) => ({ label: s.label, color: s.color, val: s.get(p) }))
    : SEVS.map((s) => ({ label: s, color: SEV_COLOR[s], val: p.bySeverity[s] })).filter((r) => r.val > 0);
  return (
    <div className="card fade-in" style={{
      position: 'absolute', top: 6, [flip ? 'right' : 'left']: `${flip ? 100 - leftPct : leftPct}%`,
      transform: `translateX(${flip ? '8px' : '8px'})`, padding: 12, minWidth: 150, pointerEvents: 'none', zIndex: 5,
      borderRadius: 'var(--radius)',
    }}>
      <div className="label-caps" style={{ marginBottom: 8 }}>{fmtTime(p.t)}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {rows.map((r) => (
          <div key={r.label} className="row" style={{ justifyContent: 'space-between', gap: 16, fontFamily: 'var(--font-mono)', fontSize: 11.5 }}>
            <span className="row" style={{ gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: r.color }} />{r.label}</span>
            <strong style={{ fontWeight: 700 }}>{r.val}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

// Donut for severity OR status distribution
function Donut({ data, colorMap, size = 132, thickness = 18, label }) {
  const entries = Object.entries(data).filter(([, v]) => v > 0);
  const total = entries.reduce((s, [, v]) => s + v, 0) || 1;
  const r = (size - thickness) / 2;
  const cx = size / 2, cy = size / 2;
  const C = 2 * Math.PI * r;
  let offset = 0;
  const [hover, setHover] = React.useState(null);
  return (
    <div className="row" style={{ gap: 20, alignItems: 'center' }}>
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--surface-sunk)" strokeWidth={thickness} />
          {entries.map(([k, v]) => {
            const frac = v / total;
            const dash = frac * C;
            const seg = (
              <circle key={k} cx={cx} cy={cy} r={r} fill="none"
                stroke={colorMap[k]} strokeWidth={hover === k ? thickness + 3 : thickness}
                strokeDasharray={`${dash} ${C - dash}`} strokeDashoffset={-offset}
                strokeLinecap="butt"
                style={{ transition: 'stroke-width 0.15s', cursor: 'pointer' }}
                onMouseEnter={() => setHover(k)} onMouseLeave={() => setHover(null)} />
            );
            offset += dash;
            return seg;
          })}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, lineHeight: 1 }}>{hover ? data[hover] : total}</div>
            <div className="label-caps" style={{ fontSize: 9 }}>{hover || label}</div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {entries.map(([k, v]) => (
          <div key={k} className="row" style={{ gap: 8, fontFamily: 'var(--font-mono)', fontSize: 11.5, cursor: 'pointer', opacity: hover && hover !== k ? 0.45 : 1, transition: 'opacity 0.15s' }}
            onMouseEnter={() => setHover(k)} onMouseLeave={() => setHover(null)}>
            <span style={{ width: 9, height: 9, borderRadius: 3, background: colorMap[k], flexShrink: 0 }} />
            <span style={{ minWidth: 92, color: 'var(--text-soft)' }}>{k.replace('_', ' ')}</span>
            <strong style={{ fontWeight: 700 }}>{v}</strong>
            <span className="faint">{Math.round((v / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { TimeseriesChart, Donut });
