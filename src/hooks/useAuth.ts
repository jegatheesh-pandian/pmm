/**
 * Auth convenience hook
 * Wraps authStore with commonly used selectors
 */

import { useAuthStore, selectUserDisplayName, selectUserInitials, selectIsHealthPlanMember } from '@/store/authStore';

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const authError = useAuthStore((s) => s.authError);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const clearError = useAuthStore((s) => s.clearError);
  const updateUser = useAuthStore((s) => s.updateUser);

  const displayName = useAuthStore(selectUserDisplayName);
  const initials = useAuthStore(selectUserInitials);
  const isHealthPlanMember = useAuthStore(selectIsHealthPlanMember);

  return {
    user,
    isAuthenticated,
    isLoading,
    authError,
    displayName,
    initials,
    isHealthPlanMember,
    login,
    logout,
    clearError,
    updateUser,
  };
}
