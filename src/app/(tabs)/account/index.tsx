/**
 * Account Tab
 * Shows login prompt if not authenticated
 * Shows dashboard inline if authenticated (keeps tab bar visible)
 */

import { useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import {
  Text,
  Surface,
  Button,
  Icon,
  ActivityIndicator,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/ui';
import { SavedMedicationCard } from '@/components/account/SavedMedicationCard';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useSavedMedications } from '@/hooks/useAccount';
import {
  useAuthStore,
  selectUserDisplayName,
  selectUserInitials,
} from '@/store/authStore';
import { spacing, borderRadius } from '@/theme';

export default function AccountScreen() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { colors } = useAppTheme();

  if (!isAuthenticated) {
    return (
      <ScreenWrapper scroll={false}>
        <View style={styles.authContent}>
          <Icon source="account-circle" size={80} color={colors.outlineVariant} />
          <Text variant="headlineSmall" style={[styles.title, { color: colors.onSurface }]}>
            Your Account
          </Text>
          <Text
            variant="bodyMedium"
            style={[styles.subtitle, { color: colors.onSurfaceVariant }]}
          >
            Sign in to save medications, set price alerts, and track your savings.
          </Text>
          <Button
            mode="contained"
            onPress={() => router.push('/(auth)/login')}
            style={styles.authButton}
            icon="login"
          >
            Sign In
          </Button>
          <Button
            mode="outlined"
            onPress={() => router.push('/(auth)/register')}
            style={styles.authButton}
            icon="account-plus"
          >
            Create Account
          </Button>
        </View>
      </ScreenWrapper>
    );
  }

  return <DashboardContent />;
}

