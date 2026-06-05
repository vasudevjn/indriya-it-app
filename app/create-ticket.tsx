import React, { useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  KeyboardAvoidingView, Platform, Image, ScrollView, Alert, TextInput,
} from 'react-native';
import { Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTicketDraftStore, AttachmentItem } from '../stores/ticketDraftStore';
import { useCreateTicket } from '../hooks/useTicketActions';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { ALL_PRIORITIES, PRIORITY_LABELS } from '../constants/ticket';
import {
  ALL_CATEGORIES, CATEGORY_LABELS, SUBCATEGORIES,
  TicketCategory,
} from '../constants/categories';
import { classifyTicket } from '../lib/utils/categoryClassifier';
import { TicketPriority } from '../types';
import { theme } from '../constants/theme';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'system';
}

const MAX_ATTACHMENTS = 5;

/** Bg tints for selected priority pills (colours not in theme) */
const PRIORITY_TINTS: Record<TicketPriority, string> = {
  low: '#ECFDF5',
  medium: '#FFFBEB',
  high: '#FEF2F2',
  critical: '#FFF7ED',
};

export default function CreateTicket() {
  const {
    description, setDescription, priority, setPriority,
    category, setCategory, subcategory, setSubcategory,
    attachments, addAttachment, removeAttachment,
    messages, addMessage, step, setStep, reset,
  } = useTicketDraftStore();

  const { profile } = useCurrentUser();
  const { mutate: createTicket, isPending } = useCreateTicket();
  const [inputText, setInputText] = React.useState('');
  const [inputFocused, setInputFocused] = React.useState(false);
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();

  const handleDiscard = () => {
    const isDirty = step !== 'description' || messages.length > 0;
    if (!isDirty) {
      reset();
      router.back();
      return;
    }
    Alert.alert(
      'Discard ticket?',
      'All your progress will be lost.',
      [
        { text: 'Keep editing', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            reset();
            router.back();
          },
        },
      ],
    );
  };

  const scrollToEnd = () => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 120);
  };

  // Step: description
  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;
    addMessage({ text, sender: 'user' });
    setDescription(text);
    setInputText('');

    const { category: cat, subcategory: sub } = classifyTicket(text);
    setCategory(cat);
    setSubcategory(sub);
    setStep('category');

    setTimeout(() => {
      addMessage({
        text: `I've classified your issue as "${CATEGORY_LABELS[cat]} > ${sub}". Does that look right? Adjust below if needed, then tap Confirm.`,
        sender: 'system',
      });
      scrollToEnd();
    }, 400);
  };

  // Step: category
  const handleCategoryConfirm = () => {
    setStep('attachments');
    addMessage({
      text: `Got it -- ${CATEGORY_LABELS[category]} > ${subcategory}. Would you like to attach any files? (photos, videos, or documents -- up to ${MAX_ATTACHMENTS})`,
      sender: 'system',
    });
    scrollToEnd();
  };

  // Step: attachments
  const handlePickPhoto = async () => {
    if (attachments.length >= MAX_ATTACHMENTS) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const name = asset.fileName ?? `photo_${Date.now()}.jpg`;
      addAttachment({ uri: asset.uri, name, type: 'image' });
      scrollToEnd();
    }
  };

  const handlePickVideo = async () => {
    if (attachments.length >= MAX_ATTACHMENTS) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const name = asset.fileName ?? `video_${Date.now()}.mp4`;
      addAttachment({ uri: asset.uri, name, type: 'video' });
      scrollToEnd();
    }
  };

  const handlePickDocument = async () => {
    if (attachments.length >= MAX_ATTACHMENTS) return;
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'application/msword', 'text/plain', '*/*'],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      addAttachment({
        uri: asset.uri,
        name: asset.name,
        type: 'document',
        mimeType: asset.mimeType ?? undefined,
      });
      scrollToEnd();
    }
  };

  const handleSkipAttachments = () => {
    setStep('confirm');
    addMessage({ text: 'Ready to submit your ticket!', sender: 'system' });
    scrollToEnd();
  };

  const handleContinueAttachments = () => {
    setStep('confirm');
    addMessage({
      text: `${attachments.length} file${attachments.length !== 1 ? 's' : ''} attached. Ready to submit!`,
      sender: 'system',
    });
    scrollToEnd();
  };

  // Step: confirm
  const handleSubmit = () => {
    if (!profile?.store_id) return;
    createTicket({
      description,
      priority,
      store_id: profile.store_id,
      category,
      subcategory,
      attachments,
    });
  };

  const allMessages: ChatMessage[] = [
    { id: 'welcome', text: "Hello! Describe your issue and I'll raise a ticket for you.", sender: 'system' },
    ...messages,
  ];

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View style={item.sender === 'user' ? styles.msgRowUser : styles.msgRowSystem}>
      {item.sender === 'system' && (
        <View style={styles.botAvatar}>
          <Ionicons name="hardware-chip-outline" size={14} color="#fff" />
        </View>
      )}
      <View style={[styles.bubble, item.sender === 'user' ? styles.userBubble : styles.systemBubble]}>
        <Text style={item.sender === 'user' ? styles.userText : styles.systemText}>
          {item.text}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      {/* 1. Header */}
      <View style={[styles.header, { paddingTop: insets.top + theme.spacing.sm }]}>
        <TouchableOpacity style={styles.headerLeft} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>

        {/* Absolutely centered title — pointerEvents none so touches reach the buttons */}
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>New Ticket</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.headerRight} onPress={handleDiscard} activeOpacity={0.7}>
          <Ionicons name="trash-outline" size={18} color="rgba(255,255,255,0.6)" />
          <Text style={styles.discardText}>Discard</Text>
        </TouchableOpacity>
      </View>

      {/* 2 + 3. Chat area + input */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <FlatList
          style={styles.chatBg}
          ref={flatListRef}
          data={allMessages}
          keyExtractor={(m) => m.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatArea}
          onContentSizeChange={scrollToEnd}
          ListFooterComponent={
            <>
              {/* Priority selector card */}
              {(step === 'description' || step === 'category' || step === 'attachments') && (
                <View style={styles.card}>
                  <Text style={styles.priorityLabel}>PRIORITY</Text>
                  <View style={styles.pillRow}>
                    {ALL_PRIORITIES.map((p) => {
                      const sel = priority === p;
                      return (
                        <TouchableOpacity
                          key={p}
                          style={[
                            styles.pill,
                            sel && {
                              backgroundColor: PRIORITY_TINTS[p],
                              borderColor: theme.priorityColors[p],
                            },
                          ]}
                          onPress={() => setPriority(p)}
                          activeOpacity={0.75}
                        >
                          <Text
                            style={[
                              styles.pillText,
                              sel && { color: theme.priorityColors[p] },
                            ]}
                          >
                            {PRIORITY_LABELS[p]}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Category picker */}
              {step === 'category' && (
                <View style={styles.card}>
                  <Text style={styles.sectionLabel}>CATEGORY</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.hScrollContent}
                  >
                    {ALL_CATEGORIES.map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.catPill, category === cat && styles.catPillSelected]}
                        onPress={() => {
                          setCategory(cat);
                          setSubcategory(SUBCATEGORIES[cat][0]);
                        }}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.catPillText, category === cat && styles.catPillTextSelected]}>
                          {CATEGORY_LABELS[cat]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <Text style={[styles.sectionLabel, { marginTop: theme.spacing.md }]}>
                    SUB-CATEGORY
                  </Text>
                  <View style={styles.subCatRow}>
                    {SUBCATEGORIES[category].map((sub) => (
                      <TouchableOpacity
                        key={sub}
                        style={[styles.catPill, subcategory === sub && styles.catPillSelected]}
                        onPress={() => setSubcategory(sub)}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.catPillText, subcategory === sub && styles.catPillTextSelected]}>
                          {sub}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Button
                    mode="contained"
                    buttonColor={theme.colors.brand}
                    onPress={handleCategoryConfirm}
                    style={styles.actionBtn}
                    icon="check"
                  >
                    Confirm Category
                  </Button>
                </View>
              )}

              {/* Attachment previews */}
              {attachments.length > 0 && (
                <View style={styles.attachPreview}>
                  {attachments.map((att, i) => (
                    <View key={i} style={styles.thumbWrap}>
                      {att.type === 'image' ? (
                        <Image source={{ uri: att.uri }} style={styles.thumb} />
                      ) : (
                        <View style={[styles.thumb, styles.fileThumb]}>
                          <Ionicons
                            name={att.type === 'video' ? 'videocam' : 'document-text'}
                            size={24}
                            color={att.type === 'video' ? '#7C3AED' : '#D97706'}
                          />
                          <Text style={styles.fileThumbLabel} numberOfLines={1}>
                            {att.name.split('.').pop()?.toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <TouchableOpacity style={styles.removeBtn} onPress={() => removeAttachment(att.uri)}>
                        <Ionicons name="close-circle" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* Attachment step actions */}
              {step === 'attachments' && (
                <View style={styles.card}>
                  <View style={styles.attachBtnRow}>
                    <TouchableOpacity
                      style={[styles.attachTypeBtn, attachments.length >= MAX_ATTACHMENTS && styles.attachTypeBtnDisabled]}
                      onPress={handlePickPhoto}
                      disabled={attachments.length >= MAX_ATTACHMENTS}
                      activeOpacity={0.75}
                    >
                      <Ionicons name="camera-outline" size={22} color={theme.colors.brand} />
                      <Text style={styles.attachTypeBtnLabel}>Photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.attachTypeBtn, attachments.length >= MAX_ATTACHMENTS && styles.attachTypeBtnDisabled]}
                      onPress={handlePickVideo}
                      disabled={attachments.length >= MAX_ATTACHMENTS}
                      activeOpacity={0.75}
                    >
                      <Ionicons name="videocam-outline" size={22} color="#7C3AED" />
                      <Text style={[styles.attachTypeBtnLabel, { color: '#7C3AED' }]}>Video</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.attachTypeBtn, attachments.length >= MAX_ATTACHMENTS && styles.attachTypeBtnDisabled]}
                      onPress={handlePickDocument}
                      disabled={attachments.length >= MAX_ATTACHMENTS}
                      activeOpacity={0.75}
                    >
                      <Ionicons name="document-text-outline" size={22} color="#D97706" />
                      <Text style={[styles.attachTypeBtnLabel, { color: '#D97706' }]}>Document</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.attachCount}>
                    {attachments.length}/{MAX_ATTACHMENTS} files attached
                  </Text>
                  <View style={styles.attachNavRow}>
                    <Button
                      mode="outlined"
                      onPress={handleSkipAttachments}
                      textColor={theme.colors.textSecondary}
                      style={styles.actionBtn}
                    >
                      Skip
                    </Button>
                    {attachments.length > 0 && (
                      <Button
                        mode="contained"
                        buttonColor={theme.colors.brand}
                        onPress={handleContinueAttachments}
                        style={styles.actionBtn}
                      >
                        Continue ({attachments.length})
                      </Button>
                    )}
                  </View>
                </View>
              )}

              {/* Confirm step */}
              {step === 'confirm' && (
                <View style={styles.card}>
                  <View style={styles.summaryBlock}>
                    <Text style={styles.summaryTitle}>Summary</Text>
                    <Text style={styles.summaryDesc}>{description}</Text>
                    {[
                      { label: 'Category', value: `${CATEGORY_LABELS[category]} > ${subcategory}` },
                      { label: 'Priority', value: PRIORITY_LABELS[priority] },
                      { label: 'Attachments', value: String(attachments.length) },
                    ].map(({ label, value }) => (
                      <View key={label} style={styles.summaryRow}>
                        <Text style={styles.summaryKey}>{label}</Text>
                        <Text style={styles.summaryVal}>{value}</Text>
                      </View>
                    ))}
                  </View>
                  <Button
                    mode="contained"
                    onPress={handleSubmit}
                    loading={isPending}
                    disabled={isPending}
                    buttonColor={theme.colors.brand}
                    style={styles.actionBtn}
                    icon="send"
                  >
                    Submit Ticket
                  </Button>
                </View>
              )}
            </>
          }
        />

        {/* 3. Input bar — only during description step */}
        {step === 'description' && (
          <View style={styles.inputBar}>
            <View style={[styles.inputWrap, inputFocused && styles.inputWrapFocused]}>
              <TextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder="Describe your issue"
                placeholderTextColor={theme.colors.textTertiary}
                multiline
                style={styles.chatInput}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
              />
            </View>
            <TouchableOpacity
              onPress={handleSend}
              disabled={!inputText.trim()}
              style={[styles.sendBtn, inputText.trim() ? styles.sendBtnActive : styles.sendBtnIdle]}
              activeOpacity={0.75}
            >
              <Ionicons name="arrow-up" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
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

  // ── Header ─────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: theme.colors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  headerLeft: {
    padding: theme.spacing.sm,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 17,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    padding: theme.spacing.sm,
  },
  discardText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '500',
  },

  // ── Chat area ─────────────────────────────────────────────────────────────
  chatBg: {
    backgroundColor: theme.colors.bg,
  },
  chatArea: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },

  // System message row
  msgRowSystem: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.sm - 2,
  },
  msgRowUser: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },

  // System avatar: square, brand bg, radius sm
  botAvatar: {
    width: 30,
    height: 30,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginBottom: 2,
  },

  // Bubble base
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    ...theme.shadows.sm,
  },

  // System bubble: surface bg, border, left tail (top-left sharp)
  systemBubble: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderTopLeftRadius: 3,
    borderTopRightRadius: theme.radius.md,
    borderBottomLeftRadius: theme.radius.md,
    borderBottomRightRadius: theme.radius.md,
  },

  // User bubble: brand bg, right tail (bottom-right sharp)
  userBubble: {
    backgroundColor: theme.colors.brand,
    borderTopLeftRadius: theme.radius.md,
    borderTopRightRadius: theme.radius.md,
    borderBottomLeftRadius: theme.radius.md,
    borderBottomRightRadius: 3,
  },

  userText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  systemText: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },

  // ── Shared card ───────────────────────────────────────────────────────────
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    ...theme.shadows.sm,
  },

  // ── Priority card ─────────────────────────────────────────────────────────
  priorityLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: theme.spacing.sm,
  },
  pillRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  pill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    borderWidth: 1.5,
    backgroundColor: theme.colors.surface2,
    borderColor: theme.colors.border,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textTertiary,
  },

  // ── Category card ─────────────────────────────────────────────────────────
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: theme.spacing.sm,
  },
  hScrollContent: {
    gap: theme.spacing.xs,
    paddingBottom: theme.spacing.xs,
  },
  subCatRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  catPill: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm - 2,
    borderRadius: theme.radius.sm,
    borderWidth: 1.5,
    backgroundColor: theme.colors.surface2,
    borderColor: theme.colors.border,
  },
  catPillSelected: {
    backgroundColor: theme.colors.brand,
    borderColor: theme.colors.brand,
  },
  catPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textTertiary,
  },
  catPillTextSelected: {
    color: '#fff',
  },
  actionBtn: {
    borderRadius: theme.radius.md,
    marginTop: theme.spacing.sm,
  },

  // ── Attachment previews ───────────────────────────────────────────────────
  attachPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  thumbWrap: {
    position: 'relative',
  },
  thumb: {
    width: 80,
    height: 80,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  fileThumb: {
    backgroundColor: theme.colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  fileThumbLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  removeBtn: {
    position: 'absolute',
    top: -theme.spacing.sm + 2,
    right: -theme.spacing.sm + 2,
  },

  // ── Attachment action card ────────────────────────────────────────────────
  attachBtnRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  attachTypeBtn: {
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
  attachTypeBtnDisabled: {
    opacity: 0.4,
  },
  attachTypeBtnLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.brand,
  },
  attachCount: {
    color: theme.colors.textTertiary,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  attachNavRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'flex-end',
  },

  // ── Confirm / summary card ────────────────────────────────────────────────
  summaryBlock: {
    backgroundColor: '#EBF2FC',
    borderRadius: theme.radius.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    gap: theme.spacing.sm,
  },
  summaryTitle: {
    color: theme.colors.brand,
    fontWeight: '700',
    fontSize: 13,
    marginBottom: theme.spacing.xs,
  },
  summaryDesc: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryKey: {
    color: theme.colors.textTertiary,
    fontSize: 13,
  },
  summaryVal: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },

  // ── Input bar ─────────────────────────────────────────────────────────────
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm + 2,
    paddingBottom: Platform.OS === 'ios' ? theme.spacing.md + 2 : theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  inputWrap: {
    flex: 1,
    backgroundColor: theme.colors.surface2,
    borderRadius: theme.radius.full,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 11 : 9,
    paddingBottom: Platform.OS === 'ios' ? 11 : 9,
    minHeight: 48,
    maxHeight: 130,
    justifyContent: 'center',
  },
  inputWrapFocused: {
    borderColor: theme.colors.brand,
  },
  chatInput: {
    fontSize: 15,
    color: theme.colors.textPrimary,
    padding: 0,
    margin: 0,
    maxHeight: 108,
    lineHeight: 21,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnActive: {
    backgroundColor: theme.colors.brand,
  },
  sendBtnIdle: {
    backgroundColor: theme.colors.borderStrong,
  },
});
