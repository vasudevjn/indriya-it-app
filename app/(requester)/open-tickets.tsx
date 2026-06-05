import React from 'react';
import { FlatList, StyleSheet, RefreshControl } from 'react-native';
import { Screen } from '../../components/common/Screen';
import { AppHeader } from '../../components/common/AppHeader';
import { TicketCard } from '../../components/tickets/TicketCard';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingOverlay } from '../../components/common/LoadingOverlay';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useTickets } from '../../hooks/useTickets';
import { theme } from '../../constants/theme';

export default function OpenTickets() {
  const { profile } = useCurrentUser();
  const { data: open, isLoading, refetch } = useTickets({ requester_id: profile?.id, status: 'open' });
  const { data: inProgress } = useTickets({ requester_id: profile?.id, status: 'in_progress' });

  const tickets = [...(open ?? []), ...(inProgress ?? [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  if (isLoading) return <LoadingOverlay />;

  return (
    <Screen edges={['top', 'left', 'right']}>
      <AppHeader title="Open tickets" />
      <FlatList
        data={tickets}
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
        ListEmptyComponent={
          <EmptyState
            icon="checkmark-circle-outline"
            title="No open tickets"
            subtitle="All your issues have been resolved!"
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingVertical: theme.spacing.sm,
    paddingBottom: theme.spacing.xxl,
  },
});
