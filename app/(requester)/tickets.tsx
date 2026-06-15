import React, { useState, useEffect } from 'react';
import {
  FlatList, View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/common/Screen';
import { TicketCard } from '../../components/tickets/TicketCard';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingOverlay } from '../../components/common/LoadingOverlay';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useTickets } from '../../hooks/useTickets';
import { ALL_STATUSES } from '../../constants/ticket';
import { TicketStatus } from '../../types';
import { router, useLocalSearchParams } from 'expo-router';
import { theme } from '../../constants/theme';

export default function RequesterTickets() {
  const { profile } = useCurrentUser();
  const { initialStatus } = useLocalSearchParams<{ initialStatus?: string }>();
  const [statusFilter, setStatusFilter] = useState<TicketStatus | undefined>(
    (initialStatus as TicketStatus) || undefined,
  );

  // Sync whenever the param changes without a full unmount/remount.
  // This happens when the tab screen is already mounted and router.push()
  // is called again with a different initialStatus.
  useEffect(() => {
    setStatusFilter((initialStatus as TicketStatus) || undefined);
  }, [initialStatus]);

  const { data: tickets, isLoading, refetch } = useTickets({
    requester_id: profile?.id,
    status: statusFilter,
  });

  const filters: (TicketStatus | undefined)[] = [undefined, ...ALL_STATUSES];

  return (
    <Screen edges={['top', 'left', 'right']} style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Tickets</Text>
        <TouchableOpacity
          onPress={() => router.push('/create-ticket')}
          style={styles.newBtn}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={styles.newBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Chips bar — plain View wrapper prevents horizontal ScrollView from stretching */}
      <View style={styles.chipsBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContainer}
        >
          {filters.map((s) => {
            const active = statusFilter === s;
            const chipColor = s ? theme.statusColors[s].accent : theme.colors.textSecondary;
            return (
              <TouchableOpacity
                key={s ?? 'all'}
                style={[
                  styles.chip,
                  active
                    ? { backgroundColor: theme.colors.brand, borderColor: theme.colors.brand }
                    : { backgroundColor: theme.colors.surface, borderColor: chipColor },
                ]}
                onPress={() => setStatusFilter(s)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, { color: active ? '#fff' : chipColor }]}>
                  {s ? theme.statusLabels[s] : 'All'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Ticket list */}
      {isLoading ? (
        <LoadingOverlay />
      ) : (
        <FlatList
          data={tickets ?? []}
          keyExtractor={(t) => t.id}
          renderItem={({ item }) => <TicketCard ticket={item} />}
          contentContainerStyle={styles.list}
          style={styles.flatList}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
          ListEmptyComponent={
            <EmptyState
              icon="ticket-outline"
              title="No tickets found"
              subtitle="Tap '+ New' to raise a new IT ticket"
            />
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: theme.colors.brand,
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.brand,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  newBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
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
