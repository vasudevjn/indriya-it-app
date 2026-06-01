import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { FeedItem, NotificationKind } from '../../hooks/useUnifiedNotifications';
import { NotificationType } from '../../types';
import { timeAgo } from '../../lib/utils/date';

interface Props {
  item: FeedItem;
  onMarkRead?: (notificationId: string) => void;
}

/*  Visual config per kind  */

type IconConfig = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  rowBg: string;
  rowBgUnread: string;
  label: string;
  labelColor: string;
};

const KIND_CONFIG: Record<NotificationKind, IconConfig> = {
  ticket: {
    icon: 'notifications',
    iconColor: '#1B3A7A',
    iconBg: '#E0EAF6',
    rowBg: '#fff',
    rowBgUnread: '#EBF2FC',
    label: 'Ticket',
    labelColor: '#1B3A7A',
  },
  announcement: {
    icon: 'megaphone',
    iconColor: '#D97706',
    iconBg: '#FEF3C7',
    rowBg: '#FFFBEB',
    rowBgUnread: '#FFFBEB',
    label: 'Announcement',
    labelColor: '#92400E',
  },
  gold_rate: {
    icon: 'trending-up',
    iconColor: '#C9A46A',
    iconBg: '#FDF6E3',
    rowBg: '#FFFDF5',
    rowBgUnread: '#FFFDF5',
    label: 'Gold Rate',
    labelColor: '#78350F',
  },
};

/*  Per ticket-notification-type icon overrides  */

const TICKET_TYPE_ICON: Partial<Record<NotificationType, Pick<IconConfig, 'icon' | 'iconColor' | 'iconBg'>>> = {
  ticket_comment: {
    icon: 'chatbubble-ellipses',
    iconColor: '#7C3AED',
    iconBg: '#EDE9FE',
  },
  ticket_assigned: {
    icon: 'person-circle',
    iconColor: '#2563EB',
    iconBg: '#DBEAFE',
  },
  ticket_resolved: {
    icon: 'checkmark-circle',
    iconColor: '#059669',
    iconBg: '#D1FAE5',
  },
  ticket_created: {
    icon: 'add-circle',
    iconColor: '#1B3A7A',
    iconBg: '#E0EAF6',
  },
  ticket_updated: {
    icon: 'refresh-circle',
    iconColor: '#D97706',
    iconBg: '#FEF3C7',
  },
};

export function UnifiedNotificationItem({ item, onMarkRead }: Props) {
  const baseCfg = KIND_CONFIG[item.kind];

  // For ticket notifications, overlay the icon/colour based on the specific type
  const typeOverride =
    item.kind === 'ticket' && item.notificationType
      ? TICKET_TYPE_ICON[item.notificationType]
      : undefined;

  const cfg = typeOverride ? { ...baseCfg, ...typeOverride } : baseCfg;

  const isUnread = item.kind === 'ticket' && !item.is_read;
  const bg = isUnread ? baseCfg.rowBgUnread : baseCfg.rowBg;

  const handlePress = () => {
    if (item.kind === 'ticket') {
      if (!item.is_read && item.notificationId && onMarkRead) {
        onMarkRead(item.notificationId);
      }
      if (item.ticket_id) {
        router.push(`/tickets/${item.ticket_id}`);
      }
    }
    // Broadcasts/gold rate: no action on tap
  };

  return (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: bg }]}
      onPress={handlePress}
      activeOpacity={item.ticket_id ? 0.7 : 1}
    >
      {/* Icon */}
      <View style={[styles.iconWrap, { backgroundColor: cfg.iconBg }]}>
        <Ionicons name={cfg.icon} size={20} color={cfg.iconColor} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Kind label badge */}
        <View style={[styles.kindBadge, { backgroundColor: cfg.iconBg }]}>
          <Text style={[styles.kindLabel, { color: cfg.labelColor }]}>{cfg.label}</Text>
        </View>
        <Text variant="labelMedium" style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        {item.body ? (
          <Text variant="bodySmall" style={styles.body} numberOfLines={2}>
            {item.body}
          </Text>
        ) : null}
        <Text variant="labelSmall" style={styles.time}>{timeAgo(item.created_at)}</Text>
      </View>

      {/* Unread dot (tickets only) */}
      {isUnread && <View style={styles.dot} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  content: {
    flex: 1,
    gap: 3,
  },
  kindBadge: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 1,
    marginBottom: 2,
  },
  kindLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  title: {
    color: '#111827',
    fontWeight: '600',
    lineHeight: 18,
  },
  body: {
    color: '#6B7280',
    lineHeight: 17,
  },
  time: {
    color: '#9CA3AF',
    marginTop: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1B3A7A',
    marginTop: 6,
    flexShrink: 0,
  },
});
