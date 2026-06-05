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

export default function MyTickets() {
  const { profile } = useCurrentUser();
  const { data: tickets, isLoading, refetch } = useTickets({ assignee_id: profile?.id });

  if (isLoading) return <LoadingOverlay />;

  return (
    <Screen edges={['top', 'left', 'right']}>
      <AppHeader title="My assigned tickets" />
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
        ListEmptyComponent={
          <EmptyState
            icon="person-outline"
            title="No assigned tickets"
            subtitle="Pick up tickets from the queue to see them here"
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
