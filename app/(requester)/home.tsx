import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Screen } from '../../components/common/Screen';
import { GoldRateCard } from '../../components/home/GoldRateCard';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useTickets } from '../../hooks/useTickets';
import { QUERY_KEYS } from '../../constants/queryKeys';
import { TicketWithRelations } from '../../types/ticket';
import { theme } from '../../constants/theme';

interface StatCardProps {
  label: string;
  count: number;
  color: string;
  onPress: () => void;
}

function StatCard({ label, count, color, onPress }: StatCardProps) {
  return (
    <TouchableOpacity style={{ flex: 1 }} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.statCard, { borderTopColor: color }, theme.shadows.sm]}>
        <Text style={[styles.statCount, { color }]}>{count}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
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
    <Screen edges={['top', 'left', 'right']} style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerAppName}>INDRIYA IT</Text>
          <Text style={styles.headerGreeting}>
            Hello, {profile?.full_name?.split(' ')[0]}
          </Text>
        </View>
        {profile && (
          <TouchableOpacity
            onPress={() => router.push('/(requester)/profile' as never)}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            activeOpacity={0.8}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarInitial}>
                {profile.full_name?.[0]?.toUpperCase() ?? ''}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Body */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isLoading}
            onRefresh={handleRefresh}
            tintColor={theme.colors.brand}
            colors={[theme.colors.brand]}
          />
        }
      >
        <GoldRateCard />

        <Text style={styles.sectionLabel}>MY TICKETS</Text>
        <View style={styles.statsRow}>
          <StatCard
            label="Open"
            count={open}
            color={theme.statusColors.open.accent}
            onPress={() => goTickets('open')}
          />
          <StatCard
            label="In Progress"
            count={inProgress}
            color={theme.statusColors.in_progress.accent}
            onPress={() => goTickets('in_progress')}
          />
          <StatCard
            label="Resolved"
            count={resolved}
            color={theme.statusColors.resolved.accent}
            onPress={() => goTickets('resolved')}
          />
        </View>

        <TouchableOpacity
          style={[styles.raiseCta, theme.shadows.md]}
          onPress={() => router.push('/create-ticket')}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={20} color="#fff" style={styles.raiseCtaIcon} />
          <Text style={styles.raiseCtaText}>Raise Ticket</Text>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: theme.colors.brand,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.brand,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  headerAppName: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
  },
  headerGreeting: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: theme.spacing.xs,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.accent,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  scroll: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl + theme.spacing.sm,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textTertiary,
    letterSpacing: 0.8,
    marginBottom: theme.spacing.sm + 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  statCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderTopWidth: 3,
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.sm,
  },
  statCount: {
    fontSize: 28,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  raiseCta: {
    backgroundColor: theme.colors.brand,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  raiseCtaIcon: {
    marginRight: theme.spacing.sm,
  },
  raiseCtaText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
