import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { FeedItem } from '../../hooks/useUnifiedNotifications';
import { NotificationType } from '../../types';
import { timeAgo } from '../../lib/utils/date';
import { theme } from '../../constants/theme';

interface Props {
  item: FeedItem;
  onMarkRead?: (notificationId: string) => void;
}

// ─── A) Announcement card ────────────────────────────────────────────────────

function AnnouncementCard({ item }: { item: FeedItem }) {
  return (
    <View style={styles.announceCard}>
      <View style={styles.baseRow}>
        <View style={styles.announceIconBox}>
          <Ionicons name="megaphone" size={20} color="rgba(201,168,76,0.9)" />
        </View>
        <View style={styles.content}>
          <Text style={styles.announceTag}>Announcement</Text>
          <Text style={styles.announceTitle} numberOfLines={2}>{item.title}</Text>
          {item.body ? (
            <Text style={styles.announceBody} numberOfLines={2}>{item.body}</Text>
          ) : null}
          <Text style={styles.announceTime}>{timeAgo(item.created_at)}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── B) Gold rate card ───────────────────────────────────────────────────────

function GoldRateCard({ item }: { item: FeedItem }) {
  return (
    <View style={styles.goldCard}>
      <View style={styles.baseRow}>
        <View style={styles.goldIconBox}>
          <Ionicons name="trending-up" size={20} color="#C9A84C" />
        </View>
        <View style={styles.content}>
          <Text style={styles.goldTag}>Gold Rate</Text>
          <Text style={styles.goldTitle} numberOfLines={2}>{item.title}</Text>
          {item.body ? (
            <Text style={styles.goldBody} numberOfLines={2}>{item.body}</Text>
          ) : null}
          <Text style={styles.goldTime}>{timeAgo(item.created_at)}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── C) Ticket card ──────────────────────────────────────────────────────────

type TicketIconCfg = {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
};

function getTicketIconCfg(type?: NotificationType | null): TicketIconCfg {
  switch (type) {
    case 'ticket_assigned':
      return { icon: 'person-circle', color: '#7C3AED', bg: '#F5F3FF' };
    case 'ticket_resolved':
      return { icon: 'checkmark-circle', color: '#059669', bg: '#ECFDF5' };
    case 'ticket_created':
      return { icon: 'add-circle', color: '#2563EB', bg: '#EFF6FF' };
    case 'ticket_updated':
      return { icon: 'refresh-circle', color: '#2563EB', bg: '#EFF6FF' };
    case 'ticket_comment':
      return { icon: 'chatbubble-ellipses', color: '#2563EB', bg: '#EFF6FF' };
    default:
      return { icon: 'notifications', color: '#2563EB', bg: '#EFF6FF' };
  }
}

function TicketCard({ item, onMarkRead }: { item: FeedItem; onMarkRead?: (id: string) => void }) {
  const isUnread = !item.is_read;
  const { icon, color, bg } = getTicketIconCfg(item.notificationType);

  const handlePress = () => {
    if (!item.is_read && item.notificationId && onMarkRead) {
      onMarkRead(item.notificationId);
    }
    if (item.ticket_id) {
      router.push(`/tickets/${item.ticket_id}`);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.ticketCard, isUnread ? styles.ticketUnread : styles.ticketRead]}
      onPress={handlePress}
      activeOpacity={item.ticket_id ? 0.7 : 1}
    >
      <View style={styles.baseRow}>
        <View style={[styles.iconBox, { backgroundColor: bg }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <View style={styles.content}>
          <Text style={styles.ticketTag}>Ticket</Text>
          <Text style={styles.ticketTitle} numberOfLines={2}>{item.title}</Text>
          {item.body ? (
            <Text style={styles.ticketBody} numberOfLines={2}>{item.body}</Text>
          ) : null}
          <Text style={styles.ticketTime}>{timeAgo(item.created_at)}</Text>
        </View>
      </View>
      {isUnread && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function UnifiedNotificationItem({ item, onMarkRead }: Props) {
  if (item.kind === 'announcement') return <AnnouncementCard item={item} />;
  if (item.kind === 'gold_rate') return <GoldRateCard item={item} />;
  return <TicketCard item={item} onMarkRead={onMarkRead} />;
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const ICON_SIZE = 38;

const styles = StyleSheet.create({
  // Shared layout
  baseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  content: {
    flex: 1,
    gap: theme.spacing.xs - 1,
  },
  iconBox: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  // ── A) Announcement ───────────────────────────────────────────────────────
  announceCard: {
    backgroundColor: '#1E3A5F',
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    ...theme.shadows.md,
  },
  announceIconBox: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: theme.radius.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  announceTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#C9A84C',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: theme.spacing.xs - 1,
  },
  announceTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 20,
  },
  announceBody: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    lineHeight: 18,
  },
  announceTime: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    marginTop: theme.spacing.xs,
  },

  // ── B) Gold rate ──────────────────────────────────────────────────────────
  goldCard: {
    backgroundColor: '#2A1E00',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.25)',
    padding: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  goldIconBox: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: theme.radius.sm,
    backgroundColor: 'rgba(201,168,76,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  goldTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#C9A84C',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: theme.spacing.xs - 1,
  },
  goldTitle: {
    color: '#C9A84C',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 20,
  },
  goldBody: {
    color: 'rgba(201,168,76,0.6)',
    fontSize: 13,
    lineHeight: 18,
  },
  goldTime: {
    color: 'rgba(201,168,76,0.3)',
    fontSize: 11,
    marginTop: theme.spacing.xs,
  },

  // ── C) Ticket ─────────────────────────────────────────────────────────────
  ticketCard: {
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
  },
  ticketUnread: {
    backgroundColor: '#F0F5FF',
    borderWidth: 1,
    borderColor: '#C7D9F5',
    ...theme.shadows.sm,
  },
  ticketRead: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  ticketTag: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: theme.spacing.xs - 1,
  },
  ticketTitle: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 20,
  },
  ticketBody: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  ticketTime: {
    color: theme.colors.textTertiary,
    fontSize: 11,
    marginTop: theme.spacing.xs,
  },
  unreadDot: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    width: 7,
    height: 7,
    borderRadius: theme.radius.full,
    backgroundColor: '#2563EB',
  },
});
