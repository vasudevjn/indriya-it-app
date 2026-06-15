import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Modal,
  RefreshControl,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useLocalSearchParams, useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { ALL_STATUSES, ALL_PRIORITIES, STATUS_LABELS, PRIORITY_LABELS } from '../../constants/ticket';
import { ALL_CATEGORIES, CATEGORY_LABELS, SUBCATEGORIES, TicketCategory } from '../../constants/categories';
import { TicketStatus, TicketPriority, UserRole } from '../../types';
import { deleteAttachment as deleteAttachmentApi, uploadAttachment, getAttachmentUrl } from '../../lib/api/tickets';
import { AttachmentItem } from '../../stores/ticketDraftStore';
import { formatDateTime } from '../../lib/utils/date';
import { createNotification } from '../../lib/api/notifications';
import { theme } from '../../constants/theme';

type ActiveTab = 'comments' | 'details';

const PRIORITY_TINTS: Record<TicketPriority, string> = {
  low: '#ECFDF5',
  medium: '#FFFBEB',
  high: '#FEF2F2',
  critical: '#FFF7ED',
};

export default function TicketDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useCurrentUser();
  const { data: ticket, isLoading, refetch: refetchTicket } = useTicketDetail(id);
  const { data: comments, refetch: refetchComments } = useTicketComments(id);
  const { mutate: addComment, isPending: addingComment } = useAddComment(id);
  const { mutate: updateTicket, isPending: updatingTicket } = useUpdateTicket(id);
  const { mutate: assignTicket, isPending: assigning } = useAssignTicket(id, ticket?.requester_id ?? '');

  const [activeTab, setActiveTab] = useState<ActiveTab>('comments');
  const [statusModal, setStatusModal] = useState(false);
  const [resolutionInput, setResolutionInput] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Edit modal state
  const [editModal, setEditModal] = useState(false);
  const [editDesc, setEditDesc] = useState('');
  const [editCategory, setEditCategory] = useState<TicketCategory | null>(null);
  const [editSubcategory, setEditSubcategory] = useState<string | null>(null);
  const [editPriority, setEditPriority] = useState<TicketPriority>('medium');
  const [removedAttIds, setRemovedAttIds] = useState<string[]>([]);
  const [newAtts, setNewAtts] = useState<AttachmentItem[]>([]);
  const [isSavingEdits, setIsSavingEdits] = useState(false);

  useRealtimeTicketDetail(id);

  useFocusEffect(
    useCallback(() => {
      refetchTicket();
      refetchComments();
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
  const isRequester = ticket.requester_id === profile.id;
  const canEdit = isRequester || isStaff;

  const visibleComments = (comments ?? []).filter(
    (c: CommentWithAuthor) => canInternal || !c.is_internal,
  );

  const knownAuthors: Record<string, { id: string; full_name: string; role: UserRole }> = {};
  if (ticket.requester) {
    knownAuthors[ticket.requester.id] = { id: ticket.requester.id, full_name: ticket.requester.full_name, role: 'requester' };
  }
  if (ticket.assignee) {
    knownAuthors[ticket.assignee.id] = { id: ticket.assignee.id, full_name: ticket.assignee.full_name, role: 'technician' };
  }
  knownAuthors[profile.id] = { id: profile.id, full_name: profile.full_name, role: profile.role };

  const enrichedComments = visibleComments.map((c: CommentWithAuthor) => ({
    ...c,
    author: c.author ?? knownAuthors[c.author_id] ?? null,
  }));

  const openEditModal = () => {
    setEditDesc(ticket.description);
    setEditCategory((ticket.category as TicketCategory) ?? null);
    setEditSubcategory(ticket.subcategory ?? null);
    setEditPriority(ticket.priority);
    setRemovedAttIds([]);
    setNewAtts([]);
    setEditModal(true);
  };

  const handlePickPhoto = async () => {
    const totalAtts = ticket.attachments.filter(a => !removedAttIds.includes(a.id)).length + newAtts.length;
    if (totalAtts >= 5) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setNewAtts(prev => [...prev, { uri: asset.uri, name: asset.fileName ?? `photo_${Date.now()}.jpg`, type: 'image' }]);
    }
  };

  const handlePickVideo = async () => {
    const totalAtts = ticket.attachments.filter(a => !removedAttIds.includes(a.id)).length + newAtts.length;
    if (totalAtts >= 5) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setNewAtts(prev => [...prev, { uri: asset.uri, name: asset.fileName ?? `video_${Date.now()}.mp4`, type: 'video' }]);
    }
  };

  const handlePickDocument = async () => {
    const totalAtts = ticket.attachments.filter(a => !removedAttIds.includes(a.id)).length + newAtts.length;
    if (totalAtts >= 5) return;
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'application/msword', 'text/plain', '*/*'],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setNewAtts(prev => [...prev, { uri: asset.uri, name: asset.name, type: 'document', mimeType: asset.mimeType ?? undefined }]);
    }
  };

  const handleSaveEdit = async () => {
    setIsSavingEdits(true);
    try {
      for (const attId of removedAttIds) {
        const att = ticket.attachments.find(a => a.id === attId);
        if (att) await deleteAttachmentApi(attId, att.storage_path);
      }
      for (const att of newAtts) {
        await uploadAttachment(ticket.id, att.uri, att.name, att.type, att.mimeType);
      }
    } catch {
      setIsSavingEdits(false);
      Alert.alert('Error', 'Failed to update attachments. Please try again.');
      return;
    }
    updateTicket(
      { description: editDesc, category: editCategory, subcategory: editSubcategory, priority: editPriority },
      {
        onSuccess: () => { setEditModal(false); setIsSavingEdits(false); },
        onError: () => setIsSavingEdits(false),
      },
    );
  };

  const handleStatusChange = (status: TicketStatus) => {
    setStatusModal(false);
    const updates =
      status === 'resolved'
        ? { status, resolved_at: new Date().toISOString(), resolution: resolutionInput || undefined }
        : { status };

    updateTicket(updates, {
      onSuccess: () => {
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
    <View style={styles.root}>
      {/* 1. Header */}
      <View style={[styles.header, { paddingTop: insets.top + theme.spacing.sm }]}>
        <TouchableOpacity style={styles.backRow} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
        <Text style={styles.ticketNumber}>{ticket.ticket_number}</Text>
        <View style={styles.chipsRow}>
          <View style={styles.statusChipPill}>
            <Text style={styles.statusChipText}>{theme.statusLabels[ticket.status]}</Text>
          </View>
          <View style={styles.priorityChipPill}>
            <Text style={styles.priorityChipText}>{PRIORITY_LABELS[ticket.priority]}</Text>
          </View>
        </View>
      </View>

      {/* 2. Subject Card — always visible, outside tab navigator */}
      <View style={styles.subjectCard}>
        <Text style={styles.subjectLabel}>SUBJECT</Text>
        <Text style={styles.subjectText} numberOfLines={3}>{ticket.description}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{ticket.store?.name ?? 'Unknown Store'}</Text>
          <View style={styles.metaDot} />
          <Text style={styles.metaText}>{formatDateTime(ticket.created_at)}</Text>
        </View>
      </View>

      {/* 3. Action Bar — always visible, outside tab navigator */}
      {isStaff && (
        <View style={styles.actionBar}>
          {!isAssignee && (
            <TouchableOpacity
              style={styles.actionBtnAssign}
              onPress={() => assignTicket()}
              disabled={assigning}
              activeOpacity={0.75}
            >
              <Ionicons name="person-add-outline" size={18} color={theme.colors.textPrimary} />
              <Text style={styles.actionLabelDark}>Assign to Me</Text>
            </TouchableOpacity>
          )}
          {canStatus && (
            <TouchableOpacity
              style={styles.actionBtnStatus}
              onPress={() => setStatusModal(true)}
              activeOpacity={0.75}
            >
              <Ionicons name="swap-horizontal-outline" size={18} color="#fff" />
              <Text style={styles.actionLabelLight}>Change Status</Text>
            </TouchableOpacity>
          )}
          {(isAssignee || isStaff) && ticket.status !== 'resolved' && ticket.status !== 'closed' && (
            <TouchableOpacity
              style={styles.actionBtnResolve}
              onPress={() => handleStatusChange('resolved')}
              disabled={updatingTicket}
              activeOpacity={0.75}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color={theme.statusColors.resolved.text} />
              <Text style={[styles.actionLabelDark, { color: theme.statusColors.resolved.text }]}>
                Resolve
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* 4. Tab Navigator */}
      <View style={[styles.tabBar, { alignItems: 'center' }]}>
        {(['comments', 'details'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={styles.tabBtn}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
              {tab === 'comments' ? 'Comments' : 'Details'}
            </Text>
            {activeTab === tab && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
        <View style={{ flex: 1 }} />
        {activeTab === 'details' && canEdit && (
          <TouchableOpacity style={styles.tabEditBtn} onPress={openEditModal} activeOpacity={0.7}>
            <Ionicons name="pencil-outline" size={18} color={theme.colors.brand} />
            <Text style={styles.tabEditBtnLabel}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 5a. Comments Tab */}
      {activeTab === 'comments' && (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.commentsContent}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={theme.colors.brand}
                colors={[theme.colors.brand]}
              />
            }
          >
            {enrichedComments.map((c: CommentWithAuthor) => (
              <CommentBubble key={c.id} comment={c} isOwnComment={c.author_id === profile.id} />
            ))}
            <View style={{ height: theme.spacing.md }} />
          </ScrollView>
          <CommentInput
            onSubmit={(body, isInternal) => addComment({ body, is_internal: isInternal })}
            isSubmitting={addingComment}
            canMarkInternal={canInternal}
          />
        </KeyboardAvoidingView>
      )}

      {/* 5b. Details Tab */}
      {activeTab === 'details' && (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.detailsContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.brand}
              colors={[theme.colors.brand]}
            />
          }
        >
          {/* Card 1: Description */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>DESCRIPTION</Text>
            <Text style={styles.descReadText}>{ticket.description}</Text>
          </View>

          {/* Card 2: Info grid */}
          <View style={styles.card}>
            <Text style={[styles.cardLabel, { marginBottom: theme.spacing.md }]}>INFO</Text>
            <View style={styles.infoGrid}>
              {[
                { key: 'Raised by', value: ticket.requester?.full_name ?? 'Unknown' },
                { key: 'Assigned to', value: ticket.assignee?.full_name ?? 'Unassigned' },
                { key: 'Store', value: ticket.store?.name ?? 'Unknown' },
                { key: 'Raised on', value: formatDateTime(ticket.created_at) },
                {
                  key: 'Category',
                  value: ticket.category
                    ? (CATEGORY_LABELS[ticket.category as keyof typeof CATEGORY_LABELS] ?? ticket.category)
                    : '—',
                },
                { key: 'Sub-category', value: ticket.subcategory ?? '—' },
              ].map(({ key, value }) => (
                <View key={key} style={styles.infoField}>
                  <Text style={styles.infoKey}>{key}</Text>
                  <Text style={styles.infoValue}>{value}</Text>
                </View>
              ))}
              <View style={styles.infoField}>
                <Text style={styles.infoKey}>Priority</Text>
                <View style={styles.priorityValueRow}>
                  <PriorityBadge priority={ticket.priority} />
                  <Text style={styles.infoValue}>{PRIORITY_LABELS[ticket.priority]}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Card 3: Attachments */}
          <View style={styles.card}>
            <Text style={[styles.cardLabel, { marginBottom: theme.spacing.md }]}>
              {`ATTACHMENTS (${ticket.attachments.length})`}
            </Text>
            <AttachmentGrid attachments={ticket.attachments} />
          </View>
        </ScrollView>
      )}

      {/* Edit ticket modal */}
      <Modal
        visible={editModal}
        animationType="slide"
        onRequestClose={() => !isSavingEdits && setEditModal(false)}
      >
        <View style={styles.editRoot}>
          {/* Header — brand bg matching the app */}
          <View style={[styles.editHeader, { paddingTop: insets.top + theme.spacing.sm }]}>
            <TouchableOpacity onPress={() => setEditModal(false)} disabled={isSavingEdits} activeOpacity={0.7}>
              <Text style={[styles.editHeaderCancel, isSavingEdits && { opacity: 0.4 }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.editHeaderTitle}>Edit Ticket</Text>
            <TouchableOpacity onPress={handleSaveEdit} disabled={isSavingEdits} activeOpacity={0.7}>
              <Text style={[styles.editHeaderSave, isSavingEdits && { opacity: 0.4 }]}>
                {isSavingEdits ? 'Saving…' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.editContent} keyboardShouldPersistTaps="handled">

              {/* Description */}
              <View style={styles.editCard}>
                <Text style={styles.editCardLabel}>DESCRIPTION</Text>
                <TextInput
                  style={styles.editDescInput}
                  value={editDesc}
                  onChangeText={setEditDesc}
                  multiline
                  placeholder="Describe the issue…"
                  placeholderTextColor={theme.colors.textTertiary}
                  textAlignVertical="top"
                />
              </View>

              {/* Category + Sub-category in one card */}
              <View style={styles.editCard}>
                <Text style={styles.editCardLabel}>CATEGORY</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.editHScroll}
                >
                  {ALL_CATEGORIES.map(cat => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.editCatPill, editCategory === cat && styles.editCatPillSelected]}
                      onPress={() => { setEditCategory(cat); setEditSubcategory(null); }}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.editCatPillText, editCategory === cat && styles.editCatPillTextSelected]}>
                        {CATEGORY_LABELS[cat]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {editCategory && (
                  <>
                    <Text style={[styles.editCardLabel, { marginTop: theme.spacing.sm }]}>SUB-CATEGORY</Text>
                    <View style={styles.editSubCatRow}>
                      {SUBCATEGORIES[editCategory].map(sub => (
                        <TouchableOpacity
                          key={sub}
                          style={[styles.editCatPill, editSubcategory === sub && styles.editCatPillSelected]}
                          onPress={() => setEditSubcategory(sub)}
                          activeOpacity={0.75}
                        >
                          <Text style={[styles.editCatPillText, editSubcategory === sub && styles.editCatPillTextSelected]}>
                            {sub}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}
              </View>

              {/* Priority */}
              <View style={styles.editCard}>
                <Text style={styles.editCardLabel}>PRIORITY</Text>
                <View style={styles.editPillRow}>
                  {ALL_PRIORITIES.map(p => {
                    const sel = editPriority === p;
                    return (
                      <TouchableOpacity
                        key={p}
                        style={[styles.editPill, sel && { backgroundColor: PRIORITY_TINTS[p], borderColor: theme.priorityColors[p] }]}
                        onPress={() => setEditPriority(p)}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.editPillText, sel && { color: theme.priorityColors[p] }]}>
                          {PRIORITY_LABELS[p]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Attachments */}
              <View style={styles.editCard}>
                <Text style={styles.editCardLabel}>
                  {`ATTACHMENTS — ${ticket.attachments.filter(a => !removedAttIds.includes(a.id)).length + newAtts.length}/5`}
                </Text>

                {/* Thumbnails */}
                {(ticket.attachments.filter(a => !removedAttIds.includes(a.id)).length > 0 || newAtts.length > 0) && (
                  <View style={styles.editThumbRow}>
                    {ticket.attachments.filter(a => !removedAttIds.includes(a.id)).map(att => {
                      const url = getAttachmentUrl(att.storage_path);
                      const isImage = !att.file_type || att.file_type === 'image';
                      return (
                        <View key={att.id} style={styles.editThumbWrap}>
                          {isImage ? (
                            <Image source={{ uri: url }} style={styles.editThumb} />
                          ) : (
                            <View style={[styles.editThumb, styles.editFileThumb]}>
                              <Ionicons
                                name={att.file_type === 'video' ? 'videocam' : 'document-text'}
                                size={24}
                                color={att.file_type === 'video' ? '#7C3AED' : '#D97706'}
                              />
                              <Text style={styles.editFileThumbLabel} numberOfLines={1}>
                                {att.file_name?.split('.').pop()?.toUpperCase()}
                              </Text>
                            </View>
                          )}
                          <TouchableOpacity
                            style={styles.editRemoveBtn}
                            onPress={() => setRemovedAttIds(ids => [...ids, att.id])}
                          >
                            <Ionicons name="close-circle" size={20} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                    {newAtts.map((att, i) => (
                      <View key={`new-${i}`} style={styles.editThumbWrap}>
                        {att.type === 'image' ? (
                          <Image source={{ uri: att.uri }} style={styles.editThumb} />
                        ) : (
                          <View style={[styles.editThumb, styles.editFileThumb]}>
                            <Ionicons
                              name={att.type === 'video' ? 'videocam' : 'document-text'}
                              size={24}
                              color={att.type === 'video' ? '#7C3AED' : '#D97706'}
                            />
                            <Text style={styles.editFileThumbLabel} numberOfLines={1}>
                              {att.name.split('.').pop()?.toUpperCase()}
                            </Text>
                          </View>
                        )}
                        <TouchableOpacity
                          style={styles.editRemoveBtn}
                          onPress={() => setNewAtts(prev => prev.filter((_, idx) => idx !== i))}
                        >
                          <Ionicons name="close-circle" size={20} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                {/* Add buttons */}
                {(ticket.attachments.filter(a => !removedAttIds.includes(a.id)).length + newAtts.length) < 5 && (
                  <View style={styles.editAttBtnRow}>
                    <TouchableOpacity style={styles.editAttTypeBtn} onPress={handlePickPhoto} activeOpacity={0.75}>
                      <Ionicons name="camera-outline" size={22} color={theme.colors.brand} />
                      <Text style={styles.editAttTypeBtnLabel}>Photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.editAttTypeBtn} onPress={handlePickVideo} activeOpacity={0.75}>
                      <Ionicons name="videocam-outline" size={22} color="#7C3AED" />
                      <Text style={[styles.editAttTypeBtnLabel, { color: '#7C3AED' }]}>Video</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.editAttTypeBtn} onPress={handlePickDocument} activeOpacity={0.75}>
                      <Ionicons name="document-text-outline" size={22} color="#D97706" />
                      <Text style={[styles.editAttTypeBtnLabel, { color: '#D97706' }]}>Document</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={{ height: 40 }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Status change modal */}
      <Modal
        visible={statusModal}
        transparent
        animationType="slide"
        onRequestClose={() => setStatusModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setStatusModal(false)}
        >
          <View style={[styles.modalSheet, { paddingBottom: Math.max(40, insets.bottom + theme.spacing.lg) }]}>
            <Text style={styles.modalTitle}>Change Status</Text>
            {ALL_STATUSES.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.statusOption, ticket.status === s && styles.statusOptionActive]}
                onPress={() => handleStatusChange(s)}
              >
                <StatusChip status={s} />
                {ticket.status === s && (
                  <Ionicons name="checkmark" size={18} color={theme.colors.brand} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
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
    alignSelf: 'flex-start',
  },
  ticketNumber: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    marginTop: theme.spacing.xs,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  statusChipPill: {
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  statusChipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  priorityChipPill: {
    backgroundColor: 'rgba(201,168,76,0.22)',
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  priorityChipText: {
    color: '#E8C96A',
    fontSize: 12,
    fontWeight: '600',
  },

  // ── Subject Card ──────────────────────────────────────────────────────────
  subjectCard: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  subjectLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textTertiary,
    letterSpacing: 0.8,
  },
  subjectText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  metaText: {
    fontSize: 12,
    color: theme.colors.textTertiary,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.textTertiary,
  },

  // ── Action Bar ────────────────────────────────────────────────────────────
  actionBar: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  actionBtnAssign: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radius.md,
  },
  actionBtnStatus: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.brand,
    borderRadius: theme.radius.md,
  },
  actionBtnResolve: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.statusColors.resolved.bg,
    borderWidth: 1.5,
    borderColor: theme.statusColors.resolved.accent,
    borderRadius: theme.radius.md,
  },
  actionLabelDark: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  actionLabelLight: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },

  // ── Tab Bar ───────────────────────────────────────────────────────────────
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingHorizontal: theme.spacing.lg,
  },
  tabBtn: {
    paddingVertical: theme.spacing.md,
    marginRight: theme.spacing.xl,
    position: 'relative',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textTertiary,
  },
  tabLabelActive: {
    color: theme.colors.brand,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: theme.colors.brand,
    borderRadius: theme.radius.full,
  },

  // ── Comments Tab ──────────────────────────────────────────────────────────
  commentsContent: {
    paddingTop: theme.spacing.md,
    backgroundColor: theme.colors.bg,
  },

  // ── Details Tab ───────────────────────────────────────────────────────────
  detailsContent: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    backgroundColor: theme.colors.bg,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textTertiary,
    letterSpacing: 0.8,
  },
  tapToEdit: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.brand,
  },
  descInput: {
    backgroundColor: theme.colors.surface2,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    fontSize: 14,
    color: theme.colors.textPrimary,
    lineHeight: 20,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  descFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm,
  },
  descInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    flex: 1,
  },
  descInfoText: {
    fontSize: 11,
    color: theme.colors.textTertiary,
  },
  savePill: {
    backgroundColor: theme.colors.brand,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xs,
  },
  savePillText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  descReadText: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    lineHeight: 22,
    marginTop: theme.spacing.xs,
  },
  readOnlyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.surface2,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    alignSelf: 'flex-start',
    marginTop: theme.spacing.sm,
  },
  readOnlyText: {
    fontSize: 11,
    color: theme.colors.textTertiary,
    fontWeight: '500',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  infoField: {
    width: '50%',
    paddingRight: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  infoKey: {
    fontSize: 11,
    color: theme.colors.textTertiary,
    fontWeight: '500',
    marginBottom: theme.spacing.xs,
  },
  infoValue: {
    fontSize: 13,
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  priorityValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },

  // ── Tab Edit Button ───────────────────────────────────────────────────────
  tabEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  tabEditBtnLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.brand,
  },

  // ── Edit Modal ────────────────────────────────────────────────────────────
  editRoot: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  editHeader: {
    backgroundColor: theme.colors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  editHeaderTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 17,
  },
  editHeaderCancel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 15,
    fontWeight: '500',
    minWidth: 60,
  },
  editHeaderSave: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    minWidth: 60,
    textAlign: 'right',
  },
  editContent: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  editCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  editCardLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    letterSpacing: 0.8,
  },
  editDescInput: {
    backgroundColor: theme.colors.surface2,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    fontSize: 14,
    color: theme.colors.textPrimary,
    lineHeight: 20,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  editHScroll: {
    gap: theme.spacing.xs,
    paddingBottom: theme.spacing.xs,
  },
  editSubCatRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  editCatPill: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm - 2,
    borderRadius: theme.radius.sm,
    borderWidth: 1.5,
    backgroundColor: theme.colors.surface2,
    borderColor: theme.colors.border,
  },
  editCatPillSelected: {
    backgroundColor: theme.colors.brand,
    borderColor: theme.colors.brand,
  },
  editCatPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textTertiary,
  },
  editCatPillTextSelected: {
    color: '#fff',
  },
  editPillRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  editPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    borderWidth: 1.5,
    backgroundColor: theme.colors.surface2,
    borderColor: theme.colors.border,
  },
  editPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textTertiary,
  },
  editThumbRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  editThumbWrap: {
    position: 'relative',
  },
  editThumb: {
    width: 80,
    height: 80,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  editFileThumb: {
    backgroundColor: theme.colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  editFileThumbLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  editRemoveBtn: {
    position: 'absolute',
    top: -(theme.spacing.sm - 2),
    right: -(theme.spacing.sm - 2),
  },
  editAttBtnRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  editAttTypeBtn: {
    flex: 1,
    backgroundColor: theme.colors.surface2,
    borderRadius: theme.radius.sm,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  editAttTypeBtnLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.brand,
  },

  // ── Status Modal ──────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.xxl,
    paddingTop: theme.spacing.xxl,
    gap: theme.spacing.sm,
  },
  modalTitle: {
    fontWeight: '700',
    fontSize: 16,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statusOptionActive: {
    borderColor: theme.colors.brand,
    backgroundColor: '#EBF2FC',
  },
});
