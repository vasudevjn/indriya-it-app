import React from 'react';
import { FlatList, StyleSheet, View, RefreshControl } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Screen } from '../../components/common/Screen';
import { AppHeader } from '../../components/common/AppHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingOverlay } from '../../components/common/LoadingOverlay';
import { QUERY_KEYS } from '../../constants/queryKeys';
import { getBroadcasts } from '../../lib/api/broadcasts';
import { formatDateTime } from '../../lib/utils/date';
import { DbBroadcast } from '../../types';
import { theme } from '../../constants/theme';

function AnnouncementCard({ item }: { item: DbBroadcast }) {
  return (
    <Card style={styles.card} mode="outlined">
      <Card.Content style={styles.cardContent}>
        <View style={styles.iconWrap}>
          <Ionicons name="megaphone" size={20} color={theme.colors.accent} />
        </View>
        <View style={styles.textBlock}>
          <Text variant="labelLarge" style={styles.title}>{item.title}</Text>
          <Text variant="bodySmall" style={styles.body}>{item.body}</Text>
          <Text variant="labelSmall" style={styles.date}>
            {formatDateTime(item.created_at)}
            {item.target_store_id ? ' · Your store' : ' · All stores'}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
}

export default function RequesterAnnouncements() {
  const {
    data: broadcasts,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: QUERY_KEYS.broadcasts(),
    queryFn: getBroadcasts,
    staleTime: 60 * 1000,
  });

  if (isLoading) return <LoadingOverlay />;

  return (
    <Screen edges={['top', 'left', 'right']}>
      <AppHeader title="Announcements" />
      <FlatList
        data={broadcasts ?? []}
        keyExtractor={(b) => b.id}
        renderItem={({ item }) => <AnnouncementCard item={item} />}
        contentContainerStyle={styles.list}
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
            icon="megaphone-outline"
            title="No announcements"
            subtitle="Admin announcements will appear here"
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingVertical: theme.spacing.sm,
    paddingBottom: theme.spacing.lg * 2,
    paddingHorizontal: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.statusColors.in_progress.bg,
    borderColor: theme.colors.accent,
    marginBottom: theme.spacing.md,
  },
  cardContent: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'flex-start',
    paddingVertical: theme.spacing.xs,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.full,
    backgroundColor: theme.statusColors.in_progress.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  textBlock: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  title: {
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  body: {
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  date: {
    color: theme.colors.textTertiary,
    marginTop: theme.spacing.xs - 2,
  },
});
