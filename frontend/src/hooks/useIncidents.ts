import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchIncidents } from '../api/incidents';
import { Range } from '../lib/timeRange';
import { IncidentFilters } from '../types/incident';

export function useIncidents(filters: IncidentFilters, range: Range) {
  return useQuery({
    queryKey: ['incidents', filters, range],
    queryFn: () => fetchIncidents(filters, range),
    placeholderData: keepPreviousData,
  });
}
