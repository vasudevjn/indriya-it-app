import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GoldRateCard } from '../../components/home/GoldRateCard';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useTickets } from '../../hooks/useTickets';
import { QUERY_KEYS } from '../../constants/queryKeys';
import { TicketWithRelations } from '../../types/ticket';
import { theme } from '../../constants/theme';

interface StatCardProps {
  label: string;
  count: number;
  accentColor: string;
  onPress: () => void;
}

function StatCard({ label, count, accentColor, onPress }: StatCardProps) {
  return (
    <TouchableOpacity style={styles.statCardWrapper} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.statCard, theme.shadows.sm, { borderTopColor: accentColor }]}>
        <View style={styles.statContent}>
          <Text style={[styles.statCount, { color: accentColor }]}>{count}</Text>
          <Text style={styles.statLabel}>{label}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function TechnicianHome() {
  const { profile } = useCurrentUser();
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();

  const { data: queueTickets, refetch: refetchQueue } = useTickets({ status: 'open' });
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

  const myActiveTickets: TicketWithRelations[] = [
    ...(myOpenTickets ?? []),
    ...(myInProgressTickets ?? []),
  ].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const queueCount    = queueTickets?.length ?? 0;
  const myActiveCount = myActiveTickets.length;
  const resolvedCount = myResolvedTickets?.length ?? 0;

  const firstName = profile?.full_name?.split(' ')[0] ?? '';
  const initial   = firstName.charAt(0).toUpperCase();

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + theme.spacing.md }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.appName}>INDRIYA IT</Text>
          <Text style={styles.greeting}>Hello, {firstName}</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/(technician)/profile' as never)}
          activeOpacity={0.8}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.brand}
            colors={[theme.colors.brand]}
          />
        }
      >
        <GoldRateCard />

        <Text style={styles.sectionLabel}>Ticket overview</Text>

        <View style={styles.statsRow}>
          <StatCard
            label="In queue"
            count={queueCount}
            accentColor={theme.statusColors.open.accent}
            onPress={() =>
              router.push({
                pathname: '/(technician)/all-tickets',
                params: { initialStatus: 'open' },
              } as never)
            }
          />
          <StatCard
            label="My active"
            count={myActiveCount}
            accentColor={theme.statusColors.in_progress.accent}
            onPress={() =>
              router.push({
                pathname: '/(technician)/all-tickets',
                params: { initialStatus: 'in_progress', initialFilter: 'my_assigned' },
              } as never)
            }
          />
          <StatCard
            label="Resolved"
            count={resolvedCount}
            accentColor={theme.statusColors.resolved.accent}
            onPress={() =>
              router.push({
                pathname: '/(technician)/all-tickets',
                params: { initialStatus: 'resolved' },
              } as never)
            }
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    backgroundColor: theme.colors.brand,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    gap: theme.spacing.xs,
  },
  appName: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  greeting: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  body: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl * 2,
  },
  sectionLabel: {
    color: theme.colors.textTertiary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 11,
    marginBottom: theme.spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  statCardWrapper: {
    flex: 1,
  },
  statCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderTopWidth: 3,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
  },
  statCount: {
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
    fontSize: 11,
  },
});
