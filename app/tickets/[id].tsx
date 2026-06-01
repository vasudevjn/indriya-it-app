import React, { useState, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform,
  TouchableOpacity, Modal, RefreshControl,
} from 'react-native';
import { Text, Button, TextInput, Divider, Chip } from 'react-native-paper';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/common/Screen';
import { AppHeader } from '../../components/common/AppHeader';
import { StatusChip } from '../../components/common/StatusChip';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { CommentBubble } from '../../components/tickets/CommentBubble';
import { CommentInput } from '../../components/tickets/CommentInput';
import { AttachmentGrid } from '../../components/tickets/AttachmentGrid';
import { LoadingOverlay } from '../../components/common/LoadingOverlay';
import { useTicketDetail, useTicketComments } from '../../hooks/useTicketDetail';
import { CommentWithAuthor } from '../../types/ticket';
import { useAddComment, useUpdateTicket, useAssignTicket } from '../../hooks/useTicketActions';
import { useRealtimeTicketDetail } from '../../hooks/useRealtime';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { canAssignTicket, canChangeStatus, canSeeInternalComments } from '../../lib/auth/permissions';
import { ALL_STATUSES, STATUS_LABELS } from '../../constants/ticket';
import { CATEGORY_LABELS } from '../../constants/categories';
import { TicketStatus } from '../../types';
import { formatDateTime } from '../../lib/utils/date';
import { createNotification } from '../../lib/api/notifications';

