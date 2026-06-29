/**
 * Pharmacy Detail Screen
 * Ported from Angular pharmacy detail view
 * Shows pharmacy info, hours, features, location, contact
 */

import { View, StyleSheet, ScrollView, Linking, Platform } from 'react-native';
import {
  Text,
  Button,
  Surface,
  Divider,
  ActivityIndicator,
  Icon,
  Chip,
} from 'react-native-paper';
import { useLocalSearchParams, Stack } from 'expo-router';
import { ScreenWrapper } from '@/components/ui';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAppTheme } from '@/hooks/useAppTheme';
import { usePharmacyDetail } from '@/hooks/usePharmacySearch';
import { PHARMACY_BRANDS } from '@/constants/pharmacy';
import { formatPhone } from '@/utils/formatting';
import { spacing, borderRadius, fontSize } from '@/theme';
import type { PharmacyHours } from '@/types/pharmacy';

const DAYS_ORDER: PharmacyHours['day'][] = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
];

export default function PharmacyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, brandColors } = useAppTheme();
  const { data: pharmacy, isLoading, error } = usePharmacyDetail(id);

  const brand = pharmacy
    ? PHARMACY_BRANDS[pharmacy.chain] ?? PHARMACY_BRANDS.independent
    : PHARMACY_BRANDS.independent;

  const handleCall = () => {
    if (pharmacy?.phone) {
      Linking.openURL(`tel:${pharmacy.phone.replace(/\D/g, '')}`);
    }
  };

  const handleGetDirections = () => {
    if (!pharmacy) return;
    const { address } = pharmacy;
    const addr = `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`;
    const encoded = encodeURIComponent(addr);

    if (Platform.OS === 'ios') {
      Linking.openURL(`maps:?daddr=${encoded}`);
    } else {
      Linking.openURL(`geo:0,0?q=${encoded}`);
    }
  };

  if (isLoading) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  if (error || !pharmacy) {
    return (
      <ScreenWrapper>
        <EmptyState
          icon="store-off"
          title="Pharmacy not found"
          message="This pharmacy could not be loaded. It may no longer be available."
        />
      </ScreenWrapper>
    );
  }

  // Sort hours by day order
  const sortedHours = [...(pharmacy.hours || [])].sort(
    (a, b) => DAYS_ORDER.indexOf(a.day) - DAYS_ORDER.indexOf(b.day),
  );

  const features: { icon: string; label: string; active: boolean }[] = [
    { icon: 'clock-outline', label: 'Open 24 Hours', active: pharmacy.is24Hours },
    { icon: 'car', label: 'Drive-Through', active: pharmacy.hasDriveThrough },
    { icon: 'truck-delivery', label: 'Home Delivery', active: pharmacy.hasHomeDelivery },
    { icon: 'credit-card', label: 'Online Payment', active: pharmacy.hasOnlinePayment },
  ];

  return (
    <ScreenWrapper scroll padded={false}>
      <Stack.Screen options={{ title: pharmacy.name }} />

      {/* Header Card */}
      <Surface style={[styles.headerCard, { backgroundColor: colors.surface }]} elevation={1}>
        <View style={styles.headerRow}>
          <View style={[styles.logo, { backgroundColor: brand.color + '15' }]}>
            <Text style={[styles.logoText, { color: brand.color }]}>{brand.initial}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text variant="titleLarge" style={{ color: colors.onSurface, fontWeight: '700' }}>
              {pharmacy.name}
            </Text>
            {pharmacy.storeNumber && (
              <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                Store #{pharmacy.storeNumber}
              </Text>
            )}
            {pharmacy.distance > 0 && (
              <View style={styles.distanceRow}>
                <Icon source="map-marker-distance" size={14} color={brandColors.primary} />
                <Text variant="bodySmall" style={{ color: brandColors.primary, marginLeft: 4 }}>
                  {pharmacy.distance.toFixed(1)} miles away
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Rating */}
        {pharmacy.rating != null && (
          <View style={styles.ratingRow}>
            <Icon source="star" size={16} color="#F59E0B" />
            <Text variant="bodyMedium" style={{ color: colors.onSurface, marginLeft: 4, fontWeight: '600' }}>
              {pharmacy.rating.toFixed(1)}
            </Text>
            {pharmacy.reviewCount != null && (
              <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, marginLeft: 4 }}>
                ({pharmacy.reviewCount} reviews)
              </Text>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <Button
            mode="contained"
            icon="phone"
            onPress={handleCall}
            style={styles.actionButton}
            disabled={!pharmacy.phone}
            compact
          >
            Call
          </Button>
          <Button
            mode="outlined"
            icon="directions"
            onPress={handleGetDirections}
            style={styles.actionButton}
            compact
          >
            Directions
          </Button>
        </View>
      </Surface>

      {/* Address Section */}
      <Surface style={[styles.section, { backgroundColor: colors.surface }]} elevation={1}>
        <Text variant="titleSmall" style={[styles.sectionTitle, { color: colors.onSurface }]}>
          Address
        </Text>
        <View style={styles.addressRow}>
          <Icon source="map-marker" size={18} color={colors.onSurfaceVariant} />
          <View style={styles.addressText}>
            <Text variant="bodyMedium" style={{ color: colors.onSurface }}>
              {pharmacy.address.street}
            </Text>
            <Text variant="bodyMedium" style={{ color: colors.onSurface }}>
              {pharmacy.address.city}, {pharmacy.address.state} {pharmacy.address.zipCode}
            </Text>
          </View>
        </View>
        {pharmacy.phone && (
          <View style={[styles.addressRow, { marginTop: spacing[1] }]}>
            <Icon source="phone" size={18} color={colors.onSurfaceVariant} />
            <Text
              variant="bodyMedium"
              style={{ color: colors.primary, marginLeft: spacing[1] }}
              onPress={handleCall}
            >
              {formatPhone(pharmacy.phone)}
            </Text>
          </View>
        )}
      </Surface>

      {/* Features */}
      <Surface style={[styles.section, { backgroundColor: colors.surface }]} elevation={1}>
        <Text variant="titleSmall" style={[styles.sectionTitle, { color: colors.onSurface }]}>
          Services & Features
        </Text>
        <View style={styles.featureGrid}>
          {features.map((f) => (
            <View
              key={f.label}
              style={[
                styles.featureItem,
                {
                  backgroundColor: f.active ? brandColors.primaryLight : colors.surfaceVariant,
                  opacity: f.active ? 1 : 0.5,
                },
              ]}
            >
              <Icon
                source={f.icon}
                size={20}
                color={f.active ? brandColors.primary : colors.onSurfaceVariant}
              />
              <Text
                variant="bodySmall"
                style={{
                  color: f.active ? brandColors.primary : colors.onSurfaceVariant,
                  marginTop: 4,
                  textAlign: 'center',
                }}
                numberOfLines={2}
              >
                {f.label}
              </Text>
              {f.active && (
                <Icon source="check-circle" size={14} color={brandColors.secondary} />
              )}
            </View>
          ))}
        </View>
      </Surface>

      {/* Hours */}
      {sortedHours.length > 0 && (
        <Surface style={[styles.section, { backgroundColor: colors.surface }]} elevation={1}>
          <View style={styles.hoursHeader}>
            <Text variant="titleSmall" style={[styles.sectionTitle, { color: colors.onSurface }]}>
              Pharmacy Hours
            </Text>
            {pharmacy.is24Hours && (
              <Chip compact icon="clock-outline" textStyle={{ fontSize: 11, color: brandColors.secondary }}>
                24 Hours
              </Chip>
            )}
          </View>
          {sortedHours.map((h, i) => {
            const today = DAYS_ORDER[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
            const isToday = h.day === today;

            return (
              <View key={h.day}>
                <View
                  style={[
                    styles.hoursRow,
                    isToday && { backgroundColor: brandColors.primaryLight },
                  ]}
                >
                  <Text
                    variant="bodyMedium"
                    style={{
                      color: colors.onSurface,
                      fontWeight: isToday ? '700' : '400',
                      width: 100,
                    }}
                  >
                    {h.day}
                    {isToday && ' (Today)'}
                  </Text>
                  <Text
                    variant="bodyMedium"
                    style={{
                      color: h.isClosed ? '#DC2626' : colors.onSurface,
                      fontWeight: isToday ? '600' : '400',
                    }}
                  >
                    {h.isClosed ? 'Closed' : `${h.open} - ${h.close}`}
                  </Text>
                </View>
                {i < sortedHours.length - 1 && <Divider />}
              </View>
            );
          })}
        </Surface>
      )}

      <View style={styles.bottomPadding} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[4],
  },
  headerCard: {
    margin: spacing[2],
    borderRadius: borderRadius.lg,
    padding: spacing[2],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[2],
  },
  logoText: {
    fontSize: 24,
    fontWeight: '800',
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[1],
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing[1.5],
    marginTop: spacing[2],
  },
  actionButton: {
    flex: 1,
    borderRadius: borderRadius.md,
  },
  section: {
    marginHorizontal: spacing[2],
    marginTop: spacing[1.5],
    borderRadius: borderRadius.lg,
    padding: spacing[2],
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: spacing[1],
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressText: {
    marginLeft: spacing[1],
    flex: 1,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[1],
  },
  featureItem: {
    width: '47%',
    alignItems: 'center',
    padding: spacing[1.5],
    borderRadius: borderRadius.md,
    gap: 4,
  },
  hoursHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[1],
    borderRadius: borderRadius.sm,
  },
  bottomPadding: {
    height: spacing[4],
  },
});
