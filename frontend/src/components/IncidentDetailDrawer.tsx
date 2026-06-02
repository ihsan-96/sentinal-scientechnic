import { ReactNode, useEffect } from 'react';
import { useIncident } from '../hooks/useIncident';
import { useUpdateStatus } from '../hooks/useUpdateStatus';
import { fmtTime, relTime } from '../lib/format';
import { EVENT_ICONS, Icons } from '../lib/icons';
import { SEV_COLOR } from '../lib/palette';
import { NEXT_STATUS } from '../lib/status';
import { IncidentDetail, STATUSES } from '../types/incident';
import { SeverityBadge } from './SeverityBadge';
import { StatusBadge } from './StatusBadge';

interface Props {
  incidentId: string;
  onClose: () => void;
}

export function IncidentDetailDrawer({ incidentId, onClose }: Props) {
  const { data: incident } = useIncident(incidentId);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div
          className="row"
          style={{
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            padding: 'calc(var(--u)*2.5) calc(var(--u)*3)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div className="label-caps" style={{ lineHeight: 1 }}>
              Incident Detail
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, lineHeight: 1.1 }}>
              Case Review
            </div>
          </div>
          <button className="btn btn-icon" onClick={onClose} aria-label="Close">
            <Icons.X size={16} />
          </button>
        </div>

        <div style={{ padding: '0 calc(var(--u)*3) calc(var(--u)*3)', overflowY: 'auto' }}>
          {!incident ? (
            <p className="faint mono" style={{ fontSize: 12 }}>
              Loading…
            </p>
          ) : (
            <DetailBody incident={incident} />
          )}
        </div>
      </div>
    </>
  );
}

function DetailBody({ incident }: { incident: IncidentDetail }) {
  const updateStatus = useUpdateStatus();
  const EvIcon = EVENT_ICONS[incident.eventType] ?? Icons.Alert;
  const next = NEXT_STATUS[incident.status];
  const setStatus = (status: typeof incident.status) =>
    updateStatus.mutate({ id: incident.id, status });

  const rows: [string, ReactNode][] = [
    ['Incident ID', <span className="mono" style={{ fontSize: 11, wordBreak: 'break-all' }}>{incident.id}</span>],
    ['Device', <span className="mono">{incident.deviceId}</span>],
    ['Location', incident.location],
    ['Event type', incident.eventType.replace('_', ' ')],
    ['Opened', fmtTime(incident.occurredAt)],
    ['Last update', relTime(incident.lastEventAt)],
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="row" style={{ gap: 14 }}>
        <span
          className="neu-raise"
          style={{
            width: 52,
            height: 52,
            borderRadius: 'var(--radius)',
            display: 'grid',
            placeItems: 'center',
            color: SEV_COLOR[incident.severity],
            flexShrink: 0,
          }}
        >
          <EvIcon size={26} />
        </span>
        <div style={{ minWidth: 0 }}>
          <div className="row" style={{ gap: 8, marginBottom: 5 }}>
            <SeverityBadge severity={incident.severity} />
            <StatusBadge status={incident.status} />
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>{incident.location}</div>
        </div>
      </div>

      <div
        className="neu-sunk"
        style={{ borderRadius: 'var(--radius)', padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 18px' }}
      >
        {rows.map(([k, v]) => (
          <div key={k}>
            <div className="label-caps" style={{ marginBottom: 3 }}>
              {k}
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 600 }}>{v}</div>
          </div>
        ))}
      </div>

      <div>
        <div className="label-caps" style={{ marginBottom: 14 }}>
          Status Timeline
        </div>
        <div className="timeline">
          {incident.events
            .slice()
            .reverse()
            .map((ev) => (
              <div key={ev.id} className="tl-item">
                <span className="tl-dot" />
                <div className="row" style={{ gap: 8 }}>
                  <StatusBadge status={ev.status} />
                  <span className="faint mono" style={{ fontSize: 10.5 }}>
                    {fmtTime(ev.occurredAt)}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>

      <div>
        <div className="label-caps" style={{ marginBottom: 10 }}>
          Update Status
        </div>
        <div className="row" style={{ gap: 7, flexWrap: 'wrap' }}>
          {STATUSES.map((s) => (
            <button
              key={s}
              className={`chip ${incident.status === s ? 'on' : ''}`}
              disabled={updateStatus.isPending}
              onClick={() => setStatus(s)}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
        {next && (
          <button
            className="btn btn-accent"
            style={{ marginTop: 14, width: '100%', justifyContent: 'center' }}
            disabled={updateStatus.isPending}
            onClick={() => setStatus(next)}
          >
            <Icons.Check size={15} /> Advance to {next.replace('_', ' ')}
          </button>
        )}
      </div>
    </div>
  );
}
