/**
 * Drug Pricing Detail Screen
 * Matches PriceMyMeds.com drug detail page:
 * - Drug header with Generic/Brand badge + Save Medication
 * - Drug description
 * - Prescription Settings (Brand, Form, Dosage, Quantity selectors)
 * - Location with edit (GPS + manual ZIP)
 * - Pharmacy price list with "Lowest Price" banner
 * - Coupon modal with BIN/PCN/Group + Email/SMS delivery
 * - Similar Medications section
 * - Price disclaimer
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Dimensions } from 'react-native';
import {
  Text,
  Button,
  IconButton,
  ActivityIndicator,
  Divider,
  Snackbar,
  TextInput,
  Portal,
  Modal,
  Icon,
} from 'react-native-paper';
import { useLocalSearchParams, router } from 'expo-router';
import { ScreenWrapper } from '@/components/ui';
import { EmptyState } from '@/components/ui/EmptyState';
import { PharmacyPriceCard } from '@/components/cards/PharmacyPriceCard';
import { DrugAlternativeCard } from '@/components/cards/DrugAlternativeCard';
import { PrescriptionSelector } from '@/components/drug/PrescriptionSelector';
import { CouponModal } from '@/components/coupon/CouponModal';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useLocation } from '@/hooks/useLocation';
import {
  useDrugConfig,
  useDrugPrices,
  useDrugDescription,
  useDrugAlternatives,
  useCheckMedicationSaved,
  useSaveMedication,
} from '@/hooks/useDrugPrices';
import { useDrugStore } from '@/store/drugStore';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/providers/ToastProvider';
import { formatPrice, formatSavingsPercent } from '@/utils/formatting';
import { spacing, borderRadius, fontSize } from '@/theme';
import type { PharmacyPrice, PharmacyPriceSortOption } from '@/types/pharmacy';
import type { CouponData } from '@/services/api/couponApi';
import { lookupZipCode } from '@/services/locationService';

const SCREEN_WIDTH = Dimensions.get('window').width;
// 2 columns with 16px padding each side + 8px gap = (width - 32 - 8) / 2
const ALT_CARD_WIDTH = (SCREEN_WIDTH - 32 - 8) / 2;

const SORT_OPTIONS: { value: PharmacyPriceSortOption; label: string }[] = [
  { value: 'price-asc', label: 'Lowest Price' },
  { value: 'price-desc', label: 'Highest Price' },
  { value: 'distance-asc', label: 'Nearest' },
  { value: 'savings-desc', label: 'Most Savings' },
];

export default function DrugPricingScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { colors, brandColors } = useAppTheme();
  const { showToast } = useToast();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();
  const addToHistory = useDrugStore((s) => s.addToHistory);
  const addFavorite = useDrugStore((s) => s.addFavorite);
  const removeFavorite = useDrugStore((s) => s.removeFavorite);
  const isFavorite = useDrugStore((s) => s.isFavorite);

  // Selection state
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedForm, setSelectedForm] = useState('');
  const [selectedDosage, setSelectedDosage] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState('');
  const [sortOption, setSortOption] = useState<PharmacyPriceSortOption>('price-asc');
  const [showZipModal, setShowZipModal] = useState(false);
  const [zipInput, setZipInput] = useState('');
  const [zipPreview, setZipPreview] = useState<{ city: string; state: string } | null>(null);
  const [isGeocodingPreview, setIsGeocodingPreview] = useState(false);
  const [snackMessage, setSnackMessage] = useState<string | null>(null);

  // Coupon modal state
  const [couponVisible, setCouponVisible] = useState(false);
  const [couponData, setCouponData] = useState<CouponData | undefined>();

  // ─── Data Fetching ──────────────────────────────────────────────

  const { data: drug, isLoading: isLoadingDrug } = useDrugConfig(slug ?? '');
  const { data: alternatives } = useDrugAlternatives(slug);

  // Initialize selections when drug loads
  useEffect(() => {
    if (!drug) return;
    setSelectedBrand(drug.brandAlternatives?.[0]?.seoUrlName ?? drug.slug);
    setSelectedForm(drug.defaultForm ?? drug.forms[0] ?? '');
    setSelectedDosage(drug.defaultDosage ?? drug.dosages[0] ?? '');
    setSelectedQuantity(drug.defaultQuantity ?? String(drug.quantities[0] ?? '30'));
    addToHistory(drug.slug, drug.name);
  }, [drug, addToHistory]);

  // Get current NDC for drug description
  const currentNdc = useMemo(() => {
    if (!drug?.brandAlternatives) return drug?.ndc ?? undefined;
    const brand = drug.brandAlternatives.find((b) => b.seoUrlName === selectedBrand);
    const qtyOpts = brand?.formStrengthQuantities?.[selectedForm]?.[selectedDosage];
    const match = qtyOpts?.find((q) => q.quantity === selectedQuantity);
    return match ? String(match.ndc ?? match.gpi ?? '') : drug.ndc;
  }, [drug, selectedBrand, selectedForm, selectedDosage, selectedQuantity]);

  const { data: drugDescription } = useDrugDescription(currentNdc);

  // Prices query
  const priceParams = useMemo(
    () => ({
      name: drug?.name ?? '',
      form: selectedForm,
      dosage: selectedDosage,
      quantity: selectedQuantity,
      zipCode: location.zipCode,
      latitude: location.latitude,
      longitude: location.longitude,
    }),
    [drug?.name, selectedForm, selectedDosage, selectedQuantity, location.zipCode, location.latitude, location.longitude],
  );

  const {
    data: pricesData,
    isLoading: isLoadingPrices,
    refetch: refetchPrices,
  } = useDrugPrices(priceParams);

  // Get current MedispanId from brand alternatives
  const currentMedispanId = useMemo(() => {
    if (!drug?.brandAlternatives) return null;
    const brand = drug.brandAlternatives.find((b) => b.seoUrlName === selectedBrand);
    const qtyOpts = brand?.formStrengthQuantities?.[selectedForm]?.[selectedDosage];
    const match = qtyOpts?.find((q) => q.quantity === selectedQuantity);
    return match?.drugInformationMedispanId ?? null;
  }, [drug, selectedBrand, selectedForm, selectedDosage, selectedQuantity]);

  const { data: isSaved } = useCheckMedicationSaved(
    isAuthenticated ? currentMedispanId : null,
  );
  const saveMutation = useSaveMedication();

  // Sort prices
  const sortedPrices = useMemo(() => {
    const prices = pricesData?.prices ?? [];
    const sorted = [...prices];
    switch (sortOption) {
      case 'price-asc':
        sorted.sort((a, b) => a.discountPrice - b.discountPrice);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.discountPrice - a.discountPrice);
        break;
      case 'distance-asc':
        sorted.sort((a, b) => (a.pharmacy.distance ?? 999) - (b.pharmacy.distance ?? 999));
        break;
      case 'savings-desc':
        sorted.sort((a, b) => b.savingsPercent - a.savingsPercent);
        break;
    }
    return sorted;
  }, [pricesData?.prices, sortOption]);

  const lowestPrice = sortedPrices.length > 0
    ? Math.min(...sortedPrices.map((p) => p.discountPrice))
    : 0;

  // ─── Handlers ───────────────────────────────────────────────────

  const handleSaveMedication = useCallback(async () => {
    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return;
    }
    if (!currentMedispanId) return;

    try {
      await saveMutation.mutateAsync({
        drugInformationMedispanId: currentMedispanId,
        currentBestPrice: lowestPrice > 0 ? lowestPrice : undefined,
      });
      showToast({ message: 'Medication saved!', type: 'success' });
    } catch {
      showToast({ message: 'Failed to save medication.', type: 'error' });
    }
  }, [isAuthenticated, currentMedispanId, lowestPrice, saveMutation, showToast]);

  const handleToggleFavorite = useCallback(() => {
    if (!drug) return;
    if (isFavorite(drug.slug)) {
      removeFavorite(drug.slug);
      setSnackMessage('Removed from favorites');
    } else {
      addFavorite({
        slug: drug.slug,
        name: drug.name,
        genericName: drug.genericName,
        type: drug.type,
      });
      setSnackMessage('Added to favorites');
    }
  }, [drug, isFavorite, addFavorite, removeFavorite]);

  const handleGetCoupon = useCallback((price: PharmacyPrice) => {
    if (!drug) return;
    setCouponData({
      drugName: drug.name,
      genericName: drug.genericName,
      form: selectedForm,
      dosage: selectedDosage,
      quantity: Number(selectedQuantity) || 0,
      pharmacyPrice: price,
    });
    setCouponVisible(true);
  }, [drug, selectedForm, selectedDosage, selectedQuantity]);

  // Auto-geocode ZIP when 5 digits entered or modal opens with valid ZIP
  useEffect(() => {
    console.log('[DrugPage] ZIP effect - zipInput:', zipInput, 'showZipModal:', showZipModal);
    if (!/^\d{5}$/.test(zipInput)) {
      setZipPreview(null);
      return;
    }
    let cancelled = false;
    setIsGeocodingPreview(true);
    console.log('[DrugPage] Starting lookupZipCode for:', zipInput);
    lookupZipCode(zipInput).then((result) => {
      console.log('[DrugPage] lookupZipCode result:', result, 'cancelled:', cancelled);
      if (cancelled) return;
      setIsGeocodingPreview(false);
      if (result) {
        setZipPreview({ city: result.city, state: result.stateCode });
      } else {
        setZipPreview(null);
      }
    }).catch((err) => {
      console.log('[DrugPage] lookupZipCode error:', err);
      if (!cancelled) {
        setIsGeocodingPreview(false);
        setZipPreview(null);
      }
    });
    return () => { cancelled = true; };
  }, [zipInput, showZipModal]);

  const handleFindMyLocation = useCallback(async () => {
    const result = await location.requestGps();
    if (result) {
      setShowZipModal(false);
    }
  }, [location]);

  const handleZipSubmit = useCallback(async () => {
    if (/^\d{5}$/.test(zipInput)) {
      await location.setZipManually(zipInput);
      setShowZipModal(false);
    }
  }, [zipInput, location]);

  // ─── Loading ────────────────────────────────────────────────────

  if (isLoadingDrug) {
    return (
      <ScreenWrapper scroll={false}>
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text variant="bodyMedium" style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            Loading drug information...
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (!drug) {
    return (
      <ScreenWrapper>
        <EmptyState
          icon="pill-off"
          title="Drug Not Found"
          message="We couldn't find information for this medication."
          actionLabel="Search Drugs"
          onAction={() => router.back()}
        />
      </ScreenWrapper>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────

  const favorited = isFavorite(drug.slug);
  const descriptionText = drugDescription?.description || pricesData?.drugDescription || drug.description;
  const locationLabel = location.city && location.stateCode
    ? `${location.zipCode} - ${location.city}, ${location.stateCode}`
    : `ZIP: ${location.zipCode}`;

  return (
    <ScreenWrapper
      scroll
      onRefresh={async () => { await refetchPrices(); }}
    >
      {/* ── Drug Header ─────────────────────────────────────────── */}
      <View style={styles.header}>
        {/* Row 1: Drug Name */}
        <Text variant="headlineMedium" style={[styles.drugName, { color: colors.onSurface }]}>
          {drug.name}
        </Text>

        {/* Row 2: Badge + Save button */}
        <View style={styles.badgeRow}>
          <View
            style={[
              styles.typeBadge,
              {
                backgroundColor:
                  drug.type === 'generic' ? brandColors.secondary : brandColors.accent,
              },
            ]}
          >
            <Text style={styles.typeBadgeText}>
              {drug.type === 'generic' ? 'Generic Available' : 'Brand'}
            </Text>
          </View>

          <Button
            mode="outlined"
            icon={isSaved ? 'heart' : 'heart-outline'}
            onPress={isSaved ? undefined : handleSaveMedication}
            style={styles.saveButton}
            labelStyle={styles.saveButtonLabel}
            compact
          >
            {isSaved ? 'Saved' : 'Save Medication'}
          </Button>
        </View>

        {/* Drug Description */}
        {descriptionText && (
          <Text
            variant="bodyMedium"
            style={[styles.description, { color: colors.onSurfaceVariant }]}
            numberOfLines={4}
          >
            {descriptionText}
          </Text>
        )}
      </View>

      {/* ── Prescription Settings ───────────────────────────────── */}
      <View style={styles.selectorContainer}>
        <PrescriptionSelector
          drug={drug}
          selectedBrand={selectedBrand}
          selectedForm={selectedForm}
          selectedDosage={selectedDosage}
          selectedQuantity={selectedQuantity}
          onBrandChange={setSelectedBrand}
          onFormChange={(form) => {
            setSelectedForm(form);
            const brand = drug.brandAlternatives?.find((b) => b.seoUrlName === selectedBrand);
            const dosages = brand?.formStrengthQuantities?.[form];
            if (dosages) {
              const firstDosage = Object.keys(dosages)[0];
              setSelectedDosage(firstDosage ?? '');
              const qtys = dosages[firstDosage];
              setSelectedQuantity(qtys?.[0]?.quantity ?? '30');
            }
          }}
          onDosageChange={(dosage) => {
            setSelectedDosage(dosage);
            const brand = drug.brandAlternatives?.find((b) => b.seoUrlName === selectedBrand);
            const qtys = brand?.formStrengthQuantities?.[selectedForm]?.[dosage];
            if (qtys?.length) {
              setSelectedQuantity(qtys[0].quantity);
            }
          }}
          onQuantityChange={setSelectedQuantity}
        />
      </View>

      {/* ── Prices Section ──────────────────────────────────────── */}
      <View style={styles.pricesSection}>
        <Text variant="titleMedium" style={[styles.sectionTitle, { color: colors.onSurface }]}>
          Prices
        </Text>
        <Divider style={{ marginBottom: spacing[1.5] }} />

        {/* Location Row */}
        <Pressable
          onPress={() => {
            setZipInput(location.zipCode);
            setShowZipModal(true);
          }}
          style={styles.locationRow}
          accessibilityRole="button"
          accessibilityLabel={`Location: ${locationLabel}. Tap to change.`}
        >
          <Icon source="map-marker" size={20} color={brandColors.primary} />
          <Text variant="bodyMedium" style={{ color: brandColors.primary, fontWeight: '600', marginLeft: 6 }}>
            {locationLabel}
          </Text>
          <Icon source="pencil" size={14} color={brandColors.primary} />
        </Pressable>

        {/* Sort Options */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sortRow}
          style={styles.sortContainer}
        >
          {SORT_OPTIONS.map((item) => (
            <Pressable
              key={item.value}
              onPress={() => setSortOption(item.value)}
              style={[
                styles.sortChip,
                {
                  backgroundColor:
                    sortOption === item.value ? colors.primary : colors.surfaceVariant,
                },
              ]}
            >
              <Text
                variant="bodySmall"
                style={{
                  color: sortOption === item.value ? '#FFFFFF' : colors.onSurfaceVariant,
                  fontWeight: sortOption === item.value ? '600' : '400',
                }}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Price List */}
        {isLoadingPrices ? (
          <View style={styles.loadingCenter}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, marginTop: spacing[1] }}>
              Finding best prices...
            </Text>
          </View>
        ) : sortedPrices.length === 0 ? (
          <EmptyState
            icon="store-off"
            title="No Prices Found"
            message="Try changing your ZIP code or prescription settings."
            actionLabel="Change Location"
            onAction={() => {
              setZipInput(location.zipCode);
              setShowZipModal(true);
            }}
          />
        ) : (
          <>
            {/* Lowest Price Banner */}
            {sortOption === 'price-asc' && sortedPrices.length > 0 && (
              <View style={[styles.lowestBanner, { backgroundColor: brandColors.secondary }]}>
                <Icon source="star" size={16} color="#FFFFFF" />
                <Text variant="labelMedium" style={{ color: '#FFFFFF', fontWeight: '700', marginLeft: 6 }}>
                  Lowest Price
                </Text>
              </View>
            )}

            {sortedPrices.map((price, index) => (
              <PharmacyPriceCard
                key={price.pharmacy.id + index}
                price={price}
                isFirst={index === 0 && sortOption === 'price-asc'}
                onGetCoupon={() => handleGetCoupon(price)}
              />
            ))}

            {/* Price Disclaimer */}
            <View style={styles.disclaimerRow}>
              <Icon source="information-outline" size={14} color={colors.onSurfaceVariant} />
              <Text variant="bodySmall" style={[styles.disclaimerText, { color: colors.onSurfaceVariant }]}>
                Prices are estimated cash prices and may vary by pharmacy. Show your coupon at the pharmacy to receive the discounted price. This is not insurance.
              </Text>
            </View>
          </>
        )}
      </View>

      {/* ── Similar Medications ─────────────────────────────────── */}
      {alternatives && alternatives.length > 0 && (
        <View style={styles.alternativesSection}>
          <Divider style={{ marginBottom: spacing[2] }} />
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: colors.onSurface }]}>
            Similar Medications
          </Text>
          <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, marginBottom: spacing[1.5] }}>
            These medications treat the same condition and may cost less. Always consult your doctor before switching.
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.alternativesScroll}
          >
            {alternatives.map((alt) => (
              <View key={alt.seoUrlName} style={styles.altCardWrapper}>
                <DrugAlternativeCard alternative={alt} />
              </View>
            ))}
          </ScrollView>
          <View style={styles.disclaimerRow}>
            <Icon source="information-outline" size={14} color={colors.onSurfaceVariant} />
            <Text variant="bodySmall" style={[styles.disclaimerText, { color: colors.onSurfaceVariant }]}>
              Alternatives are in the same therapeutic class. Always consult your doctor or pharmacist before switching medications.
            </Text>
          </View>
        </View>
      )}

      {/* ── Location Modal ──────────────────────────────────────── */}
      <Portal>
        <Modal
          visible={showZipModal}
          onDismiss={() => setShowZipModal(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: colors.surface }]}
        >
          <View style={styles.modalHeader}>
            <Text variant="titleMedium" style={{ color: colors.onSurface, fontWeight: '700' }}>
              Set Your Location
            </Text>
            <IconButton icon="close" size={20} onPress={() => setShowZipModal(false)} />
          </View>

          <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant, textAlign: 'center' }}>
            Get the best price from local pharmacies.
          </Text>

          {/* Find My Location Button */}
          <Button
            mode="contained"
            icon="crosshairs-gps"
            onPress={handleFindMyLocation}
            loading={location.isLoadingGps}
            style={[styles.gpsButton, { backgroundColor: brandColors.primary }]}
            contentStyle={styles.gpsButtonContent}
            labelStyle={{ fontWeight: '700' }}
          >
            Find my location
          </Button>

          {location.isLoadingGps && (
            <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, textAlign: 'center' }}>
              Note: your device will ask permission first
            </Text>
          )}

          {/* Divider with OR */}
          <View style={styles.orRow}>
            <View style={[styles.orLine, { backgroundColor: colors.outlineVariant }]} />
            <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, marginHorizontal: spacing[1.5] }}>
              OR
            </Text>
            <View style={[styles.orLine, { backgroundColor: colors.outlineVariant }]} />
          </View>

          {/* Geocoded ZIP preview */}
          {zipPreview && (
            <View style={[styles.zipPreviewRow, { backgroundColor: brandColors.primaryLight, borderColor: brandColors.primary }]}>
              <Icon source="check-circle" size={18} color={brandColors.primary} />
              <Text variant="bodyMedium" style={{ color: brandColors.primary, marginLeft: 6, fontWeight: '600' }}>
                {zipInput} - {zipPreview.city}, {zipPreview.state}
              </Text>
            </View>
          )}

          {/* Current saved location (shown when no preview) */}
          {!zipPreview && location.city && (
            <View style={styles.currentLocation}>
              <Icon source="map-marker" size={18} color={brandColors.primary} />
              <Text variant="bodyMedium" style={{ color: brandColors.primary, marginLeft: 6 }}>
                {location.zipCode} - {location.city}, {location.stateCode}
              </Text>
            </View>
          )}

          {/* ZIP Code Input */}
          <TextInput
            mode="outlined"
            placeholder="Enter ZIP code"
            value={zipInput}
            onChangeText={setZipInput}
            keyboardType="number-pad"
            maxLength={5}
            outlineColor={colors.outline}
            activeOutlineColor={brandColors.primary}
            style={styles.zipInput}
          />

          {isGeocodingPreview && (
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="small" color={brandColors.primary} />
              <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, marginLeft: 6 }}>
                Looking up ZIP code...
              </Text>
            </View>
          )}

          {location.error && (
            <Text variant="bodySmall" style={{ color: brandColors.error, textAlign: 'center' }}>
              {location.error}
            </Text>
          )}

          <View style={styles.modalButtons}>
            <Button mode="outlined" onPress={() => setShowZipModal(false)} style={{ flex: 1 }}>
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleZipSubmit}
              disabled={!/^\d{5}$/.test(zipInput)}
              style={{ flex: 1, backgroundColor: brandColors.primary }}
            >
              Set location
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* ── Coupon Modal ────────────────────────────────────────── */}
      <CouponModal
        visible={couponVisible}
        onDismiss={() => setCouponVisible(false)}
        couponData={couponData}
        onToast={(msg, type) => showToast({ message: msg, type })}
      />

      <Snackbar
        visible={!!snackMessage}
        onDismiss={() => setSnackMessage(null)}
        duration={2000}
      >
        {snackMessage ?? ''}
      </Snackbar>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[4],
    minHeight: 200,
  },
  loadingText: {
    marginTop: spacing[2],
  },

  // Header
  header: {
    marginBottom: spacing[1],
  },
  drugName: {
    fontWeight: '700',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing[1],
  },
  typeBadge: {
    paddingHorizontal: spacing[1.5],
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  typeBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  saveButton: {
    borderRadius: borderRadius.md,
  },
  saveButtonLabel: {
    fontSize: 12,
  },
  description: {
    marginTop: spacing[1.5],
    lineHeight: 22,
  },

  // Prescription Selector
  selectorContainer: {
    marginVertical: spacing[2],
  },

  // Prices
  pricesSection: {
    marginBottom: spacing[2],
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: spacing[1],
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[1.5],
    gap: 4,
  },
  sortContainer: {
    marginBottom: spacing[1.5],
  },
  sortRow: {
    gap: 8,
    paddingRight: spacing[2],
  },
  sortChip: {
    paddingHorizontal: spacing[1.5],
    paddingVertical: spacing[0.5],
    borderRadius: borderRadius.full,
  },
  lowestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    marginBottom: 0,
  },
  disclaimerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing[2],
    gap: 6,
  },
  disclaimerText: {
    flex: 1,
    lineHeight: 18,
  },

  // Alternatives
  alternativesSection: {
    marginTop: spacing[1],
    paddingBottom: spacing[4],
  },
  alternativesScroll: {
    gap: spacing[1],
    paddingRight: spacing[2],
  },
  altCardWrapper: {
    width: (SCREEN_WIDTH - 32) / 2,
  },

  // Location Modal
  modal: {
    margin: spacing[3],
    padding: spacing[3],
    borderRadius: borderRadius.xl,
    gap: spacing[2],
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gpsButton: {
    borderRadius: borderRadius.full,
  },
  gpsButtonContent: {
    paddingVertical: 6,
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orLine: {
    flex: 1,
    height: 1,
  },
  zipPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[2],
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  currentLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zipInput: {
    backgroundColor: 'transparent',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing[1.5],
    marginTop: spacing[1],
  },
});
