import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateIncidentStatus } from '../api/incidents';
import { IncidentStatus } from '../types/incident';

export function useUpdateStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: IncidentStatus }) =>
      updateIncidentStatus(id, status),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['timeseries'] });
      queryClient.invalidateQueries({ queryKey: ['incident', id] });
    },
  });
}
