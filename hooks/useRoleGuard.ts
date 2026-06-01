import { useEffect } from 'react';
import { router } from 'expo-router';
import { useCurrentUser } from './useCurrentUser';
import { UserRole } from '../types';

export function useRoleGuard(allowedRoles: UserRole[]) {
  const { profile, isLoading } = useCurrentUser();

  useEffect(() => {
    if (isLoading) return;
    if (!profile) {
      router.replace('/(auth)/login');
      return;
    }
    if (!allowedRoles.includes(profile.role)) {
      router.replace('/(auth)/login');
    }
  }, [profile, isLoading]);
}