export default function TicketDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useCurrentUser();
  const { data: ticket, isLoading, refetch: refetchTicket } = useTicketDetail(id);
  const { data: comments, refetch: refetchComments } = useTicketComments(id);
  const { mutate: addComment, isPending: addingComment } = useAddComment(id);
  const { mutate: updateTicket, isPending: updatingTicket } = useUpdateTicket(id);
  const { mutate: assignTicket, isPending: assigning } = useAssignTicket(id, ticket?.requester_id ?? '');
  const [statusModal, setStatusModal] = useState(false);
  const [resolutionInput, setResolutionInput] = useState('');
  const [showResolutionInput, setShowResolutionInput] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useRealtimeTicketDetail(id);

  /**
   * Refetch both ticket and comments whenever the screen comes into focus.
   * With staleTime: 0 in useTicketDetail/useTicketComments, React Query will
   * always treat the cached data as stale and fire a background refetch on mount.
   * useFocusEffect additionally handles the "navigate back to this screen" case.
   */
  useFocusEffect(
    useCallback(() => {
      refetchTicket();
      refetchComments();
    // id changing means a different ticket -- refetch should fire again
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]),
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetchTicket(), refetchComments()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchTicket, refetchComments]);

  if (isLoading || !ticket || !profile) return <LoadingOverlay />;

  const isStaff = canAssignTicket(profile);
  const canStatus = canChangeStatus(profile);
  const canInternal = canSeeInternalComments(profile);
  const isAssignee = ticket.assignee_id === profile.id;
  const isUnassigned = !ticket.assignee_id;

  const visibleComments = (comments ?? []).filter(
    (c: CommentWithAuthor) => canInternal || !c.is_internal,
  );

  const handleStatusChange = (status: TicketStatus) => {
    setStatusModal(false);
    const updates =
      status === 'resolved'
        ? { status, resolved_at: new Date().toISOString(), resolution: resolutionInput || undefined }
        : { status };

    updateTicket(updates, {
      onSuccess: () => {
        // Reset resolution UI after a successful update
        setShowResolutionInput(false);
        setResolutionInput('');

        const notifPayload =
          status === 'resolved'
            ? {
                recipient_id: ticket.requester_id,
                ticket_id: ticket.id,
                title: 'Ticket Resolved',
                body: `Your ticket ${ticket.ticket_number} has been resolved.`,
                type: 'ticket_resolved' as const,
              }
            : {
                recipient_id: ticket.requester_id,
                ticket_id: ticket.id,
                title: 'Ticket Updated',
                body: `Your ticket ${ticket.ticket_number} status changed to ${STATUS_LABELS[status]}.`,
                type: 'ticket_updated' as const,
              };

        createNotification(notifPayload).catch(() => null);
      },
    });
  };

  return (
    <Screen edges={['top', 'left', 'right']}>
      <AppHeader title={ticket.ticket_number} showBack />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#1B3A7A"
              colors={['#1B3A7A']}
            />
          }
        >
          {/* Header info */}
          <View style={styles.headerSection}>
            <View style={styles.badgeRow}>
              <StatusChip status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </View>
            <Text variant="bodyMedium" style={styles.storeName}>
              {ticket.store?.name ?? 'Unknown Store'}
            </Text>
            <Text variant="labelSmall" style={styles.meta}>
              {'Raised by '}{ticket.requester?.full_name ?? 'Unknown'}{' - '}{formatDateTime(ticket.created_at)}
            </Text>
            {ticket.assignee && (
              <Text variant="labelSmall" style={styles.meta}>
                Assigned to {ticket.assignee.full_name}
              </Text>
            )}
            {ticket.category && (
              <Text variant="labelSmall" style={styles.meta}>
                {CATEGORY_LABELS[ticket.category as keyof typeof CATEGORY_LABELS] ?? ticket.category}
                {ticket.subcategory ? ' > ' + ticket.subcategory : ''}
              </Text>
            )}
          </View>

          <Divider />

          {/* Description */}
          <View style={styles.section}>
            <Text variant="labelLarge" style={styles.sectionTitle}>Description</Text>
            <Text variant="bodyMedium" style={styles.description}>{ticket.description}</Text>
          </View>

          {/* Attachments */}
          {ticket.attachments.length > 0 && (
            <>
              <Divider />
              <View style={styles.section}>
                <Text variant="labelLarge" style={styles.sectionTitle}>Attachments</Text>
                <AttachmentGrid attachments={ticket.attachments} />
              </View>
            </>
          )}

          {/* Resolution */}
          {ticket.resolution && (
            <>
              <Divider />
              <View style={[styles.section, styles.resolutionSection]}>
                <Text variant="labelLarge" style={styles.sectionTitle}>Resolution</Text>
                <Text variant="bodyMedium" style={styles.resolutionText}>{ticket.resolution}</Text>
              </View>
            </>
          )}

          {/* Staff action buttons */}
          {isStaff && (
            <>
              <Divider />
              <View style={styles.actionsSection}>
                {isUnassigned && (
                  <Button
                    mode="contained"
                    buttonColor="#1B3A7A"
                    onPress={() => assignTicket()}
                    loading={assigning}
                    disabled={assigning}
                    icon="account-arrow-right"
                    style={styles.actionBtn}
                  >
                    Assign to Me
                  </Button>
                )}
                {canStatus && (
                  <Button
                    mode="outlined"
                    textColor="#1B3A7A"
                    onPress={() => setStatusModal(true)}
                    icon="swap-horizontal"
                    style={styles.actionBtn}
                  >
                    Change Status
                  </Button>
                )}
                {(isAssignee || isStaff) && ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                  <Button
                    mode="outlined"
                    textColor="#10B981"
                    onPress={() => setShowResolutionInput((v) => !v)}
                    icon="check-circle-outline"
                    style={[styles.actionBtn, { borderColor: '#10B981' }]}
                  >
                    {showResolutionInput ? 'Cancel Resolution' : 'Add Resolution'}
                  </Button>
                )}
                {showResolutionInput && (
                  <View style={styles.resolutionInput}>
                    <TextInput
                      label="Resolution notes"
                      value={resolutionInput}
                      onChangeText={setResolutionInput}
                      mode="outlined"
                      multiline
                      numberOfLines={3}
                      outlineColor="#E5E7EB"
                      activeOutlineColor="#10B981"
                    />
                    <Button
                      mode="contained"
                      buttonColor="#10B981"
                      onPress={() => handleStatusChange('resolved')}
                      loading={updatingTicket}
                      disabled={updatingTicket}
                      style={{ marginTop: 8 }}
                    >
                      Mark Resolved
                    </Button>
                  </View>
                )}
              </View>
            </>
          )}

          {/* Comments */}
          <Divider />
          <View style={styles.section}>
            <Text variant="labelLarge" style={styles.sectionTitle}>
              Comments ({visibleComments.length})
            </Text>
          </View>

          {visibleComments.map((c: CommentWithAuthor) => (
            <CommentBubble key={c.id} comment={c} isOwnComment={c.author_id === profile.id} />
          ))}

          <View style={{ height: 16 }} />
        </ScrollView>

        <CommentInput
          onSubmit={(body, isInternal) => addComment({ body, is_internal: isInternal })}
          isSubmitting={addingComment}
          canMarkInternal={canInternal}
        />
      </KeyboardAvoidingView>

      {/* Status change modal */}
      <Modal visible={statusModal} transparent animationType="slide" onRequestClose={() => setStatusModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setStatusModal(false)}>
          <View style={styles.modalSheet}>
            <Text variant="titleMedium" style={styles.modalTitle}>Change Status</Text>
            {ALL_STATUSES.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.statusOption, ticket.status === s && styles.statusOptionActive]}
                onPress={() => handleStatusChange(s)}
              >
                <StatusChip status={s} />
                {ticket.status === s && (
                  <Ionicons name="checkmark" size={18} color="#1B3A7A" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 16,
  },
  headerSection: {
    padding: 16,
    gap: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  storeName: {
    color: '#374151',
    fontWeight: '600',
  },
  meta: {
    color: '#9CA3AF',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 11,
  },
  description: {
    color: '#111827',
    lineHeight: 22,
  },
  resolutionSection: {
    backgroundColor: '#F0FDF4',
  },
  resolutionText: {
    color: '#166534',
    lineHeight: 22,
  },
  actionsSection: {
    padding: 16,
    gap: 8,
  },
  actionBtn: {
    borderRadius: 8,
  },
  resolutionInput: {
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    gap: 8,
  },
  modalTitle: {
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  statusOptionActive: {
    borderColor: '#1B3A7A',
    backgroundColor: '#EBF2FC',
  },
});
