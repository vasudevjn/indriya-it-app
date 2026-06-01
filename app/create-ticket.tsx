import React, { useRef } from 'react';
import {
  View, StyleSheet, FlatList, TouchableOpacity, KeyboardAvoidingView, Platform,
  Image, ScrollView, Alert,
} from 'react-native';
import { Text, TextInput, Button, Chip } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { Screen } from '../components/common/Screen';
import { AppHeader } from '../components/common/AppHeader';
import { useTicketDraftStore, AttachmentItem } from '../stores/ticketDraftStore';
import { useCreateTicket } from '../hooks/useTicketActions';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { ALL_PRIORITIES, PRIORITY_LABELS, PRIORITY_COLORS } from '../constants/ticket';
import {
  ALL_CATEGORIES, CATEGORY_LABELS, SUBCATEGORIES,
  TicketCategory,
} from '../constants/categories';
import { classifyTicket } from '../lib/utils/categoryClassifier';
import { TicketPriority } from '../types';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'system';
}

const MAX_ATTACHMENTS = 5;

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
  const flatListRef = useRef<FlatList>(null);

  const handleDiscard = () => {
    // Only show confirmation if the user has made any progress
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

  //  Step: description 
  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;
    addMessage({ text, sender: 'user' });
    setDescription(text);
    setInputText('');

    // Classify and move to category step
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

  //  Step: category 
  const handleCategoryConfirm = () => {
    setStep('attachments');
    addMessage({
      text: `Got it -- ${CATEGORY_LABELS[category]} > ${subcategory}. Would you like to attach any files? (photos, videos, or documents -- up to ${MAX_ATTACHMENTS})`,
      sender: 'system',
    });
    scrollToEnd();
  };

  //  Step: attachments 
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
    // expo-document-picker v12 uses { canceled, assets } API
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

  //  Step: confirm 
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
    { id: 'welcome', text: "Hello! Describe your IT issue and I'll raise a ticket for you.", sender: 'system' },
    ...messages,
  ];

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View style={[styles.bubble, item.sender === 'user' ? styles.userBubble : styles.systemBubble]}>
      <Text style={item.sender === 'user' ? styles.userText : styles.systemText}>{item.text}</Text>
    </View>
  );

  return (
    <Screen edges={['top', 'left', 'right']}>
      <AppHeader
        title="New IT Ticket"
        showBack
        right={
          <TouchableOpacity onPress={handleDiscard} style={styles.discardBtn}>
            <Ionicons name="trash-outline" size={18} color="rgba(255,255,255,0.85)" />
            <Text style={styles.discardText}>Discard</Text>
          </TouchableOpacity>
        }
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          ref={flatListRef}
          data={allMessages}
          keyExtractor={(m) => m.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatArea}
          onContentSizeChange={scrollToEnd}
          ListFooterComponent={
            <>
              {/* Priority chips -- visible through description + category steps */}
              {(step === 'description' || step === 'category' || step === 'attachments') && (
                <View style={styles.prioritySection}>
                  <Text variant="labelMedium" style={styles.sectionLabel}>Priority:</Text>
                  <View style={styles.chipRow}>
                    {ALL_PRIORITIES.map((p) => (
                      <Chip
                        key={p}
                        selected={priority === p}
                        onPress={() => setPriority(p)}
                        style={[styles.chip, priority === p && { backgroundColor: PRIORITY_COLORS[p] }]}
                        textStyle={priority === p ? { color: '#fff' } : { color: PRIORITY_COLORS[p] }}
                        compact
                      >
                        {PRIORITY_LABELS[p]}
                      </Chip>
                    ))}
                  </View>
                </View>
              )}

              {/* Category picker */}
              {step === 'category' && (
                <View style={styles.categorySection}>
                  <Text variant="labelMedium" style={styles.sectionLabel}>Category:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
                    <View style={styles.chipRow}>
                      {ALL_CATEGORIES.map((cat) => (
                        <Chip
                          key={cat}
                          selected={category === cat}
                          onPress={() => {
                            setCategory(cat);
                            setSubcategory(SUBCATEGORIES[cat][0]);
                          }}
                          style={[styles.chip, category === cat && styles.chipSelected]}
                          textStyle={category === cat ? { color: '#fff' } : { color: '#374151' }}
                          compact
                        >
                          {CATEGORY_LABELS[cat]}
                        </Chip>
                      ))}
                    </View>
                  </ScrollView>

                  <Text variant="labelMedium" style={[styles.sectionLabel, { marginTop: 10 }]}>Sub-category:</Text>
                  <View style={styles.chipRow}>
                    {SUBCATEGORIES[category].map((sub) => (
                      <Chip
                        key={sub}
                        selected={subcategory === sub}
                        onPress={() => setSubcategory(sub)}
                        style={[styles.chip, subcategory === sub && styles.chipSelected]}
                        textStyle={subcategory === sub ? { color: '#fff' } : { color: '#374151' }}
                        compact
                      >
                        {sub}
                      </Chip>
                    ))}
                  </View>

                  <Button
                    mode="contained"
                    buttonColor="#1B3A7A"
                    onPress={handleCategoryConfirm}
                    style={[styles.actionBtn, { marginTop: 12 }]}
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
                <View style={styles.attachActions}>
                  <View style={styles.attachBtnRow}>
                    <TouchableOpacity
                      style={[styles.attachTypeBtn, attachments.length >= MAX_ATTACHMENTS && styles.attachTypeBtnDisabled]}
                      onPress={handlePickPhoto}
                      disabled={attachments.length >= MAX_ATTACHMENTS}
                    >
                      <Ionicons name="camera-outline" size={22} color="#1B3A7A" />
                      <Text style={styles.attachTypeBtnLabel}>Photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.attachTypeBtn, attachments.length >= MAX_ATTACHMENTS && styles.attachTypeBtnDisabled]}
                      onPress={handlePickVideo}
                      disabled={attachments.length >= MAX_ATTACHMENTS}
                    >
                      <Ionicons name="videocam-outline" size={22} color="#7C3AED" />
                      <Text style={[styles.attachTypeBtnLabel, { color: '#7C3AED' }]}>Video</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.attachTypeBtn, attachments.length >= MAX_ATTACHMENTS && styles.attachTypeBtnDisabled]}
                      onPress={handlePickDocument}
                      disabled={attachments.length >= MAX_ATTACHMENTS}
                    >
                      <Ionicons name="document-text-outline" size={22} color="#D97706" />
                      <Text style={[styles.attachTypeBtnLabel, { color: '#D97706' }]}>Document</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.attachCount}>
                    {attachments.length}/{MAX_ATTACHMENTS} files attached
                  </Text>
                  <View style={styles.attachNavRow}>
                    <Button mode="outlined" onPress={handleSkipAttachments} textColor="#6B7280">
                      Skip
                    </Button>
                    {attachments.length > 0 && (
                      <Button mode="contained" buttonColor="#1B3A7A" onPress={handleContinueAttachments}>
                        Continue ({attachments.length})
                      </Button>
                    )}
                  </View>
                </View>
              )}

              {/* Confirm step */}
              {step === 'confirm' && (
                <View style={styles.confirmSection}>
                  <View style={styles.summary}>
                    <Text variant="labelLarge" style={styles.summaryTitle}>Summary</Text>
                    <Text style={styles.summaryText}>{description}</Text>
                    <View style={styles.summaryMeta}>
                      <Text style={styles.summaryMetaLabel}>Category</Text>
                      <Text style={styles.summaryMetaValue}>
                        {CATEGORY_LABELS[category]}{' > '}{subcategory}
                      </Text>
                    </View>
                    <View style={styles.summaryMeta}>
                      <Text style={styles.summaryMetaLabel}>Priority</Text>
                      <Text style={styles.summaryMetaValue}>{PRIORITY_LABELS[priority]}</Text>
                    </View>
                    <View style={styles.summaryMeta}>
                      <Text style={styles.summaryMetaLabel}>Attachments</Text>
                      <Text style={styles.summaryMetaValue}>{attachments.length}</Text>
                    </View>
                  </View>
                  <Button
                    mode="contained"
                    onPress={handleSubmit}
                    loading={isPending}
                    disabled={isPending}
                    buttonColor="#1B3A7A"
                    style={styles.submitBtn}
                    icon="send"
                  >
                    Submit Ticket
                  </Button>
                </View>
              )}
            </>
          }
        />

        {/* Description input bar */}
        {step === 'description' && (
          <View style={styles.inputBar}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Describe your IT issue..."
              multiline
              style={styles.chatInput}
              mode="outlined"
              outlineColor="#E5E7EB"
              activeOutlineColor="#1B3A7A"
              dense
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={!inputText.trim()}
              style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            >
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chatArea: {
    padding: 16,
    paddingBottom: 8,
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
  },
  userBubble: {
    backgroundColor: '#1B3A7A',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  systemBubble: {
    backgroundColor: '#F3F4F6',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  userText: { color: '#fff', fontSize: 14 },
  systemText: { color: '#374151', fontSize: 14 },

  // Priority + category shared
  prioritySection: { marginVertical: 8 },
  categorySection: { marginVertical: 8 },
  sectionLabel: { color: '#6B7280', marginBottom: 6 },
  chipRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  hScroll: { marginBottom: 4 },
  chip: { borderRadius: 20, backgroundColor: '#F3F4F6' },
  chipSelected: { backgroundColor: '#1B3A7A' },

  actionBtn: { borderRadius: 8 },

  // Attachment previews
  attachPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 8,
  },
  thumbWrap: { position: 'relative' },
  thumb: { width: 80, height: 80, borderRadius: 8 },
  fileThumb: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  fileThumbLabel: { fontSize: 10, fontWeight: '700', color: '#6B7280' },
  removeBtn: { position: 'absolute', top: -6, right: -6 },

  // Attachment step
  attachActions: { marginVertical: 8 },
  attachBtnRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  attachTypeBtn: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  attachTypeBtnDisabled: { opacity: 0.4 },
  attachTypeBtnLabel: { fontSize: 12, fontWeight: '600', color: '#1B3A7A' },
  attachCount: { color: '#9CA3AF', fontSize: 12, textAlign: 'center', marginBottom: 8 },
  attachNavRow: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },

  // Confirm summary
  confirmSection: { marginTop: 8 },
  summary: {
    backgroundColor: '#EBF2FC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#B8D0E8',
    gap: 8,
  },
  summaryTitle: { color: '#1B3A7A', fontWeight: '700', marginBottom: 4 },
  summaryText: { color: '#111827', fontSize: 14, lineHeight: 20 },
  summaryMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryMetaLabel: { color: '#6B7280', fontSize: 13 },
  summaryMetaValue: { color: '#111827', fontSize: 13, fontWeight: '500', flex: 1, textAlign: 'right' },
  submitBtn: { borderRadius: 8 },

  // Header discard button
  discardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  discardText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '500',
  },

  // Description input
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
  },
  chatInput: {
    flex: 1,
    maxHeight: 120,
    backgroundColor: '#fff',
    fontSize: 14,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1B3A7A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#7BA3CE' },
});
