import { useRef, useState } from 'react';
import { fmtTime } from '../lib/format';
import { SEV_COLOR } from '../lib/palette';
import { SEVERITIES, Severity, TimeseriesPoint } from '../types/incident';

const SEVS: Severity[] = [...SEVERITIES];

// X-axis tick label format depends on bucket granularity: a time-only label is meaningless
// for multi-day buckets (every point lands on midnight), so coarse buckets show the date.
function tickFormatter(bucket?: string): (iso: string) => string {
  if (bucket === 'day') {
    return (iso) => new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  if (bucket === 'sixHours') {
    return (iso) =>
      new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit' });
  }
  return (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function useHover(length: number) {
  const [idx, setIdx] = useState<number | null>(null);
  const ref = useRef<SVGSVGElement>(null);
  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = ref.current;
    if (!svg || !length) return;
    const rect = svg.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const i = Math.min(length - 1, Math.max(0, Math.round(x * (length - 1))));
    setIdx(i);
  };
  return { idx, ref, onMove, onLeave: () => setIdx(null) };
}

interface Props {
  points: TimeseriesPoint[];
  bucket?: string;
  height?: number;
}

/** Stacked area of incidents-by-severity over time, with crosshair + tooltip. */
export function TimeseriesChart({ points, bucket, height = 230 }: Props) {
  const W = 760;
  const H = height;
  const PAD_L = 34;
  const PAD_B = 26;
  const PAD_T = 12;
  const PAD_R = 12;
  const iw = W - PAD_L - PAD_R;
  const ih = H - PAD_T - PAD_B;

  // A single-bucket series (common for ALL when data is concentrated near "now") would draw a
  // zero-width sliver — duplicate it so it renders as a visible flat band across the width.
  const pts = points.length === 1 ? [points[0], points[0]] : points;
  const hover = useHover(pts.length);

  if (!points || points.length === 0) {
    return (
      <div className="faint" style={{ textAlign: 'center', padding: 40, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
        No activity in this range.
      </div>
    );
  }

  const n = pts.length;
  const fmtTick = tickFormatter(bucket);
  const xAt = (i: number) => PAD_L + (i / Math.max(1, n - 1)) * iw;

  let maxY = 1;
  pts.forEach((p) => {
    maxY = Math.max(maxY, SEVS.reduce((s, k) => s + p.bySeverity[k], 0));
  });
  maxY = Math.ceil(maxY * 1.15);
  const yAt = (v: number) => PAD_T + ih - (v / maxY) * ih;

  const gridLines = 4;
  const ticks = Array.from({ length: gridLines + 1 }, (_, i) => Math.round((maxY / gridLines) * i));
  const xTicks = [...new Set([0, Math.floor(n / 3), Math.floor((2 * n) / 3), n - 1])];

  // stacked area paths (cumulative by severity)
  let cum = pts.map(() => 0);
  const areas = SEVS.map((sev) => {
    const top = pts.map((p, i) => cum[i] + p.bySeverity[sev]);
    const bottom = cum.slice();
    const path =
      top.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(1)} ${yAt(v).toFixed(1)}`).join(' ') +
      ' ' +
      bottom.map((_, i) => `L ${xAt(n - 1 - i).toFixed(1)} ${yAt(bottom[n - 1 - i]).toFixed(1)}`).join(' ') +
      ' Z';
    cum = top;
    return { sev, path, color: SEV_COLOR[sev] };
  });

  const hi = hover.idx;

  return (
    <div style={{ position: 'relative' }}>
      <svg
        ref={hover.ref}
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={H}
        onMouseMove={hover.onMove}
        onMouseLeave={hover.onLeave}
        style={{ display: 'block', overflow: 'visible' }}
      >
        {ticks.map((t, i) => (
          <g key={i}>
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={yAt(t)}
              y2={yAt(t)}
              stroke="var(--line)"
              strokeWidth="1"
              strokeDasharray={i === 0 ? '0' : '2 4'}
            />
            <text x={PAD_L - 8} y={yAt(t) + 3} textAnchor="end" fontSize="9.5" fontFamily="var(--font-mono)" fill="var(--text-faint)">
              {t}
            </text>
          </g>
        ))}
        {xTicks.map((i) => (
          <text key={i} x={xAt(i)} y={H - 8} textAnchor="middle" fontSize="9.5" fontFamily="var(--font-mono)" fill="var(--text-faint)">
            {fmtTick(pts[i].t)}
          </text>
        ))}

        {areas.map((a) => (
          <path key={a.sev} d={a.path} fill={a.color} fillOpacity="0.82" stroke={a.color} strokeWidth="0.5" />
        ))}

        {hi != null && (
          <g>
            <line
              x1={xAt(hi)}
              x2={xAt(hi)}
              y1={PAD_T}
              y2={PAD_T + ih}
              stroke="var(--text-soft)"
              strokeWidth="1"
              strokeDasharray="3 3"
              opacity="0.5"
            />
            <circle
              cx={xAt(hi)}
              cy={yAt(SEVS.reduce((acc, k) => acc + pts[hi].bySeverity[k], 0))}
              r="3.5"
              fill="var(--text)"
            />
          </g>
        )}
      </svg>

      <div className="row" style={{ gap: 16, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        {SEVS.map((s) => (
          <span
            key={s}
            className="row"
            style={{ gap: 6, fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--text-soft)', fontWeight: 600, letterSpacing: '0.04em' }}
          >
            <span style={{ width: 9, height: 9, borderRadius: 3, background: SEV_COLOR[s] }} />
            {s}
          </span>
        ))}
      </div>

      {hi != null && <ChartTooltip point={pts[hi]} leftPct={(xAt(hi) / W) * 100} />}
    </div>
  );
}

function ChartTooltip({ point, leftPct }: { point: TimeseriesPoint; leftPct: number }) {
  const flip = leftPct > 62;
  const rows = SEVS.map((s) => ({ label: s, color: SEV_COLOR[s], val: point.bySeverity[s] })).filter((r) => r.val > 0);
  return (
    <div
      className="card fade-in"
      style={{
        position: 'absolute',
        top: 6,
        [flip ? 'right' : 'left']: `${flip ? 100 - leftPct : leftPct}%`,
        transform: 'translateX(8px)',
        padding: 12,
        minWidth: 150,
        pointerEvents: 'none',
        zIndex: 5,
        borderRadius: 'var(--radius)',
      }}
    >
      <div className="label-caps" style={{ marginBottom: 8 }}>
        {fmtTime(point.t)}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {rows.map((r) => (
          <div
            key={r.label}
            className="row"
            style={{ justifyContent: 'space-between', gap: 16, fontFamily: 'var(--font-mono)', fontSize: 11.5 }}
          >
            <span className="row" style={{ gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: r.color }} />
              {r.label}
            </span>
            <strong style={{ fontWeight: 700 }}>{r.val}</strong>
          </div>
        ))}
        {rows.length === 0 && <span className="faint">No incidents</span>}
      </div>
    </div>
  );
}
