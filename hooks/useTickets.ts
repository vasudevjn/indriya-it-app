import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../constants/queryKeys';
import { getTickets, getOpenTickets } from '../lib/api/tickets';
import { TicketStatus } from '../types';

export function useTickets(filters?: { status?: TicketStatus; store_id?: string; requester_id?: string; assignee_id?: string }) {
  return useQuery({
    queryKey: QUERY_KEYS.tickets(filters),
    queryFn: () => getTickets(filters),
  });
}

export function useOpenTickets() {
  return useQuery({
    queryKey: QUERY_KEYS.tickets({ status: 'open' }),
    queryFn: getOpenTickets,
  });
}
