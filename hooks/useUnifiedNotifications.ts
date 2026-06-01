import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DbNotification, DbBroadcast, NotificationType } from '../types';
import { QUERY_KEYS } from '../constants/queryKeys';
import { useNotifications } from './useNotifications';
import { getBroadcastsForStore } from '../lib/api/broadcasts';

export type NotificationKind = 'ticket' | 'announcement' | 'gold_rate';

export interface FeedItem {
  id: string;
  kind: NotificationKind;
  /** Populated for kind=ticket — distinguishes comment / assigned / resolved etc. */
  notificationType?: NotificationType | null;
  title: string;
  body: string | null;
  created_at: string;
  is_read?: boolean;
  ticket_id?: string | null;
  /** Original record -- use for mutation callbacks. */
  notificationId?: string; // set only for kind=ticket
}

function isBroadcastGoldRate(title: string): boolean {
  return title.toLowerCase().includes('gold rate');
}

/**
 * Merge ticket notifications + broadcasts into a single chronological feed.
 *
 * @param userId     Current user's profile.id
 * @param storeId    User's store_id (null for admins / technicians who see all)
 */
export function useUnifiedNotifications(userId: string, storeId: string | null) {
  const notifQuery = useNotifications(userId);

  const broadcastQuery = useQuery({
    queryKey: [...QUERY_KEYS.broadcasts(), 'for-store', storeId],
    queryFn: () => getBroadcastsForStore(storeId),
    enabled: !!userId,
    staleTime: 60 * 1000,
  });

  const feed = useMemo<FeedItem[]>(() => {
    const ticketItems: FeedItem[] = (notifQuery.data ?? []).map(
      (n: DbNotification) => ({
        id: 'n-' + n.id,
        kind: 'ticket',
        notificationType: n.type,
        title: n.title,
        body: n.body,
        created_at: n.created_at,
        is_read: n.is_read,
        ticket_id: n.ticket_id,
        notificationId: n.id,
      }),
    );

    const broadcastItems: FeedItem[] = (broadcastQuery.data ?? []).map(
      (b: DbBroadcast) => ({
        id: 'b-' + b.id,
        kind: isBroadcastGoldRate(b.title) ? 'gold_rate' : 'announcement',
        title: b.title,
        body: b.body,
        created_at: b.created_at,
        is_read: undefined, // broadcasts have no read state
        ticket_id: null,
      }),
    );

    return [...ticketItems, ...broadcastItems].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }, [notifQuery.data, broadcastQuery.data]);

  return {
    feed,
    isLoading: notifQuery.isLoading || broadcastQuery.isLoading,
    isRefetching: notifQuery.isRefetching || broadcastQuery.isRefetching,
    refetch: async () => {
      await Promise.all([notifQuery.refetch(), broadcastQuery.refetch()]);
    },
    markOneRead: (notificationId: string) =>
      notifQuery, // caller uses useMarkRead separately
  };
}
