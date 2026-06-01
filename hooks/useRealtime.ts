import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../constants/queryKeys';
import { subscribeToTickets, subscribeToTicket, subscribeToNotifications } from '../lib/realtime/ticketsChannel';
import { useNotificationStore } from '../stores/notificationStore';

export function useRealtimeTickets() {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = subscribeToTickets(() => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.tickets() });
    });
    return () => { channel.unsubscribe(); };
  }, []);
}

export function useRealtimeTicketDetail(ticketId: string) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!ticketId) return;
    const channel = subscribeToTicket(ticketId, () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ticket(ticketId) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ticketComments(ticketId) });
    });
    return () => { channel.unsubscribe(); };
  }, [ticketId]);
}

export function useRealtimeNotifications(userId: string) {
  const qc = useQueryClient();
  const incrementUnread = useNotificationStore((s) => s.incrementUnread);

  useEffect(() => {
    if (!userId) return;
    const channel = subscribeToNotifications(userId, () => {
      incrementUnread();
      qc.invalidateQueries({ queryKey: QUERY_KEYS.notifications(userId) });
    });
    return () => { channel.unsubscribe(); };
  }, [userId]);
}
