/**
 * Family Member Detail Screen
 * View/edit member, manage their medications
 */

import { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, Alert, FlatList } from 'react-native';
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
  Divider,
  Chip,
} from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenWrapper } from '@/components/ui';
import { EmptyState } from '@/components/ui/EmptyState';
import { FamilyMemberForm, type FamilyMemberFormValues } from '@/components/account/FamilyMemberForm';
import { useAppTheme } from '@/hooks/useAppTheme';
import {
  useFamilyMember,
  useUpdateFamilyMember,
  useDeleteFamilyMember,
  useRemoveFamilyMedication,
} from '@/hooks/useFamily';
import { formatPrice } from '@/utils/formatting';
import { spacing, borderRadius } from '@/theme';
import type { SavedMedication } from '@/types/user';

const RELATIONSHIP_LABELS: Record<string, string> = {
  self: 'Self',
  spouse: 'Spouse',
  child: 'Child',
  parent: 'Parent',
  other: 'Other',
};

const AVATAR_COLORS = ['#0D7377', '#2E8540', '#7C3AED', '#DC2626', '#F59E0B', '#EC4899'];

export default function FamilyMemberDetailScreen() {
  const { colors, brandColors } = useAppTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: member, isLoading } = useFamilyMember(id);
  const updateMember = useUpdateFamilyMember();
  const deleteMember = useDeleteFamilyMember();
  const removeMedication = useRemoveFamilyMedication();

  const [showEditModal, setShowEditModal] = useState(false);

  // ── Derived ──────────────────────────────────────────────────
  const avatarColor = useMemo(() => {
    if (!member) return AVATAR_COLORS[0];
    return AVATAR_COLORS[member.name.charCodeAt(0) % AVATAR_COLORS.length];
  }, [member]);

  const initials = useMemo(() => {
    if (!member) return '';
    return member.name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [member]);

  const medStats = useMemo(() => {
    if (!member) return { count: 0, totalSavings: 0, avgSavings: 0 };
    const meds = member.savedMedications;
    const totalSavings = meds.reduce(
      (s, m) => s + (m.retailPrice ?? 0) - (m.currentBestPrice ?? 0),
      0,
    );
    return {
      count: meds.length,
      totalSavings,
      avgSavings: meds.length > 0 ? totalSavings / meds.length : 0,
    };
  }, [member]);

  // ── Edit Member ──────────────────────────────────────────────
  const getEditDefaults = useCallback((): Partial<FamilyMemberFormValues> => {
    if (!member) return {};
    const parts = member.name.split(' ');
    return {
      firstName: parts[0] ?? '',
      lastName: parts.slice(1).join(' ') ?? '',
      relationship: member.relationship === 'self' ? 'other' : member.relationship,
    };
  }, [member]);

  const handleEdit = useCallback(
    async (values: FamilyMemberFormValues) => {
      if (!id) return;
      try {
        await updateMember.mutateAsync({
          id,
          request: {
            firstName: values.firstName,
            lastName: values.lastName,
            relationship: values.relationship as 'spouse' | 'child' | 'parent' | 'other',
            dateOfBirth: values.dateOfBirth || undefined,
            avatarColor: values.avatarColor || undefined,
          },
        });
        setShowEditModal(false);
      } catch {
        Alert.alert('Error', 'Failed to update family member.');
      }
    },
    [id, updateMember],
  );

  // ── Delete Member ────────────────────────────────────────────
  const handleDelete = useCallback(() => {
    if (!member || !id) return;
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
              await deleteMember.mutateAsync(id);
              router.back();
            } catch {
              Alert.alert('Error', 'Failed to remove family member.');
            }
          },
        },
      ],
    );
  }, [member, id, deleteMember, router]);

  // ── Remove Medication ────────────────────────────────────────
  const handleRemoveMedication = useCallback(
    (med: SavedMedication) => {
      if (!id) return;
      Alert.alert('Remove Medication', `Remove ${med.drugName} from ${member?.name ?? 'this member'}?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeMedication.mutateAsync({ memberId: id, medicationId: med.id });
            } catch {
              Alert.alert('Error', 'Failed to remove medication.');
            }
          },
        },
      ]);
    },
    [id, member, removeMedication],
  );

  // ── Loading ──────────────────────────────────────────────────
  if (isLoading || !member) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  const isSelf = member.relationship === 'self';

  // ── Render Medication Row ────────────────────────────────────
  const renderMedication = ({ item: med }: { item: SavedMedication }) => {
    const savings = (med.retailPrice ?? 0) - (med.currentBestPrice ?? 0);
    const savingsPercent =
      med.retailPrice && med.retailPrice > 0
        ? Math.round((savings / med.retailPrice) * 100)
        : 0;

    return (
      <Surface style={[styles.medCard, { backgroundColor: colors.surface }]} elevation={1}>
        <View style={styles.medHeader}>
          <Icon source="pill" size={20} color={brandColors.primary} />
          <View style={styles.medInfo}>
            <Text variant="titleSmall" style={{ color: colors.onSurface }} numberOfLines={1}>
              {med.drugName}
            </Text>
            <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
              {med.form} {med.dosage} | Qty: {med.quantity}
            </Text>
          </View>
          {!isSelf && (
            <IconButton
              icon="close"
              size={18}
              onPress={() => handleRemoveMedication(med)}
              iconColor={colors.onSurfaceVariant}
            />
          )}
        </View>

        {/* Pricing */}
        <View style={styles.medPricing}>
          {med.currentBestPrice != null && (
            <View style={styles.priceCol}>
              <Text variant="labelSmall" style={{ color: colors.onSurfaceVariant }}>
                Best Price
              </Text>
              <Text variant="titleMedium" style={{ color: brandColors.secondary, fontWeight: '700' }}>
                {formatPrice(med.currentBestPrice)}
              </Text>
            </View>
          )}
          {med.retailPrice != null && (
            <View style={styles.priceCol}>
              <Text variant="labelSmall" style={{ color: colors.onSurfaceVariant }}>
                Retail
              </Text>
              <Text
                variant="bodyMedium"
                style={{ color: colors.onSurfaceVariant, textDecorationLine: 'line-through' }}
              >
                {formatPrice(med.retailPrice)}
              </Text>
            </View>
          )}
          {savings > 0 && (
            <View style={styles.priceCol}>
              <Text variant="labelSmall" style={{ color: colors.onSurfaceVariant }}>
                Savings
              </Text>
              <Chip compact textStyle={{ fontSize: 11, color: '#166534' }} style={styles.savingsChip}>
                {savingsPercent}% off
              </Chip>
            </View>
          )}
        </View>

        {/* Tags */}
        <View style={styles.medTags}>
          {med.preferredPharmacyName && (
            <Chip compact icon="store" textStyle={{ fontSize: 10 }} style={styles.tagChip}>
              {med.preferredPharmacyName}
            </Chip>
          )}
          {med.refillReminderEnabled && (
            <Chip compact icon="bell" textStyle={{ fontSize: 10 }} style={styles.tagChip}>
              Reminder
            </Chip>
          )}
          {med.priceAlertEnabled && (
            <Chip compact icon="trending-down" textStyle={{ fontSize: 10 }} style={styles.tagChip}>
              Alert
            </Chip>
          )}
        </View>
      </Surface>
    );
  };

  return (
    <ScreenWrapper scroll={false} padded={false}>
      <FlatList
        data={member.savedMedications}
        keyExtractor={(m) => m.id}
        renderItem={renderMedication}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* Profile Header */}
            <Surface style={[styles.profileCard, { backgroundColor: colors.surface }]} elevation={1}>
              <View style={styles.profileRow}>
                <Avatar.Text
                  size={64}
                  label={initials}
                  style={{ backgroundColor: avatarColor }}
                  labelStyle={{ fontWeight: '700', fontSize: 24 }}
                />
                <View style={styles.profileInfo}>
                  <Text variant="titleLarge" style={{ color: colors.onSurface, fontWeight: '700' }}>
                    {member.name}
                  </Text>
                  <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>
                    {RELATIONSHIP_LABELS[member.relationship] ?? member.relationship}
                  </Text>
                  <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                    Added {new Date(member.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              {!isSelf && (
                <View style={styles.profileActions}>
                  <Button
                    mode="outlined"
                    icon="pencil"
                    onPress={() => setShowEditModal(true)}
                    compact
                    style={styles.actionButton}
                  >
                    Edit
                  </Button>
                  <Button
                    mode="outlined"
                    icon="delete"
                    onPress={handleDelete}
                    compact
                    textColor="#DC2626"
                    style={[styles.actionButton, { borderColor: '#FECACA' }]}
                  >
                    Remove
                  </Button>
                </View>
              )}
            </Surface>

            {/* Stats */}
            <View style={styles.statsRow}>
              <Surface style={[styles.statCard, { backgroundColor: colors.surface }]} elevation={1}>
                <Icon source="pill" size={24} color={brandColors.primary} />
                <Text variant="titleMedium" style={{ color: colors.onSurface, fontWeight: '700' }}>
                  {medStats.count}
                </Text>
                <Text variant="labelSmall" style={{ color: colors.onSurfaceVariant }}>
                  Medications
                </Text>
              </Surface>
              <Surface style={[styles.statCard, { backgroundColor: colors.surface }]} elevation={1}>
                <Icon source="piggy-bank" size={24} color={brandColors.secondary} />
                <Text variant="titleMedium" style={{ color: brandColors.secondary, fontWeight: '700' }}>
                  {formatPrice(medStats.totalSavings)}
                </Text>
                <Text variant="labelSmall" style={{ color: colors.onSurfaceVariant }}>
                  Total Savings
                </Text>
              </Surface>
              <Surface style={[styles.statCard, { backgroundColor: colors.surface }]} elevation={1}>
                <Icon source="tag" size={24} color="#7C3AED" />
                <Text variant="titleMedium" style={{ color: '#7C3AED', fontWeight: '700' }}>
                  {formatPrice(medStats.avgSavings)}
                </Text>
                <Text variant="labelSmall" style={{ color: colors.onSurfaceVariant }}>
                  Avg Savings
                </Text>
              </Surface>
            </View>

            {/* Medications Section Header */}
            <View style={styles.sectionHeader}>
              <Text variant="titleSmall" style={{ color: colors.onSurface, fontWeight: '700' }}>
                Medications ({member.savedMedications.length})
              </Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyMeds}>
            <EmptyState
              icon="pill"
              title="No medications tracked"
              message={`Search for medications and save them to ${member.name}'s profile.`}
            />
            <Button
              mode="contained"
              icon="magnify"
              onPress={() => router.push('/(tabs)/search')}
              style={styles.searchButton}
            >
              Search Medications
            </Button>
          </View>
        }
        ListFooterComponent={<View style={styles.bottomPadding} />}
      />

      {/* ── Edit Member Modal ─────────────────────────────── */}
      <Portal>
        <Modal
          visible={showEditModal}
          onDismiss={() => setShowEditModal(false)}
          contentContainerStyle={[styles.dialog, { backgroundColor: colors.surface }]}
        >
          <Text
            variant="titleMedium"
            style={{ color: colors.onSurface, fontWeight: '700', marginBottom: spacing[2] }}
          >
            Edit Family Member
          </Text>
          <FamilyMemberForm
            defaultValues={getEditDefaults()}
            onSubmit={handleEdit}
            onCancel={() => setShowEditModal(false)}
            isSubmitting={updateMember.isPending}
            submitLabel="Save Changes"
          />
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
  profileCard: {
    margin: spacing[2],
    borderRadius: borderRadius.lg,
    padding: spacing[2],
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: spacing[2],
    gap: 2,
  },
  profileActions: {
    flexDirection: 'row',
    gap: spacing[1],
    marginTop: spacing[2],
    paddingTop: spacing[2],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  actionButton: {
    borderRadius: borderRadius.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    marginBottom: spacing[2],
  },
  statCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    padding: spacing[1.5],
    alignItems: 'center',
    gap: 4,
  },
  sectionHeader: {
    paddingHorizontal: spacing[2],
    marginBottom: spacing[1],
  },
  medCard: {
    marginHorizontal: spacing[2],
    marginBottom: spacing[1],
    borderRadius: borderRadius.lg,
    padding: spacing[2],
  },
  medHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  medInfo: {
    flex: 1,
    marginLeft: spacing[1],
    gap: 2,
  },
  medPricing: {
    flexDirection: 'row',
    marginTop: spacing[1.5],
    paddingTop: spacing[1],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.06)',
    gap: spacing[3],
  },
  priceCol: {
    gap: 2,
  },
  savingsChip: {
    backgroundColor: '#DCFCE7',
    height: 24,
  },
  medTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[0.5],
    marginTop: spacing[1],
  },
  tagChip: {
    height: 24,
  },
  emptyMeds: {
    paddingHorizontal: spacing[2],
    alignItems: 'center',
  },
  searchButton: {
    marginTop: spacing[2],
    borderRadius: borderRadius.md,
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
