import { useState } from 'react';
import { ArchitectureMap } from './ArchitectureMap';
import {
  BOTTLENECKS,
  EDGES,
  GROUPS,
  NODES,
  SCALE_EDGES,
  SCALE_LEVELS,
  SCALE_NODES,
  ScaleLevel,
} from './content';

export function ScaleBottlenecks() {
  const [level, setLevel] = useState<ScaleLevel>(100);
  const meta = SCALE_LEVELS.find((s) => s.level === level)!;
  const scaledOut = level === 100000;
  const isActive = (bitesAt: ScaleLevel | null) => bitesAt !== null && level >= bitesAt;
  const activeCount = BOTTLENECKS.filter((b) => isActive(b.bitesAt)).length;

  return (
    <>
      <div>
        <div className="eyebrow">Chapter 05 · Performance &amp; growth</div>
        <h2 className="chapter-title">Bottlenecks &amp; scaling</h2>
        <p className="lead">
          The single-node build ships today. Slide the load up to see which pressure points light up
          and how the same shape scales out from <strong>100 to 100,000 devices</strong>. Not every
          limit is driven by device count.
        </p>
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">Load scenario</div>
          <div className="seg">
            {SCALE_LEVELS.map((s) => (
              <button
                key={s.level}
                className={level === s.level ? 'on' : ''}
                onClick={() => setLevel(s.level)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div className="row gap" style={{ marginBottom: 16 }}>
          <span className={activeCount ? 'hot' : 'label-caps'}>
            {activeCount} device-driven pressure point{activeCount === 1 ? '' : 's'} active
          </span>
          <span className="faint mono" style={{ fontSize: 11 }}>
            · {meta.note}
          </span>
        </div>
        {scaledOut ? (
          <ArchitectureMap key="scale" nodes={SCALE_NODES} edges={SCALE_EDGES} viewW={1140} viewH={520} selectable />
        ) : (
          <ArchitectureMap key="single" nodes={NODES} edges={EDGES} groups={GROUPS} viewW={970} viewH={472} selectable />
        )}
      </div>

      <div className="col" style={{ gap: 14 }}>
        {BOTTLENECKS.map((b) => {
          const active = isActive(b.bitesAt);
          const deviceDriven = b.bitesAt !== null;
          return (
            <div key={b.area} className={`card ${active ? 'scenario-active' : 'scenario-quiet'}`}>
              <div className="card-head" style={{ marginBottom: 10 }}>
                <span className="card-title">{b.area}</span>
                {!deviceDriven ? (
                  <span className="label-caps" style={{ color: 'var(--high-muted)' }}>
                    not device-driven
                  </span>
                ) : active ? (
                  <span className="hot">hot at {b.bitesAt!.toLocaleString()}+ devices</span>
                ) : (
                  <span className="label-caps">headroom</span>
                )}
              </div>
              <div className="faint mono" style={{ fontSize: 10.5, marginBottom: 14 }}>
                Driver: {b.driver}
              </div>
              <div className="grid-3">
                <div>
                  <div className="label-caps">Symptom</div>
                  <div className="prose" style={{ marginTop: 6 }}>
                    {b.symptom}
                  </div>
                </div>
                <div>
                  <div className="label-caps" style={{ color: 'var(--accent)' }}>
                    Mitigation (today)
                  </div>
                  <div className="prose" style={{ marginTop: 6 }}>
                    {b.mitigation}
                  </div>
                </div>
                <div>
                  <div className="label-caps" style={{ color: 'var(--high-muted)' }}>
                    At scale
                  </div>
                  <div className="prose" style={{ marginTop: 6 }}>
                    {b.future}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
