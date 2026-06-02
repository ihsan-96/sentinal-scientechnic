import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { createIncidentStream } from '../lib/stream';

export function useIncidentStream() {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);
  const [eventCount, setEventCount] = useState(0);

  useEffect(() => {
    const source = createIncidentStream();
    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false);

    const invalidate = () => {
      for (const key of ['incidents', 'stats', 'timeseries', 'incident']) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
    };

    // Server coalesces incident activity into periodic counts; we just accumulate + refetch.
    source.addEventListener('incidents.changed', (e) => {
      const { count } = JSON.parse((e as MessageEvent).data) as { count: number };
      setEventCount((n) => n + count);
      invalidate();
    });
    source.addEventListener('incidents.cleared', () => {
      setEventCount(0);
      invalidate();
    });

    return () => source.close();
  }, [queryClient]);

  return { connected, eventCount };
}
