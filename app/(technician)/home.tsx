import React, { useCallback, useState } from 'react';
import {
  View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, FlatList,
} from 'react-native';
import { Text, Card, Divider } from 'react-native-paper';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Screen } from '../../components/common/Screen';
import { AppHeader } from '../../components/common/AppHeader';
import { GoldRateCard } from '../../components/home/GoldRateCard';
import { ProfileIconButton } from '../../components/common/ProfileIconButton';
import { TicketCard } from '../../components/tickets/TicketCard';
import { EmptyState } from '../../components/common/EmptyState';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useTickets } from '../../hooks/useTickets';
import { QUERY_KEYS } from '../../constants/queryKeys';
import { TicketWithRelations } from '../../types/ticket';

interface StatCardProps {
  label: string;
  count: number;
  color: string;
  onPress: () => void;
}

function StatCard({ label, count, color, onPress }: StatCardProps) {
  return (
    <TouchableOpacity style={{ flex: 1 }} onPress={onPress} activeOpacity={0.8}>
      <Card style={styles.statCard} mode="outlined">
        <Card.Content style={styles.statContent}>
          <Text style={[styles.statCount, { color }]}>{count}</Text>
          <Text variant="labelSmall" style={styles.statLabel}>{label}</Text>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
}

export default function TechnicianHome() {
  const { profile } = useCurrentUser();
  const qc = useQueryClient();

  // All open tickets in queue (unassigned)
  const { data: queueTickets, refetch: refetchQueue } = useTickets({ status: 'open' });

  // My assigned active tickets (open + in_progress)
  const { data: myOpenTickets, refetch: refetchMyOpen } = useTickets({
    assignee_id: profile?.id,
    status: 'open',
  });
  const { data: myInProgressTickets, refetch: refetchMyIP } = useTickets({
    assignee_id: profile?.id,
    status: 'in_progress',
  });
  const { data: myResolvedTickets, refetch: refetchResolved } = useTickets({
    assignee_id: profile?.id,
    status: 'resolved',
  });

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchQueue(),
      refetchMyOpen(),
      refetchMyIP(),
      refetchResolved(),
      qc.invalidateQueries({ queryKey: QUERY_KEYS.goldRate() }),
    ]);
    setRefreshing(false);
  }, [refetchQueue, refetchMyOpen, refetchMyIP, refetchResolved, qc]);

  // Unresolved tickets assigned to this technician (shown as cards)
  const myActiveTickets: TicketWithRelations[] = [
    ...(myOpenTickets ?? []),
    ...(myInProgressTickets ?? []),
  ].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const goAllTickets = (status: string) =>
    router.push({ pathname: '/(technician)/all-tickets', params: { initialStatus: status } } as never);

  const queueCount    = queueTickets?.length ?? 0;
  const myActiveCount = myActiveTickets.length;
  const resolvedCount = myResolvedTickets?.length ?? 0;

  return (
    <Screen edges={['top', 'left', 'right']}>
      <AppHeader
        title="Indriya IT"
        right={profile ? <ProfileIconButton profile={profile} /> : undefined}
      />
      <FlatList
        data={myActiveTickets}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => <TicketCard ticket={item} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#1B3A7A"
            colors={['#1B3A7A']}
          />
        }
        ListHeaderComponent={
          <View>
            {/* Greeting */}
            <View style={styles.headerPad}>
              <Text variant="headlineSmall" style={styles.greeting}>
                Hello, {profile?.full_name?.split(' ')[0]}
              </Text>
            </View>

            {/* Gold Rate */}
            <View style={styles.section}>
              <GoldRateCard />
            </View>

            {/* Stats */}
            <View style={styles.headerPad}>
              <Text variant="labelMedium" style={styles.sectionLabel}>Ticket Overview</Text>
              <View style={styles.statsRow}>
                <StatCard
                  label="In Queue"
                  count={queueCount}
                  color="#3B82F6"
                  onPress={() => goAllTickets('open')}
                />
                <StatCard
                  label="My Active"
                  count={myActiveCount}
                  color="#F59E0B"
                  onPress={() => goAllTickets('in_progress')}
                />
                <StatCard
                  label="Resolved"
                  count={resolvedCount}
                  color="#10B981"
                  onPress={() => goAllTickets('resolved')}
                />
              </View>
            </View>

            <Divider />
            <View style={styles.headerPad}>
              <Text variant="labelMedium" style={styles.sectionLabel}>My Assigned Tickets</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="checkmark-done-outline"
            title="No active assigned tickets"
            subtitle="Pick up tickets from All Tickets"
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: 32 },
  headerPad: { paddingHorizontal: 16 },
  greeting: { fontWeight: '700', color: '#111827', marginTop: 16, marginBottom: 16 },
  section: { paddingHorizontal: 0 },
  sectionLabel: {
    color: '#6B7280',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 11,
    marginBottom: 10,
    marginTop: 16,
  },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statCard: { backgroundColor: '#fff' },
  statContent: { alignItems: 'center', paddingVertical: 14 },
  statCount: { fontSize: 24, fontWeight: '800' },
  statLabel: { color: '#6B7280', marginTop: 2, textAlign: 'center', fontSize: 11 },
});
