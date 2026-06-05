import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { signOut } from '../../lib/auth/session';
import { getStores } from '../../lib/api/stores';
import { QUERY_KEYS } from '../../constants/queryKeys';
import { theme } from '../../constants/theme';

export default function RequesterProfile() {
  const { profile, session } = useCurrentUser();
  const insets = useSafeAreaInsets();

  const { data: stores } = useQuery({
    queryKey: QUERY_KEYS.stores(),
    queryFn: getStores,
    staleTime: 5 * 60 * 1000,
    enabled: !!profile?.store_id,
  });

  if (!profile) return null;

  const initial = profile.full_name[0]?.toUpperCase() ?? '?';
  const email = session?.user?.email ?? '-';
  const storeName = stores?.find((s) => s.id === profile.store_id)?.name ?? '-';

  const rows: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }[] = [
    { icon: 'call-outline', label: 'Phone', value: profile.phone ?? '-' },
    { icon: 'mail-outline', label: 'Email', value: email },
    { icon: 'business-outline', label: 'Store', value: storeName },
    { icon: 'briefcase-outline', label: 'Designation', value: profile.designation ?? '-' },
  ];

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + theme.spacing.sm }]}>
        <TouchableOpacity style={styles.backRow} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={20} color="rgba(255,255,255,0.6)" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My profile</Text>
      </View>

      {/* Body */}
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar section */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatarCircle, theme.shadows.md]}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
          <Text style={styles.name}>{profile.full_name}</Text>
          {profile.designation ? (
            <Text style={styles.designation}>{profile.designation}</Text>
          ) : null}
          <Text style={styles.roleTypeLabel}>Requester</Text>
        </View>

        {/* Info card */}
        <View style={[styles.card, theme.shadows.sm]}>
          {rows.map((row, idx) => (
            <View key={row.label}>
              <View style={styles.infoRow}>
                <View style={styles.infoLeft}>
                  <View style={styles.iconBox}>
                    <Ionicons name={row.icon} size={18} color={theme.colors.brand} />
                  </View>
                  <Text style={styles.infoLabel}>{row.label}</Text>
                </View>
                <Text style={styles.infoValue} numberOfLines={1}>{row.value}</Text>
              </View>
              {idx < rows.length - 1 && <View style={styles.separator} />}
            </View>
          ))}
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={signOut} activeOpacity={0.75}>
          <Ionicons name="log-out-outline" size={20} color={theme.colors.errorStrong} />
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  flex: {
    flex: 1,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: theme.colors.brand,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  backText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
    fontWeight: '500',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginTop: theme.spacing.xs,
  },

  // ── Body ──────────────────────────────────────────────────────────────────
  body: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl + theme.spacing.lg,
  },

  // ── Avatar section ────────────────────────────────────────────────────────
  avatarSection: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.brand,
    borderWidth: 3,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 38,
    fontWeight: '700',
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  designation: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  roleTypeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: theme.spacing.xs - 2,
  },

  // ── Info card ─────────────────────────────────────────────────────────────
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    maxWidth: '50%',
    textAlign: 'right',
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
  },

  // ── Sign out ──────────────────────────────────────────────────────────────
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.errorLight,
    borderWidth: 1.5,
    borderColor: theme.colors.errorBorder,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
  },
  signOutText: {
    color: theme.colors.errorStrong,
    fontWeight: '600',
    fontSize: 15,
  },
});
