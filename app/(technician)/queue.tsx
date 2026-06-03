import React, { useState } from 'react';
import {
  FlatList, View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { Screen } from '../../components/common/Screen';
import { TicketCard } from '../../components/tickets/TicketCard';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingOverlay } from '../../components/common/LoadingOverlay';
import { useTickets } from '../../hooks/useTickets';
import { useRealtimeTickets } from '../../hooks/useRealtime';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../constants/queryKeys';
import { getStores } from '../../lib/api/stores';
import { DbStore } from '../../types';
import { theme } from '../../constants/theme';

export default function TechnicianQueue() {
  useRealtimeTickets();
  const [storeFilter, setStoreFilter] = useState<string | undefined>(undefined);
  const { data: openTickets, isLoading: loadingOpen, isRefetching: refetchingOpen, refetch: refetchOpen } = useTickets({ status: 'open', store_id: storeFilter });
  const { data: inProgressTickets, isLoading: loadingIP, isRefetching: refetchingIP, refetch: refetchIP } = useTickets({ status: 'in_progress', store_id: storeFilter });
  const { data: stores } = useQuery({ queryKey: QUERY_KEYS.stores(), queryFn: getStores });

  const tickets = [...(openTickets ?? []), ...(inProgressTickets ?? [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  const isLoading = loadingOpen || loadingIP;
  const isRefetching = refetchingOpen || refetchingIP;

  if (isLoading) return <LoadingOverlay />;

  return (
    <Screen edges={['top', 'left', 'right']} style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ticket Queue</Text>
      </View>

      {/* Chips bar — plain View wrapper prevents horizontal ScrollView from stretching */}
      <View style={styles.chipsBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContainer}
        >
          <TouchableOpacity
            style={[
              styles.chip,
              storeFilter === undefined
                ? { backgroundColor: theme.colors.brand, borderColor: theme.colors.brand }
                : { backgroundColor: theme.colors.surface, borderColor: theme.colors.borderStrong },
            ]}
            onPress={() => setStoreFilter(undefined)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.chipText,
              { color: storeFilter === undefined ? '#fff' : theme.colors.textSecondary },
            ]}>
              All Stores
            </Text>
          </TouchableOpacity>

          {(stores ?? []).map((s: DbStore) => {
            const active = storeFilter === s.id;
            return (
              <TouchableOpacity
                key={s.id}
                style={[
                  styles.chip,
                  active
                    ? { backgroundColor: theme.colors.brand, borderColor: theme.colors.brand }
                    : { backgroundColor: theme.colors.surface, borderColor: theme.colors.borderStrong },
                ]}
                onPress={() => setStoreFilter(storeFilter === s.id ? undefined : s.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, { color: active ? '#fff' : theme.colors.textSecondary }]}>
                  {s.code}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Ticket list */}
      <FlatList
        data={tickets}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => <TicketCard ticket={item} />}
        contentContainerStyle={styles.list}
        style={styles.flatList}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => { refetchOpen(); refetchIP(); }}
            tintColor={theme.colors.brand}
            colors={[theme.colors.brand]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="checkmark-done-outline"
            title="Queue is empty"
            subtitle="No open tickets right now - great work!"
          />
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
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  chipsBar: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  chipsContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.full,
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  flatList: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  list: {
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xxl,
  },
});
