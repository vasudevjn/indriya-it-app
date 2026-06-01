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

function AnnouncementCard({ item }: { item: DbBroadcast }) {
  return (
    <Card style={styles.card} mode="outlined">
      <Card.Content style={styles.cardContent}>
        <View style={styles.iconWrap}>
          <Ionicons name="megaphone" size={20} color="#C9A46A" />
        </View>
        <View style={styles.textBlock}>
          <Text variant="labelLarge" style={styles.title}>{item.title}</Text>
          <Text variant="bodySmall" style={styles.body}>{item.body}</Text>
          <Text variant="labelSmall" style={styles.date}>
            {formatDateTime(item.created_at)}
            {item.target_store_id ? ' - Your store' : ' - All stores'}
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
            tintColor="#1B3A7A"
            colors={['#1B3A7A']}
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
    paddingVertical: 8,
    paddingBottom: 32,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    marginBottom: 10,
  },
  cardContent: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    paddingVertical: 4,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  textBlock: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontWeight: '700',
    color: '#111827',
  },
  body: {
    color: '#374151',
    lineHeight: 18,
  },
  date: {
    color: '#9CA3AF',
    marginTop: 2,
  },
});
