/**
 * Family Members Screen
 * Full CRUD with React Hook Form + Yup validation
 * Manage family members, view medications, edit/delete
 */

import { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, Alert, FlatList, Pressable } from 'react-native';
import {
  Text,
  Surface,
  Button,
  Icon,
  Avatar,
  Portal,
  Modal,
  ActivityIndicator,
  IconButton,
  Menu,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '@/components/ui';
import { EmptyState } from '@/components/ui/EmptyState';
import { SummaryCard } from '@/components/account/SummaryCard';
import { FamilyMemberForm, type FamilyMemberFormValues } from '@/components/account/FamilyMemberForm';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useUserProfile } from '@/hooks/useAccount';
import {
  useFamilyMembers,
  useAddFamilyMember,
  useUpdateFamilyMember,
  useDeleteFamilyMember,
} from '@/hooks/useFamily';
import { formatPrice } from '@/utils/formatting';
import { spacing, borderRadius } from '@/theme';
import type { FamilyMember } from '@/types/user';

const RELATIONSHIP_LABELS: Record<string, string> = {
  self: 'Self',
  spouse: 'Spouse',
  child: 'Child',
  parent: 'Parent',
  other: 'Other',
};

const AVATAR_COLORS = ['#0D7377', '#2E8540', '#7C3AED', '#DC2626', '#F59E0B', '#EC4899'];

const BENEFITS = [
  { icon: 'pill', text: 'Track medications for the whole family' },
  { icon: 'bell', text: 'Set refill reminders per family member' },
  { icon: 'piggy-bank', text: 'See combined family savings' },
  { icon: 'shield-check', text: 'Private — only you can see family data' },
];

