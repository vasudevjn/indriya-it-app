import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGoldRate } from '../../hooks/useGoldRate';
import { timeAgo } from '../../lib/utils/date';
import { theme } from '../../constants/theme';

// Indian Rupee sign (U+20B9) constructed at runtime to keep source file ASCII-only
// Raw Unicode chars in JSX text nodes can confuse Metro/Hermes on some Android builds
const RUPEE = String.fromCharCode(0x20B9);

interface RateColumnProps {
  karat: string;
  rate: number;
  isLast: boolean;
}

function RateColumn({ karat, rate, isLast }: RateColumnProps) {
  return (
    <React.Fragment>
      <View style={styles.rateColumn}>
        <Text style={styles.karatLabel}>{karat}</Text>
        <Text style={styles.rateValue}>
          {RUPEE}{rate.toLocaleString('en-IN')}
        </Text>
      </View>
      {!isLast && <View style={styles.verticalDivider} />}
    </React.Fragment>
  );
}

export function GoldRateCard() {
  const { data: rate, isLoading, refetch, isRefetching } = useGoldRate();

  return (
    <View style={[styles.card, theme.shadows.md]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.goldIconWrap}>
            <Ionicons name="trending-up" size={18} color={theme.colors.accent} />
          </View>
          <Text style={styles.cardTitle}>Gold Rate</Text>
        </View>
        <TouchableOpacity
          onPress={() => refetch()}
          disabled={isRefetching}
          style={styles.refreshBtn}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
        >
          {isRefetching ? (
            <ActivityIndicator size="small" color={theme.colors.accent} />
          ) : (
            <Ionicons name="refresh-outline" size={18} color={theme.colors.accent} />
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading ? (
        <ActivityIndicator color={theme.colors.accent} style={{ marginVertical: theme.spacing.xl }} />
      ) : rate ? (
        <>
          <View style={styles.ratesRow}>
            <RateColumn karat="24K (999)" rate={rate.rate_24k}     isLast={false} />
            <RateColumn karat="24K (995)" rate={rate.rate_24k_995} isLast={false} />
            <RateColumn karat="22K (916)" rate={rate.rate_22k}     isLast={false} />
            <RateColumn karat="18K (750)" rate={rate.rate_18k}     isLast />
          </View>
          <View style={styles.footer}>
            <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.35)" />
            <Text style={styles.updatedText}>
              {'Updated '}{timeAgo(rate.updated_at)}
            </Text>
          </View>
        </>
      ) : (
        <View style={styles.noRateWrap}>
          <Ionicons name="information-circle-outline" size={20} color={theme.colors.accent} />
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
    backgroundColor: theme.colors.brand,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  goldIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(201,168,76,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    fontWeight: '600',
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
    marginBottom: theme.spacing.md,
  },
  rateColumn: {
    flex: 1,
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  karatLabel: {
    color: theme.colors.accent,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  rateValue: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  verticalDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: theme.spacing.md,
  },
  updatedText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    fontWeight: '500',
  },
  noRateWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
  },
  noRateText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    flex: 1,
  },
});
