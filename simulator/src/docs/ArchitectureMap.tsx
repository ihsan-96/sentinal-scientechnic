import { useEffect, useMemo, useRef, useState } from 'react';
import { MapEdge, MapGroup, MapNode } from './content';

const NW = 168;
const NH = 62;

export type Tone = 'req' | 'res' | 'event' | 'live' | 'read' | 'write';

const TONE_COLOR: Record<Tone, string> = {
  req: 'var(--accent)',
  res: 'var(--text-soft)',
  event: 'var(--high)',
  live: 'var(--success)',
  read: 'var(--accent)',
  write: 'var(--warning)',
};

/** One animated hop for the spotlight walkthrough. */
export interface FlowState {
  from: string;
  to: string;
  tone: Tone;
  /** Nodes to keep lit; defaults to [from, to]. */
  nodes?: string[];
}

interface Props {
  nodes: MapNode[];
  edges: MapEdge[];
  viewW: number;
  viewH: number;
  /** Ambient continuous flow (decorative). */
  live?: boolean;
  /** Counters — a bump fires a one-shot packet pulse. */
  activity?: { opens: number; updates: number };
  /** Clickable nodes + a detail strip below the map. */
  selectable?: boolean;
  /** Spotlight a single hop (walkthrough mode). */
  flow?: FlowState | null;
  /** Bump to force the spotlight packet to replay. */
  flowKey?: number;
  /** Labelled containers drawn behind the nodes (e.g. the one Nest process). */
  groups?: MapGroup[];
  /** When false, the active hop pulses but the rest of the map stays lit (no dimming). */
  spotlight?: boolean;
  /** Show the line-type legend strip below the map. */
  legend?: boolean;
}

const LINE_LEGEND: { label: string; stroke: string; dash?: string; w?: number }[] = [
  { label: 'Ingest & events', stroke: 'var(--text-faint)', w: 2 },
  { label: 'Read · request ↔ response', stroke: 'var(--accent)', dash: '6 5', w: 2 },
  { label: 'Operator write', stroke: 'var(--warning)', w: 2.6 },
];

function box(n: MapNode) {
  const w = n.w ?? NW;
  const h = n.h ?? NH;
  return { x: n.x, y: n.y, w, h, cx: n.x + w / 2, cy: n.y + h / 2 };
}

/** A smooth cubic between the facing edges of two nodes, with optional bow. */
function edgePath(a: MapNode, b: MapNode, bow = 0): string {
  const A = box(a);
  const B = box(b);
  const dx = B.cx - A.cx;
  const dy = B.cy - A.cy;
  if (Math.abs(dx) >= Math.abs(dy)) {
    const sx = dx >= 0 ? A.x + A.w : A.x;
    const tx = dx >= 0 ? B.x : B.x + B.w;
    const sy = A.cy;
    const ty = B.cy;
    const c = (tx - sx) / 2;
    return `M ${sx} ${sy} C ${sx + c} ${sy + bow}, ${tx - c} ${ty + bow}, ${tx} ${ty}`;
  }
  const sy = dy >= 0 ? A.y + A.h : A.y;
  const ty = dy >= 0 ? B.y : B.y + B.h;
  const sx = A.cx;
  const tx = B.cx;
  const c = (ty - sy) / 2;
  return `M ${sx} ${sy} C ${sx + bow} ${sy + c}, ${tx + bow} ${ty - c}, ${tx} ${ty}`;
}

interface Burst {
  id: number;
  path: string;
  warm: boolean;
}

