import { useQuery } from '@tanstack/react-query';
import { fetchTimeseries } from '../api/incidents';
import { Range } from '../lib/timeRange';

export function useTimeseries(range: Range) {
  return useQuery({ queryKey: ['timeseries', range], queryFn: () => fetchTimeseries(range) });
}
