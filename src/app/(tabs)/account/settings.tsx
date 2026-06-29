/**
 * Account Settings Screen
 * Matches PriceMyMeds.com web design:
 * - Teal gradient header: "Account Settings" + subtitle
 * - Two tabs: Profile (edit personal info) and Security (change password)
 * - Profile: Last Name, Email (read-only), Mobile (read-only), marketing checkbox, Update
 * - Security: Current/New/Confirm password with requirements, Update Password
 */

import { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, Alert, Pressable, ScrollView } from 'react-native';
import {
  Text,
  Surface,
  Button,
  TextInput,
  Checkbox,
  Icon,
  ActivityIndicator,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { BrandHeader } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useUserProfile } from '@/hooks/useAccount';
import { accountApi } from '@/services/api/accountApi';
import { useAuthStore } from '@/store/authStore';
import { spacing, borderRadius } from '@/theme';

// Password helpers
const hasMinLength = (pw: string) => pw.length >= 8;
const hasLetters = (pw: string) => /[a-zA-Z]/.test(pw);
const hasNumbers = (pw: string) => /\d/.test(pw);

type SettingsTab = 'profile' | 'security';

export default function SettingsScreen() {
  const { colors } = useAppTheme();
  const { data: profile, isLoading, refetch } = useUserProfile();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const logout = useAuthStore((s) => s.logout);

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [isSaving, setIsSaving] = useState(false);

  // Profile state
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [smsConsent, setSmsConsent] = useState(user?.smsConsent ?? false);

  // Security state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const profileDirty =
    lastName !== (user?.lastName ?? '') ||
    smsConsent !== (user?.smsConsent ?? false);

  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  const handleSaveProfile = useCallback(async () => {
    if (!profileDirty) return;
    setIsSaving(true);
    try {
      await accountApi.updateProfile({ lastName, smsConsent });
      updateUser({ lastName, smsConsent });
      await refetch();
      Alert.alert('Saved', 'Profile updated successfully.');
    } catch {
      Alert.alert('Error', 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  }, [lastName, smsConsent, profileDirty, refetch, updateUser]);

  const handleChangePassword = useCallback(async () => {
    if (!hasMinLength(newPassword) || !hasLetters(newPassword) || !hasNumbers(newPassword)) {
      Alert.alert('Error', 'Password does not meet requirements.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    setIsSaving(true);
    try {
      await accountApi.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Success', 'Password changed successfully.');
    } catch {
      Alert.alert('Error', 'Failed to change password. Check your current password.');
    } finally {
      setIsSaving(false);
    }
  }, [currentPassword, newPassword, confirmPassword]);

  if (isLoading) {
    return (
      <View style={styles.flex}>
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color="#0D7377" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <BrandHeader safeTop />
      {/* ── Teal Gradient Header ──────────────────────────────── */}
      <LinearGradient
        colors={['#0D5C5F', '#0D7377', '#0F8B8F']}
        style={styles.header}
      >
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Icon source="arrow-left" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Account Settings</Text>
        <Text style={styles.headerSubtitle}>
          Manage your profile, notifications, and security preferences
        </Text>
      </LinearGradient>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Tab Selector ─────────────────────────────────────── */}
        <View style={styles.tabRow}>
          <Pressable
            style={[
              styles.tabCard,
              activeTab === 'profile' && styles.tabCardActive,
            ]}
            onPress={() => setActiveTab('profile')}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'profile' }}
          >
            <View
              style={[
                styles.tabIconCircle,
                activeTab === 'profile' && styles.tabIconCircleActive,
              ]}
            >
              <Icon
                source="account-outline"
                size={20}
                color={activeTab === 'profile' ? '#FFFFFF' : '#6B7280'}
              />
            </View>
            <View style={styles.tabCardContent}>
              <Text
                style={[
                  styles.tabCardTitle,
                  activeTab === 'profile' && styles.tabCardTitleActive,
                ]}
              >
                Profile
              </Text>
              <Text style={styles.tabCardDesc}>Personal information</Text>
            </View>
            {activeTab === 'profile' && (
              <Icon source="chevron-right" size={18} color="#0D7377" />
            )}
          </Pressable>

          <Pressable
            style={[
              styles.tabCard,
              activeTab === 'security' && styles.tabCardActive,
            ]}
            onPress={() => setActiveTab('security')}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'security' }}
          >
            <View
              style={[
                styles.tabIconCircle,
                activeTab === 'security' && styles.tabIconCircleActive,
              ]}
            >
              <Icon
                source="lock-outline"
                size={20}
                color={activeTab === 'security' ? '#FFFFFF' : '#6B7280'}
              />
            </View>
            <View style={styles.tabCardContent}>
              <Text
                style={[
                  styles.tabCardTitle,
                  activeTab === 'security' && styles.tabCardTitleActive,
                ]}
              >
                Security
              </Text>
              <Text style={styles.tabCardDesc}>Password & sessions</Text>
            </View>
            {activeTab === 'security' && (
              <Icon source="chevron-right" size={18} color="#0D7377" />
            )}
          </Pressable>
        </View>

        {/* ── Profile Tab ──────────────────────────────────────── */}
        {activeTab === 'profile' && (
          <Surface style={styles.formCard} elevation={1}>
            {/* Section Header */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconCircle}>
                <Icon source="account-outline" size={22} color="#0D7377" />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Edit Profile</Text>
                <Text style={styles.sectionSubtitle}>
                  Edit your details below form
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Last Name */}
            <Text style={styles.fieldLabel}>Last Name</Text>
            <TextInput
              mode="outlined"
              value={lastName}
              onChangeText={setLastName}
              style={styles.input}
              outlineStyle={styles.inputOutline}
              autoCapitalize="words"
            />

            {/* Email (read-only) */}
            <Text style={styles.fieldLabel}>Email Address</Text>
            <TextInput
              mode="outlined"
              value={user?.email ?? ''}
              editable={false}
              style={[styles.input, styles.inputDisabled]}
              outlineStyle={styles.inputOutline}
            />

            {/* Mobile (read-only) */}
            <Text style={styles.fieldLabel}>Mobile Number</Text>
            <TextInput
              mode="outlined"
              value={user?.phone ?? ''}
              editable={false}
              style={[styles.input, styles.inputDisabled]}
              outlineStyle={styles.inputOutline}
            />

            {/* Marketing Checkbox */}
            <Pressable
              style={styles.checkboxRow}
              onPress={() => setSmsConsent((prev) => !prev)}
            >
              <Checkbox.Android
                status={smsConsent ? 'checked' : 'unchecked'}
                color="#0D7377"
              />
              <Text style={styles.checkboxText}>
                By checking box, you agree to receive recurring automated
                savings and marketing messages from Greenback Health. Message
                and data rates may apply. Reply STOP to unsubscribe at any time.
              </Text>
            </Pressable>

            {/* Update Profile Button */}
            <Button
              mode="contained"
              onPress={handleSaveProfile}
              loading={isSaving}
              disabled={!profileDirty || isSaving}
              style={styles.updateBtn}
              contentStyle={styles.updateBtnContent}
              labelStyle={styles.updateBtnLabel}
            >
              Update Profile
            </Button>
          </Surface>
        )}

        {/* ── Security Tab ─────────────────────────────────────── */}
        {activeTab === 'security' && (
          <Surface style={styles.formCard} elevation={1}>
            {/* Section Header */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconCircle}>
                <Icon source="lock-outline" size={22} color="#0D7377" />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Password & Security</Text>
                <Text style={styles.sectionSubtitle}>
                  Manage your password and security settings
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Current Password */}
            <Text style={styles.fieldLabel}>
              <Icon source="lock-outline" size={14} color="#374151" /> Current
              Password
            </Text>
            <TextInput
              mode="outlined"
              placeholder="Enter current password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry={!showCurrentPw}
              style={styles.input}
              outlineStyle={styles.inputOutline}
              right={
                <TextInput.Icon
                  icon={showCurrentPw ? 'eye-off' : 'eye'}
                  onPress={() => setShowCurrentPw(!showCurrentPw)}
                />
              }
            />

            {/* New Password */}
            <Text style={styles.fieldLabel}>
              <Icon source="key-variant" size={14} color="#374151" /> New
              Password
            </Text>
            <TextInput
              mode="outlined"
              placeholder="Enter new password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNewPw}
              style={styles.input}
              outlineStyle={styles.inputOutline}
              right={
                <TextInput.Icon
                  icon={showNewPw ? 'eye-off' : 'eye'}
                  onPress={() => setShowNewPw(!showNewPw)}
                />
              }
            />

            {/* Password Requirements */}
            {newPassword.length > 0 && (
              <View style={styles.reqList}>
                <PasswordRequirement
                  met={hasMinLength(newPassword)}
                  label="At least 8 characters"
                />
                <PasswordRequirement
                  met={hasLetters(newPassword)}
                  label="Contains letters"
                />
                <PasswordRequirement
                  met={hasNumbers(newPassword)}
                  label="Contains numbers"
                />
              </View>
            )}

            {/* Confirm Password */}
            <Text style={styles.fieldLabel}>
              <Icon source="check-decagram" size={14} color="#374151" /> Confirm
              New Password
            </Text>
            <TextInput
              mode="outlined"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPw}
              error={passwordsMismatch}
              style={styles.input}
              outlineStyle={styles.inputOutline}
              right={
                <TextInput.Icon
                  icon={showConfirmPw ? 'eye-off' : 'eye'}
                  onPress={() => setShowConfirmPw(!showConfirmPw)}
                />
              }
            />

            {/* Update Password Button */}
            <Button
              mode="contained"
              icon="lock-outline"
              onPress={handleChangePassword}
              loading={isSaving}
              disabled={
                !currentPassword ||
                !hasMinLength(newPassword) ||
                !hasLetters(newPassword) ||
                !hasNumbers(newPassword) ||
                !passwordsMatch ||
                isSaving
              }
              style={styles.updatePwBtn}
              contentStyle={styles.updateBtnContent}
              labelStyle={styles.updateBtnLabel}
            >
              Update Password
            </Button>
          </Surface>
        )}

        {/* Sign Out */}
        <Button
          mode="outlined"
          icon="logout"
          textColor="#DC2626"
          onPress={() => {
            Alert.alert('Sign Out', 'Are you sure?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Sign Out', onPress: () => logout() },
            ]);
          }}
          style={styles.logoutBtn}
        >
          Sign Out
        </Button>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

