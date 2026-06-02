import { IncidentStatus, OpenPayload } from './types';

export async function openBatch(apiUrl: string, opens: OpenPayload[]): Promise<void> {
  const res = await fetch(`${apiUrl}/incidents/batch`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ incidents: opens }),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
}

export async function sendStatusEvent(
  apiUrl: string,
  id: string,
  status: IncidentStatus,
  timestamp: string,
): Promise<void> {
  const res = await fetch(`${apiUrl}/incidents/${id}/events`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ status, timestamp }),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
}

export async function clearAll(apiUrl: string): Promise<number> {
  const res = await fetch(`${apiUrl}/incidents`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  const { cleared } = (await res.json()) as { cleared: number };
  return cleared;
}
