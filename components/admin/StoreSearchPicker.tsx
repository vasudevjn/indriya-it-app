import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Modal, StyleSheet, FlatList, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { DbStore } from '../../types';

/* ================================================================
   Single-select mode  (default)
   Multi-select  mode  (multiple={true})
================================================================ */

interface SingleProps {
  stores: DbStore[];
  multiple?: false;
  selectedId: string | undefined;
  onSelect: (id: string | undefined) => void;
  label?: string;
}

interface MultiProps {
  stores: DbStore[];
  multiple: true;
  selectedIds: string[];
  onMultiSelect: (ids: string[]) => void;
  label?: string;
}

type Props = SingleProps | MultiProps;

function isMulti(p: Props): p is MultiProps {
  return p.multiple === true;
}

/*  single store row  */

function StoreRow({
  store,
  selected,
  multiMode,
  onPress,
}: {
  store: DbStore;
  selected: boolean;
  multiMode: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.row, selected && styles.rowSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.rowBadge}>
        <Text style={styles.rowCode}>{store.code}</Text>
      </View>
      <View style={styles.rowInfo}>
        <Text style={[styles.rowName, selected && styles.rowNameSelected]} numberOfLines={1}>
          {store.name}
        </Text>
        {store.city ? <Text style={styles.rowCity}>{store.city}</Text> : null}
      </View>
      {multiMode ? (
        <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
          {selected && <Ionicons name="checkmark" size={13} color="#fff" />}
        </View>
      ) : (
        selected && <Ionicons name="checkmark-circle" size={20} color="#1B3A7A" />
      )}
    </TouchableOpacity>
  );
}

/*  main component  */

