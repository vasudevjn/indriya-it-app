import '../global.css';
import React, { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { queryClient } from '../lib/queryClient';
import { useAuth } from '../hooks/useAuth';
import { useAuthStore } from '../stores/authStore';
import { useRealtimeNotifications } from '../hooks/useRealtime';
import { updatePushToken } from '../lib/api/profiles';
import { LoadingOverlay } from '../components/common/LoadingOverlay';
import { useNotifications } from '../hooks/useNotifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#1B3A7A',
    secondary: '#1B3A7A',
  },
};

function AuthGate() {
  useAuth();
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);
  const isLoading = useAuthStore((s) => s.isLoading);

  useRealtimeNotifications(profile?.id ?? '');

  /**
   * Fetch notifications globally as soon as the profile is known.
   * This populates the unread badge count BEFORE the Notifications tab is visited.
   * React Query caches the result, so the Notifications screen reuses it for free.
   */
  useNotifications(profile?.id ?? '');

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;
      const token = await Notifications.getExpoPushTokenAsync();
      await updatePushToken(profile.id, token.data).catch(() => null);
    })();
  }, [profile?.id]);

  useEffect(() => {
    if (isLoading) return;

    if (!session) {
      router.replace('/(auth)/login');
      return;
    }

    if (!profile) return;

    if (profile.role === 'requester' && profile.approval_status === 'approved') {
      router.replace('/(requester)/home');
    } else if (profile.role === 'technician' && profile.approval_status === 'approved') {
      router.replace('/(technician)/queue');
    } else if (profile.role === 'admin') {
      router.replace('/(admin)/home');
    } else if (profile.role === 'technician' && profile.approval_status === 'pending') {
      router.replace('/pending-approval');
    } else {
      router.replace('/(auth)/login');
    }
  }, [isLoading, session, profile]);

  if (isLoading) return <LoadingOverlay message="Loading..." />;
  return null;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={theme}>
        <SafeAreaProvider>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(requester)" />
            <Stack.Screen name="(technician)" />
            <Stack.Screen name="(admin)" />
            <Stack.Screen name="tickets/[id]" options={{ presentation: 'card' }} />
            <Stack.Screen name="create-ticket" options={{ presentation: 'modal' }} />
            <Stack.Screen name="pending-approval" />
          </Stack>
          <AuthGate />
        </SafeAreaProvider>
      </PaperProvider>
    </QueryClientProvider>
  );
}
