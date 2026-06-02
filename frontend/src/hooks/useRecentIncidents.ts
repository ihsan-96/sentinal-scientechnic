import { useQuery } from '@tanstack/react-query';
import { fetchIncidents } from '../api/incidents';

const RECENT_LIMIT = 8;

/**
 * Newest incidents (all statuses, all-time) for the Live Feed. Shares the `['incidents']`
 * query-key prefix, so the stream's `invalidateQueries(['incidents'])` refetches it on every
 * change — the feed stays live without a dedicated SSE payload.
 */
export function useRecentIncidents() {
  return useQuery({
    queryKey: ['incidents', 'recent'],
    queryFn: () => fetchIncidents({ page: 1, pageSize: RECENT_LIMIT }, 'all'),
  });
}
