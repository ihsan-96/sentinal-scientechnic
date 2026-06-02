import { useQuery } from '@tanstack/react-query';
import { fetchIncident } from '../api/incidents';

export function useIncident(id: string | null) {
  return useQuery({
    queryKey: ['incident', id],
    queryFn: () => fetchIncident(id as string),
    enabled: !!id,
  });
}
