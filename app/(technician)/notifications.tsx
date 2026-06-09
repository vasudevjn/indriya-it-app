import React from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { Screen } from '../../components/common/Screen';
import { UnifiedNotificationItem } from '../../components/notifications/UnifiedNotificationItem';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingOverlay } from '../../components/common/LoadingOverlay';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useUnifiedNotifications } from '../../hooks/useUnifiedNotifications';
import { useMarkRead } from '../../hooks/useNotifications';
import { theme } from '../../constants/theme';

export default function TechnicianNotifications() {
  const { profile } = useCurrentUser();
  // Technicians see all broadcasts (no store filter)
  const { feed, isLoading, isRefetching, refetch } = useUnifiedNotifications(
    profile?.id ?? '',
    null,
  );
  const { markOne, markAll } = useMarkRead(profile?.id ?? '');

  if (isLoading) return <LoadingOverlay />;

  return (
    <Screen edges={['top', 'left', 'right']} style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Alerts</Text>
        <TouchableOpacity
          style={styles.markAllBtn}
          onPress={() => markAll.mutate()}
          activeOpacity={0.75}
        >
          <Text style={styles.markAllText}>Mark all as read</Text>
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
          <EmptyState icon="notifications-outline" title="No alerts yet" />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: theme.colors.brand,
  },
  header: {
    height: 52,
    backgroundColor: theme.colors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
  },
  headerTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
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
    backgroundColor: theme.colors.bg,
  },
  listContent: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.xxl,
  },
});
