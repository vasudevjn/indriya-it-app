import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNotificationStore } from '../../stores/notificationStore';
import { theme } from '../../constants/theme';

export default function AdminLayout() {
  const unreadCount = useNotificationStore((s) => s.unreadCount);

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
          title: 'All tickets',
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color, size }) => <Ionicons name="notifications-outline" size={size} color={color} />,
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />

      {/* Hidden from tab bar — reachable from home screen cards */}
      <Tabs.Screen name="approvals"  options={{ href: null }} />
      <Tabs.Screen name="broadcasts" options={{ href: null }} />
      <Tabs.Screen name="profile"    options={{ href: null, tabBarStyle: { display: 'none' } }} />
    </Tabs>
  );
}
