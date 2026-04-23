import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getTrips, SheetTrip, clearCache } from '@/services/sheetsService';
import { useCallback } from 'react';

export function useTrips() {
  const queryClient = useQueryClient();

  const query = useQuery<SheetTrip[]>({
    queryKey: ['sheet-trips'],
    queryFn: getTrips,
    staleTime: Infinity,
    retry: 1,
    enabled: true,
  });

  const refresh = useCallback(() => {
    clearCache();
    queryClient.invalidateQueries({ queryKey: ['sheet-trips'] });
    query.refetch();
  }, [queryClient, query]);

  return { ...query, refresh };
}
