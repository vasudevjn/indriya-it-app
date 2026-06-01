import React from 'react';
import { FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Screen } from '../../components/common/Screen';
import { AppHeader } from '../../components/common/AppHeader';
import { TechnicianApprovalCard } from '../../components/admin/TechnicianApprovalCard';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingOverlay } from '../../components/common/LoadingOverlay';
import { QUERY_KEYS } from '../../constants/queryKeys';
import { getPendingTechnicians, updateApprovalStatus } from '../../lib/api/profiles';
import { createNotification } from '../../lib/api/notifications';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useUiStore } from '../../stores/uiStore';

export default function AdminApprovals() {
  const qc = useQueryClient();
  const showToast = useUiStore((s) => s.showToast);
  const { data: pending, isLoading, refetch } = useQuery({
    queryKey: QUERY_KEYS.pendingTechnicians(),
    queryFn: getPendingTechnicians,
  });

  const approveMutation = useMutation({
    mutationFn: async (techId: string) => {
      await updateApprovalStatus(techId, 'approved');
      await createNotification({
        recipient_id: techId,
        title: 'Account Approved',
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
        title: 'Account Rejected',
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
    <Screen edges={['top', 'left', 'right']}>
      <AppHeader title="Pending Approvals" />
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
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        ListEmptyComponent={
          <EmptyState
            icon="checkmark-circle-outline"
            title="No pending approvals"
            subtitle="All technician requests have been reviewed"
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingVertical: 8,
    paddingBottom: 24,
  },
});
