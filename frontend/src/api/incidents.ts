import {
  Incident,
  IncidentDetail,
  IncidentFilters,
  IncidentStats,
  IncidentStatus,
  Paginated,
  Timeseries,
} from '../types/incident';
import { rangeToWindow, Range } from '../lib/timeRange';
import { client } from './client';

export async function fetchIncidents(
  filters: IncidentFilters,
  range: Range,
): Promise<Paginated<Incident>> {
  const { from, to } = rangeToWindow(range);
  const { data } = await client.get<Paginated<Incident>>('/incidents', {
    params: clean({ ...filters, from, to }),
  });
  return data;
}

export async function fetchIncident(id: string): Promise<IncidentDetail> {
  const { data } = await client.get<IncidentDetail>(`/incidents/${id}`);
  return data;
}

export async function fetchStats(range: Range): Promise<IncidentStats> {
  const { from, to } = rangeToWindow(range);
  const { data } = await client.get<IncidentStats>('/stats', { params: clean({ from, to }) });
  return data;
}

export async function fetchTimeseries(range: Range): Promise<Timeseries> {
  const { from, to, bucket } = rangeToWindow(range);
  const { data } = await client.get<Timeseries>('/stats/timeseries', {
    params: clean({ from, to, bucket }),
  });
  return data;
}

export async function updateIncidentStatus(
  id: string,
  status: IncidentStatus,
): Promise<Incident> {
  const { data } = await client.patch<Incident>(`/incidents/${id}/status`, { status });
  return data;
}

function clean(params: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== '' && value !== undefined),
  );
}
