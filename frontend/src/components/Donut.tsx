import { useState } from 'react';

interface Props {
  data: Record<string, number>;
  colorMap: Record<string, string>;
  size?: number;
  thickness?: number;
  label?: string;
}

/** Ring chart with center total + interactive legend. */
export function Donut({ data, colorMap, size = 132, thickness = 18, label = 'total' }: Props) {
  const [hover, setHover] = useState<string | null>(null);
  const entries = Object.entries(data).filter(([, v]) => v > 0);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  const divisor = total || 1; // avoid divide-by-zero for fractions/percentages
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const C = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="row" style={{ gap: 20, alignItems: 'center' }}>
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--surface-sunk)" strokeWidth={thickness} />
          {entries.map(([k, v]) => {
            const frac = v / divisor;
            const dash = frac * C;
            const seg = (
              <circle
                key={k}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={colorMap[k]}
                strokeWidth={hover === k ? thickness + 3 : thickness}
                strokeDasharray={`${dash} ${C - dash}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
                style={{ transition: 'stroke-width 0.15s', cursor: 'pointer' }}
                onMouseEnter={() => setHover(k)}
                onMouseLeave={() => setHover(null)}
              />
            );
            offset += dash;
            return seg;
          })}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, lineHeight: 1 }}>
              {hover ? data[hover] : total}
            </div>
            <div className="label-caps" style={{ fontSize: 9 }}>
              {hover ?? label}
            </div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {entries.map(([k, v]) => (
          <div
            key={k}
            className="row"
            style={{
              gap: 8,
              fontFamily: 'var(--font-mono)',
              fontSize: 11.5,
              cursor: 'pointer',
              opacity: hover && hover !== k ? 0.45 : 1,
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={() => setHover(k)}
            onMouseLeave={() => setHover(null)}
          >
            <span style={{ width: 9, height: 9, borderRadius: 3, background: colorMap[k], flexShrink: 0 }} />
            <span style={{ minWidth: 92, color: 'var(--text-soft)' }}>{k.replace('_', ' ')}</span>
            <strong style={{ fontWeight: 700 }}>{v}</strong>
            <span className="faint">{Math.round((v / divisor) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
