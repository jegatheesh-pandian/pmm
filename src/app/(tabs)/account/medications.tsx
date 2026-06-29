/**
 * My Medications Screen
 * Matches PriceMyMeds.com web design:
 * - Teal gradient header with "My Medications" title, "+Add Medication" button
 * - Empty state: large heart icon, "No Saved Medications", action buttons
 * - Medication list with search/sort when populated
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert, Pressable, ScrollView } from 'react-native';
import {
  Text,
  Searchbar,
  Button,
  ActivityIndicator,
  Portal,
  Modal,
  Icon,
} from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SavedMedicationCard } from '@/components/account/SavedMedicationCard';
import { BrandHeader } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useLocation } from '@/hooks/useLocation';
import { drugApi } from '@/services/api/drugApi';
import {
  useSavedMedications,
  useUpdateMedicationMutation,
  useDeleteMedicationMutation,
} from '@/hooks/useAccount';
import { spacing, borderRadius, fontSize } from '@/theme';
import type { SavedMedicationResponse, UpdateMedicationRequest } from '@/types/medication';
import type { Drug, QuantityOption } from '@/types/drug';

/** Default quantity choices when drug config has none */
const DEFAULT_QUANTITIES = ['15', '30', '60', '90', '120', '180'];

/** Pull the form→dosage→quantity map from a drug config (first brand alternative). */
function getFormStrengthQuantities(
  config: Drug | null,
): Record<string, Record<string, QuantityOption[]>> | null {
  return config?.brandAlternatives?.[0]?.formStrengthQuantities ?? null;
}

function getDrugInitials(name: string): string {
  return name ? name.substring(0, 2).toUpperCase() : 'Rx';
}

type SortOption = 'name' | 'date' | 'price';

