import { useAuthStore } from '../stores/authStore';

export function useCurrentUser() {
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);
  const isLoading = useAuthStore((s) => s.isLoading);
  return { session, profile, isLoading, userId: session?.user?.id ?? null };
}
