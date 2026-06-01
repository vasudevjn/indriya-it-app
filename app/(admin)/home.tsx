import React, { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/common/Screen';
import { AppHeader } from '../../components/common/AppHeader';
import { GoldRateCard } from '../../components/home/GoldRateCard';
import { ProfileIconButton } from '../../components/common/ProfileIconButton';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { QUERY_KEYS } from '../../constants/queryKeys';
import { getPendingTechnicians } from '../../lib/api/profiles';

interface ActionCardProps {
  icon: string;
  label: string;
  subtitle: string;
  badge?: number;
  color: string;
  onPress: () => void;
}

function ActionCard({ icon, label, subtitle, badge, color, onPress }: ActionCardProps) {
  return (
    <TouchableOpacity style={styles.actionCard} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.actionIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={24} color={color} />
        {badge !== undefined && badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        )}
      </View>
      <View style={styles.actionText}>
        <Text variant="labelLarge" style={styles.actionLabel}>{label}</Text>
        <Text variant="bodySmall" style={styles.actionSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
    </TouchableOpacity>
  );
}

export default function AdminHome() {
  const { profile } = useCurrentUser();
  const qc = useQueryClient();

  const { data: pending, refetch: refetchPending } = useQuery({
    queryKey: QUERY_KEYS.pendingTechnicians(),
    queryFn: getPendingTechnicians,
  });

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchPending(),
      qc.invalidateQueries({ queryKey: QUERY_KEYS.goldRate() }),
    ]);
    setRefreshing(false);
  }, [refetchPending, qc]);

  const pendingCount = pending?.length ?? 0;

  return (
    <Screen edges={['top', 'left', 'right']}>
      <AppHeader
        title="Admin"
        right={profile ? <ProfileIconButton profile={profile} /> : undefined}
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#1B3A7A"
            colors={['#1B3A7A']}
          />
        }
      >
        <Text variant="headlineSmall" style={styles.greeting}>
          Hello, {profile?.full_name?.split(' ')[0]}
        </Text>

        {/* Gold Rate */}
        <GoldRateCard />

        {/* Quick Actions */}
        <Text variant="labelMedium" style={styles.sectionLabel}>Quick Actions</Text>
        <Card style={styles.actionsCard} mode="outlined">
          <ActionCard
            icon="person-add-outline"
            label="Approvals"
            subtitle={
              pendingCount > 0
                ? `${pendingCount} pending technician request${pendingCount !== 1 ? 's' : ''}`
                : 'No pending requests'
            }
            badge={pendingCount}
            color="#1B3A7A"
            onPress={() => router.push('/(admin)/approvals')}
          />
          <View style={styles.cardDivider} />
          <ActionCard
            icon="megaphone-outline"
            label="Publish Announcement"
            subtitle="Send broadcast or update gold rate"
            color="#D97706"
            onPress={() => router.push('/(admin)/broadcasts')}
          />
          <View style={styles.cardDivider} />
          <ActionCard
            icon="grid-outline"
            label="All Tickets"
            subtitle="View and manage all IT tickets"
            color="#6B7280"
            onPress={() => router.push('/(admin)/all-tickets')}
          />
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 32 },
  greeting: { fontWeight: '700', color: '#111827', marginBottom: 20 },
  sectionLabel: {
    color: '#6B7280',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 11,
    marginBottom: 10,
  },
  actionsCard: { backgroundColor: '#fff', overflow: 'hidden' },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  actionText: { flex: 1, gap: 2 },
  actionLabel: { color: '#111827', fontWeight: '700' },
  actionSubtitle: { color: '#6B7280' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  cardDivider: { height: 1, backgroundColor: '#F3F4F6', marginLeft: 78 },
});
