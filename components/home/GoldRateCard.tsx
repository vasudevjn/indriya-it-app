import React from 'react';
import {
  View, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useGoldRate } from '../../hooks/useGoldRate';
import { timeAgo } from '../../lib/utils/date';

const GOLD = '#C9A46A';
const GOLD_LIGHT = '#F5ECD8';
const NAVY_DARK = '#142D60';

// Indian Rupee sign (U+20B9) constructed at runtime to keep source file ASCII-only
// Raw Unicode chars in JSX text nodes can confuse Metro/Hermes on some Android builds
const RUPEE = String.fromCharCode(0x20B9);

function RateColumn({ karat, rate }: { karat: string; rate: number }) {
  return (
    <View style={styles.rateColumn}>
      <View style={styles.karatBadge}>
        <Text style={styles.karatText}>{karat}</Text>
      </View>
      <Text style={styles.rateValue}>
        {RUPEE}{rate.toLocaleString('en-IN')}
      </Text>
      <Text style={styles.rateUnit}>per gram</Text>
    </View>
  );
}

export function GoldRateCard() {
  const { data: rate, isLoading, refetch, isRefetching } = useGoldRate();

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.goldIconWrap}>
            <Ionicons name="trending-up" size={18} color={GOLD} />
          </View>
          <Text style={styles.cardTitle}>Gold Rate Today</Text>
        </View>
        <TouchableOpacity
          onPress={() => refetch()}
          disabled={isRefetching}
          style={styles.refreshBtn}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
        >
          {isRefetching ? (
            <ActivityIndicator size="small" color={GOLD} />
          ) : (
            <Ionicons name="refresh-outline" size={18} color={GOLD} />
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading ? (
        <ActivityIndicator color={GOLD} style={{ marginVertical: 20 }} />
      ) : rate ? (
        <>
          <View style={styles.ratesRow}>
            <RateColumn karat="22K" rate={rate.rate_22k} />
            <View style={styles.verticalDivider} />
            <RateColumn karat="24K" rate={rate.rate_24k} />
          </View>
          <View style={styles.footer}>
            <Ionicons name="time-outline" size={12} color={GOLD} />
            <Text style={styles.updatedText}>
              {'Updated '}{timeAgo(rate.updated_at)}
            </Text>
          </View>
        </>
      ) : (
        <View style={styles.noRateWrap}>
          <Ionicons name="information-circle-outline" size={20} color={GOLD} />
          <Text style={styles.noRateText}>
            Gold rate not set. Please contact your admin.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: NAVY_DARK,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(201,164,106,0.3)',
    shadowColor: NAVY_DARK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  goldIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(201,164,106,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    color: GOLD_LIGHT,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  refreshBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  rateColumn: {
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  karatBadge: {
    backgroundColor: 'rgba(201,164,106,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(201,164,106,0.4)',
  },
  karatText: {
    color: GOLD,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  rateValue: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  rateUnit: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    fontWeight: '500',
  },
  verticalDivider: {
    width: 1,
    height: 60,
    backgroundColor: 'rgba(201,164,106,0.2)',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(201,164,106,0.15)',
    paddingTop: 12,
  },
  updatedText: {
    color: 'rgba(201,164,106,0.7)',
    fontSize: 11,
    fontWeight: '500',
  },
  noRateWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  noRateText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    flex: 1,
  },
});
