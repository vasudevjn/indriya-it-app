import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { DbNotification } from '../../types';
import { timeAgo } from '../../lib/utils/date';
import { router } from 'expo-router';

interface Props {
  notification: DbNotification;
  onRead: (id: string) => void;
}

const isBroadcast = (n: DbNotification) => n.type === 'broadcast';

export function NotificationItem({ notification, onRead }: Props) {
  const handlePress = () => {
    if (!notification.is_read) onRead(notification.id);
    if (notification.ticket_id) {
      router.push(`/tickets/${notification.ticket_id}`);
    }
  };

  const broadcast = isBroadcast(notification);

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[
        styles.container,
        !notification.is_read && styles.unread,
        broadcast && styles.broadcastBg,
      ]}
    >
      <View style={[styles.iconWrap, broadcast && styles.broadcastIcon]}>
        <Ionicons
          name={broadcast ? 'megaphone' : 'notifications'}
          size={20}
          color={broadcast ? '#C9A46A' : '#1B3A7A'}
        />
      </View>
      <View style={styles.content}>
        <Text variant="labelMedium" style={styles.title}>{notification.title}</Text>
        {notification.body ? (
          <Text variant="bodySmall" style={styles.body} numberOfLines={2}>{notification.body}</Text>
        ) : null}
        <Text variant="labelSmall" style={styles.time}>{timeAgo(notification.created_at)}</Text>
      </View>
      {!notification.is_read && <View style={styles.dot} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  unread: {
    backgroundColor: '#EBF2FC',
  },
  broadcastBg: {
    backgroundColor: '#FFFBEB',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0EAF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  broadcastIcon: {
    backgroundColor: '#FEF3C7',
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: '#111827',
    fontWeight: '600',
  },
  body: {
    color: '#6B7280',
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
    marginTop: 4,
  },
});
