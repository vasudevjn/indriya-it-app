import React from 'react';
import { FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { Text } from 'react-native-paper';
import { Screen } from '../../components/common/Screen';
import { AppHeader } from '../../components/common/AppHeader';
import { UnifiedNotificationItem } from '../../components/notifications/UnifiedNotificationItem';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingOverlay } from '../../components/common/LoadingOverlay';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useUnifiedNotifications } from '../../hooks/useUnifiedNotifications';
import { useMarkRead } from '../../hooks/useNotifications';

export default function RequesterNotifications() {
  const { profile } = useCurrentUser();
  const { feed, isLoading, isRefetching, refetch } = useUnifiedNotifications(
    profile?.id ?? '',
    profile?.store_id ?? null,
  );
  const { markOne, markAll } = useMarkRead(profile?.id ?? '');

  if (isLoading) return <LoadingOverlay />;

  return (
    <Screen edges={['top', 'left', 'right']}>
      <AppHeader
        title="Alerts"
        right={
          <TouchableOpacity onPress={() => markAll.mutate()} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        }
      />
      <FlatList
        data={feed}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <UnifiedNotificationItem
            item={item}
            onMarkRead={(nid) => markOne.mutate(nid)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#1B3A7A"
            colors={['#1B3A7A']}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="notifications-outline"
            title="No alerts yet"
            subtitle="Ticket updates and announcements appear here"
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  markAllBtn: { marginRight: 16, paddingHorizontal: 10, paddingVertical: 4 },
  markAllText: { color: 'rgba(255,255,255,0.85)', fontSize: 13 },
});
