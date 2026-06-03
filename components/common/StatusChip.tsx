import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TicketStatus } from '../../types';
import { theme } from '../../constants/theme';

interface Props {
  status: TicketStatus;
  small?: boolean;
}

export function StatusChip({ status, small = false }: Props) {
  const colors = theme.statusColors[status];
  return (
    <View style={[styles.chip, { backgroundColor: colors.bg }, small && styles.small]}>
      <Text style={[styles.label, { color: colors.text }, small && styles.smallText]}>
        {theme.statusLabels[status]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    alignSelf: 'flex-start',
  },
  small: {
    paddingHorizontal: theme.spacing.sm,
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
