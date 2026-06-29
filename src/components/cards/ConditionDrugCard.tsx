/**
 * ConditionDrugCard - Matches web condition drug card design
 * Shows: drug name, generic name, price, savings badge, form, "Compare Prices" link
 */

import { View, StyleSheet, Pressable } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { router } from 'expo-router';
import { spacing, borderRadius } from '@/theme';
import type { ConditionDrug } from '@/types/condition';

interface ConditionDrugCardProps {
  drug: ConditionDrug;
}

export function ConditionDrugCard({ drug }: ConditionDrugCardProps) {
  const slug = drug.seoUrlName || drug.seoName || drug.drugName?.toLowerCase().replace(/\s+/g, '-');
  // seoName has proper casing (e.g. "Doxycycline Monohydrate"), drugName is lowercase
  const displayName = drug.seoName || drug.drugName || '';

  return (
    <Pressable
      onPress={() => router.push(`/drugs/${slug}`)}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
      accessibilityRole="button"
      accessibilityLabel={displayName}
    >
      {/* Header: Name */}
      <View style={styles.header}>
        <Text style={styles.drugName} numberOfLines={2}>
          {displayName}
        </Text>
      </View>

      {/* Drug form badge */}
      {drug.form ? (
        <View style={styles.formBadgeRow}>
          <View style={styles.genericBadge}>
            <Text style={styles.genericBadgeText}>{drug.form}</Text>
          </View>
        </View>
      ) : null}

      {/* Description */}
      {drug.descriptions ? (
        <Text style={styles.description} numberOfLines={2}>
          {drug.descriptions}
        </Text>
      ) : null}

      {/* Footer: Compare Prices */}
      <View style={styles.footer}>
        <View style={styles.compareRow}>
          <Text style={styles.compareText}>Compare Prices</Text>
          <Icon source="arrow-right" size={14} color="#0D7377" />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  drugName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
    flex: 1,
  },
  formBadgeRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  genericBadge: {
    backgroundColor: '#E6F7F4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  genericBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0D7377',
  },
  description: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  compareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compareText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0D7377',
  },
});
