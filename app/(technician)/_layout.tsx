import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNotificationStore } from '../../stores/notificationStore';
import { theme } from '../../constants/theme';

export default function TechnicianLayout() {
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const unreadAnnouncementCount = useNotificationStore((s) => s.unreadAnnouncementCount);
  const totalUnread = unreadCount + unreadAnnouncementCount;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.brand,
        tabBarInactiveTintColor: theme.colors.textTertiary,
        tabBarStyle: {
          borderTopColor: theme.colors.border,
          paddingBottom: theme.spacing.sm,
          height: 60,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="all-tickets"
        options={{
          title: 'All Tickets',
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color, size }) => <Ionicons name="notifications-outline" size={size} color={color} />,
          tabBarBadge: totalUnread > 0 ? totalUnread : undefined,
        }}
      />

      {/* Hidden from tab bar */}
      <Tabs.Screen name="profile"    options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="my-tickets" options={{ href: null }} />
    </Tabs>
  );
}
