import React, { useState } from 'react';
import {
  FlatList, View, Text, StyleSheet, RefreshControl, TouchableOpacity,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BroadcastForm } from '../../components/admin/BroadcastForm';
import { GoldRateForm } from '../../components/admin/GoldRateForm';
import { LoadingOverlay } from '../../components/common/LoadingOverlay';
import { EmptyState } from '../../components/common/EmptyState';
import { QUERY_KEYS } from '../../constants/queryKeys';
import { getBroadcasts, createBroadcast } from '../../lib/api/broadcasts';
import { getStores } from '../../lib/api/stores';
import { useGoldRateHistory } from '../../hooks/useGoldRate';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useUiStore } from '../../stores/uiStore';
import { formatDateTime } from '../../lib/utils/date';
import { DbBroadcast } from '../../types';
import { GoldRate } from '../../lib/api/goldRate';
import { theme } from '../../constants/theme';

const RUPEE = String.fromCharCode(0x20B9);
type AdminTab = 'broadcasts' | 'gold-rate';

type RateKey = 'rate_24k' | 'rate_24k_995' | 'rate_22k' | 'rate_18k';
const RATE_COLS: Array<{ key: RateKey; label: string }> = [
  { key: 'rate_24k',     label: '24K (999)' },
  { key: 'rate_24k_995', label: '24K (995)' },
  { key: 'rate_22k',     label: '22K (916)' },
  { key: 'rate_18k',     label: '18K (750)' },
];

// ── Past broadcast item ───────────────────────────────────────────────────────

function BroadcastItem({ item }: { item: DbBroadcast }) {
  return (
    <View style={[styles.card, theme.shadows.sm]}>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardBody}>{item.body}</Text>
      <Text style={styles.cardMeta}>
        {formatDateTime(item.created_at)}
        {item.target_store_id ? ' · Specific store' : ' · All stores'}
      </Text>
    </View>
  );
}

// ── Gold rate history item ────────────────────────────────────────────────────

function RateHistoryItem({ item, isLatest }: { item: GoldRate; isLatest: boolean }) {
  return (
    <View style={[styles.card, theme.shadows.sm]}>
      <View style={styles.rateCardHeader}>
        {isLatest ? (
          <View style={styles.currentBadge}>
            <Text style={styles.currentBadgeText}>Current</Text>
          </View>
        ) : (
          <View />
        )}
        <Text style={styles.rateTimestamp}>{formatDateTime(item.updated_at)}</Text>
      </View>
      <View style={styles.rateColumns}>
        {RATE_COLS.map((col) => (
          <View key={col.key} style={styles.rateColumn}>
            <Text style={styles.rateColLabel}>{col.label}</Text>
            <Text style={styles.rateColValue}>
              {RUPEE}{item[col.key].toLocaleString('en-IN')}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function AdminBroadcasts() {
  const qc = useQueryClient();
  const showToast = useUiStore((s) => s.showToast);
  const { profile } = useCurrentUser();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<AdminTab>('broadcasts');

  const {
    data: broadcasts,
    isLoading: loadingBroadcasts,
    refetch: refetchBroadcasts,
    isRefetching: refetchingBroadcasts,
  } = useQuery({ queryKey: QUERY_KEYS.broadcasts(), queryFn: getBroadcasts });

  const { data: stores } = useQuery({
    queryKey: QUERY_KEYS.stores(),
    queryFn: getStores,
  });

  const sendMutation = useMutation({
    mutationFn: (payload: { title: string; body: string; target_store_ids: string[] }) =>
      createBroadcast({ ...payload, sender_id: profile!.id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.broadcasts() });
      showToast('Broadcast sent!', 'success');
    },
    onError: () => showToast('Failed to send broadcast', 'error'),
  });

  const {
    data: rateHistory,
    isLoading: loadingRates,
    refetch: refetchRates,
    isRefetching: refetchingRates,
  } = useGoldRateHistory();

  if (loadingBroadcasts && activeTab === 'broadcasts') return <LoadingOverlay />;
  if (loadingRates && activeTab === 'gold-rate') return <LoadingOverlay />;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + theme.spacing.sm }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={18} color="rgba(255,255,255,0.6)" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Publish Announcement</Text>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {(['broadcasts', 'gold-rate'] as AdminTab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={styles.tabItem}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'broadcasts' ? 'Broadcasts' : 'Gold rate'}
            </Text>
            {activeTab === tab && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Broadcasts panel */}
      {activeTab === 'broadcasts' && (
        <FlatList
          data={broadcasts ?? []}
          keyExtractor={(b) => b.id}
          renderItem={({ item }) => <BroadcastItem item={item} />}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refetchingBroadcasts}
              onRefresh={refetchBroadcasts}
              tintColor={theme.colors.brand}
              colors={[theme.colors.brand]}
            />
          }
          ListHeaderComponent={
            <BroadcastForm
              stores={stores ?? []}
              onSubmit={(p) => sendMutation.mutate(p)}
              isLoading={sendMutation.isPending}
            />
          }
          ListEmptyComponent={
            broadcasts !== undefined ? (
              <EmptyState icon="megaphone-outline" title="No broadcasts yet" />
            ) : null
          }
        />
      )}

      {/* Gold rate panel */}
      {activeTab === 'gold-rate' && (
        <FlatList
          data={rateHistory ?? []}
          keyExtractor={(r) => r.id}
          renderItem={({ item, index }) => (
            <RateHistoryItem item={item} isLatest={index === 0} />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refetchingRates}
              onRefresh={refetchRates}
              tintColor={theme.colors.brand}
              colors={[theme.colors.brand]}
            />
          }
          ListHeaderComponent={<GoldRateForm />}
          ListEmptyComponent={
            rateHistory !== undefined ? (
              <EmptyState icon="trending-up" title="No rates set yet" />
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },

  // Header
  header: {
    backgroundColor: theme.colors.brand,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  backText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '500',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    position: 'relative',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textTertiary,
  },
  tabTextActive: {
    color: theme.colors.brand,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: theme.spacing.xl,
    right: theme.spacing.xl,
    height: 2,
    backgroundColor: theme.colors.brand,
    borderRadius: theme.radius.full,
  },

  // Lists
  list: {
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.lg * 2,
  },

  // Past broadcast card
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  cardTitle: {
    fontWeight: '700',
    color: theme.colors.textPrimary,
    fontSize: 14,
    marginBottom: theme.spacing.xs,
  },
  cardBody: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginBottom: theme.spacing.xs,
  },
  cardMeta: {
    color: theme.colors.textTertiary,
    fontSize: 12,
  },

  // Rate history card
  rateCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  currentBadge: {
    backgroundColor: theme.colors.accent + '26',
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  currentBadgeText: {
    color: theme.colors.accent,
    fontSize: 11,
    fontWeight: '700',
  },
  rateTimestamp: {
    color: theme.colors.textTertiary,
    fontSize: 12,
    marginLeft: 'auto',
  },
  rateColumns: {
    flexDirection: 'row',
  },
  rateColumn: {
    flex: 1,
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  rateColLabel: {
    color: theme.colors.textTertiary,
    fontSize: 11,
    fontWeight: '600',
  },
  rateColValue: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
});
