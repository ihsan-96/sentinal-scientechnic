interface Props {
  points: number[];
  color?: string;
  h?: number;
  w?: number;
}

/** Tiny gradient-filled line chart for KPI cards. */
export function Sparkline({ points, color = 'var(--accent)', h = 28, w = 120 }: Props) {
  if (!points || points.length < 2) return null;
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const span = max - min || 1;
  const step = w / (points.length - 1);
  const d = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${(i * step).toFixed(1)} ${(h - ((p - min) / span) * h).toFixed(1)}`)
    .join(' ');
  const area = `${d} L ${w} ${h} L 0 ${h} Z`;
  const id = `sg${Math.round(points[0] * 999 + points.length)}`;
  return (
    <svg
      width="100%"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      style={{ marginTop: 4, overflow: 'visible' }}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
