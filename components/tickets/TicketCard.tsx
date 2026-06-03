import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { TicketWithRelations } from '../../types/ticket';
import { StatusChip } from '../common/StatusChip';
import { PriorityBadge } from '../common/PriorityBadge';
import { timeAgo } from '../../lib/utils/date';
import { theme } from '../../constants/theme';

interface Props {
  ticket: TicketWithRelations;
}

export function TicketCard({ ticket }: Props) {
  const accentColor = theme.statusColors[ticket.status].accent;

  return (
    <TouchableOpacity onPress={() => router.push(`/tickets/${ticket.id}`)}>
      <View style={[styles.card, theme.shadows.sm]}>
        <View style={[styles.strip, { backgroundColor: accentColor }]} />
        <View style={styles.content}>
          <View style={styles.topRow}>
            <View style={styles.leftMeta}>
              <PriorityBadge priority={ticket.priority} />
              <Text style={styles.ticketNumber}>{ticket.ticket_number}</Text>
            </View>
            <StatusChip status={ticket.status} small />
          </View>

          <Text style={styles.description} numberOfLines={2}>
            {ticket.description}
          </Text>

          <Text style={styles.timeAgo}>{timeAgo(ticket.created_at)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginHorizontal: theme.spacing.lg,
    marginVertical: 6,
  },
  strip: {
    width: 4,
    borderTopLeftRadius: theme.radius.md,
    borderBottomLeftRadius: theme.radius.md,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  leftMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  ticketNumber: {
    fontFamily: 'DM Mono',
    fontWeight: '600',
    fontSize: 13,
    color: theme.colors.brand,
  },
  description: {
    fontWeight: '500',
    fontSize: 14,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assigneeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  avatarDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: theme.colors.brandMid,
  },
  assigneeName: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  timeAgo: {
    fontSize: 12,
    color: theme.colors.textTertiary,
  },
});