function PasswordRequirement({ met, label }: { met: boolean; label: string }) {
  return (
    <View style={styles.reqRow}>
      <Icon
        source={met ? 'check-circle' : 'circle-outline'}
        size={14}
        color={met ? '#2E8540' : '#9CA3AF'}
      />
      <Text style={{ color: met ? '#2E8540' : '#9CA3AF', fontSize: 13, marginLeft: 6 }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F8FAFB' },
  scrollContent: {
    paddingBottom: spacing[4],
  },

  // Header
  header: {
    paddingTop: spacing[3],
    paddingBottom: 20,
    paddingHorizontal: spacing[2],
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 3,
  },

  // Tab Selector
  tabRow: {
    flexDirection: 'row',
    gap: spacing[1],
    padding: spacing[2],
  },
  tabCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing[1.5],
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tabCardActive: {
    borderColor: '#0D7377',
    backgroundColor: '#F0FDF9',
  },
  tabIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIconCircleActive: {
    backgroundColor: '#0D7377',
  },
  tabCardContent: {
    flex: 1,
    marginLeft: spacing[1],
  },
  tabCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  tabCardTitleActive: {
    color: '#0D7377',
  },
  tabCardDesc: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 1,
  },

  // Form Card
  formCard: {
    marginHorizontal: spacing[2],
    borderRadius: borderRadius.lg,
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
  },
  sectionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E6F7F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: spacing[2],
  },

  // Fields
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: spacing[2],
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
  },
  inputOutline: {
    borderRadius: 8,
  },
  inputDisabled: {
    backgroundColor: '#F9FAFB',
  },

  // Checkbox
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing[2],
  },
  checkboxText: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
    marginTop: 4,
  },

  // Buttons
  updateBtn: {
    marginTop: spacing[3],
    borderRadius: 8,
    backgroundColor: '#0D7377',
  },
  updatePwBtn: {
    marginTop: spacing[3],
    borderRadius: 8,
    backgroundColor: '#0D7377',
  },
  updateBtnContent: {
    paddingVertical: 4,
  },
  updateBtnLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  logoutBtn: {
    marginHorizontal: spacing[2],
    marginTop: spacing[3],
    borderRadius: 8,
    borderColor: '#FECACA',
  },

  // Password Requirements
  reqList: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: spacing[1.5],
    marginTop: spacing[1],
    gap: 4,
  },
  reqRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Loading
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  bottomPadding: {
    height: spacing[4],
  },
});
