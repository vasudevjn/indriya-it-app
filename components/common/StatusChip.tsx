import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { TicketStatus } from '../../types';
import { STATUS_COLORS, STATUS_LABELS } from '../../constants/ticket';

interface Props {
  status: TicketStatus;
  small?: boolean;
}

export function StatusChip({ status, small = false }: Props) {
  const color = STATUS_COLORS[status];
  return (
    <View style={[styles.chip, { backgroundColor: color + '20', borderColor: color }, small && styles.small]}>
      <Text style={[styles.label, { color }, small && styles.smallText]}>
        {STATUS_LABELS[status]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  small: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  smallText: {
    fontSize: 10,
  },
});
