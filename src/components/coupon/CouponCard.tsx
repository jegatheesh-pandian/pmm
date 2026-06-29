/**
 * CouponCard - Full coupon display card
 * Matches PriceMyMeds.com coupon modal:
 * - PriceMyMeds header + "THIS IS NOT INSURANCE" badge
 * - Drug info (avatar, name, form, dosage, qty)
 * - Member ID row
 * - BIN | PCN | GROUP codes
 * - Pharmacy info (logo, name, address, phone)
 * - YOUR PRICE with savings breakdown
 * - Disclaimer footer
 */

import { View, StyleSheet, Image } from 'react-native';
import { Text, Surface, Divider, Icon } from 'react-native-paper';
import { useAppTheme } from '@/hooks/useAppTheme';
import { PHARMACY_BRANDS } from '@/constants/pharmacy';
import { formatPrice, formatSavingsPercent, formatPhone } from '@/utils/formatting';
import { spacing, borderRadius, fontSize } from '@/theme';
import type { SavedCoupon } from '@/store/couponStore';

interface CouponCardProps {
  coupon: SavedCoupon;
  compact?: boolean;
}

export function CouponCard({ coupon, compact }: CouponCardProps) {
  const { colors, brandColors } = useAppTheme();
  const brand = PHARMACY_BRANDS[coupon.pharmacyChain as keyof typeof PHARMACY_BRANDS]
    ?? PHARMACY_BRANDS.independent;

  if (compact) {
    return (
      <Surface style={[styles.compactCard, { backgroundColor: colors.surface }]} elevation={1}>
        <View style={styles.compactRow}>
          <View style={[styles.compactAvatar, { backgroundColor: brandColors.primaryLight }]}>
            <Text style={[styles.compactAvatarText, { color: brandColors.primary }]}>
              {coupon.drugName.slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <View style={styles.compactInfo}>
            <Text variant="titleSmall" style={{ color: colors.onSurface }} numberOfLines={1}>
              {coupon.drugName}
            </Text>
            <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
              {coupon.form} {coupon.dosage} - Qty: {coupon.quantity}
            </Text>
            <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
              {coupon.pharmacyName}
            </Text>
          </View>
          <View style={styles.compactPrice}>
            <Text style={[styles.priceValue, { color: brandColors.secondary }]}>
              {formatPrice(coupon.discountPrice)}
            </Text>
            {coupon.savingsPercent > 0 && (
              <Text style={[styles.savingsSmall, { color: brandColors.secondary }]}>
                Save {formatSavingsPercent(coupon.savingsPercent)}
              </Text>
            )}
          </View>
        </View>
      </Surface>
    );
  }

  return (
    <Surface style={[styles.card, { backgroundColor: colors.surface, borderColor: brandColors.primary }]} elevation={2}>
      {/* Header - PriceMyMeds branding */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Image
          source={require('@/assets/images/logo.png')}
          style={styles.brandLogo}
          resizeMode="contain"
        />
        <View style={styles.notInsuranceBadge}>
          <Icon source="alert-outline" size={12} color={brandColors.accent} />
          <Text variant="labelSmall" style={{ color: brandColors.accent, marginLeft: 4, fontWeight: '600' }}>
            THIS IS NOT INSURANCE
          </Text>
        </View>
      </View>

      <Divider />

      {/* Drug Info */}
      <View style={[styles.drugSection, { backgroundColor: colors.surfaceVariant }]}>
        <View style={[styles.drugAvatar, { backgroundColor: brandColors.primary }]}>
          <Text style={styles.drugAvatarText}>
            {coupon.drugName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.drugInfo}>
          <Text variant="titleMedium" style={{ color: colors.onSurface, fontWeight: '700' }}>
            {coupon.drugName}
          </Text>
          <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
            {coupon.form} {coupon.dosage}    Qty: {coupon.quantity}
          </Text>
        </View>
      </View>

      {/* Member ID */}
      <View style={styles.memberSection}>
        <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
          Member ID
        </Text>
        <Text style={[styles.memberIdText, { color: colors.onSurface }]}>
          {coupon.memberId}
        </Text>
      </View>

      <Divider />

      {/* Coupon Codes: BIN | PCN | GROUP */}
      <View style={[styles.codesSection, { backgroundColor: brandColors.primaryLight }]}>
        <View style={styles.codeItem}>
          <Text variant="labelSmall" style={{ color: colors.onSurfaceVariant }}>BIN</Text>
          <Text style={[styles.codeValue, { color: colors.onSurface }]}>{coupon.bin}</Text>
        </View>
        <View style={[styles.codeDivider, { backgroundColor: colors.outlineVariant }]} />
        <View style={styles.codeItem}>
          <Text variant="labelSmall" style={{ color: colors.onSurfaceVariant }}>PCN</Text>
          <Text style={[styles.codeValue, { color: colors.onSurface }]}>{coupon.pcn}</Text>
        </View>
        <View style={[styles.codeDivider, { backgroundColor: colors.outlineVariant }]} />
        <View style={styles.codeItem}>
          <Text variant="labelSmall" style={{ color: colors.onSurfaceVariant }}>GROUP</Text>
          <Text style={[styles.codeValue, { color: colors.onSurface }]}>{coupon.group}</Text>
        </View>
      </View>

      <Divider />

      {/* Pharmacy Info */}
      <View style={styles.pharmacySection}>
        <View style={[styles.pharmacyLogo, { backgroundColor: brand.color + '15' }]}>
          <Text style={[styles.pharmacyLogoText, { color: brand.color }]}>{brand.initial}</Text>
        </View>
        <View style={styles.pharmacyInfo}>
          <Text variant="titleSmall" style={{ color: colors.onSurface, fontWeight: '700' }}>
            {coupon.pharmacyName}
          </Text>
          <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
            {coupon.pharmacyAddress}
          </Text>
          {coupon.pharmacyPhone && (
            <View style={styles.phoneRow}>
              <Icon source="phone" size={12} color={colors.primary} />
              <Text variant="bodySmall" style={{ color: colors.primary, marginLeft: 4 }}>
                {formatPhone(coupon.pharmacyPhone)}
              </Text>
            </View>
          )}
        </View>
      </View>

      <Divider />

      {/* YOUR PRICE */}
      <View style={[styles.pricingSection, { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }]}>
        <Text variant="labelMedium" style={{ color: '#065f46' }}>YOUR PRICE</Text>
        <View style={styles.priceRow}>
          <Text style={[styles.priceMain, { color: '#065f46' }]}>
            {formatPrice(coupon.discountPrice)}
          </Text>
          {coupon.savingsAmount > 0 && (
            <Text variant="bodyMedium" style={{ color: '#065f46' }}>
              You Save: <Text style={{ fontWeight: '700' }}>{formatPrice(coupon.savingsAmount)} ({formatSavingsPercent(coupon.savingsPercent)})</Text>
            </Text>
          )}
        </View>
      </View>

      {/* Footer Disclaimer */}
      <View style={styles.footer}>
        <Text variant="labelSmall" style={{ color: colors.onSurfaceVariant, textAlign: 'center', lineHeight: 16 }}>
          Present this coupon to the pharmacist at pickup. Prices may vary. Coupon valid at participating pharmacies only.
        </Text>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1.5],
  },
  brandLogo: {
    height: 28,
    width: 140,
  },
  notInsuranceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  drugSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[2],
  },
  drugAvatar: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[1.5],
  },
  drugAvatarText: {
    color: '#FFFFFF',
    fontSize: fontSize.lg,
    fontWeight: '800',
  },
  drugInfo: {
    flex: 1,
    gap: 2,
  },
  memberSection: {
    alignItems: 'center',
    paddingVertical: spacing[1.5],
    paddingHorizontal: spacing[2],
  },
  memberIdText: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  codesSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[1.5],
    paddingHorizontal: spacing[2],
  },
  codeItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  codeValue: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  codeDivider: {
    width: 1,
    height: 32,
  },
  pharmacySection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[2],
  },
  pharmacyLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[1.5],
  },
  pharmacyLogoText: {
    fontSize: fontSize.base,
    fontWeight: '800',
  },
  pharmacyInfo: {
    flex: 1,
    gap: 2,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  pricingSection: {
    padding: spacing[2],
    borderWidth: 1,
    margin: spacing[2],
    borderRadius: borderRadius.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 4,
  },
  priceMain: {
    fontSize: 32,
    fontWeight: '800',
  },
  footer: {
    paddingHorizontal: spacing[2],
    paddingBottom: spacing[2],
  },

  // Compact styles
  compactCard: {
    borderRadius: borderRadius.lg,
    padding: spacing[2],
    marginBottom: spacing[1],
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactAvatar: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[1.5],
  },
  compactAvatarText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  compactInfo: {
    flex: 1,
    gap: 2,
  },
  compactPrice: {
    alignItems: 'flex-end',
  },
  priceValue: {
    fontSize: fontSize.lg,
    fontWeight: '800',
  },
  savingsSmall: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
});
