import { Incident } from '../types/incident';
import { SeverityBadge } from './SeverityBadge';
import { StatusBadge } from './StatusBadge';

interface Props {
  incidents: Incident[];
  onSelect: (incident: Incident) => void;
}

const formatTime = (iso: string) => new Date(iso).toLocaleString();

export function IncidentTable({ incidents, onSelect }: Props) {
  if (incidents.length === 0) {
    return <p className="p-8 text-center text-slate-500">No incidents match these filters.</p>;
  }

  return (
    <table className="w-full text-left text-sm">
      <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
        <tr>
          <th className="px-4 py-3">Severity</th>
          <th className="px-4 py-3">Status</th>
          <th className="px-4 py-3">Device</th>
          <th className="px-4 py-3">Event</th>
          <th className="px-4 py-3">Location</th>
          <th className="px-4 py-3">Occurred</th>
        </tr>
      </thead>
      <tbody>
        {incidents.map((incident) => (
          <tr
            key={incident.id}
            onClick={() => onSelect(incident)}
            className="cursor-pointer border-b border-slate-100 hover:bg-slate-50"
          >
            <td className="px-4 py-3">
              <SeverityBadge severity={incident.severity} />
            </td>
            <td className="px-4 py-3">
              <StatusBadge status={incident.status} />
            </td>
            <td className="px-4 py-3 font-mono text-xs">{incident.deviceId}</td>
            <td className="px-4 py-3">{incident.eventType.replace('_', ' ')}</td>
            <td className="px-4 py-3">{incident.location}</td>
            <td className="px-4 py-3 text-slate-500">{formatTime(incident.occurredAt)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