/** Dashboard UI rendered inline within the Account tab */
function DashboardContent() {
  const displayName = useAuthStore(selectUserDisplayName);
  const initials = useAuthStore(selectUserInitials);
  const { data: medications, isLoading: isLoadingMeds } = useSavedMedications();

  const medsList = useMemo(() => {
    if (Array.isArray(medications)) return medications;
    if (medications && typeof medications === 'object' && Array.isArray((medications as any).content)) {
      return (medications as any).content;
    }
    return [];
  }, [medications]);

  return (
    <ScreenWrapper scroll padded={false}>
      {/* Hero Header */}
      <LinearGradient
        colors={['#0D5C5F', '#0D7377', '#0F8B8F']}
        style={[styles.hero, { paddingTop: spacing[3] }]}
      >
        {/* Avatar + Welcome */}
        <View style={styles.heroRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials || '?'}</Text>
            <View style={styles.onlineIndicator} />
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.welcomeText}>
              Welcome back, {displayName}!
            </Text>
            <View style={styles.badgeRow}>
              <View style={styles.memberBadge}>
                <Text style={styles.memberBadgeText}>General Member</Text>
              </View>
              <View style={styles.verifiedBadge}>
                <Icon source="check-decagram" size={14} color="#FFFFFF" />
                <Text style={styles.verifiedBadgeText}>Verified</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Action Cards */}
        <View style={styles.quickCardsRow}>
          <Pressable
            style={[styles.quickCard, styles.quickCardSaved]}
            onPress={() => router.push('/account/medications')}
            accessibilityRole="button"
            accessibilityLabel="View saved medications"
          >
            <View style={styles.quickCardIcon}>
              <Icon source="heart" size={20} color="#0D7377" />
            </View>
            <View style={styles.quickCardContent}>
              <Text style={styles.quickCardTitle}>Saved Meds</Text>
              <Text style={styles.quickCardDesc}>
                View your saved medications
              </Text>
            </View>
            <View style={styles.quickCardArrow}>
              <Icon source="arrow-right" size={18} color="#0D7377" />
            </View>
          </Pressable>

          <Pressable
            style={[styles.quickCard, styles.quickCardSettings]}
            onPress={() => router.push('/account/settings')}
            accessibilityRole="button"
            accessibilityLabel="Manage account settings"
          >
            <View style={[styles.quickCardIcon, styles.quickCardIconDark]}>
              <Icon source="cog" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.quickCardContent}>
              <Text style={[styles.quickCardTitle, { color: '#FFFFFF' }]}>
                Account Settings
              </Text>
              <Text style={[styles.quickCardDesc, { color: 'rgba(255,255,255,0.7)' }]}>
                Manage your profile
              </Text>
            </View>
            <View style={[styles.quickCardArrow, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
              <Icon source="arrow-right" size={18} color="#FFFFFF" />
            </View>
          </Pressable>
        </View>
      </LinearGradient>

      {/* My Medications Section */}
      <Surface style={styles.medsCard} elevation={1}>
        <View style={styles.medsHeader}>
          <View style={styles.medsHeaderLeft}>
            <Icon source="heart" size={20} color="#0D7377" />
            <Text style={styles.medsTitle}>My Medications</Text>
          </View>
          <Pressable
            onPress={() => router.push('/(tabs)/search')}
            style={styles.addNewBtn}
            accessibilityRole="button"
          >
            <Icon source="plus" size={16} color="#0D7377" />
            <Text style={styles.addNewText}>Add New</Text>
          </Pressable>
        </View>

        {isLoadingMeds ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#0D7377" />
          </View>
        ) : medsList.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Icon source="heart-outline" size={36} color="#FFFFFF" />
            </View>
            <Text style={styles.emptyTitle}>No saved medications yet</Text>
            <Text style={styles.emptyDesc}>
              Save your frequently used medications for quick access to prices
              and coupons.
            </Text>
            <Button
              mode="outlined"
              icon="magnify"
              onPress={() => router.push('/(tabs)/search')}
              style={styles.searchMedsBtn}
              labelStyle={styles.searchMedsBtnLabel}
            >
              Search Medications
            </Button>
          </View>
        ) : (
          <View style={styles.medsList}>
            {medsList.slice(0, 5).map((med: any) => (
              <SavedMedicationCard key={med.medItemId} medication={med} compact />
            ))}
            {medsList.length > 5 && (
              <Button
                mode="text"
                onPress={() => router.push('/account/medications')}
                labelStyle={{ color: '#0D7377' }}
              >
                View All ({medsList.length})
              </Button>
            )}
          </View>
        )}
      </Surface>

      <View style={styles.bottomPadding} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  // Auth (not logged in)
  authContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[3],
  },
  title: {
    fontWeight: '700',
    marginTop: spacing[2],
  },
  subtitle: {
    marginTop: spacing[1],
    textAlign: 'center',
    maxWidth: 280,
  },
  authButton: {
    marginTop: spacing[2],
    width: '100%',
    maxWidth: 300,
    borderRadius: borderRadius.md,
  },

  // Hero
  hero: {
    paddingTop: spacing[3],
    paddingBottom: spacing[3],
    paddingHorizontal: spacing[2],
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1A5C5E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#0D7377',
  },
  heroInfo: {
    flex: 1,
    marginLeft: spacing[2],
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  memberBadge: {
    backgroundColor: '#2E8540',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  memberBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  verifiedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Quick Action Cards
  quickCardsRow: {
    gap: spacing[1.5],
  },
  quickCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[1.5],
    borderRadius: borderRadius.lg,
  },
  quickCardSaved: {
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  quickCardSettings: {
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  quickCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E6F7F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickCardIconDark: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  quickCardContent: {
    flex: 1,
    marginLeft: spacing[1.5],
  },
  quickCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0D7377',
  },
  quickCardDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  quickCardArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E6F7F4',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // My Medications
  medsCard: {
    marginHorizontal: spacing[2],
    marginTop: spacing[3],
    marginBottom: spacing[2],
    borderRadius: borderRadius.lg,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  medsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  medsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  medsTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  addNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addNewText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D7377',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[3],
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#0D7377',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
    maxWidth: 300,
  },
  searchMedsBtn: {
    marginTop: 20,
    borderColor: '#0D7377',
    borderRadius: 8,
  },
  searchMedsBtnLabel: {
    color: '#0D7377',
    fontWeight: '600',
  },

  // Meds List
  medsList: {
    padding: spacing[1],
    gap: spacing[0.5],
  },

  // Loading
  loadingContainer: {
    padding: spacing[4],
    alignItems: 'center',
  },

  bottomPadding: {
    height: spacing[4],
  },
});
