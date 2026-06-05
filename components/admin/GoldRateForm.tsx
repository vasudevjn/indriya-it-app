import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Switch, StyleSheet,
} from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useGoldRate } from '../../hooks/useGoldRate';
import { postGoldRate } from '../../lib/api/goldRate';
import { createBroadcast } from '../../lib/api/broadcasts';
import { QUERY_KEYS } from '../../constants/queryKeys';
import { useUiStore } from '../../stores/uiStore';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { theme } from '../../constants/theme';

const RUPEE = String.fromCharCode(0x20B9);

function formatRate(n: number): string {
  return RUPEE + n.toLocaleString('en-IN');
}

function calcFromBase(base: number) {
  return {
    r24k995: Math.round(base * 995 / 999),
    r22k:    Math.round(base * 916 / 999),
    r18k:    Math.round(base * 750 / 999),
  };
}

export function GoldRateForm() {
  const qc = useQueryClient();
  const showToast = useUiStore((s) => s.showToast);
  const { data: currentRate } = useGoldRate();
  const { profile } = useCurrentUser();

  const [rate24k,    setRate24k]    = useState('');
  const [rate24k995, setRate24k995] = useState('');
  const [rate22k,    setRate22k]    = useState('');
  const [rate18k,    setRate18k]    = useState('');
  const [autoFill,   setAutoFill]   = useState(true);

  // Pre-fill from current rate on load
  useEffect(() => {
    if (currentRate) {
      setRate24k(String(currentRate.rate_24k));
      setRate24k995(String(currentRate.rate_24k_995));
      setRate22k(String(currentRate.rate_22k));
      setRate18k(String(currentRate.rate_18k));
    }
  }, [currentRate?.id]);

  const r22 = parseFloat(rate22k);
  const r24 = parseFloat(rate24k);
  const isValid = !isNaN(r22) && !isNaN(r24) && r22 > 0 && r24 > 0;

  // Auto-fill handlers
  const handleChange24k = (val: string) => {
    setRate24k(val);
    if (!autoFill) return;
    const base = parseFloat(val);
    if (!isNaN(base) && base > 0) {
      const { r24k995, r22k, r18k } = calcFromBase(base);
      setRate24k995(String(r24k995));
      setRate22k(String(r22k));
      setRate18k(String(r18k));
    }
  };

  const handleChange24k995 = (val: string) => {
    setRate24k995(val);
    if (!autoFill) return;
    const v = parseFloat(val);
    if (!isNaN(v) && v > 0) {
      const base = Math.round(v * 999 / 995);
      setRate24k(String(base));
      const { r22k, r18k } = calcFromBase(base);
      setRate22k(String(r22k));
      setRate18k(String(r18k));
    }
  };

  const handleChange22k = (val: string) => {
    setRate22k(val);
    if (!autoFill) return;
    const v = parseFloat(val);
    if (!isNaN(v) && v > 0) {
      const base = Math.round(v * 999 / 916);
      setRate24k(String(base));
      const { r24k995, r18k } = calcFromBase(base);
      setRate24k995(String(r24k995));
      setRate18k(String(r18k));
    }
  };

  const handleChange18k = (val: string) => {
    setRate18k(val);
    if (!autoFill) return;
    const v = parseFloat(val);
    if (!isNaN(v) && v > 0) {
      const base = Math.round(v * 999 / 750);
      setRate24k(String(base));
      const { r24k995, r22k } = calcFromBase(base);
      setRate24k995(String(r24k995));
      setRate22k(String(r22k));
    }
  };

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      if (!isValid) throw new Error('Enter valid rates');
      // 1. Save rate
      await postGoldRate(r22, r24);

      // 2. Always send push + create broadcast (not optional)
      if (profile) {
        const body = `22K: ${formatRate(r22)} | 24K: ${formatRate(r24)} per gram`;
        await createBroadcast({
          sender_id: profile.id,
          title: 'Gold Rate Updated',
          body,
          // no target_store_ids = all stores
        }).catch(() => null);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.goldRate() });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.goldRateHistory() });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.broadcasts() });
      showToast('Gold rate updated and stores notified!', 'success');
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to update rate';
      showToast(msg, 'error');
    },
  });

  return (
    <View style={[styles.card, theme.shadows.sm]}>
      {/* Card header */}
      <View style={styles.cardHeader}>
        <View style={styles.iconBox}>
          <Ionicons name="trending-up" size={18} color={theme.colors.accent} />
        </View>
        <Text style={styles.cardTitle}>Update Gold Rate</Text>
      </View>

      {/* Auto-fill toggle */}
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Auto-calculate</Text>
        <Switch
          value={autoFill}
          onValueChange={setAutoFill}
          trackColor={{ false: theme.colors.border, true: theme.colors.brand + '60' }}
          thumbColor={autoFill ? theme.colors.brand : theme.colors.surface}
          ios_backgroundColor={theme.colors.border}
        />
      </View>

      {/* 2×2 grid */}
      <View style={styles.grid}>
        <View style={styles.gridRow}>
          <RateField label="24K (999)" value={rate24k} onChange={handleChange24k} />
          <RateField label="24K (995)" value={rate24k995} onChange={handleChange24k995} />
        </View>
        <View style={styles.gridRow}>
          <RateField label="22K (916)" value={rate22k} onChange={handleChange22k} />
          <RateField label="18K (750)" value={rate18k} onChange={handleChange18k} />
        </View>
      </View>

      {/* Info note */}
      <View style={styles.infoNote}>
        <Ionicons name="notifications-outline" size={14} color={theme.colors.accent} />
        <Text style={styles.infoNoteText}>
          All stores will receive a push notification with the updated rate.
        </Text>
      </View>

      {/* Save button */}
      <TouchableOpacity
        style={[styles.saveBtn, (!isValid || isPending) && styles.saveBtnDisabled]}
        onPress={() => mutate()}
        disabled={!isValid || isPending}
        activeOpacity={0.8}
      >
        <Ionicons name="save-outline" size={16} color="#fff" />
        <Text style={styles.saveBtnText}>
          {isPending ? 'Saving...' : 'Save & Notify All Stores'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function RateField({
  label, value, onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.fieldCol}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldInputWrap}>
        <Text style={styles.fieldPrefix}>{RUPEE}</Text>
        <TextInput
          style={styles.fieldInput}
          value={value}
          onChangeText={onChange}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={theme.colors.textTertiary}
        />
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
    marginBottom: theme.spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  iconBox: {
    padding: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.accent + '26',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontWeight: '700',
    color: theme.colors.textPrimary,
    fontSize: 15,
  },

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  toggleLabel: {
    color: theme.colors.textSecondary,
    fontSize: 13,
  },

  // Grid
  grid: { gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  gridRow: { flexDirection: 'row', gap: theme.spacing.sm },
  fieldCol: { flex: 1, gap: theme.spacing.xs },
  fieldLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  fieldInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface2,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  fieldPrefix: {
    color: theme.colors.textTertiary,
    fontSize: 14,
  },
  fieldInput: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    padding: 0,
  },

  // Info note
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.accent + '1A',
    borderRadius: theme.radius.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  infoNoteText: {
    flex: 1,
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },

  // Save button
  saveBtn: {
    backgroundColor: theme.colors.brand,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  saveBtnDisabled: {
    backgroundColor: theme.colors.borderStrong,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
