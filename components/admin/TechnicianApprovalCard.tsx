import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DbProfile } from '../../types';
import { timeAgo } from '../../lib/utils/date';
import { theme } from '../../constants/theme';

interface Props {
  profile: DbProfile;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  isLoading?: boolean;
}

export function TechnicianApprovalCard({ profile, onApprove, onReject, isLoading }: Props) {
  const initial = profile.full_name.charAt(0).toUpperCase();

  return (
    <View style={[styles.card, theme.shadows.sm]}>
      {/* Top row: avatar + name block */}
      <View style={styles.topRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarInitial}>{initial}</Text>
        </View>
        <View style={styles.nameBlock}>
          <Text style={styles.name}>{profile.full_name}</Text>
          {profile.designation ? (
            <Text style={styles.designation}>{profile.designation}</Text>
          ) : null}
          <Text style={styles.accountLabel}>TECHNICIAN ACCOUNT</Text>
        </View>
      </View>

      {/* Info row */}
      <View style={styles.infoRow}>
        {profile.phone ? (
          <View style={styles.infoItem}>
            <Ionicons name="call-outline" size={13} color={theme.colors.textTertiary} />
            <Text style={styles.infoText}>{profile.phone}</Text>
          </View>
        ) : null}
        <View style={styles.infoItem}>
          <Ionicons name="calendar-outline" size={13} color={theme.colors.textTertiary} />
          <Text style={styles.infoMeta}>Registered {timeAgo(profile.created_at)}</Text>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.btn, styles.rejectBtn]}
          onPress={() => onReject(profile.id)}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Ionicons name="close-outline" size={16} color={theme.colors.errorStrong} />
          <Text style={[styles.btnText, styles.rejectText]}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, styles.approveBtn]}
          onPress={() => onApprove(profile.id)}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark-outline" size={16} color={theme.statusColors.resolved.text} />
          <Text style={[styles.btnText, styles.approveText]}>Approve</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },

  // Top row
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  nameBlock: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  name: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  designation: {
    color: theme.colors.textSecondary,
    fontSize: 13,
  },
  accountLabel: {
    color: theme.colors.textTertiary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },

  // Info row
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  infoText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
  },
  infoMeta: {
    color: theme.colors.textTertiary,
    fontSize: 13,
  },

  // Buttons
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
  },
  btnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  rejectBtn: {
    backgroundColor: theme.colors.errorLight,
    borderColor: theme.colors.errorBorder,
  },
  rejectText: {
    color: theme.colors.errorStrong,
  },
  approveBtn: {
    backgroundColor: theme.statusColors.resolved.bg,
    borderColor: theme.statusColors.resolved.accent,
  },
  approveText: {
    color: theme.statusColors.resolved.text,
  },
});
