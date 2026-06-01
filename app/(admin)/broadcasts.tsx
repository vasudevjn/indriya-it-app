import React, { useState } from 'react';
import {
  FlatList, View, StyleSheet, RefreshControl, ScrollView, TouchableOpacity,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Text, Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/common/Screen';
import { AppHeader } from '../../components/common/AppHeader';
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

// Rupee sign built at runtime to keep source file ASCII-only
const RUPEE = String.fromCharCode(0x20B9);

type AdminTab = 'broadcasts' | 'gold-rate';

//  Broadcast item 

function BroadcastItem({ item }: { item: DbBroadcast }) {
  return (
    <Card style={styles.card} mode="outlined">
      <Card.Content>
        <Text variant="labelLarge" style={styles.cardTitle}>{item.title}</Text>
        <Text variant="bodySmall" style={styles.cardBody}>{item.body}</Text>
        <Text variant="labelSmall" style={styles.cardMeta}>
          {formatDateTime(item.created_at)}
          {item.target_store_id ? ' - Specific store' : ' - All stores'}
        </Text>
      </Card.Content>
    </Card>
  );
}

//  Gold rate history item 

function RateHistoryItem({ item, isLatest }: { item: GoldRate; isLatest: boolean }) {
  return (
    <Card style={[styles.card, isLatest && styles.latestCard]} mode="outlined">
      <Card.Content style={styles.rateCardContent}>
        {isLatest && (
          <View style={styles.latestBadge}>
            <Text style={styles.latestBadgeText}>Current</Text>
          </View>
        )}
        <View style={styles.rateRow}>
          <View style={styles.rateCell}>
            <Text style={styles.rateKarat}>22K</Text>
            <Text style={[styles.rateVal, isLatest && styles.rateValCurrent]}>
              {RUPEE}{item.rate_22k.toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.rateDivider} />
          <View style={styles.rateCell}>
            <Text style={styles.rateKarat}>24K</Text>
            <Text style={[styles.rateVal, isLatest && styles.rateValCurrent]}>
              {RUPEE}{item.rate_24k.toLocaleString('en-IN')}
            </Text>
          </View>
          <Text style={styles.rateMeta}>{formatDateTime(item.updated_at)}</Text>
        </View>
      </Card.Content>
    </Card>
  );
}

//  Segmented control 

interface TabButtonProps {
  tab: AdminTab;
  active: boolean;
  icon: string;
  label: string;
  onPress: () => void;
}

function TabButton({ active, icon, label, onPress }: TabButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.tabBtn, active && styles.tabBtnActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons
        name={icon as keyof typeof Ionicons.glyphMap}
        size={16}
        color={active ? '#1B3A7A' : '#9CA3AF'}
      />
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

//  Main screen 

export default function AdminBroadcasts() {
  const qc = useQueryClient();
  const showToast = useUiStore((s) => s.showToast);
  const { profile } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<AdminTab>('broadcasts');

  // Broadcasts data
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

  // Gold rate history data
  const {
    data: rateHistory,
    isLoading: loadingRates,
    refetch: refetchRates,
    isRefetching: refetchingRates,
  } = useGoldRateHistory();

  if (loadingBroadcasts && activeTab === 'broadcasts') return <LoadingOverlay />;
  if (loadingRates && activeTab === 'gold-rate') return <LoadingOverlay />;

  return (
    <Screen edges={['top', 'left', 'right']}>
      <AppHeader title="Publish" />

      {/* Segmented control */}
      <View style={styles.tabBar}>
        <TabButton
          tab="broadcasts"
          active={activeTab === 'broadcasts'}
          icon="megaphone-outline"
          label="Broadcasts"
          onPress={() => setActiveTab('broadcasts')}
        />
        <TabButton
          tab="gold-rate"
          active={activeTab === 'gold-rate'}
          icon="trending-up"
          label="Gold Rate"
          onPress={() => setActiveTab('gold-rate')}
        />
      </View>

      {/*  Broadcasts panel  */}
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
              tintColor="#1B3A7A"
              colors={['#1B3A7A']}
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

      {/*  Gold Rate panel  */}
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
              tintColor="#1B3A7A"
              colors={['#1B3A7A']}
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  /* Segmented control */
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 9,
  },
  tabBtnActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  tabLabelActive: {
    color: '#1B3A7A',
  },

  /* Lists */
  list: {
    paddingBottom: 32,
  },

  /* Broadcast card */
  card: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  cardTitle: {
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  cardBody: {
    color: '#374151',
    marginBottom: 6,
  },
  cardMeta: {
    color: '#9CA3AF',
  },

  /* Gold rate history card */
  latestCard: {
    borderColor: 'rgba(201,164,106,0.5)',
    backgroundColor: '#FFFBEB',
  },
  rateCardContent: {
    paddingVertical: 4,
  },
  latestBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(201,164,106,0.2)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 8,
  },
  latestBadgeText: {
    color: '#92400E',
    fontSize: 11,
    fontWeight: '700',
  },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rateCell: {
    alignItems: 'center',
    minWidth: 70,
  },
  rateKarat: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  rateVal: {
    color: '#374151',
    fontSize: 17,
    fontWeight: '700',
  },
  rateValCurrent: {
    color: '#92400E',
  },
  rateDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E5E7EB',
  },
  rateMeta: {
    flex: 1,
    color: '#9CA3AF',
    fontSize: 12,
    textAlign: 'right',
  },
});
