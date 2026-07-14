/**
 * PrescriptionSelector - Brand, Form, Dosage, Quantity picker
 * Matches PriceMyMeds.com "Prescription Settings" panel:
 * - Select Brand (Generic/Brand alternatives)
 * - Select Form (Capsule, Tablet, Liquid, etc.)
 * - Select Dosage (250MG, 500MG, etc.)
 * - Select Quantity (30 count, 60 count, Custom...)
 * Reactive: dosages update when form changes, quantities update when dosage changes
 */

import { useState, useMemo } from 'react';
import { View, StyleSheet, TextInput as RNTextInput } from 'react-native';
import { Text, Button, Portal, Modal } from 'react-native-paper';
import { SelectDropdown } from '@/components/ui/SelectDropdown';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing, borderRadius, fontSize } from '@/theme';
import type { Drug } from '@/types/drug';

interface PrescriptionSelectorProps {
  drug: Drug;
  selectedBrand: string;
  selectedForm: string;
  selectedDosage: string;
  selectedQuantity: string;
  onBrandChange: (brand: string) => void;
  onFormChange: (form: string) => void;
  onDosageChange: (dosage: string) => void;
  onQuantityChange: (quantity: string) => void;
}

export function PrescriptionSelector({
  drug,
  selectedBrand,
  selectedForm,
  selectedDosage,
  selectedQuantity,
  onBrandChange,
  onFormChange,
  onDosageChange,
  onQuantityChange,
}: PrescriptionSelectorProps) {
  const { colors, brandColors } = useAppTheme();
  const [showCustomQty, setShowCustomQty] = useState(false);
  const [customQty, setCustomQty] = useState('');

  // Find the active brand alternative (use seoName like web app)
  const activeBrand = useMemo(() => {
    if (!selectedBrand || !drug.brandAlternatives?.length) return null;
    return drug.brandAlternatives.find((b) => b.seoName === selectedBrand) ?? null;
  }, [drug.brandAlternatives, selectedBrand]);

  // Available forms from brand alternative or drug
  const availableForms = useMemo(() => {
    if (activeBrand?.formStrengthQuantities) {
      return Object.keys(activeBrand.formStrengthQuantities);
    }
    return drug.forms as string[];
  }, [activeBrand, drug.forms]);

  // Available dosages based on selected form
  const availableDosages = useMemo(() => {
    if (activeBrand?.formStrengthQuantities?.[selectedForm]) {
      return Object.keys(activeBrand.formStrengthQuantities[selectedForm]);
    }
    return drug.dosages;
  }, [activeBrand, drug.dosages, selectedForm]);

  // Available quantities based on selected form + dosage
  const availableQuantities = useMemo(() => {
    if (activeBrand?.formStrengthQuantities?.[selectedForm]?.[selectedDosage]) {
      return activeBrand.formStrengthQuantities[selectedForm][selectedDosage].map(
        (q) => q.quantity,
      );
    }
    return drug.quantities.map(String);
  }, [activeBrand, drug.quantities, selectedForm, selectedDosage]);

  // Brand options (use seoName as value like web app)
  const brandOptions = useMemo(() => {
    if (!drug.brandAlternatives?.length) return [];
    return drug.brandAlternatives.map((b) => ({
      value: b.seoName,
      label: b.displayName,
    }));
  }, [drug.brandAlternatives]);

  const handleCustomQtySubmit = () => {
    const num = parseInt(customQty, 10);
    if (num > 0) {
      onQuantityChange(String(num));
    }
    setShowCustomQty(false);
    setCustomQty('');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
      <Text variant="titleSmall" style={[styles.title, { color: colors.onSurface }]}>
        Prescription Settings
      </Text>

      <View style={styles.grid}>
        {/* Select Brand */}
        {brandOptions.length > 1 && (
          <View style={styles.field}>
            <Text variant="labelSmall" style={[styles.label, { color: colors.onSurfaceVariant }]}>
              Select Brand
            </Text>
            <SelectDropdown
              value={selectedBrand}
              options={brandOptions}
              onValueChange={onBrandChange}
              accessibilityLabel="Select brand or generic"
            />
          </View>
        )}

        {/* Select Form */}
        <View style={styles.field}>
          <Text variant="labelSmall" style={[styles.label, { color: colors.onSurfaceVariant }]}>
            Select Form
          </Text>
          <SelectDropdown
            value={selectedForm}
            options={availableForms.map((form) => ({ label: form, value: form }))}
            onValueChange={onFormChange}
            accessibilityLabel="Select drug form"
          />
        </View>

        {/* Select Dosage */}
        <View style={styles.field}>
          <Text variant="labelSmall" style={[styles.label, { color: colors.onSurfaceVariant }]}>
            Select Dosage
          </Text>
          <SelectDropdown
            value={selectedDosage}
            options={availableDosages.map((dosage) => ({ label: dosage, value: dosage }))}
            onValueChange={onDosageChange}
            accessibilityLabel="Select dosage"
          />
        </View>

        {/* Select Quantity */}
        <View style={styles.field}>
          <Text variant="labelSmall" style={[styles.label, { color: colors.onSurfaceVariant }]}>
            Select Quantity
          </Text>
          <SelectDropdown
            value={availableQuantities.includes(selectedQuantity) ? selectedQuantity : 'custom'}
            options={[
              ...availableQuantities.map((qty) => ({ label: `${qty} count`, value: qty })),
              { label: 'Custom...', value: 'custom' },
            ]}
            onValueChange={(val) => {
              if (val === 'custom') {
                setShowCustomQty(true);
              } else {
                onQuantityChange(val);
              }
            }}
            accessibilityLabel="Select quantity"
          />
        </View>
      </View>

      {/* Custom Quantity Modal */}
      <Portal>
        <Modal
          visible={showCustomQty}
          onDismiss={() => setShowCustomQty(false)}
          contentContainerStyle={[styles.customModal, { backgroundColor: colors.surface }]}
        >
          <Text variant="titleSmall" style={{ color: colors.onSurface, fontWeight: '700' }}>
            Enter custom quantity
          </Text>
          <View style={styles.customRow}>
            <RNTextInput
              value={customQty}
              onChangeText={setCustomQty}
              keyboardType="number-pad"
              placeholder="Enter quantity"
              placeholderTextColor={colors.onSurfaceVariant}
              style={[styles.customInput, { color: colors.onSurface, borderColor: colors.outlineVariant }]}
              maxLength={4}
            />
            <Button
              mode="contained"
              onPress={handleCustomQtySubmit}
              disabled={!customQty || parseInt(customQty, 10) <= 0}
              style={{ backgroundColor: brandColors.primary }}
            >
              Set
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing[2],
  },
  title: {
    fontWeight: '700',
    marginBottom: spacing[1.5],
  },
  grid: {
    gap: spacing[1.5],
  },
  field: {
    gap: 4,
  },
  label: {
    fontWeight: '600',
    textTransform: 'none',
  },
  customModal: {
    margin: spacing[4],
    padding: spacing[3],
    borderRadius: borderRadius.xl,
    gap: spacing[2],
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
  },
  customInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[1.5],
    fontSize: fontSize.base,
  },
});
