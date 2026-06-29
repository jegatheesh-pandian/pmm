/**
 * PharmacyFilters - Filter sheet for pharmacy search
 * Distance radius, chain filter, feature toggles (24hr, drive-thru, delivery)
 */

import { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text, Button, Chip, Switch, Portal, Modal, IconButton } from 'react-native-paper';
import { useAppTheme } from '@/hooks/useAppTheme';
import { PHARMACY_BRANDS } from '@/constants/pharmacy';
import { usePharmacyStore } from '@/store/pharmacyStore';
import { spacing, borderRadius, fontSize } from '@/theme';
import type { PharmacyPriceFilters, PharmacyChain } from '@/types/pharmacy';

const DISTANCE_OPTIONS = [5, 10, 25, 50, 100];

const CHAIN_OPTIONS: { key: PharmacyChain; label: string }[] = [
  { key: 'cvs', label: 'CVS' },
  { key: 'walgreens', label: 'Walgreens' },
  { key: 'walmart', label: 'Walmart' },
  { key: 'kroger', label: 'Kroger' },
  { key: 'riteaid', label: 'Rite Aid' },
  { key: 'costco', label: 'Costco' },
  { key: 'target', label: 'Target' },
  { key: 'publix', label: 'Publix' },
  { key: 'samsclub', label: "Sam's Club" },
  { key: 'albertsons', label: 'Albertsons' },
  { key: 'safeway', label: 'Safeway' },
];

interface PharmacyFiltersProps {
  visible: boolean;
  onDismiss: () => void;
  onApply: (filters: PharmacyPriceFilters) => void;
}

export function PharmacyFilters({ visible, onDismiss, onApply }: PharmacyFiltersProps) {
  const { colors, brandColors } = useAppTheme();
  const storeFilters = usePharmacyStore((s) => s.filters);

  // Local draft state
  const [maxDistance, setMaxDistance] = useState(storeFilters.maxDistance ?? 25);
  const [selectedChains, setSelectedChains] = useState<PharmacyChain[]>(
    storeFilters.chains ?? [],
  );
  const [is24Hours, setIs24Hours] = useState(storeFilters.features?.is24Hours ?? false);
  const [hasDriveThrough, setHasDriveThrough] = useState(
    storeFilters.features?.hasDriveThrough ?? false,
  );
  const [hasHomeDelivery, setHasHomeDelivery] = useState(
    storeFilters.features?.hasHomeDelivery ?? false,
  );

  const toggleChain = useCallback((chain: PharmacyChain) => {
    setSelectedChains((prev) =>
      prev.includes(chain) ? prev.filter((c) => c !== chain) : [...prev, chain],
    );
  }, []);

  const handleReset = useCallback(() => {
    setMaxDistance(25);
    setSelectedChains([]);
    setIs24Hours(false);
    setHasDriveThrough(false);
    setHasHomeDelivery(false);
  }, []);

  const handleApply = useCallback(() => {
    const filters: PharmacyPriceFilters = {
      maxDistance,
      chains: selectedChains.length > 0 ? selectedChains : undefined,
      features: {
        is24Hours: is24Hours || undefined,
        hasDriveThrough: hasDriveThrough || undefined,
        hasHomeDelivery: hasHomeDelivery || undefined,
      },
    };

    // Clean up empty features
    if (!filters.features?.is24Hours && !filters.features?.hasDriveThrough && !filters.features?.hasHomeDelivery) {
      delete filters.features;
    }

    onApply(filters);
    onDismiss();
  }, [maxDistance, selectedChains, is24Hours, hasDriveThrough, hasHomeDelivery, onApply, onDismiss]);

  const activeFilterCount =
    (maxDistance !== 25 ? 1 : 0) +
    selectedChains.length +
    (is24Hours ? 1 : 0) +
    (hasDriveThrough ? 1 : 0) +
    (hasHomeDelivery ? 1 : 0);

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[styles.modal, { backgroundColor: colors.surface }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text variant="titleMedium" style={{ color: colors.onSurface, fontWeight: '700' }}>
            Filter Pharmacies
          </Text>
          <IconButton icon="close" size={20} onPress={onDismiss} />
        </View>

        <ScrollView
          style={styles.scrollBody}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Distance */}
          <View style={styles.section}>
            <Text variant="titleSmall" style={[styles.sectionTitle, { color: colors.onSurface }]}>
              Maximum Distance
            </Text>
            <View style={styles.chipRow}>
              {DISTANCE_OPTIONS.map((d) => (
                <Chip
                  key={d}
                  selected={maxDistance === d}
                  onPress={() => setMaxDistance(d)}
                  style={maxDistance === d ? { backgroundColor: brandColors.primaryLight } : undefined}
                  textStyle={{ color: maxDistance === d ? brandColors.primary : colors.onSurface }}
                  showSelectedCheck={false}
                  compact
                >
                  {d} mi
                </Chip>
              ))}
            </View>
          </View>

          {/* Pharmacy Chains */}
          <View style={styles.section}>
            <Text variant="titleSmall" style={[styles.sectionTitle, { color: colors.onSurface }]}>
              Pharmacy Chain
            </Text>
            <View style={styles.chipRow}>
              {CHAIN_OPTIONS.map((c) => {
                const isSelected = selectedChains.includes(c.key);
                const brand = PHARMACY_BRANDS[c.key];
                return (
                  <Chip
                    key={c.key}
                    selected={isSelected}
                    onPress={() => toggleChain(c.key)}
                    style={isSelected ? { backgroundColor: brand.color + '20' } : undefined}
                    textStyle={{ color: isSelected ? brand.color : colors.onSurface }}
                    showSelectedCheck={false}
                    compact
                  >
                    {c.label}
                  </Chip>
                );
              })}
            </View>
          </View>

          {/* Features */}
          <View style={styles.section}>
            <Text variant="titleSmall" style={[styles.sectionTitle, { color: colors.onSurface }]}>
              Features
            </Text>
            <View style={styles.switchRow}>
              <Text variant="bodyMedium" style={{ color: colors.onSurface, flex: 1 }}>
                Open 24 Hours
              </Text>
              <Switch value={is24Hours} onValueChange={setIs24Hours} color={brandColors.primary} />
            </View>
            <View style={styles.switchRow}>
              <Text variant="bodyMedium" style={{ color: colors.onSurface, flex: 1 }}>
                Drive-Through
              </Text>
              <Switch value={hasDriveThrough} onValueChange={setHasDriveThrough} color={brandColors.primary} />
            </View>
            <View style={styles.switchRow}>
              <Text variant="bodyMedium" style={{ color: colors.onSurface, flex: 1 }}>
                Home Delivery
              </Text>
              <Switch value={hasHomeDelivery} onValueChange={setHasHomeDelivery} color={brandColors.primary} />
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Button
            mode="outlined"
            onPress={handleReset}
            style={styles.footerButton}
            disabled={activeFilterCount === 0}
          >
            Reset
          </Button>
          <Button mode="contained" onPress={handleApply} style={styles.footerButton}>
            Apply{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: spacing[2],
    borderRadius: borderRadius.lg,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: spacing[2],
    paddingRight: spacing[1],
    paddingTop: spacing[1],
  },
  scrollBody: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: spacing[2],
    paddingBottom: spacing[2],
  },
  section: {
    marginTop: spacing[2],
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: spacing[1],
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[1],
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[1],
  },
  footer: {
    flexDirection: 'row',
    gap: spacing[1.5],
    padding: spacing[2],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  footerButton: {
    flex: 1,
  },
});
