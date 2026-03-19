import { useQuery } from '@tanstack/react-query';
import { getTrips, SheetTrip } from '@/services/sheetsService';

export function useTrips() {
  return useQuery<SheetTrip[]>({
    queryKey: ['sheet-trips'],
    queryFn: getTrips,
    staleTime: Infinity, // Load once per session
    retry: 1,
  });
}
