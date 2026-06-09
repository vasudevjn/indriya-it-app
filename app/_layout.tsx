import '../global.css';
import React, { useEffect, useRef } from 'react';
import { Stack, router } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
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

  /**
   * Track the last navigation destination so that React 18 Strict Mode's
   * double-invocation of effects never fires router.replace() twice for the
   * same auth state.  Without this guard, the second call remounts the login
   * screen mid-interaction and kills TextInput focus.
   */
  const lastNav = useRef<string | null>(null);

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
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') return;
        const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
        const token = await Notifications.getExpoPushTokenAsync(
          projectId ? { projectId } : undefined,
        );
        await updatePushToken(profile.id, token.data).catch(() => null);
      } catch {
        // Push token registration is non-critical — never crash the app over it
      }
    })();
  }, [profile?.id]);

  useEffect(() => {
    if (isLoading) return;

    if (!session) {
      if (lastNav.current !== 'login') {
        lastNav.current = 'login';
        router.replace('/(auth)/login');
      }
      return;
    }

    if (!profile) return;

    // Determine the destination key so we can skip duplicate navigations.
    let dest: string;
    if (profile.role === 'requester' && profile.approval_status === 'approved') {
      dest = 'requester';
    } else if (profile.role === 'technician' && profile.approval_status === 'approved') {
      dest = 'technician';
    } else if (profile.role === 'admin') {
      dest = 'admin';
    } else if (profile.role === 'technician' && profile.approval_status === 'pending') {
      dest = 'pending';
    } else {
      dest = 'login';
    }

    if (lastNav.current === dest) return; // already navigated here — skip (covers Strict Mode re-run)
    lastNav.current = dest;

    if (dest === 'requester') router.replace('/(requester)/home');
    else if (dest === 'technician') router.replace('/(technician)/home');
    else if (dest === 'admin') router.replace('/(admin)/home');
    else if (dest === 'pending') router.replace('/pending-approval');
    else router.replace('/(auth)/login');
  }, [isLoading, session, profile]);

  if (isLoading) return <LoadingOverlay message="Loading..." />;
  return null;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={theme}>
        <SafeAreaProvider>
          <StatusBar style="auto" backgroundColor="#1B3A7A" />
          <Stack screenOptions={{
            headerShown: false,
            statusBarStyle: 'light',
          }}>
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