export default function MedicationsScreen() {
  const { colors, brandColors } = useAppTheme();

  const { data: medications, isLoading, refetch, isFetching } = useSavedMedications();
  const updateMutation = useUpdateMedicationMutation();
  const deleteMutation = useDeleteMedicationMutation();
  const { zipCode, latitude, longitude } = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [editingMed, setEditingMed] = useState<SavedMedicationResponse | null>(null);

  // Edit dialog state — form/dosage/quantity are all editable (matches web)
  const [editForm, setEditForm] = useState({ form: '', dosage: '', quantity: '' });
  const [drugConfig, setDrugConfig] = useState<Drug | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [estPrice, setEstPrice] = useState<number | null>(null);
  const [estRetail, setEstRetail] = useState<number | null>(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);

  // Filter & sort
  const sortedMedications = useMemo(() => {
    let list: SavedMedicationResponse[] = Array.isArray(medications)
      ? medications
      : (medications as any)?.content ?? [];
    if (searchQuery.trim().length >= 2) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (m) =>
          m.drugName.toLowerCase().includes(q) ||
          (m.genericName?.toLowerCase().includes(q) ?? false),
      );
    }
    const sorted = [...list];
    switch (sortBy) {
      case 'name':
        sorted.sort((a, b) => a.drugName.localeCompare(b.drugName));
        break;
      case 'date':
        sorted.sort((a, b) => new Date(b.lastModifiedDate).getTime() - new Date(a.lastModifiedDate).getTime());
        break;
      case 'price':
        sorted.sort((a, b) => (a.currentBestPrice ?? 999) - (b.currentBestPrice ?? 999));
        break;
    }
    return sorted;
  }, [medications, searchQuery, sortBy]);

  const handleDelete = useCallback(
    (med: SavedMedicationResponse) => {
      Alert.alert(
        'Remove Medication',
        `Remove ${med.drugName} from your saved medications?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => deleteMutation.mutate(med.medItemId),
          },
        ],
      );
    },
    [deleteMutation],
  );

  const openEditDialog = useCallback(async (med: SavedMedicationResponse) => {
    setEditingMed(med);
    setEditForm({ form: med.form, dosage: med.dosage, quantity: String(med.quantity) });
    // Seed price from the saved values; the effect refreshes it once options load
    setEstPrice(med.currentBestPrice ?? null);
    setEstRetail(med.retailPrice ?? null);
    setDrugConfig(null);
    setIsLoadingConfig(true);
    try {
      const cfg = await drugApi.getDrugConfig(med.drugName);
      setDrugConfig(cfg);
    } catch {
      // Keep fallback options derived from the saved medication
    } finally {
      setIsLoadingConfig(false);
    }
  }, []);

  const closeEditDialog = useCallback(() => {
    setEditingMed(null);
    setDrugConfig(null);
  }, []);

  // ─── Cascading options (form → dosage → quantity), mirrors web ───────
  const formOptions = useMemo(() => {
    if (!editingMed) return [];
    const fsq = getFormStrengthQuantities(drugConfig);
    let list = fsq ? Object.keys(fsq) : ((drugConfig?.forms as string[]) ?? []);
    if (editingMed.form && !list.includes(editingMed.form)) list = [editingMed.form, ...list];
    return list.length ? list : [editingMed.form];
  }, [drugConfig, editingMed]);

  const dosageOptions = useMemo(() => {
    if (!editingMed) return [];
    const fsq = getFormStrengthQuantities(drugConfig);
    let list = fsq?.[editForm.form] ? Object.keys(fsq[editForm.form]) : (drugConfig?.dosages ?? []);
    if (editForm.dosage && !list.includes(editForm.dosage)) list = [editForm.dosage, ...list];
    return list.length ? list : [editingMed.dosage];
  }, [drugConfig, editForm.form, editForm.dosage, editingMed]);

  const quantityOptions = useMemo(() => {
    if (!editingMed) return [];
    const fsq = getFormStrengthQuantities(drugConfig);
    const dosageData = fsq?.[editForm.form]?.[editForm.dosage];
    let list = dosageData
      ? dosageData.map((q) => q.quantity)
      : (drugConfig?.quantities?.map(String) ?? []);
    list = list.filter((q) => parseInt(q, 10) > 0);
    if (!list.length) list = [...DEFAULT_QUANTITIES];
    if (editForm.quantity && !list.includes(editForm.quantity)) list = [...list, editForm.quantity];
    return [...new Set(list)].sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  }, [drugConfig, editForm.form, editForm.dosage, editForm.quantity, editingMed]);

  const handleFormChange = useCallback(
    (form: string) => {
      const fsq = getFormStrengthQuantities(drugConfig);
      const dosages = fsq?.[form] ? Object.keys(fsq[form]) : dosageOptions;
      const nextDosage = dosages.includes(editForm.dosage) ? editForm.dosage : (dosages[0] ?? editForm.dosage);
      const qtys = (fsq?.[form]?.[nextDosage] ?? []).map((q) => q.quantity);
      const nextQty = qtys.includes(editForm.quantity) ? editForm.quantity : (qtys[0] ?? editForm.quantity);
      setEditForm({ form, dosage: nextDosage, quantity: nextQty });
    },
    [drugConfig, dosageOptions, editForm.dosage, editForm.quantity],
  );

  const handleDosageChange = useCallback(
    (dosage: string) => {
      const fsq = getFormStrengthQuantities(drugConfig);
      const qtys = (fsq?.[editForm.form]?.[dosage] ?? []).map((q) => q.quantity);
      const nextQty = qtys.includes(editForm.quantity) ? editForm.quantity : (qtys[0] ?? editForm.quantity);
      setEditForm((prev) => ({ ...prev, dosage, quantity: nextQty }));
    },
    [drugConfig, editForm.form, editForm.quantity],
  );

  // Fetch a fresh estimated price whenever the configuration changes
  useEffect(() => {
    if (!editingMed) return;
    const { form, dosage, quantity } = editForm;
    if (!form || !dosage || !quantity || !zipCode) return;

    let cancelled = false;
    setIsLoadingPrice(true);
    drugApi
      .getDrugPrices({ name: editingMed.drugName, form, dosage, quantity, zipCode, latitude, longitude })
      .then((res) => {
        if (cancelled) return;
        if (res.prices.length > 0) {
          const lowest = res.prices.reduce((lo, c) => (c.discountPrice < lo.discountPrice ? c : lo));
          setEstPrice(lowest.discountPrice);
          setEstRetail(lowest.retailPrice);
        }
      })
      .catch(() => {
        /* keep last known price */
      })
      .finally(() => {
        if (!cancelled) setIsLoadingPrice(false);
      });

    return () => {
      cancelled = true;
    };
  }, [editingMed, editForm.form, editForm.dosage, editForm.quantity, zipCode, latitude, longitude]);

  const savingsPercent = useMemo(() => {
    if (!estPrice || !estRetail || estRetail <= estPrice) return 0;
    return Math.round(((estRetail - estPrice) / estRetail) * 100);
  }, [estPrice, estRetail]);

  const handleSaveEdit = useCallback(() => {
    if (!editingMed) return;
    const qty = parseInt(editForm.quantity, 10);
    const updates: UpdateMedicationRequest = {
      form: editForm.form,
      dosage: editForm.dosage,
      quantity: !isNaN(qty) && qty > 0 ? qty : undefined,
      currentBestPrice: estPrice ?? undefined,
      retailPrice: estRetail ?? undefined,
    };
    updateMutation.mutate(
      { id: editingMed.medItemId, request: updates },
      { onSuccess: closeEditDialog },
    );
  }, [editingMed, editForm, estPrice, estRetail, updateMutation, closeEditDialog]);

  const renderItem = useCallback(
    ({ item }: { item: SavedMedicationResponse }) => (
      <SavedMedicationCard
        medication={item}
        onEdit={() => openEditDialog(item)}
        onDelete={() => handleDelete(item)}
      />
    ),
    [openEditDialog, handleDelete],
  );

  const hasMeds = sortedMedications.length > 0 || (Array.isArray(medications) && medications.length > 0);

  return (
    <View style={styles.flex}>
      <BrandHeader safeTop />
      {/* ── Teal Gradient Header ──────────────────────────────── */}
      <LinearGradient
        colors={['#0D5C5F', '#0D7377', '#0F8B8F']}
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Icon source="arrow-left" size={22} color="#FFFFFF" />
          </Pressable>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>My Medications</Text>
            <Text style={styles.headerSubtitle}>
              Manage your saved prescriptions
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/(tabs)/search')}
            style={styles.addMedBtn}
            accessibilityRole="button"
          >
            <Icon source="plus" size={16} color="#0D7377" />
            <Text style={styles.addMedBtnText}>Add Medication</Text>
          </Pressable>
        </View>
      </LinearGradient>

      {/* ── Search (only when medications exist) ──────────────── */}
      {hasMeds && (
        <View style={styles.controls}>
          <Searchbar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search medications..."
            style={[styles.searchbar, { backgroundColor: colors.surfaceVariant }]}
            inputStyle={styles.searchInput}
            elevation={0}
          />
          <View style={styles.sortRow}>
            <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
              {sortedMedications.length} meds
            </Text>
          </View>
        </View>
      )}

      {/* ── Content ─────────────────────────────────────────── */}
      {isLoading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color="#0D7377" />
        </View>
      ) : sortedMedications.length === 0 ? (
        /* Empty State */
        <View style={styles.emptyContainer}>
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Icon source="heart-outline" size={40} color="#FFFFFF" />
            </View>
            <Text style={styles.emptyTitle}>No Saved Medications</Text>
            <Text style={styles.emptyDesc}>
              Save your frequently used medications for quick access to prices
              and coupons.
            </Text>
            <View style={styles.emptyActions}>
              <Button
                mode="outlined"
                icon="magnify"
                onPress={() => router.push('/(tabs)/search')}
                style={styles.emptyBtn}
                labelStyle={styles.emptyBtnLabel}
              >
                Search Medications
              </Button>
              <Button
                mode="outlined"
                icon="format-list-bulleted"
                onPress={() => router.push('/(tabs)/conditions')}
                style={styles.emptyBtn}
                labelStyle={styles.emptyBtnLabel}
              >
                Browse Popular
              </Button>
            </View>
          </View>
        </View>
      ) : (
        <FlatList
          data={sortedMedications}
          keyExtractor={(item) => item.medItemId}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshing={isFetching}
          onRefresh={() => refetch()}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* ── Edit Dialog ──────────────────────────────────────── */}
      <Portal>
        <Modal
          visible={!!editingMed}
          onDismiss={closeEditDialog}
          contentContainerStyle={[styles.dialog, { backgroundColor: colors.surface }]}
        >
          {editingMed && (
            <>
              {/* Header */}
              <View style={styles.editHeader}>
                <Text variant="titleMedium" style={{ color: colors.onSurface, fontWeight: '700' }}>
                  Edit Prescription
                </Text>
                <Pressable onPress={closeEditDialog} accessibilityRole="button" accessibilityLabel="Close">
                  <Icon source="close" size={22} color={colors.onSurfaceVariant} />
                </Pressable>
              </View>

              <ScrollView style={styles.editScroll} showsVerticalScrollIndicator={false}>
                {/* Drug Info Card */}
                <View style={[styles.drugCard, { backgroundColor: colors.surfaceVariant }]}>
                  <View style={[styles.drugAvatar, { backgroundColor: brandColors.primary }]}>
                    <Text style={styles.drugAvatarText}>{getDrugInitials(editingMed.drugName)}</Text>
                  </View>
                  <View style={styles.drugInfo}>
                    <Text variant="titleSmall" style={{ color: colors.onSurface, fontWeight: '700' }} numberOfLines={1}>
                      {editingMed.drugName}
                    </Text>
                    <View
                      style={[
                        styles.typeBadge,
                        { backgroundColor: editingMed.brandGeneric === 'Brand' ? brandColors.primary : brandColors.secondary },
                      ]}
                    >
                      <Text style={styles.typeBadgeText}>
                        {(editingMed.brandGeneric ?? 'Generic').toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>

                {isLoadingConfig && (
                  <View style={styles.configLoading}>
                    <ActivityIndicator size="small" color={brandColors.primary} />
                    <Text variant="bodySmall" style={{ color: brandColors.primary }}>
                      Loading prescription options...
                    </Text>
                  </View>
                )}

                {/* Prescription Settings */}
                <Text style={[styles.sectionHeading, { color: colors.onSurfaceVariant }]}>
                  Prescription Settings
                </Text>

                <View style={styles.fieldRow}>
                  <View style={styles.fieldHalf}>
                    <Text style={[styles.fieldLabel, { color: colors.onSurfaceVariant }]}>FORM</Text>
                    <View style={[styles.pickerWrapper, { borderColor: colors.outlineVariant }]}>
                      <Picker
                        selectedValue={editForm.form}
                        onValueChange={handleFormChange}
                        enabled={!isLoadingConfig}
                        style={[styles.picker, { color: colors.onSurface }]}
                        dropdownIconColor={colors.onSurfaceVariant}
                      >
                        {formOptions.map((f) => (
                          <Picker.Item key={f} label={f} value={f} />
                        ))}
                      </Picker>
                    </View>
                  </View>
                  <View style={styles.fieldHalf}>
                    <Text style={[styles.fieldLabel, { color: colors.onSurfaceVariant }]}>DOSAGE</Text>
                    <View style={[styles.pickerWrapper, { borderColor: colors.outlineVariant }]}>
                      <Picker
                        selectedValue={editForm.dosage}
                        onValueChange={handleDosageChange}
                        enabled={!isLoadingConfig}
                        style={[styles.picker, { color: colors.onSurface }]}
                        dropdownIconColor={colors.onSurfaceVariant}
                      >
                        {dosageOptions.map((d) => (
                          <Picker.Item key={d} label={d} value={d} />
                        ))}
                      </Picker>
                    </View>
                  </View>
                </View>

                <View style={styles.fieldFull}>
                  <Text style={[styles.fieldLabel, { color: colors.onSurfaceVariant }]}>QUANTITY</Text>
                  <View style={[styles.pickerWrapper, { borderColor: colors.outlineVariant }]}>
                    <Picker
                      selectedValue={editForm.quantity}
                      onValueChange={(q) => setEditForm((prev) => ({ ...prev, quantity: q }))}
                      enabled={!isLoadingConfig}
                      style={[styles.picker, { color: colors.onSurface }]}
                      dropdownIconColor={colors.onSurfaceVariant}
                    >
                      {quantityOptions.map((q) => (
                        <Picker.Item key={q} label={q} value={q} />
                      ))}
                    </Picker>
                  </View>
                </View>

                {/* Estimated Price */}
                <View style={[styles.priceSection, { backgroundColor: brandColors.secondaryLight }]}>
                  <Text style={[styles.priceHeading, { color: brandColors.primary }]}>
                    ESTIMATED PRICE
                  </Text>
                  {isLoadingPrice ? (
                    <View style={styles.priceLoading}>
                      <ActivityIndicator size="small" color={brandColors.primary} />
                      <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                        Fetching price...
                      </Text>
                    </View>
                  ) : estPrice != null ? (
                    <View style={styles.priceRow}>
                      <Text style={[styles.priceBest, { color: brandColors.secondary }]}>
                        ${estPrice.toFixed(2)}
                      </Text>
                      {estRetail != null && estRetail > estPrice && (
                        <>
                          <Text style={styles.priceRetail}>${estRetail.toFixed(2)}</Text>
                          <View style={[styles.savingsBadge, { backgroundColor: brandColors.secondary }]}>
                            <Text style={styles.savingsBadgeText}>Save {savingsPercent}%</Text>
                          </View>
                        </>
                      )}
                    </View>
                  ) : (
                    <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, fontStyle: 'italic' }}>
                      Price will be updated after save
                    </Text>
                  )}
                </View>
              </ScrollView>

              {/* Footer */}
              <View style={styles.dialogActions}>
                <Button mode="text" onPress={closeEditDialog}>
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  icon="check"
                  onPress={handleSaveEdit}
                  loading={updateMutation.isPending}
                  disabled={updateMutation.isPending || isLoadingConfig}
                  style={{ backgroundColor: brandColors.primary }}
                >
                  Save Changes
                </Button>
              </View>
            </>
          )}
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F8FAFB' },

  // Header
  header: {
    paddingTop: spacing[3],
    paddingBottom: spacing[2],
    paddingHorizontal: spacing[2],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: spacing[1.5],
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  addMedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  addMedBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0D7377',
  },

  // Controls
  controls: {
    paddingHorizontal: spacing[2],
    paddingTop: spacing[1.5],
  },
  searchbar: {
    borderRadius: borderRadius.md,
    height: 40,
  },
  searchInput: {
    fontSize: fontSize.sm,
    minHeight: 40,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: spacing[1],
    marginBottom: spacing[1],
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    padding: spacing[2],
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    paddingVertical: 40,
    paddingHorizontal: spacing[3],
    alignItems: 'center',
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0D7377',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    maxWidth: 320,
  },
  emptyActions: {
    flexDirection: 'row',
    gap: spacing[1.5],
    marginTop: spacing[3],
  },
  emptyBtn: {
    borderColor: '#0D7377',
    borderRadius: 8,
  },
  emptyBtnLabel: {
    color: '#0D7377',
    fontWeight: '600',
    fontSize: 13,
  },

  // List
  listContent: {
    paddingHorizontal: spacing[2],
    paddingBottom: spacing[4],
  },
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Dialog
  dialog: {
    margin: spacing[2],
    padding: spacing[2],
    borderRadius: borderRadius.lg,
    maxHeight: '88%',
  },
  editHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[1.5],
  },
  editScroll: {
    flexGrow: 0,
  },
  drugCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
    padding: spacing[1.5],
    borderRadius: borderRadius.md,
  },
  drugAvatar: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  drugAvatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: fontSize.base,
  },
  drugInfo: {
    flex: 1,
    gap: 4,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[1],
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  typeBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  configLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginTop: spacing[1.5],
  },
  sectionHeading: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    marginTop: spacing[2],
    marginBottom: spacing[1],
  },
  fieldRow: {
    flexDirection: 'row',
    gap: spacing[1.5],
  },
  fieldHalf: {
    flex: 1,
    gap: 4,
  },
  fieldFull: {
    marginTop: spacing[1.5],
    gap: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  picker: {
    height: 54,
  },
  priceSection: {
    marginTop: spacing[2],
    padding: spacing[1.5],
    borderRadius: borderRadius.md,
  },
  priceHeading: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: spacing[1],
  },
  priceLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
    flexWrap: 'wrap',
  },
  priceBest: {
    fontSize: 24,
    fontWeight: '800',
  },
  priceRetail: {
    fontSize: fontSize.sm,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  savingsBadge: {
    paddingHorizontal: spacing[1],
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  savingsBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing[1],
    marginTop: spacing[2],
  },
});
