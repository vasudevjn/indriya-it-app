import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { DbStore } from '../../types';
import { StoreSearchPicker } from './StoreSearchPicker';

interface Props {
  stores: DbStore[];
  onSubmit: (payload: {
    title: string;
    body: string;
    target_store_ids: string[]; // empty = all stores
  }) => void;
  isLoading?: boolean;
}

export function BroadcastForm({ stores, onSubmit, isLoading }: Props) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [storeIds, setStoreIds] = useState<string[]>([]);

  const handleSubmit = () => {
    if (!title.trim() || !body.trim()) return;
    onSubmit({ title: title.trim(), body: body.trim(), target_store_ids: storeIds });
    setTitle('');
    setBody('');
    setStoreIds([]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.iconWrap}>
          <Ionicons name="megaphone" size={18} color="#1B3A7A" />
        </View>
        <Text variant="titleMedium" style={styles.heading}>Send Broadcast</Text>
      </View>

      <TextInput
        label="Title"
        value={title}
        onChangeText={setTitle}
        mode="outlined"
        style={styles.input}
        outlineColor="#E5E7EB"
        activeOutlineColor="#1B3A7A"
        dense
      />
      <TextInput
        label="Message"
        value={body}
        onChangeText={setBody}
        mode="outlined"
        multiline
        numberOfLines={3}
        style={styles.input}
        outlineColor="#E5E7EB"
        activeOutlineColor="#1B3A7A"
      />

      {/* Multi-store picker */}
      <StoreSearchPicker
        stores={stores}
        multiple
        selectedIds={storeIds}
        onMultiSelect={setStoreIds}
        label="Send to (select stores, or leave blank for all)"
      />

      <Button
        mode="contained"
        onPress={handleSubmit}
        disabled={!title.trim() || !body.trim() || isLoading}
        loading={isLoading}
        buttonColor="#1B3A7A"
        style={styles.sendBtn}
        icon="send"
      >
        {storeIds.length === 0
          ? 'Send to All Stores'
          : `Send to ${storeIds.length} Store${storeIds.length !== 1 ? 's' : ''}`}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0EAF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: { fontWeight: '700', color: '#111827' },
  input: { marginBottom: 12, backgroundColor: '#fff' },
  sendBtn: { borderRadius: 8 },
});
