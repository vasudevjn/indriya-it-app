import React from 'react';
import { FlatList, View, Text, StyleSheet, RefreshControl } from 'react-native';
import { Screen } from '../../components/common/Screen';
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
    <Screen edges={['top', 'left', 'right']} style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Tickets</Text>
      </View>
      <FlatList
        data={tickets ?? []}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => <TicketCard ticket={item} />}
        style={styles.flatList}
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
  screen: {
    backgroundColor: theme.colors.brand,
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.brand,
  },
  flatList: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  list: {
    paddingVertical: theme.spacing.sm,
    paddingBottom: theme.spacing.xxl,
  },
});
