/**
 * LocationPicker - ZIP code entry + GPS location picker
 * Used in pharmacy search for setting user location
 * Reusable across pharmacy search and drug pricing screens
 */

import { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Button, IconButton, HelperText } from 'react-native-paper';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useLocation } from '@/hooks/useLocation';
import { spacing, borderRadius, fontSize } from '@/theme';

interface LocationPickerProps {
  /** Compact mode shows only the current location and change button */
  compact?: boolean;
}

export function LocationPicker({ compact }: LocationPickerProps) {
  const { colors, brandColors } = useAppTheme();
  const {
    zipCode,
    city,
    stateCode,
    isLoadingGps,
    isGeocodingZip,
    locationSource,
    error,
    requestGps,
    setZipManually,
    resetLocation,
  } = useLocation();

  const [zipInput, setZipInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const handleSubmitZip = useCallback(async () => {
    if (!zipInput.trim()) return;
    const success = await setZipManually(zipInput.trim());
    if (success) {
      setIsEditing(false);
      setZipInput('');
    }
  }, [zipInput, setZipManually]);

  const handleUseGps = useCallback(async () => {
    await requestGps();
    setIsEditing(false);
  }, [requestGps]);

  const locationLabel = city && stateCode
    ? `${city}, ${stateCode} ${zipCode}`
    : zipCode;

  if (compact && !isEditing) {
    return (
      <View style={styles.compactRow}>
        <View style={styles.compactLocation}>
          <IconButton
            icon="map-marker"
            size={16}
            iconColor={brandColors.primary}
            style={styles.compactIcon}
          />
          <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
            {locationLabel}
          </Text>
        </View>
        <Button
          mode="text"
          compact
          onPress={() => setIsEditing(true)}
          labelStyle={[styles.changeLabel, { color: colors.primary }]}
        >
          Change
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text variant="titleSmall" style={[styles.title, { color: colors.onSurface }]}>
        Your Location
      </Text>

      {!isEditing && !compact ? (
        <View style={styles.currentRow}>
          <View style={[styles.locationBadge, { backgroundColor: brandColors.primaryLight }]}>
            <IconButton
              icon={locationSource === 'gps' ? 'crosshairs-gps' : 'map-marker'}
              size={18}
              iconColor={brandColors.primary}
              style={styles.badgeIcon}
            />
            <Text variant="bodyMedium" style={{ color: colors.onSurface }}>
              {locationLabel}
            </Text>
          </View>
          <Button
            mode="outlined"
            compact
            onPress={() => setIsEditing(true)}
            style={styles.changeButton}
          >
            Change
          </Button>
        </View>
      ) : (
        <View style={styles.editContainer}>
          <View style={styles.inputRow}>
            <TextInput
              mode="outlined"
              label="ZIP Code"
              value={zipInput}
              onChangeText={setZipInput}
              keyboardType="number-pad"
              maxLength={5}
              style={styles.zipInput}
              dense
              right={
                isGeocodingZip ? (
                  <TextInput.Icon icon="loading" />
                ) : undefined
              }
              onSubmitEditing={handleSubmitZip}
              returnKeyType="search"
            />
            <Button
              mode="contained"
              onPress={handleSubmitZip}
              loading={isGeocodingZip}
              disabled={isGeocodingZip || zipInput.replace(/\D/g, '').length < 5}
              style={styles.goButton}
              compact
            >
              Go
            </Button>
          </View>

          <View style={styles.orRow}>
            <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />
            <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, paddingHorizontal: spacing[1] }}>
              or
            </Text>
            <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />
          </View>

          <Button
            mode="outlined"
            icon="crosshairs-gps"
            onPress={handleUseGps}
            loading={isLoadingGps}
            disabled={isLoadingGps}
            style={styles.gpsButton}
          >
            Use My Current Location
          </Button>

          {isEditing && (
            <Button
              mode="text"
              onPress={() => {
                setIsEditing(false);
                setZipInput('');
              }}
              compact
              style={styles.cancelButton}
            >
              Cancel
            </Button>
          )}
        </View>
      )}

      {error && (
        <HelperText type="error" visible>
          {error}
        </HelperText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[2],
  },
  title: {
    fontWeight: '600',
    marginBottom: spacing[1],
  },
  currentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing[1.5],
    borderRadius: borderRadius.full,
    flex: 1,
    marginRight: spacing[1],
  },
  badgeIcon: {
    margin: 0,
  },
  changeButton: {
    borderRadius: borderRadius.md,
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactIcon: {
    margin: 0,
    marginRight: 2,
  },
  changeLabel: {
    fontSize: fontSize.xs,
  },
  editContainer: {
    gap: spacing[1],
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  zipInput: {
    flex: 1,
  },
  goButton: {
    borderRadius: borderRadius.md,
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing[0.5],
  },
  divider: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  gpsButton: {
    borderRadius: borderRadius.md,
  },
  cancelButton: {
    marginTop: spacing[0.5],
  },
});
