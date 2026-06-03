import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, Platform } from 'react-native';
import { Text, Switch } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  onSubmit: (body: string, isInternal: boolean) => void;
  isSubmitting?: boolean;
  canMarkInternal?: boolean;
}

export function CommentInput({ onSubmit, isSubmitting, canMarkInternal }: Props) {
  const [body, setBody] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [focused, setFocused] = useState(false);

  const handleSubmit = () => {
    if (!body.trim()) return;
    onSubmit(body.trim(), isInternal);
    setBody('');
  };

  const canSend = !!body.trim() && !isSubmitting;
  const activeBorderColor = isInternal ? '#8B5CF6' : '#1B3A7A';
  const borderColor = focused ? activeBorderColor : '#E5E7EB';

  return (
    <View style={[styles.container, isInternal && styles.containerInternal]}>
      {canMarkInternal && (
        <View style={styles.internalRow}>
          <Ionicons
            name="lock-closed"
            size={12}
            color={isInternal ? '#8B5CF6' : '#9CA3AF'}
          />
          <Text style={[styles.internalLabel, isInternal && styles.internalLabelActive]}>
            Internal note
          </Text>
          <Switch value={isInternal} onValueChange={setIsInternal} color="#8B5CF6" />
        </View>
      )}

      <View style={styles.inputRow}>
        <View style={[styles.inputWrap, { borderColor }]}>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Add a comment…"
            placeholderTextColor="#9CA3AF"
            multiline
            style={styles.input}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!canSend}
          style={[styles.sendBtn, canSend ? styles.sendBtnActive : styles.sendBtnIdle]}
          activeOpacity={0.75}
        >
          <Ionicons name="arrow-up" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 14 : 12,
    gap: 6,
  },
  containerInternal: {
    backgroundColor: '#FAFAFF',
  },

  internalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 2,
  },
  internalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    flex: 1,
  },
  internalLabelActive: {
    color: '#8B5CF6',
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  inputWrap: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 24,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 11 : 9,
    paddingBottom: Platform.OS === 'ios' ? 11 : 9,
    minHeight: 48,
    maxHeight: 130,
    justifyContent: 'center',
  },
  input: {
    fontSize: 15,
    color: '#111827',
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
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnActive: {
    backgroundColor: '#1B3A7A',
  },
  sendBtnIdle: {
    backgroundColor: '#D1D5DB',
  },
});
