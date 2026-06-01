import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../constants/queryKeys';
import { getTicketById } from '../lib/api/tickets';
import { getComments } from '../lib/api/comments';

/**
 * staleTime: 0 -- ticket detail is always considered stale so React Query
 * refetches in the background every time the component mounts.
 * Combined with useFocusEffect in the screen, this ensures comments and
 * status changes from other devices are always visible on re-entry.
 */
export function useTicketDetail(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.ticket(id),
    queryFn: () => getTicketById(id),
    enabled: !!id,
    staleTime: 0,
  });
}

export function useTicketComments(ticketId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.ticketComments(ticketId),
    queryFn: () => getComments(ticketId),
    enabled: !!ticketId,
    staleTime: 0,
  });
}
