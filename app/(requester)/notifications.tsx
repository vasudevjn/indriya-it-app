import React from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UnifiedNotificationItem } from '../../components/notifications/UnifiedNotificationItem';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingOverlay } from '../../components/common/LoadingOverlay';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useUnifiedNotifications } from '../../hooks/useUnifiedNotifications';
import { useMarkRead } from '../../hooks/useNotifications';
import { theme } from '../../constants/theme';

export default function RequesterNotifications() {
  const { profile } = useCurrentUser();
  const { feed, isLoading, isRefetching, refetch } = useUnifiedNotifications(
    profile?.id ?? '',
    profile?.store_id ?? null,
  );
  const { markOne, markAll } = useMarkRead(profile?.id ?? '');
  const insets = useSafeAreaInsets();

  if (isLoading) return <LoadingOverlay />;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + theme.spacing.sm }]}>
        <Text style={styles.headerTitle}>Alerts</Text>
        <TouchableOpacity
          style={styles.markAllBtn}
          onPress={() => markAll.mutate()}
          activeOpacity={0.75}
        >
          <Text style={styles.markAllText}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      {/* Notification list */}
      <FlatList
        data={feed}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <UnifiedNotificationItem
            item={item}
            onMarkRead={(nid) => markOne.mutate(nid)}
          />
        )}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={theme.colors.brand}
            colors={[theme.colors.brand]}
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    backgroundColor: theme.colors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  headerTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 22,
  },
  markAllBtn: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  markAllText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.xxl,
  },
});