export function StoreSearchPicker(props: Props) {
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');
  // draft selection used only in multi mode
  const [draft, setDraft] = useState<string[]>([]);

  const multi = isMulti(props);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return props.stores;
    return props.stores.filter(
      (s) =>
        s.code.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        (s.city?.toLowerCase().includes(q) ?? false) ||
        (s.region?.toLowerCase().includes(q) ?? false),
    );
  }, [props.stores, query]);

  const openModal = () => {
    if (multi) setDraft(props.selectedIds);
    setVisible(true);
  };

  const closeModal = () => {
    setVisible(false);
    setQuery('');
  };

  const confirmMulti = () => {
    if (multi) props.onMultiSelect(draft);
    closeModal();
  };

  /* trigger label */
  let triggerLabel: string;
  if (multi) {
    const n = props.selectedIds.length;
    triggerLabel = n === 0 ? 'All Stores' : `${n} store${n !== 1 ? 's' : ''} selected`;
  } else {
    const s = props.stores.find((x) => x.id === props.selectedId);
    triggerLabel = s ? `${s.code} - ${s.name}` : 'All Stores';
  }

  const handleToggleDraft = useCallback((id: string) => {
    setDraft((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    if (multi) {
      setDraft([]);       // empty = all stores
    } else {
      props.onSelect(undefined);
      closeModal();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [multi]);

  const handleSelectSingle = useCallback((id: string) => {
    if (!multi) {
      props.onSelect(id);
      closeModal();
    } else {
      handleToggleDraft(id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [multi, handleToggleDraft]);

  const allStoreSelected = multi ? draft.length === 0 : !(props as SingleProps).selectedId;

  return (
    <>
      {/* Trigger */}
      <View>
        <Text variant="labelMedium" style={styles.label}>{props.label ?? 'Target Store'}</Text>
        <TouchableOpacity style={styles.trigger} onPress={openModal} activeOpacity={0.8}>
          <View style={styles.triggerLeft}>
            <Ionicons
              name={multi && (props as MultiProps).selectedIds.length > 0 ? 'business-outline' : 'earth-outline'}
              size={16}
              color="#374151"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.triggerText} numberOfLines={1}>{triggerLabel}</Text>
          </View>
          <Ionicons name="chevron-down" size={18} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Modal */}
      <Modal visible={visible} animationType="slide" transparent onRequestClose={closeModal}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.sheet}
          >
            {/* Header */}
            <View style={styles.sheetHeader}>
              <Text variant="titleMedium" style={styles.sheetTitle}>
                {multi ? 'Select Stores' : 'Select Store'}
              </Text>
              <TouchableOpacity onPress={closeModal} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <TextInput
              placeholder="Search by name, code or city..."
              value={query}
              onChangeText={setQuery}
              mode="outlined"
              dense
              autoFocus
              outlineColor="#E5E7EB"
              activeOutlineColor="#1B3A7A"
              style={styles.search}
              left={<TextInput.Icon icon="magnify" color="#9CA3AF" />}
              right={
                query.length > 0
                  ? <TextInput.Icon icon="close-circle" onPress={() => setQuery('')} color="#9CA3AF" />
                  : undefined
              }
            />

            <Text style={styles.countText}>{filtered.length} store{filtered.length !== 1 ? 's' : ''}</Text>

            {/* List */}
            <FlatList
              data={filtered}
              keyExtractor={(s) => s.id}
              keyboardShouldPersistTaps="handled"
              ListHeaderComponent={
                <TouchableOpacity
                  style={[styles.row, styles.allRow, allStoreSelected && styles.rowSelected]}
                  onPress={handleSelectAll}
                  activeOpacity={0.7}
                >
                  <View style={[styles.rowBadge, styles.allBadge]}>
                    <Ionicons name="earth" size={14} color="#fff" />
                  </View>
                  <View style={styles.rowInfo}>
                    <Text style={[styles.rowName, allStoreSelected && styles.rowNameSelected]}>
                      All Stores
                    </Text>
                    <Text style={styles.rowCity}>Send to everyone</Text>
                  </View>
                  {multi ? (
                    <View style={[styles.checkbox, allStoreSelected && styles.checkboxSelected]}>
                      {allStoreSelected && <Ionicons name="checkmark" size={13} color="#fff" />}
                    </View>
                  ) : (
                    allStoreSelected && <Ionicons name="checkmark-circle" size={20} color="#1B3A7A" />
                  )}
                </TouchableOpacity>
              }
              renderItem={({ item }) => {
                const selected = multi
                  ? draft.includes(item.id)
                  : (props as SingleProps).selectedId === item.id;
                return (
                  <StoreRow
                    store={item}
                    selected={selected}
                    multiMode={!!multi}
                    onPress={() => handleSelectSingle(item.id)}
                  />
                );
              }}
              ListEmptyComponent={
                query.length > 0 ? (
                  <View style={styles.emptyWrap}>
                    <Text style={styles.emptyText}>No stores match "{query}"</Text>
                  </View>
                ) : null
              }
              contentContainerStyle={{ paddingBottom: 16 }}
              initialNumToRender={25}
              maxToRenderPerBatch={30}
              windowSize={10}
            />

            {/* Multi-select confirm button */}
            {multi && (
              <View style={styles.confirmRow}>
                <Button
                  mode="contained"
                  buttonColor="#1B3A7A"
                  onPress={confirmMulti}
                  style={styles.confirmBtn}
                >
                  {draft.length === 0
                    ? 'Confirm (All Stores)'
                    : `Confirm ${draft.length} store${draft.length !== 1 ? 's' : ''}`}
                </Button>
              </View>
            )}
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  label: { color: '#6B7280', marginBottom: 6 },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  triggerLeft: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  triggerText: { flex: 1, color: '#111827', fontSize: 14 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '88%',
    paddingTop: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sheetTitle: { fontWeight: '700', color: '#111827' },
  search: { marginHorizontal: 16, marginTop: 12, backgroundColor: '#fff', fontSize: 14 },
  countText: { color: '#9CA3AF', fontSize: 12, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
    gap: 12,
  },
  allRow: { backgroundColor: '#F9FAFB', borderBottomColor: '#E5E7EB', marginBottom: 4 },
  rowSelected: { backgroundColor: '#EBF2FC' },
  rowBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#E0EAF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  allBadge: { backgroundColor: '#1B3A7A' },
  rowCode: { color: '#1B3A7A', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  rowInfo: { flex: 1, gap: 1 },
  rowName: { color: '#111827', fontSize: 14, fontWeight: '500' },
  rowNameSelected: { color: '#1B3A7A', fontWeight: '700' },
  rowCity: { color: '#9CA3AF', fontSize: 12 },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: { backgroundColor: '#1B3A7A', borderColor: '#1B3A7A' },

  emptyWrap: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyText: { color: '#9CA3AF', fontSize: 14 },

  confirmRow: { padding: 16, paddingBottom: 32, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  confirmBtn: { borderRadius: 10 },
});
