import { useEffect, useState } from 'react';
import { Icons } from '../lib/icons';

interface Props {
  running: boolean;
  opened: number;
  updates: number;
  startedAt: number | null;
  error: string | null;
  onStart: () => void;
  onStop: () => void;
}

export function RunPanel({ running, opened, updates, startedAt, error, onStart, onStop }: Props) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [running]);

  const elapsed = startedAt ? (now - startedAt) / 1000 : 0;
  const rate = elapsed > 0 ? Math.round(opened / elapsed) : 0;

  return (
    <div className="col" style={{ gap: 16 }}>
      <div className="row gap" style={{ justifyContent: 'space-between' }}>
        <div className="row gap">
          <button className="btn btn-accent" onClick={onStart} disabled={running}>
            <Icons.Play size={13} /> Start
          </button>
          <button className="btn" onClick={onStop} disabled={!running}>
            <Icons.Square size={13} /> Stop
          </button>
        </div>
        <span className="row gap" style={{ gap: 8 }}>
          <span className={`live-dot${running ? '' : ' off'}`} />
          <span className="label-caps" style={{ color: running ? 'var(--success)' : undefined }}>
            {running ? 'Running' : 'Idle'}
          </span>
        </span>
      </div>

      <div className="kpi-grid">
        <div className="kpi">
          <span className="label-caps">Cases opened</span>
          <span className="kpi-val">{opened.toLocaleString()}</span>
        </div>
        <div className="kpi">
          <span className="label-caps">Updates sent</span>
          <span className="kpi-val">{updates.toLocaleString()}</span>
        </div>
        <div className="kpi">
          <span className="label-caps">Actual rate</span>
          <span className="kpi-val">
            {rate.toLocaleString()}
            <span className="faint mono" style={{ fontSize: 13, marginLeft: 4 }}>
              /s
            </span>
          </span>
        </div>
      </div>

      {error && (
        <div
          className="prose mono"
          style={{ color: 'var(--danger-muted)', fontSize: 12 }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
