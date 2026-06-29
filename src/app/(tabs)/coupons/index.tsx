/**
 * Coupons List Screen - Saved Coupons
 * Shows all saved coupons with search, swipe to delete
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { View, StyleSheet, FlatList, Pressable } from 'react-native';
import { Text, Searchbar, Button, IconButton } from 'react-native-paper';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/ui';
import { EmptyState } from '@/components/ui/EmptyState';
import { CouponCard } from '@/components/coupon/CouponCard';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useCouponStore, type SavedCoupon } from '@/store/couponStore';
import { spacing, borderRadius, fontSize } from '@/theme';

export default function CouponsListScreen() {
  const { colors, brandColors } = useAppTheme();
  const savedCoupons = useCouponStore((s) => s.savedCoupons);
  const removeCoupon = useCouponStore((s) => s.removeCoupon);
  const clearCoupons = useCouponStore((s) => s.clearCoupons);
  const restoreCoupons = useCouponStore((s) => s.restoreCoupons);

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    restoreCoupons();
  }, [restoreCoupons]);

  const filteredCoupons = useMemo(() => {
    if (!searchQuery.trim()) return savedCoupons;
    const q = searchQuery.toLowerCase().trim();
    return savedCoupons.filter(
      (c) =>
        c.drugName.toLowerCase().includes(q) ||
        c.pharmacyName.toLowerCase().includes(q),
    );
  }, [savedCoupons, searchQuery]);

  const renderItem = useCallback(
    ({ item }: { item: SavedCoupon }) => (
      <Pressable
        onPress={() => router.push(`/coupons/${item.id}`)}
        onLongPress={() => removeCoupon(item.id)}
        accessibilityRole="button"
        accessibilityLabel={`${item.drugName} coupon at ${item.pharmacyName}`}
        accessibilityHint="Tap to view, long press to delete"
      >
        <CouponCard coupon={item} compact />
      </Pressable>
    ),
    [removeCoupon],
  );

  return (
    <ScreenWrapper scroll={false} padded={false}>
      {savedCoupons.length > 0 && (
        <>
          {/* Search + Clear */}
          <View style={styles.controlsRow}>
            <Searchbar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search saved coupons..."
              style={[styles.searchbar, { backgroundColor: colors.surfaceVariant }]}
              inputStyle={styles.searchInput}
              elevation={0}
            />
            {savedCoupons.length > 1 && (
              <IconButton
                icon="delete-sweep"
                size={20}
                iconColor={colors.error}
                onPress={clearCoupons}
              />
            )}
          </View>

          {/* Count */}
          <View style={styles.countRow}>
            <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
              {filteredCoupons.length} saved coupon{filteredCoupons.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </>
      )}

      {savedCoupons.length === 0 ? (
        <EmptyState
          icon="ticket-percent-outline"
          title="No saved coupons"
          message='Save coupons from drug pricing pages by tapping "Get Free Coupon" and then "Save Coupon".'
          actionLabel="Search Drugs"
          onAction={() => router.push('/(tabs)/search')}
        />
      ) : filteredCoupons.length === 0 ? (
        <EmptyState
          icon="magnify-close"
          title="No matching coupons"
          message={`No saved coupons matching "${searchQuery}".`}
        />
      ) : (
        <FlatList
          data={filteredCoupons}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    paddingTop: spacing[1],
    gap: spacing[0.5],
  },
  searchbar: {
    flex: 1,
    borderRadius: borderRadius.md,
    height: 40,
  },
  searchInput: {
    fontSize: fontSize.sm,
    minHeight: 40,
  },
  countRow: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
  },
  listContent: {
    paddingHorizontal: spacing[2],
    paddingBottom: spacing[4],
  },
});
