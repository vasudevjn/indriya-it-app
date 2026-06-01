import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useGoldRate } from '../../hooks/useGoldRate';
import { postGoldRate } from '../../lib/api/goldRate';
import { createBroadcast } from '../../lib/api/broadcasts';
import { QUERY_KEYS } from '../../constants/queryKeys';
import { useUiStore } from '../../stores/uiStore';
import { useCurrentUser } from '../../hooks/useCurrentUser';

// Rupee sign built at runtime to keep source file ASCII-only
const RUPEE = String.fromCharCode(0x20B9);

function formatRate(n: number): string {
  return RUPEE + n.toLocaleString('en-IN');
}

export function GoldRateForm() {
  const qc = useQueryClient();
  const showToast = useUiStore((s) => s.showToast);
  const { data: currentRate } = useGoldRate();
  const { profile } = useCurrentUser();

  const [rate22k, setRate22k] = useState('');
  const [rate24k, setRate24k] = useState('');

  // Pre-fill with current rates on load
  useEffect(() => {
    if (currentRate) {
      setRate22k(String(currentRate.rate_22k));
      setRate24k(String(currentRate.rate_24k));
    }
  }, [currentRate?.id]);

  const r22 = parseFloat(rate22k);
  const r24 = parseFloat(rate24k);
  const isValid = !isNaN(r22) && !isNaN(r24) && r22 > 0 && r24 > 0;

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
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconWrap}>
          <Ionicons name="trending-up" size={18} color="#C9A46A" />
        </View>
        <Text variant="titleMedium" style={styles.heading}>Update Gold Rate</Text>
      </View>

      {currentRate && (
        <View style={styles.currentRow}>
          <Text style={styles.currentLabel}>Current</Text>
          <Text style={styles.currentVal}>22K: {formatRate(currentRate.rate_22k)}</Text>
          <Text style={styles.currentVal}>24K: {formatRate(currentRate.rate_24k)}</Text>
        </View>
      )}

      <View style={styles.inputsRow}>
        <View style={styles.inputWrap}>
          <TextInput
            label="22K Rate"
            value={rate22k}
            onChangeText={setRate22k}
            mode="outlined"
            keyboardType="numeric"
            dense
            outlineColor="#E5E7EB"
            activeOutlineColor="#C9A46A"
            style={styles.rateInput}
            left={<TextInput.Affix text={RUPEE} />}
            error={rate22k.length > 0 && isNaN(parseFloat(rate22k))}
          />
        </View>
        <View style={styles.inputWrap}>
          <TextInput
            label="24K Rate"
            value={rate24k}
            onChangeText={setRate24k}
            mode="outlined"
            keyboardType="numeric"
            dense
            outlineColor="#E5E7EB"
            activeOutlineColor="#C9A46A"
            style={styles.rateInput}
            left={<TextInput.Affix text={RUPEE} />}
            error={rate24k.length > 0 && isNaN(parseFloat(rate24k))}
          />
        </View>
      </View>

      <View style={styles.noticeRow}>
        <Ionicons name="notifications-outline" size={14} color="#C9A46A" />
        <Text style={styles.noticeText}>
          All stores will receive a push notification with the updated rate.
        </Text>
      </View>

      <Button
        mode="contained"
        onPress={() => mutate()}
        disabled={!isValid || isPending}
        loading={isPending}
        buttonColor="#142D60"
        style={styles.submitBtn}
        icon="content-save"
      >
        {isPending ? 'Saving...' : 'Save & Notify All Stores'}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(201,164,106,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(201,164,106,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: { fontWeight: '700', color: '#111827' },
  currentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  currentLabel: { color: '#9CA3AF', fontSize: 12, fontWeight: '500' },
  currentVal: { color: '#374151', fontSize: 13, fontWeight: '600' },
  inputsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  inputWrap: { flex: 1 },
  rateInput: { backgroundColor: '#fff', fontSize: 16 },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  noticeText: { flex: 1, color: '#78350F', fontSize: 12, lineHeight: 18 },
  submitBtn: { borderRadius: 8 },
});
