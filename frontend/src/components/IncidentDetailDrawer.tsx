import { ReactNode } from 'react';
import { useIncident } from '../hooks/useIncident';
import { useUpdateStatus } from '../hooks/useUpdateStatus';
import { IncidentStatus, STATUSES } from '../types/incident';
import { SeverityBadge } from './SeverityBadge';
import { StatusBadge } from './StatusBadge';

interface Props {
  incidentId: string;
  onClose: () => void;
}

export function IncidentDetailDrawer({ incidentId, onClose }: Props) {
  const { data: incident } = useIncident(incidentId);
  const updateStatus = useUpdateStatus();

  return (
    <div className="fixed inset-0 z-10 flex justify-end bg-slate-900/30" onClick={onClose}>
      <aside
        className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Incident</h2>
          <button className="text-slate-400 hover:text-slate-600" onClick={onClose}>
            ✕
          </button>
        </div>

        {!incident ? (
          <p className="mt-6 text-sm text-slate-500">Loading…</p>
        ) : (
          <>
            <dl className="mt-6 space-y-3">
              {(
                [
                  ['Device', incident.deviceId],
                  ['Location', incident.location],
                  ['Event type', incident.eventType.replace('_', ' ')],
                  ['Severity', <SeverityBadge severity={incident.severity} />],
                  ['Status', <StatusBadge status={incident.status} />],
                  ['Opened at', new Date(incident.occurredAt).toLocaleString()],
                ] as [string, ReactNode][]
              ).map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 text-sm">
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="text-right font-medium text-slate-900">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-8">
              <p className="text-sm font-semibold text-slate-700">Status timeline</p>
              <ol className="mt-3 space-y-3 border-l border-slate-200 pl-4">
                {incident.events.map((event) => (
                  <li key={event.id} className="relative text-sm">
                    <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-slate-300" />
                    <StatusBadge status={event.status} />
                    <span className="ml-2 text-slate-500">
                      {new Date(event.occurredAt).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-8">
              <label className="text-sm text-slate-500">Update status</label>
              <select
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={incident.status}
                disabled={updateStatus.isPending}
                onChange={(e) =>
                  updateStatus.mutate({ id: incident.id, status: e.target.value as IncidentStatus })
                }
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
