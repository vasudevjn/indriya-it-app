import React from 'react';
import { FlatList, View, Text, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TechnicianApprovalCard } from '../../components/admin/TechnicianApprovalCard';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingOverlay } from '../../components/common/LoadingOverlay';
import { QUERY_KEYS } from '../../constants/queryKeys';
import { getPendingTechnicians, updateApprovalStatus } from '../../lib/api/profiles';
import { createNotification } from '../../lib/api/notifications';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useUiStore } from '../../stores/uiStore';
import { theme } from '../../constants/theme';

export default function AdminApprovals() {
  const qc = useQueryClient();
  const showToast = useUiStore((s) => s.showToast);
  const insets = useSafeAreaInsets();
  const { data: pending, isLoading, refetch } = useQuery({
    queryKey: QUERY_KEYS.pendingTechnicians(),
    queryFn: getPendingTechnicians,
  });

  const approveMutation = useMutation({
    mutationFn: async (techId: string) => {
      await updateApprovalStatus(techId, 'approved');
      await createNotification({
        recipient_id: techId,
        title: 'Account approved',
        body: 'Your technician account has been approved. You can now log in.',
        type: 'ticket_updated',
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.pendingTechnicians() });
      showToast('Technician approved', 'success');
    },
    onError: () => showToast('Failed to approve', 'error'),
  });

  const rejectMutation = useMutation({
    mutationFn: async (techId: string) => {
      await updateApprovalStatus(techId, 'rejected');
      await createNotification({
        recipient_id: techId,
        title: 'Account rejected',
        body: 'Your technician account application was not approved.',
        type: 'ticket_updated',
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.pendingTechnicians() });
      showToast('Technician rejected', 'info');
    },
    onError: () => showToast('Failed to reject', 'error'),
  });

  if (isLoading) return <LoadingOverlay />;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + theme.spacing.sm }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={18} color="rgba(255,255,255,0.6)" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pending Approvals</Text>
      </View>

      <FlatList
        data={pending ?? []}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => (
          <TechnicianApprovalCard
            profile={item}
            onApprove={(id) => approveMutation.mutate(id)}
            onReject={(id) => rejectMutation.mutate(id)}
            isLoading={approveMutation.isPending || rejectMutation.isPending}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={theme.colors.brand}
            colors={[theme.colors.brand]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="checkmark-circle-outline"
            title="No pending approvals"
            subtitle="All technician requests have been reviewed"
          />
        }
      />
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
  list: {
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
});
