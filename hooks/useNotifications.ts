import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { QUERY_KEYS } from '../constants/queryKeys';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../lib/api/notifications';
import { useNotificationStore } from '../stores/notificationStore';
import { DbNotification } from '../types';

/**
 * Fetch notifications and keep the global unread count in sync.
 *
 * staleTime is intentionally short (30 s) so that:
 *  - The badge updates when the app comes to the foreground (AppState wired in queryClient.ts)
 *  - The Notifications screen shows fresh data on every visit
 *
 * This hook is safe to call multiple times (QueryClient caches the result).
 * It is called from both AuthGate (_layout.tsx) -- for global badge initialisation --
 * and from each Notifications screen for the list view.
 */
export function useNotifications(userId: string) {
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);

  const query = useQuery({
    queryKey: QUERY_KEYS.notifications(userId),
    queryFn: () => getNotifications(userId),
    enabled: !!userId,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (query.data) {
      setUnreadCount(query.data.filter((n: DbNotification) => !n.is_read).length);
    }
  }, [query.data]);

  return query;
}

export function useMarkRead(userId: string) {
  const qc = useQueryClient();
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);

  const markOne = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.notifications(userId) }),
  });

  const markAll = useMutation({
    mutationFn: () => markAllNotificationsRead(userId),
    onSuccess: () => {
      setUnreadCount(0);
      qc.invalidateQueries({ queryKey: QUERY_KEYS.notifications(userId) });
    },
  });

  return { markOne, markAll };
}
