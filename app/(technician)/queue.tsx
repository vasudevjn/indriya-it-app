import React, { useState } from 'react';
import { FlatList, View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Text } from 'react-native-paper';
import { Screen } from '../../components/common/Screen';
import { AppHeader } from '../../components/common/AppHeader';
import { TicketCard } from '../../components/tickets/TicketCard';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingOverlay } from '../../components/common/LoadingOverlay';
import { useTickets } from '../../hooks/useTickets';
import { useRealtimeTickets } from '../../hooks/useRealtime';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../constants/queryKeys';
import { getStores } from '../../lib/api/stores';
import { DbStore } from '../../types';

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
    <Screen edges={['top', 'left', 'right']}>
      <AppHeader title="Ticket Queue" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        <TouchableOpacity
          style={[styles.chip, storeFilter === undefined && styles.chipActive]}
          onPress={() => setStoreFilter(undefined)}
        >
          <Text style={[styles.chipText, storeFilter === undefined && styles.chipTextActive]}>All Stores</Text>
        </TouchableOpacity>
        {(stores ?? []).map((s: DbStore) => (
          <TouchableOpacity
            key={s.id}
            style={[styles.chip, storeFilter === s.id && styles.chipActive]}
            onPress={() => setStoreFilter(storeFilter === s.id ? undefined : s.id)}
          >
            <Text style={[styles.chipText, storeFilter === s.id && styles.chipTextActive]}>{s.code}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={tickets}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => <TicketCard ticket={item} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => { refetchOpen(); refetchIP(); }}
            tintColor="#1B3A7A"
            colors={['#1B3A7A']}
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
  chips: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  chipActive: {
    backgroundColor: '#1B3A7A',
    borderColor: '#1B3A7A',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  chipTextActive: {
    color: '#fff',
  },
  list: {
    paddingVertical: 8,
    paddingBottom: 24,
  },
});