export default function FamilyScreen() {
  const { colors, brandColors } = useAppTheme();
  const router = useRouter();
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const { data: familyData, isLoading: familyLoading } = useFamilyMembers();
  const addMember = useAddFamilyMember();
  const updateMember = useUpdateFamilyMember();
  const deleteMember = useDeleteFamilyMember();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [menuMemberId, setMenuMemberId] = useState<string | null>(null);

  // Use family data from dedicated endpoint, fallback to profile
  const familyMembers = familyData ?? profile?.familyMembers ?? [];
  const isLoading = profileLoading && familyLoading;

  const stats = useMemo(() => {
    const totalMeds = familyMembers.reduce((sum, m) => sum + m.savedMedications.length, 0);
    const totalSavings = familyMembers.reduce(
      (sum, m) =>
        sum +
        m.savedMedications.reduce(
          (s, med) => s + (med.retailPrice ?? 0) - (med.currentBestPrice ?? 0),
          0,
        ),
      0,
    );
    return { members: familyMembers.length, totalMeds, totalSavings };
  }, [familyMembers]);

  // ── Add Member ───────────────────────────────────────────────
  const handleAdd = useCallback(
    async (values: FamilyMemberFormValues) => {
      try {
        await addMember.mutateAsync({
          firstName: values.firstName,
          lastName: values.lastName,
          relationship: values.relationship as 'spouse' | 'child' | 'parent' | 'other',
          dateOfBirth: values.dateOfBirth || undefined,
          avatarColor: values.avatarColor || undefined,
        });
        setShowAddModal(false);
      } catch {
        Alert.alert('Error', 'Failed to add family member. Please try again.');
      }
    },
    [addMember],
  );

  // ── Edit Member ──────────────────────────────────────────────
  const handleEdit = useCallback(
    async (values: FamilyMemberFormValues) => {
      if (!editingMember) return;
      try {
        await updateMember.mutateAsync({
          id: editingMember.id,
          request: {
            firstName: values.firstName,
            lastName: values.lastName,
            relationship: values.relationship as 'spouse' | 'child' | 'parent' | 'other',
            dateOfBirth: values.dateOfBirth || undefined,
            avatarColor: values.avatarColor || undefined,
          },
        });
        setEditingMember(null);
      } catch {
        Alert.alert('Error', 'Failed to update family member. Please try again.');
      }
    },
    [editingMember, updateMember],
  );

  // ── Delete Member ────────────────────────────────────────────
  const handleDeleteConfirm = useCallback(
    (member: FamilyMember) => {
      setMenuMemberId(null);
      Alert.alert(
        'Remove Family Member',
        `Are you sure you want to remove ${member.name}? Their saved medications will also be removed.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteMember.mutateAsync(member.id);
              } catch {
                Alert.alert('Error', 'Failed to remove family member.');
              }
            },
          },
        ],
      );
    },
    [deleteMember],
  );

  // ── Navigate to Member Detail ────────────────────────────────
  const handleMemberPress = useCallback(
    (member: FamilyMember) => {
      router.push({ pathname: '/account/family-member', params: { id: member.id } });
    },
    [router],
  );

  // ── Edit defaults from existing member ───────────────────────
  const getEditDefaults = useCallback((member: FamilyMember): Partial<FamilyMemberFormValues> => {
    const parts = member.name.split(' ');
    return {
      firstName: parts[0] ?? '',
      lastName: parts.slice(1).join(' ') ?? '',
      relationship: member.relationship === 'self' ? 'other' : member.relationship,
    };
  }, []);

  const getAvatarColor = (member: FamilyMember) => {
    const idx = member.name.charCodeAt(0) % AVATAR_COLORS.length;
    return AVATAR_COLORS[idx];
  };

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  // ── Loading ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  // ── Render Member Card ───────────────────────────────────────
  const renderMemberCard = ({ item: member }: { item: FamilyMember }) => {
    const avatarColor = getAvatarColor(member);
    const initials = getInitials(member.name);
    const isSelf = member.relationship === 'self';
    const isMenuOpen = menuMemberId === member.id;

    return (
      <Surface style={[styles.memberCard, { backgroundColor: colors.surface }]} elevation={1}>
        <Pressable onPress={() => handleMemberPress(member)} style={styles.memberPressable}>
          {/* Header */}
          <View style={styles.memberHeader}>
            <Avatar.Text
              size={44}
              label={initials}
              style={{ backgroundColor: avatarColor }}
              labelStyle={{ fontWeight: '700', fontSize: 16 }}
            />
            <View style={styles.memberInfo}>
              <Text variant="titleSmall" style={{ color: colors.onSurface }}>
                {member.name}
              </Text>
              <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                {RELATIONSHIP_LABELS[member.relationship] ?? member.relationship}
              </Text>
            </View>
            <View style={styles.memberStats}>
              <Text variant="titleSmall" style={{ color: brandColors.primary }}>
                {member.savedMedications.length}
              </Text>
              <Text variant="labelSmall" style={{ color: colors.onSurfaceVariant }}>
                meds
              </Text>
            </View>

            {/* Context Menu (not for self) */}
            {!isSelf && (
              <Menu
                visible={isMenuOpen}
                onDismiss={() => setMenuMemberId(null)}
                anchor={
                  <IconButton
                    icon="dots-vertical"
                    size={20}
                    onPress={() => setMenuMemberId(member.id)}
                  />
                }
              >
                <Menu.Item
                  leadingIcon="pencil"
                  onPress={() => {
                    setMenuMemberId(null);
                    setEditingMember(member);
                  }}
                  title="Edit"
                />
                <Menu.Item
                  leadingIcon="delete"
                  onPress={() => handleDeleteConfirm(member)}
                  title="Remove"
                  titleStyle={{ color: '#DC2626' }}
                />
              </Menu>
            )}
          </View>

          {/* Medication Previews */}
          {member.savedMedications.slice(0, 2).map((med) => (
            <View key={med.id} style={styles.medPreview}>
              <Icon source="pill" size={14} color={colors.onSurfaceVariant} />
              <Text
                variant="bodySmall"
                style={{ color: colors.onSurfaceVariant, flex: 1, marginLeft: 6 }}
                numberOfLines={1}
              >
                {med.drugName} - {med.form} {med.dosage}
              </Text>
              {med.currentBestPrice != null && (
                <Text
                  variant="bodySmall"
                  style={{ color: brandColors.secondary, fontWeight: '600' }}
                >
                  {formatPrice(med.currentBestPrice)}
                </Text>
              )}
            </View>
          ))}

          {member.savedMedications.length > 2 && (
            <Text
              variant="labelSmall"
              style={{ color: colors.primary, marginTop: spacing[1], textAlign: 'right' }}
            >
              +{member.savedMedications.length - 2} more medications
            </Text>
          )}
        </Pressable>
      </Surface>
    );
  };

  return (
    <ScreenWrapper scroll={false} padded={false}>
      <FlatList
        data={familyMembers}
        keyExtractor={(m) => m.id}
        renderItem={renderMemberCard}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* Summary Stats */}
            <View style={styles.statsRow}>
              <SummaryCard
                icon="account-group"
                iconColor={brandColors.primary}
                label="Members"
                value={stats.members}
              />
              <SummaryCard icon="pill" iconColor="#7C3AED" label="Total Meds" value={stats.totalMeds} />
              <SummaryCard
                icon="piggy-bank"
                iconColor={brandColors.secondary}
                label="Family Savings"
                value={formatPrice(stats.totalSavings)}
              />
            </View>

            {/* Add Member Button */}
            <View style={styles.addContainer}>
              <Button
                mode="contained"
                icon="account-plus"
                onPress={() => setShowAddModal(true)}
                style={styles.addButton}
              >
                Add Family Member
              </Button>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <EmptyState
              icon="account-group-outline"
              title="No family members yet"
              message="Add family members to track their medications and savings together."
            />
            <Surface
              style={[styles.benefitsCard, { backgroundColor: colors.surface }]}
              elevation={1}
            >
              <Text
                variant="titleSmall"
                style={[styles.sectionTitle, { color: colors.onSurface }]}
              >
                Benefits of Family Tracking
              </Text>
              {BENEFITS.map((b, i) => (
                <View key={i} style={styles.benefitRow}>
                  <Icon source={b.icon} size={20} color={brandColors.primary} />
                  <Text
                    variant="bodyMedium"
                    style={{ color: colors.onSurface, flex: 1, marginLeft: spacing[1] }}
                  >
                    {b.text}
                  </Text>
                </View>
              ))}
            </Surface>
          </View>
        }
        ListFooterComponent={
          <>
            {/* Privacy Notice */}
            <View style={styles.privacyNotice}>
              <Icon source="shield-lock" size={16} color={colors.onSurfaceVariant} />
              <Text
                variant="bodySmall"
                style={{ color: colors.onSurfaceVariant, flex: 1, marginLeft: spacing[1] }}
              >
                Family member data is private and only visible to you. We never share health
                information.
              </Text>
            </View>
            <View style={styles.bottomPadding} />
          </>
        }
      />

      {/* ── Add Member Modal ──────────────────────────────── */}
      <Portal>
        <Modal
          visible={showAddModal}
          onDismiss={() => setShowAddModal(false)}
          contentContainerStyle={[styles.dialog, { backgroundColor: colors.surface }]}
        >
          <Text
            variant="titleMedium"
            style={{ color: colors.onSurface, fontWeight: '700', marginBottom: spacing[2] }}
          >
            Add Family Member
          </Text>
          <FamilyMemberForm
            onSubmit={handleAdd}
            onCancel={() => setShowAddModal(false)}
            isSubmitting={addMember.isPending}
            submitLabel="Add Member"
          />
        </Modal>
      </Portal>

      {/* ── Edit Member Modal ─────────────────────────────── */}
      <Portal>
        <Modal
          visible={!!editingMember}
          onDismiss={() => setEditingMember(null)}
          contentContainerStyle={[styles.dialog, { backgroundColor: colors.surface }]}
        >
          <Text
            variant="titleMedium"
            style={{ color: colors.onSurface, fontWeight: '700', marginBottom: spacing[2] }}
          >
            Edit Family Member
          </Text>
          {editingMember && (
            <FamilyMemberForm
              defaultValues={getEditDefaults(editingMember)}
              onSubmit={handleEdit}
              onCancel={() => setEditingMember(null)}
              isSubmitting={updateMember.isPending}
              submitLabel="Save Changes"
            />
          )}
        </Modal>
      </Portal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: spacing[2],
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing[1],
    padding: spacing[2],
  },
  addContainer: {
    paddingHorizontal: spacing[2],
    marginBottom: spacing[2],
  },
  addButton: {
    borderRadius: borderRadius.md,
  },
  emptyContainer: {
    paddingHorizontal: spacing[2],
  },
  benefitsCard: {
    borderRadius: borderRadius.lg,
    padding: spacing[2],
    marginTop: spacing[2],
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: spacing[1],
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[1],
  },
  memberCard: {
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing[2],
    marginBottom: spacing[1],
    overflow: 'hidden',
  },
  memberPressable: {
    padding: spacing[2],
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberInfo: {
    flex: 1,
    marginLeft: spacing[1.5],
    gap: 2,
  },
  memberStats: {
    alignItems: 'center',
    marginRight: spacing[0.5],
  },
  medPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[1],
    paddingTop: spacing[1],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing[2],
    marginTop: spacing[1],
  },
  dialog: {
    margin: spacing[3],
    padding: spacing[3],
    borderRadius: borderRadius.lg,
    maxHeight: '85%',
  },
  bottomPadding: {
    height: spacing[4],
  },
});
