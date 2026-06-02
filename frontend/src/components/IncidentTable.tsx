import { relTime } from '../lib/format';
import { EVENT_ICONS, Icons } from '../lib/icons';
import { SEV_COLOR } from '../lib/palette';
import { NEXT_LABEL, NEXT_STATUS } from '../lib/status';
import { Incident, IncidentStatus } from '../types/incident';
import { SeverityBadge } from './SeverityBadge';
import { StatusBadge } from './StatusBadge';

interface Props {
  incidents: Incident[];
  onSelect: (incident: Incident) => void;
  selectedId?: string | null;
  /** When provided, renders an inline action column that advances the status. */
  onAdvance?: (id: string, status: IncidentStatus) => void;
}

export function IncidentTable({ incidents, onSelect, selectedId, onAdvance }: Props) {
  if (incidents.length === 0) {
    return (
      <div className="faint mono" style={{ textAlign: 'center', padding: 48, fontSize: 12 }}>
        No incidents match these filters.
      </div>
    );
  }

  return (
    <table className="tbl">
      <thead>
        <tr>
          <th style={{ width: 4, padding: 0 }}></th>
          <th>Severity</th>
          <th>Event</th>
          <th>Location</th>
          <th>Device</th>
          <th>Status</th>
          <th>Occurred</th>
          {onAdvance && <th style={{ textAlign: 'right' }}>Action</th>}
        </tr>
      </thead>
      <tbody>
        {incidents.map((inc) => {
          const EvIcon = EVENT_ICONS[inc.eventType] ?? Icons.Alert;
          const next = NEXT_STATUS[inc.status];
          return (
            <tr key={inc.id} className={selectedId === inc.id ? 'sel' : ''} onClick={() => onSelect(inc)}>
              <td style={{ padding: 0 }}>
                <div className={`sevbar-${inc.severity}`} style={{ width: 4, height: 36, borderRadius: 4, margin: '0 auto' }} />
              </td>
              <td>
                <SeverityBadge severity={inc.severity} />
              </td>
              <td>
                <span className="row" style={{ gap: 8 }}>
                  <span style={{ color: SEV_COLOR[inc.severity] }}>
                    <EvIcon size={16} />
                  </span>
                  <span style={{ fontWeight: 600, fontSize: 12 }}>{inc.eventType.replace('_', ' ')}</span>
                </span>
              </td>
              <td style={{ maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {inc.location}
              </td>
              <td className="mono faint" style={{ fontSize: 11 }}>
                {inc.deviceId}
              </td>
              <td>
                <StatusBadge status={inc.status} />
              </td>
              <td className="mono faint" style={{ fontSize: 11 }}>
                {relTime(inc.occurredAt)}
              </td>
              {onAdvance && (
                <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                  {next ? (
                    <button className="btn" style={{ padding: '6px 11px', fontSize: 11 }} onClick={() => onAdvance(inc.id, next)}>
                      <Icons.Check size={13} />
                      {NEXT_LABEL[inc.status]}
                    </button>
                  ) : (
                    <span className="label-caps" style={{ color: 'var(--success)' }}>
                      <Icons.Check size={13} style={{ verticalAlign: -2 }} /> Done
                    </span>
                  )}
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
