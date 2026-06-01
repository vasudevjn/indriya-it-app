import React, { useState, useEffect } from 'react';
import { FlatList, View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Text } from 'react-native-paper';
import { Screen } from '../../components/common/Screen';
import { AppHeader } from '../../components/common/AppHeader';
import { TicketCard } from '../../components/tickets/TicketCard';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingOverlay } from '../../components/common/LoadingOverlay';
import { useTickets } from '../../hooks/useTickets';
import { ALL_STATUSES, STATUS_LABELS, STATUS_COLORS } from '../../constants/ticket';
import { TicketStatus } from '../../types';
import { useLocalSearchParams } from 'expo-router';

export default function TechnicianAllTickets() {
  const { initialStatus } = useLocalSearchParams<{ initialStatus?: string }>();
  const [statusFilter, setStatusFilter] = useState<TicketStatus | undefined>(
    (initialStatus as TicketStatus) || undefined,
  );

  useEffect(() => {
    setStatusFilter((initialStatus as TicketStatus) || undefined);
  }, [initialStatus]);
  const { data: tickets, isLoading, refetch } = useTickets({ status: statusFilter });

  const filters: (TicketStatus | undefined)[] = [undefined, ...ALL_STATUSES];

  return (
    <Screen edges={['top', 'left', 'right']}>
      <AppHeader title="All Tickets" />
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {filters.map((s) => {
            const active = statusFilter === s;
            const color = s ? STATUS_COLORS[s] : '#1B3A7A';
            return (
              <TouchableOpacity
                key={s ?? 'all'}
                style={[styles.chip, active && { backgroundColor: color, borderColor: color }]}
                onPress={() => setStatusFilter(s)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive, !active && { color }]}>
                  {s ? STATUS_LABELS[s] : 'All'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {isLoading ? (
        <LoadingOverlay />
      ) : (
        <FlatList
          data={tickets ?? []}
          keyExtractor={(t) => t.id}
          renderItem={({ item }) => <TicketCard ticket={item} />}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
          ListEmptyComponent={<EmptyState icon="ticket-outline" title="No tickets found" />}
        />
      )}
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
