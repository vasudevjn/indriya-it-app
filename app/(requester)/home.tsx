import React, { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Screen } from '../../components/common/Screen';
import { AppHeader } from '../../components/common/AppHeader';
import { GoldRateCard } from '../../components/home/GoldRateCard';
import { ProfileIconButton } from '../../components/common/ProfileIconButton';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useTickets } from '../../hooks/useTickets';
import { QUERY_KEYS } from '../../constants/queryKeys';
import { TicketWithRelations } from '../../types/ticket';

type StatColor = string;

interface StatCardProps {
  label: string;
  count: number;
  color: StatColor;
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

export default function RequesterHome() {
  const { profile } = useCurrentUser();
  const qc = useQueryClient();
  const { data: tickets, isLoading, refetch } = useTickets({ requester_id: profile?.id });

  const open       = tickets?.filter((t: TicketWithRelations) => t.status === 'open').length ?? 0;
  const inProgress = tickets?.filter((t: TicketWithRelations) => t.status === 'in_progress').length ?? 0;
  const resolved   = tickets?.filter((t: TicketWithRelations) => t.status === 'resolved').length ?? 0;

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetch(),
      qc.invalidateQueries({ queryKey: QUERY_KEYS.goldRate() }),
    ]);
    setRefreshing(false);
  }, [refetch, qc]);

  const goTickets = (status: string) =>
    router.push({ pathname: '/(requester)/tickets', params: { initialStatus: status } } as never);

  return (
    <Screen edges={['top', 'left', 'right']}>
      <AppHeader
        title="Indriya IT"
        right={profile ? <ProfileIconButton profile={profile} /> : undefined}
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isLoading}
            onRefresh={handleRefresh}
            tintColor="#1B3A7A"
            colors={['#1B3A7A']}
          />
        }
      >
        {/* Greeting */}
        <Text variant="headlineSmall" style={styles.greeting}>
          Hello, {profile?.full_name?.split(' ')[0]}
        </Text>

        {/* Gold Rate */}
        <GoldRateCard />

        {/* My Tickets */}
        <Text variant="labelMedium" style={styles.sectionLabel}>My Tickets</Text>
        <View style={styles.statsRow}>
          <StatCard label="Open"        count={open}       color="#3B82F6" onPress={() => goTickets('open')} />
          <StatCard label="In Progress" count={inProgress} color="#F59E0B" onPress={() => goTickets('in_progress')} />
          <StatCard label="Resolved"    count={resolved}   color="#10B981" onPress={() => goTickets('resolved')} />
        </View>

        {/* Raise Ticket */}
        <TouchableOpacity
          style={styles.raiseCta}
          onPress={() => router.push('/create-ticket')}
          activeOpacity={0.85}
        >
          <Text style={styles.raiseCtaText}>+ Raise IT Ticket</Text>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 32 },
  greeting: { fontWeight: '700', color: '#111827', marginTop: 4, marginBottom: 20 },
  sectionLabel: {
    color: '#6B7280',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 11,
    marginBottom: 10,
  },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  statCard: { backgroundColor: '#fff' },
  statContent: { alignItems: 'center', paddingVertical: 14 },
  statCount: { fontSize: 28, fontWeight: '800' },
  statLabel: { color: '#6B7280', marginTop: 2, textAlign: 'center' },
  raiseCta: {
    backgroundColor: '#1B3A7A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  raiseCtaText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
