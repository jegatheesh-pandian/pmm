/**
 * PharmacyCard - Reusable pharmacy card for listing screens
 * Shows chain branding, name, address, distance, features
 * Navigates to pharmacy detail on press
 */

import { View, StyleSheet, Pressable, Image } from 'react-native';
import { Text, Surface, Icon } from 'react-native-paper';
import { router } from 'expo-router';
import { useAppTheme } from '@/hooks/useAppTheme';
import { PHARMACY_BRANDS, getPharmacyLogo, getPharmacyInitials } from '@/constants/pharmacy';
import { formatPhone } from '@/utils/formatting';
import { spacing, borderRadius, fontSize } from '@/theme';
import type { PharmacyWithDistance } from '@/types/pharmacy';

interface PharmacyCardProps {
  pharmacy: PharmacyWithDistance;
  /** If true, card is not pressable */
  static?: boolean;
}

export function PharmacyCard({ pharmacy, static: isStatic }: PharmacyCardProps) {
  const { colors, brandColors } = useAppTheme();
  const brand = PHARMACY_BRANDS[pharmacy.chain] ?? PHARMACY_BRANDS.independent;
  const logo = getPharmacyLogo(pharmacy.chain, pharmacy.name);

  const handlePress = () => {
    if (!isStatic) {
      router.push(`/pharmacies/${pharmacy.id}`);
    }
  };

  const features: { icon: string; label: string }[] = [];
  if (pharmacy.is24Hours) features.push({ icon: 'clock-outline', label: '24 Hours' });
  if (pharmacy.hasDriveThrough) features.push({ icon: 'car', label: 'Drive-Thru' });
  if (pharmacy.hasHomeDelivery) features.push({ icon: 'truck-delivery', label: 'Delivery' });

  const Wrapper = isStatic ? View : Pressable;

  return (
    <Wrapper
      onPress={isStatic ? undefined : handlePress}
      accessibilityRole={isStatic ? undefined : 'button'}
      accessibilityLabel={`${pharmacy.name}, ${pharmacy.distance.toFixed(1)} miles away`}
    >
      <Surface style={[styles.card, { backgroundColor: colors.surface }]} elevation={1}>
        <View style={styles.row}>
          {/* Chain Logo */}
          {logo ? (
            <View style={[styles.logo, styles.logoImageWrap]}>
              <Image source={logo} style={styles.logoImage} resizeMode="contain" />
            </View>
          ) : (
            <View style={[styles.logo, { backgroundColor: brand.color + '15' }]}>
              <Text style={[styles.logoText, { color: brand.color }]}>
                {getPharmacyInitials(pharmacy.name)}
              </Text>
            </View>
          )}

          {/* Pharmacy Info */}
          <View style={styles.info}>
            <Text variant="titleSmall" style={{ color: colors.onSurface }} numberOfLines={1}>
              {pharmacy.name}
            </Text>
            <Text
              variant="bodySmall"
              style={{ color: colors.onSurfaceVariant }}
              numberOfLines={1}
            >
              {pharmacy.address.street}
            </Text>
            <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
              {pharmacy.address.city}, {pharmacy.address.state} {pharmacy.address.zipCode}
            </Text>
            {pharmacy.phone ? (
              <Text variant="bodySmall" style={{ color: colors.primary }}>
                {formatPhone(pharmacy.phone)}
              </Text>
            ) : null}
          </View>

          {/* Distance */}
          <View style={styles.distanceColumn}>
            <Text style={[styles.distanceValue, { color: brandColors.primary }]}>
              {pharmacy.distance.toFixed(1)}
            </Text>
            <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
              miles
            </Text>
          </View>
        </View>

        {/* Feature Tags */}
        {features.length > 0 && (
          <View style={styles.featureRow}>
            {features.map((f) => (
              <View
                key={f.label}
                style={[styles.featureTag, { backgroundColor: colors.surfaceVariant }]}
              >
                <Icon source={f.icon} size={12} color={colors.onSurfaceVariant} />
                <Text style={[styles.featureText, { color: colors.onSurfaceVariant }]}>
                  {f.label}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Surface>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing[2],
    marginBottom: spacing[1.5],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[1.5],
  },
  logoText: {
    fontSize: fontSize.lg,
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
  info: {
    flex: 1,
    marginRight: spacing[1],
    gap: 2,
  },
  distanceColumn: {
    alignItems: 'center',
    minWidth: 48,
  },
  distanceValue: {
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  featureRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[1],
    marginTop: spacing[1.5],
    paddingTop: spacing[1],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  featureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing[1],
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  featureText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
