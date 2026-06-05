import React, { useState } from 'react';
import { FlatList, View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Text } from 'react-native-paper';
import { Screen } from '../../components/common/Screen';
import { AppHeader } from '../../components/common/AppHeader';
import { TicketCard } from '../../components/tickets/TicketCard';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingOverlay } from '../../components/common/LoadingOverlay';
import { useTickets } from '../../hooks/useTickets';
import { ALL_STATUSES, STATUS_LABELS } from '../../constants/ticket';
import { TicketStatus } from '../../types';
import { theme } from '../../constants/theme';

export default function AdminAllTickets() {
  const [statusFilter, setStatusFilter] = useState<TicketStatus | undefined>(undefined);
  const { data: tickets, isLoading, refetch } = useTickets({ status: statusFilter });

  const filters: (TicketStatus | undefined)[] = [undefined, ...ALL_STATUSES];

  return (
    <Screen edges={['top', 'left', 'right']}>
      <AppHeader title="All tickets" />
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {filters.map((s) => {
            const active = statusFilter === s;
            const color = s ? theme.statusColors[s].accent : theme.colors.brand;
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
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={theme.colors.brand}
              colors={[theme.colors.brand]}
            />
          }
          ListEmptyComponent={<EmptyState icon="ticket-outline" title="No tickets found" />}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  chip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.full,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textTertiary,
  },
  chipTextActive: {
    color: theme.colors.surface,
  },
  list: {
    paddingVertical: theme.spacing.sm,
    paddingBottom: theme.spacing.xxl,
  },
});
