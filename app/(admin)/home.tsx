import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GoldRateCard } from '../../components/home/GoldRateCard';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { QUERY_KEYS } from '../../constants/queryKeys';
import { getPendingTechnicians } from '../../lib/api/profiles';
import { theme } from '../../constants/theme';

interface ActionRowProps {
  iconName: string;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  subtitleColor: string;
  onPress: () => void;
}

function ActionRow({
  iconName, iconColor, iconBg, title, subtitle, subtitleColor, onPress,
}: ActionRowProps) {
  return (
    <TouchableOpacity style={styles.actionRow} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
        <Ionicons name={iconName as keyof typeof Ionicons.glyphMap} size={22} color={iconColor} />
      </View>
      <View style={styles.actionText}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={[styles.actionSubtitle, { color: subtitleColor }]}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} />
    </TouchableOpacity>
  );
}

export default function AdminHome() {
  const { profile } = useCurrentUser();
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();

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
  const firstName    = profile?.full_name?.split(' ')[0] ?? '';
  const initial      = firstName.charAt(0).toUpperCase();

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + theme.spacing.md }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.appName}>ADMIN</Text>
          <Text style={styles.greeting}>Hello, {firstName}</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/(admin)/profile' as never)}
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

        <Text style={styles.sectionLabel}>Quick actions</Text>

        <View style={[styles.actionsCard, theme.shadows.sm]}>
          <ActionRow
            iconName="person-add-outline"
            iconColor={theme.colors.brand}
            iconBg={theme.colors.bg}
            title="Approvals"
            subtitle={
              pendingCount > 0
                ? `${pendingCount} pending request${pendingCount !== 1 ? 's' : ''}`
                : 'No pending requests'
            }
            subtitleColor={pendingCount > 0 ? theme.colors.accent : theme.colors.textTertiary}
            onPress={() => router.push('/(admin)/approvals')}
          />
          <View style={styles.rowDivider} />
          <ActionRow
            iconName="megaphone-outline"
            iconColor={theme.colors.accent}
            iconBg={theme.colors.accent + '26'}
            title="Publish announcement"
            subtitle="Send broadcast or update gold rate"
            subtitleColor={theme.colors.textTertiary}
            onPress={() => router.push('/(admin)/broadcasts')}
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
  actionsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  iconBox: {
    padding: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  actionTitle: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
  actionSubtitle: {
    fontSize: 12,
  },
  rowDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
});
