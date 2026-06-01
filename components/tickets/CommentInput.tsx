import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { TextInput, Switch, Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  onSubmit: (body: string, isInternal: boolean) => void;
  isSubmitting?: boolean;
  canMarkInternal?: boolean;
}

export function CommentInput({ onSubmit, isSubmitting, canMarkInternal }: Props) {
  const [body, setBody] = useState('');
  const [isInternal, setIsInternal] = useState(false);

  const handleSubmit = () => {
    if (!body.trim()) return;
    onSubmit(body.trim(), isInternal);
    setBody('');
  };

  return (
    <View style={styles.container}>
      {canMarkInternal && (
        <View style={styles.internalRow}>
          <Text variant="labelSmall" style={styles.internalLabel}>Internal note</Text>
          <Switch
            value={isInternal}
            onValueChange={setIsInternal}
            color="#1B3A7A"
          />
        </View>
      )}
      <View style={styles.inputRow}>
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder="Add a comment..."
          multiline
          style={styles.input}
          mode="outlined"
          outlineColor="#E5E7EB"
          activeOutlineColor="#1B3A7A"
          dense
        />
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!body.trim() || isSubmitting}
          style={[styles.sendBtn, (!body.trim() || isSubmitting) && styles.sendBtnDisabled]}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: 8,
  },
  internalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 4,
    gap: 8,
  },
  internalLabel: {
    color: '#8B5CF6',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
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
  sendBtnDisabled: {
    backgroundColor: '#7BA3CE',
  },
});
