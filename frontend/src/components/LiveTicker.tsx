import { relTime } from '../lib/format';
import { EVENT_ICONS, Icons } from '../lib/icons';
import { SEV_COLOR } from '../lib/palette';
import { Incident } from '../types/incident';
import { SeverityBadge } from './SeverityBadge';

interface Props {
  feed: Incident[];
}

/** Live feed of newly-opened incidents, pushed over SSE (incidents.recent). */
export function LiveTicker({ feed }: Props) {
  return (
    <div className="card" style={{ padding: 'calc(var(--u)*1.75)' }}>
      <div className="card-head" style={{ marginBottom: 12 }}>
        <div className="row" style={{ gap: 9 }}>
          <span className="live-dot" />
          <span className="card-title">Live Feed</span>
        </div>
        <span className="label-caps">{feed.length ? relTime(feed[0].occurredAt) : '—'}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 230, overflowY: 'auto' }}>
        {feed.map((f) => {
          const EvIcon = EVENT_ICONS[f.eventType] ?? Icons.Alert;
          return (
            <div key={f.id} className="ticker-row">
              <span
                className="neu-sunk"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                  color: SEV_COLOR[f.severity],
                }}
              >
                <EvIcon size={15} />
              </span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {f.location}
                </div>
                <div className="faint mono" style={{ fontSize: 10 }}>
                  {f.eventType.replace('_', ' ')} · {f.deviceId}
                </div>
              </div>
              <SeverityBadge severity={f.severity} />
            </div>
          );
        })}
        {feed.length === 0 && (
          <div className="faint mono" style={{ fontSize: 11, padding: 16, textAlign: 'center' }}>
            Waiting for events…
          </div>
        )}
      </div>
    </div>
  );
}