export function ArchitectureMap({
  nodes,
  edges,
  viewW,
  viewH,
  live,
  activity,
  selectable,
  flow,
  flowKey,
  groups,
  spotlight = true,
  legend,
}: Props) {
  const [sel, setSel] = useState<string | null>(null);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const burstId = useRef(0);
  const prev = useRef({ opens: 0, updates: 0 });

  const byId = useMemo(() => Object.fromEntries(nodes.map((n) => [n.id, n])), [nodes]);

  const paths = useMemo(
    () =>
      edges
        .map((e) => {
          const a = byId[e.from];
          const b = byId[e.to];
          return a && b ? { edge: e, d: edgePath(a, b, e.bow ?? 0) } : null;
        })
        .filter((p): p is { edge: MapEdge; d: string } => p !== null),
    [edges, byId],
  );

  // Labelled containers (e.g. the single Nest process) — bbox over their members.
  const groupBoxes = useMemo(() => {
    if (!groups) return [];
    const padX = 16;
    const padTop = 30;
    const padBottom = 16;
    return groups.flatMap((g) => {
      const boxes = g.nodeIds.map((id) => byId[id]).filter(Boolean).map((n) => box(n));
      if (!boxes.length) return [];
      const minX = Math.min(...boxes.map((b) => b.x));
      const minY = Math.min(...boxes.map((b) => b.y));
      const maxX = Math.max(...boxes.map((b) => b.x + b.w));
      const maxY = Math.max(...boxes.map((b) => b.y + b.h));
      return [
        {
          id: g.id,
          label: g.label,
          x: minX - padX,
          y: minY - padTop,
          w: maxX - minX + padX * 2,
          h: maxY - minY + padTop + padBottom,
        },
      ];
    });
  }, [groups, byId]);

  // One-shot packets when the live counters change.
  useEffect(() => {
    if (!activity) return;
    const dOpens = activity.opens - prev.current.opens;
    const dUpdates = activity.updates - prev.current.updates;
    prev.current = { opens: activity.opens, updates: activity.updates };
    const fresh: Burst[] = [];
    if (dOpens > 0)
      paths
        .filter((p) => p.edge.kind === 'ingest')
        .forEach((p) => fresh.push({ id: burstId.current++, path: p.d, warm: false }));
    if (dUpdates > 0)
      paths
        .filter((p) => p.edge.kind === 'fanout')
        .forEach((p) => fresh.push({ id: burstId.current++, path: p.d, warm: true }));
    if (!fresh.length) return;
    setBursts((b) => [...b, ...fresh]);
    const ids = new Set(fresh.map((f) => f.id));
    const t = setTimeout(() => setBursts((b) => b.filter((x) => !ids.has(x.id))), 850);
    return () => clearTimeout(t);
  }, [activity?.opens, activity?.updates, paths]);

  const spot = !!flow && spotlight;
  const litNodes = useMemo(() => {
    if (!flow) return null;
    return new Set(flow.nodes ?? [flow.from, flow.to]);
  }, [flow]);

  const flowPath = useMemo(() => {
    if (!flow) return null;
    const a = byId[flow.from];
    const b = byId[flow.to];
    return a && b ? edgePath(a, b) : null;
  }, [flow, byId]);

  const selected = sel ? byId[sel] : null;

  return (
    <div className="map-wrap col" style={{ gap: 16 }}>
      <svg
        className={`map-svg${live ? ' live' : ''}${spot ? ' spot' : ''}`}
        viewBox={`0 0 ${viewW} ${viewH}`}
        role="img"
        aria-label="System architecture map"
      >
        {/* grouping containers (behind everything) */}
        {groupBoxes.map((g) => (
          <g key={`g-${g.id}`} className="map-group">
            <rect className="group-box" x={g.x} y={g.y} width={g.w} height={g.h} rx={18} />
            <text className="group-label" x={g.x + 16} y={g.y + 20}>
              {g.label}
            </text>
          </g>
        ))}

        {/* edges */}
        {paths.map((p, i) => (
          <path key={`e${i}`} className={`edge ${p.edge.kind}`} d={p.d} />
        ))}

        {/* continuous flow while live — reads oscillate (request out / response back) */}
        {live &&
          !spot &&
          paths.map((p, i) => {
            const k = p.edge.kind;
            const cls = k === 'fanout' ? ' warm' : k === 'write' ? ' amber' : '';
            const osc = k === 'read';
            return (
              <circle key={`l${i}`} r={4} className={`edge-packet${cls}`}>
                <animateMotion
                  dur={`${(osc ? 2 : 1.1) + (i % 3) * 0.18}s`}
                  repeatCount="indefinite"
                  path={p.d}
                  keyPoints={osc ? '0;1;0' : undefined}
                  keyTimes={osc ? '0;0.5;1' : undefined}
                  calcMode={osc ? 'linear' : undefined}
                />
              </circle>
            );
          })}

        {/* one-shot pulses on real activity */}
        {bursts.map((b) => (
          <circle key={`b${b.id}`} r={5} className={`edge-packet${b.warm ? ' warm' : ''}`}>
            <animateMotion dur="0.6s" fill="freeze" path={b.path} />
          </circle>
        ))}

        {/* spotlight: bright active hop + travelling packet */}
        {flow && flowPath && (
          <g key={`flow-${flowKey ?? 0}`}>
            <path
              className="edge-active"
              d={flowPath}
              style={{ stroke: TONE_COLOR[flow.tone] }}
              strokeDasharray={flow.tone === 'read' ? '5 6' : undefined}
            />
            <circle r={6.5} style={{ fill: TONE_COLOR[flow.tone] }}>
              <animateMotion dur="0.9s" fill="freeze" path={flowPath} />
            </circle>
          </g>
        )}

        {/* nodes */}
        {nodes.map((n) => {
          const b = box(n);
          const on = sel === n.id;
          const hot = litNodes?.has(n.id);
          // SVG text doesn't wrap — clamp long names to the available width.
          const avail = b.w - 44;
          const clamp = n.name.length * 8.1 > avail;
          return (
            <g
              key={n.id}
              className={`node${selectable && !spot ? ' selectable' : ''}${on ? ' sel' : ''}${
                hot ? ' hot' : ''
              }`}
              onClick={selectable && !spot ? () => setSel((s) => (s === n.id ? null : n.id)) : undefined}
            >
              <rect className="node-box" x={b.x} y={b.y} width={b.w} height={b.h} rx={12} />
              <circle className={`node-dot ${n.dot ?? ''}`} cx={b.x + 18} cy={b.y + 22} r={4} />
              <text
                className="node-name"
                x={b.x + 32}
                y={b.y + 27}
                fontSize={13.5}
                textLength={clamp ? avail : undefined}
                lengthAdjust={clamp ? 'spacingAndGlyphs' : undefined}
              >
                {n.name}
              </text>
              <text className="node-tag" x={b.x + 18} y={b.y + 47} fontSize={9}>
                {n.tag}
              </text>
            </g>
          );
        })}
      </svg>

      {legend && (
        <div className="map-legend">
          {LINE_LEGEND.map((l) => (
            <span className="map-legend-item" key={l.label}>
              <svg width={28} height={8} aria-hidden="true">
                <line
                  x1={1}
                  y1={4}
                  x2={27}
                  y2={4}
                  stroke={l.stroke}
                  strokeWidth={l.w ?? 2}
                  strokeDasharray={l.dash}
                  strokeLinecap="round"
                />
              </svg>
              <span>{l.label}</span>
            </span>
          ))}
          {live && (
            <span className="map-legend-item">
              <svg width={14} height={8} aria-hidden="true">
                <circle cx={7} cy={4} r={3.5} fill="var(--accent)" />
              </svg>
              <span>Live pulse</span>
            </span>
          )}
        </div>
      )}

      {selectable && !spot && (
        <div className="node-detail fade-in" key={selected?.id ?? 'hint'}>
          {selected ? (
            <>
              <div className="row gap" style={{ marginBottom: 6 }}>
                <span className="card-title">{selected.name}</span>
                <span className="label-caps">{selected.tag}</span>
              </div>
              <div className="prose">{selected.blurb}</div>
            </>
          ) : (
            <div className="faint mono" style={{ fontSize: 12 }}>
              Click any component to read what it does and why it’s there.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
