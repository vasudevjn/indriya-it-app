import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { TicketPriority } from '../../types';
import { PRIORITY_COLORS, PRIORITY_LABELS } from '../../constants/ticket';

interface Props {
  priority: TicketPriority;
}

export function PriorityBadge({ priority }: Props) {
  const color = PRIORITY_COLORS[priority];
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.label}>{PRIORITY_LABELS[priority].toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  label: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
