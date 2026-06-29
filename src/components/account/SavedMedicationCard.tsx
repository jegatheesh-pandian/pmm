/**
 * SavedMedicationCard - Saved medication card for dashboard/medications list
 * Shows drug name, form/dosage/qty, pharmacy, pricing, alerts status
 */

import { useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, Surface, Icon, Chip } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useLocation } from '@/hooks/useLocation';
import { drugApi } from '@/services/api/drugApi';
import { queryKeys } from '@/services/api/queryKeys';
import { formatPrice } from '@/utils/formatting';
import { spacing, borderRadius, fontSize } from '@/theme';
import type { SavedMedicationResponse } from '@/types/medication';

interface SavedMedicationCardProps {
  medication: SavedMedicationResponse;
  /** Compact mode for dashboard grid */
  compact?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function SavedMedicationCard({
  medication,
  compact,
  onEdit,
  onDelete,
}: SavedMedicationCardProps) {
  const { colors, brandColors } = useAppTheme();
  const slug = medication.seoUrlName || medication.drugName.toLowerCase().replace(/\s+/g, '-');
  const { zipCode, latitude, longitude } = useLocation();

  // Fall back to a live price lookup when the saved medication has no stored price
  const needsLivePrice = medication.currentBestPrice == null;
  const canFetchPrice = !!(
    medication.drugName &&
    medication.form &&
    medication.dosage &&
    medication.quantity &&
    zipCode
  );

  const { data: livePrices } = useQuery({
    queryKey: queryKeys.drugs.prices(medication.drugName, {
      form: medication.form,
      dosage: medication.dosage,
      quantity: medication.quantity,
      zipCode,
    }),
    queryFn: () =>
      drugApi.getDrugPrices({
        name: medication.drugName,
        form: medication.form,
        dosage: medication.dosage,
        quantity: medication.quantity,
        zipCode,
        latitude,
        longitude,
      }),
    enabled: needsLivePrice && canFetchPrice,
    staleTime: 2 * 60_000,
  });

  const lowestLive = useMemo(() => {
    const prices = livePrices?.prices ?? [];
    if (prices.length === 0) return null;
    return prices.reduce((lo, c) => (c.discountPrice < lo.discountPrice ? c : lo));
  }, [livePrices]);

  const displayPrice = medication.currentBestPrice ?? lowestLive?.discountPrice ?? null;

  const handlePress = () => {
    router.push(`/drugs/${slug}`);
  };

  if (compact) {
    return (
      <Pressable onPress={handlePress} accessibilityRole="button">
        <Surface style={[styles.compactCard, { backgroundColor: colors.surface }]} elevation={1}>
          <View style={[styles.avatar, { backgroundColor: brandColors.primaryLight }]}>
            <Text style={[styles.avatarText, { color: brandColors.primary }]}>
              {medication.drugName.slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <View style={styles.compactInfo}>
            <Text variant="titleSmall" style={{ color: colors.onSurface }} numberOfLines={1}>
              {medication.drugName}
            </Text>
            <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
              {medication.form} {medication.dosage}
            </Text>
          </View>
          {displayPrice != null && (
            <Text style={[styles.compactPrice, { color: brandColors.secondary }]}>
              {formatPrice(displayPrice)}
            </Text>
          )}
        </Surface>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={handlePress} accessibilityRole="button">
      <Surface style={[styles.card, { backgroundColor: colors.surface }]} elevation={1}>
        <View style={styles.row}>
          <View style={[styles.avatarLarge, { backgroundColor: brandColors.primaryLight }]}>
            <Text style={[styles.avatarTextLarge, { color: brandColors.primary }]}>
              {medication.drugName.slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <View style={styles.info}>
            <View style={styles.nameRow}>
              <Text
                variant="titleSmall"
                style={[styles.drugName, { color: colors.onSurface }]}
                numberOfLines={1}
              >
                {medication.drugName}
              </Text>
              <View
                style={[
                  styles.typeBadge,
                  {
                    backgroundColor:
                      medication.brandGeneric === 'Generic' ? brandColors.secondaryLight : '#FEF3C7',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.typeBadgeText,
                    { color: medication.brandGeneric === 'Generic' ? brandColors.secondary : '#B45309' },
                  ]}
                >
                  {medication.brandGeneric}
                </Text>
              </View>
            </View>
            {medication.genericName && (
              <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }} numberOfLines={1}>
                {medication.genericName}
              </Text>
            )}
            <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
              {medication.form} {medication.dosage} | Qty: {medication.quantity}
            </Text>
            {medication.preferredPharmacyName && (
              <Text variant="bodySmall" style={{ color: colors.primary }} numberOfLines={1}>
                {medication.preferredPharmacyName}
              </Text>
            )}
          </View>
          <View style={styles.priceCol}>
            {displayPrice != null && (
              <Text style={[styles.price, { color: brandColors.secondary }]}>
                {formatPrice(displayPrice)}
              </Text>
            )}
          </View>
        </View>

        {/* Status Tags */}
        {(medication.priceAlertEnabled || medication.refillReminderEnabled) && (
          <View style={styles.tagRow}>
            {medication.priceAlertEnabled && (
              <Chip
                compact
                icon="bell"
                textStyle={{ fontSize: 10, color: brandColors.primary }}
                style={[styles.tag, { backgroundColor: brandColors.primaryLight }]}
              >
                Alert On
              </Chip>
            )}
            {medication.refillReminderEnabled && (
              <Chip
                compact
                icon="clock-outline"
                textStyle={{ fontSize: 10, color: '#7C3AED' }}
                style={[styles.tag, { backgroundColor: '#EDE9FE' }]}
              >
                Refill Reminder
              </Chip>
            )}
          </View>
        )}

        {/* Actions */}
        {(onEdit || onDelete) && (
          <View style={styles.actionRow}>
            {onEdit && (
              <Pressable onPress={onEdit} hitSlop={8}>
                <Icon source="pencil" size={18} color={colors.primary} />
              </Pressable>
            )}
            {onDelete && (
              <Pressable onPress={onDelete} hitSlop={8}>
                <Icon source="delete-outline" size={18} color={colors.error} />
              </Pressable>
            )}
          </View>
        )}
      </Surface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing[2],
    marginBottom: spacing[1],
  },
  compactCard: {
    borderRadius: borderRadius.lg,
    padding: spacing[1.5],
    marginBottom: spacing[1],
    flexDirection: 'row',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[1],
  },
  avatarText: {
    fontSize: 11,
    fontWeight: '700',
  },
  avatarLarge: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[1.5],
  },
  avatarTextLarge: {
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  compactInfo: {
    flex: 1,
    gap: 2,
  },
  compactPrice: {
    fontSize: fontSize.base,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    marginRight: spacing[1],
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  drugName: {
    flexShrink: 1,
    fontWeight: '700',
  },
  typeBadge: {
    paddingHorizontal: spacing[1],
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  priceCol: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: fontSize.lg,
    fontWeight: '800',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing[1],
    marginTop: spacing[1.5],
  },
  tag: {
    alignSelf: 'flex-start',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing[2],
    marginTop: spacing[1],
    paddingTop: spacing[1],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
});
