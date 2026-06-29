/**
 * PharmacyPriceCard - Pharmacy price comparison card
 * Matches PriceMyMeds.com layout:
 * [Logo] [Name / Address / Distance]   [$Price / "with coupon" / Save %]  [Get Free Coupon]
 * First card (isFirst) gets highlighted border for "Lowest Price"
 */

import { View, StyleSheet, Image } from 'react-native';
import { Text, Surface, Button, Icon } from 'react-native-paper';
import { useAppTheme } from '@/hooks/useAppTheme';
import { PHARMACY_BRANDS, getPharmacyLogo, getPharmacyInitials } from '@/constants/pharmacy';
import { formatPrice, formatSavingsPercent } from '@/utils/formatting';
import { spacing, borderRadius, fontSize } from '@/theme';
import type { PharmacyPrice } from '@/types/pharmacy';

interface PharmacyPriceCardProps {
  price: PharmacyPrice;
  isFirst?: boolean;
  onGetCoupon: () => void;
}

export function PharmacyPriceCard({ price, isFirst, onGetCoupon }: PharmacyPriceCardProps) {
  const { colors, brandColors } = useAppTheme();
  const brand = PHARMACY_BRANDS[price.pharmacy.chain] ?? PHARMACY_BRANDS.independent;
  const logo = getPharmacyLogo(price.pharmacy.chain, price.pharmacy.name);
  const distance = price.pharmacy.distance;

  return (
    <Surface
      style={[
        styles.card,
        { backgroundColor: colors.surface },
        isFirst && { borderColor: brandColors.secondary, borderWidth: 2 },
      ]}
      elevation={1}
    >
      <View style={styles.row}>
        {/* Pharmacy Logo */}
        {logo ? (
          <View style={[styles.logo, styles.logoImageWrap]}>
            <Image source={logo} style={styles.logoImage} resizeMode="contain" />
          </View>
        ) : (
          <View style={[styles.logo, { backgroundColor: brand.color + '15' }]}>
            <Text style={[styles.logoText, { color: brand.color }]}>
              {getPharmacyInitials(price.pharmacy.name)}
            </Text>
          </View>
        )}

        {/* Pharmacy Info */}
        <View style={styles.pharmacyInfo}>
          <Text variant="titleSmall" style={{ color: colors.onSurface, fontWeight: '700' }} numberOfLines={1}>
            {price.pharmacy.name}
          </Text>
          <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }} numberOfLines={1}>
            {price.pharmacy.address.street}, {price.pharmacy.address.city}, {price.pharmacy.address.state}
          </Text>
          {distance > 0 && (
            <View style={styles.distanceRow}>
              <Icon source="map-marker-outline" size={12} color={colors.onSurfaceVariant} />
              <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, marginLeft: 2 }}>
                {distance.toFixed(1)} miles away
              </Text>
            </View>
          )}
        </View>

        {/* Price + Coupon Button */}
        <View style={styles.priceColumn}>
          <Text style={[styles.discountPrice, { color: colors.onSurface }]}>
            {formatPrice(price.discountPrice)}
          </Text>
          <Text variant="labelSmall" style={{ color: colors.onSurfaceVariant }}>
            with coupon
          </Text>
          {price.savingsPercent > 0 && (
            <View style={[styles.savingsBadge, { backgroundColor: brandColors.secondaryLight }]}>
              <Text style={[styles.savingsText, { color: brandColors.secondary }]}>
                Save {formatSavingsPercent(price.savingsPercent)}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Get Free Coupon Button */}
      <Button
        mode="contained"
        onPress={onGetCoupon}
        style={[styles.couponButton, { backgroundColor: brandColors.primary }]}
        contentStyle={styles.couponContent}
        labelStyle={styles.couponLabel}
      >
        Get Free Coupon
      </Button>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing[2],
    marginBottom: spacing[1],
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[1.5],
  },
  logoText: {
    fontSize: fontSize.base,
    fontWeight: '800',
  },
  logoImageWrap: {
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.08)',
    padding: 4,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  pharmacyInfo: {
    flex: 1,
    marginRight: spacing[1],
    gap: 1,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  priceColumn: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  discountPrice: {
    fontSize: 22,
    fontWeight: '800',
  },
  savingsBadge: {
    marginTop: 4,
    paddingHorizontal: spacing[1],
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  savingsText: {
    fontSize: 10,
    fontWeight: '700',
  },
  couponButton: {
    marginTop: spacing[1.5],
    borderRadius: borderRadius.md,
  },
  couponContent: {
    paddingVertical: 2,
  },
  couponLabel: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
