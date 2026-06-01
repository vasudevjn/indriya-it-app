import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { router } from 'expo-router';
import { TicketWithRelations } from '../../types/ticket';
import { StatusChip } from '../common/StatusChip';
import { PriorityBadge } from '../common/PriorityBadge';
import { timeAgo } from '../../lib/utils/date';

interface Props {
  ticket: TicketWithRelations;
}

export function TicketCard({ ticket }: Props) {
  return (
    <TouchableOpacity onPress={() => router.push(`/tickets/${ticket.id}`)}>
      <Card style={styles.card} mode="outlined">
        <Card.Content>
          <View style={styles.header}>
            <Text variant="labelLarge" style={styles.number}>{ticket.ticket_number}</Text>
            <View style={styles.badges}>
              <PriorityBadge priority={ticket.priority} />
              <StatusChip status={ticket.status} small />
            </View>
          </View>
          <Text variant="bodyMedium" numberOfLines={2} style={styles.description}>
            {ticket.description}
          </Text>
          <View style={styles.footer}>
            <Text variant="labelSmall" style={styles.meta}>
              {ticket.store?.name ?? 'Unknown Store'}
            </Text>
            <Text variant="labelSmall" style={styles.meta}>
              {timeAgo(ticket.created_at)}
            </Text>
          </View>
          {ticket.assignee && (
            <Text variant="labelSmall" style={styles.assignee}>
              Assigned: {ticket.assignee.full_name}
            </Text>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  number: {
    color: '#1B3A7A',
    fontWeight: '700',
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  description: {
    color: '#374151',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  meta: {
    color: '#9CA3AF',
  },
  assignee: {
    color: '#6B7280',
    marginTop: 4,
  },
});
