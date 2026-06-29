/**
 * Auth Store (Zustand)
 * Ported from Angular AuthService (864 lines)
 *
 * State: user, isAuthenticated, isLoading, authError
 * Computed: isHealthPlanMember, userDisplayName, userInitials
 * Actions: login, register, logout, refreshToken, restoreSession, updateProfile
 * Persistence: Expo SecureStore for tokens, user data
 */

import { create } from 'zustand';
import { router } from 'expo-router';
import { authApi } from '@/services/api/authApi';
import { getSecureItem, setSecureItem, removeSecureItem } from '@/utils/secureStorage';
import { SECURE_KEYS } from '@/constants/storage';
import { TOKEN_CONFIG } from '@/constants/api';
import type { User, LoginCredentials, UserAccountType } from '@/types/user';
import type { StoredAuthData, BackendAuthResponse } from '@/types/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isRestoringSession: boolean;
  authError: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

/** Transform backend user to frontend User model */
function transformBackendUser(backend: BackendAuthResponse['gbhUser']): User {
  return {
    id: backend.gbhUserId,
    email: backend.emailId,
    emailVerified: true,
    phone: backend.mobile,
    phoneVerified: true,
    firstName: backend.firstName,
    lastName: backend.lastName,
    accountType: 'general_public' as UserAccountType,
    accountStatus: 'active' as const,
    accountTypeHistory: [],
    savedMedications: [],
    priceAlerts: [],
    couponHistory: [],
    familyMembers: [],
    notificationPreferences: {
      email: { priceAlerts: true, refillReminders: true, savingsTips: false, productUpdates: false },
      sms: { priceAlerts: false, refillReminders: false },
      push: { priceAlerts: true, refillReminders: true },
    },
    totalSavings: backend.totalSavings ?? 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/** Store tokens in SecureStore */
async function persistTokens(
  accessToken: string,
  refreshToken: string,
  expiresIn: number,
  rememberMe: boolean
): Promise<void> {
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
  const refreshTokenExpiresAt = new Date(
    Date.now() + TOKEN_CONFIG.REFRESH_TOKEN_VALIDITY_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  await setSecureItem<StoredAuthData>(SECURE_KEYS.AUTH_TOKENS, {
    token: accessToken,
    refreshToken,
    expiresAt,
    refreshTokenExpiresAt,
    rememberMe,
  });
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isRestoringSession: true,
  authError: null,

  login: async (credentials) => {
    set({ isLoading: true, authError: null });

    try {
      const response = await authApi.login(credentials.mobile, credentials.password);

      if (response.data.success && response.data.data) {
        const backend = response.data.data;
        const user = transformBackendUser(backend.gbhUser);

        await persistTokens(
          backend.accessToken,
          backend.refreshToken,
          backend.expiresIn,
          credentials.rememberMe ?? false
        );
        await setSecureItem(SECURE_KEYS.USER_DATA, user);

        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          authError: null,
        });
        return true;
      }

      set({
        isLoading: false,
        authError: response.data.message ?? 'Login failed. Please check your credentials.',
      });
      return false;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'An error occurred during login.';
      set({ isLoading: false, authError: message });
      return false;
    }
  },

  logout: async () => {
    await removeSecureItem(SECURE_KEYS.AUTH_TOKENS);
    await removeSecureItem(SECURE_KEYS.USER_DATA);

    set({
      user: null,
      isAuthenticated: false,
      authError: null,
    });

    router.replace('/(auth)/login');
  },

  restoreSession: async () => {
    set({ isRestoringSession: true });

    try {
      const authData = await getSecureItem<StoredAuthData>(SECURE_KEYS.AUTH_TOKENS);
      if (!authData?.token) {
        set({ isRestoringSession: false });
        return;
      }

      // Check refresh token expiry
      if (authData.refreshTokenExpiresAt) {
        const expiry = new Date(authData.refreshTokenExpiresAt).getTime();
        if (expiry <= Date.now()) {
          await removeSecureItem(SECURE_KEYS.AUTH_TOKENS);
          await removeSecureItem(SECURE_KEYS.USER_DATA);
          set({ isRestoringSession: false });
          return;
        }
      }

      // Restore user from storage
      const user = await getSecureItem<User>(SECURE_KEYS.USER_DATA);
      if (user) {
        set({
          user,
          isAuthenticated: true,
          isRestoringSession: false,
        });
      } else {
        set({ isRestoringSession: false });
      }
    } catch {
      set({ isRestoringSession: false });
    }
  },

  updateUser: (updates) => {
    const currentUser = get().user;
    if (!currentUser) return;

    const updated = { ...currentUser, ...updates, updatedAt: new Date().toISOString() };
    set({ user: updated });
    setSecureItem(SECURE_KEYS.USER_DATA, updated);
  },

  clearError: () => set({ authError: null }),
  setLoading: (loading) => set({ isLoading: loading }),
}));

// ─── Selectors ────────────────────────────────────────────────────────

export const selectIsHealthPlanMember = (state: AuthState) =>
  state.user?.accountType === 'health_plan_member';

export const selectUserDisplayName = (state: AuthState) => {
  const user = state.user;
  if (!user) return '';
  if (user.firstName) return user.firstName;
  return user.email?.split('@')[0] ?? '';
};

export const selectUserInitials = (state: AuthState) => {
  const user = state.user;
  if (!user) return '';
  if (user.firstName && user.lastName) {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  }
  return (user.email?.[0] ?? '?').toUpperCase();
};
