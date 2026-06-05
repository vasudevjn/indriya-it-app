import React, { useState, useEffect } from 'react';
import {
  FlatList, View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '../../components/common/Screen';
import { TicketCard } from '../../components/tickets/TicketCard';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingOverlay } from '../../components/common/LoadingOverlay';
import { useTickets } from '../../hooks/useTickets';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { ALL_STATUSES } from '../../constants/ticket';
import { TicketStatus } from '../../types';
import { theme } from '../../constants/theme';

// Status chips are a plain single-select list (undefined = All).
const STATUS_FILTER_OPTIONS: (TicketStatus | undefined)[] = [undefined, ...ALL_STATUSES];

export default function TechnicianAllTickets() {
  const { initialStatus, initialFilter } = useLocalSearchParams<{
    initialStatus?: string;
    initialFilter?: string;
  }>();
  const { profile } = useCurrentUser();

  // Two independent filter dimensions:
  //   assignedToMe  – toggleable; filters by assignee_id = current technician
  //   statusFilter  – single-select; filters by ticket status (undefined = All)
  // Both can be active simultaneously: the query ANDs them together.
  const [assignedToMe, setAssignedToMe] = useState(initialFilter === 'my_assigned');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | undefined>(
    (initialStatus as TicketStatus) || undefined,
  );

  useEffect(() => {
    setAssignedToMe(initialFilter === 'my_assigned');
    setStatusFilter((initialStatus as TicketStatus) || undefined);
  }, [initialStatus, initialFilter]);

  // Build query — both conditions are applied when both flags are set.
  // '__loading__' ensures an empty result while profile.id is still hydrating,
  // rather than briefly returning all tickets.
  const ticketFilters: { status?: TicketStatus; assignee_id?: string } = {};
  if (assignedToMe) ticketFilters.assignee_id = profile?.id ?? '__loading__';
  if (statusFilter) ticketFilters.status = statusFilter;

  const { data: tickets, isLoading, refetch } = useTickets(ticketFilters);

  return (
    <Screen edges={['top', 'left', 'right']} style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>All Tickets</Text>
      </View>

      {/* Filter chips */}
      <View style={styles.chipsBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContainer}
        >
          {/* "Assigned to Me" — independent toggle */}
          <TouchableOpacity
            style={[
              styles.chip,
              assignedToMe
                ? { backgroundColor: theme.colors.brand, borderColor: theme.colors.brand }
                : { backgroundColor: theme.colors.surface, borderColor: theme.colors.brand },
            ]}
            onPress={() => setAssignedToMe((v) => !v)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, { color: assignedToMe ? '#fff' : theme.colors.brand }]}>
              Assigned to Me
            </Text>
          </TouchableOpacity>

          {/* Divider between assignment and status chips */}
          <View style={styles.chipDivider} />

          {/* Status chips — single-select; tap active chip to deselect */}
          {STATUS_FILTER_OPTIONS.map((s) => {
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
                onPress={() => setStatusFilter(active ? undefined : s)}
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
          ListEmptyComponent={<EmptyState icon="ticket-outline" title="No tickets found" />}
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
  chipDivider: {
    width: 1,
    height: 20,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.xs,
    alignSelf: 'center',
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
