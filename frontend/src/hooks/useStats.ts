import { useQuery } from '@tanstack/react-query';
import { fetchStats } from '../api/incidents';
import { Range } from '../lib/timeRange';

export function useStats(range: Range) {
  return useQuery({ queryKey: ['stats', range], queryFn: () => fetchStats(range) });
}
