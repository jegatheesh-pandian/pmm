/**
 * Coupon Detail Screen - Full coupon view with share/delivery options
 * Shows full CouponCard + CouponActions
 */

import { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Snackbar } from 'react-native-paper';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { ScreenWrapper } from '@/components/ui';
import { EmptyState } from '@/components/ui/EmptyState';
import { CouponCard } from '@/components/coupon/CouponCard';
import { CouponActions } from '@/components/coupon/CouponActions';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useCouponStore } from '@/store/couponStore';
import { COUPON_DEFAULTS } from '@/constants/pharmacy';
import type { CouponData } from '@/services/api/couponApi';
import { spacing, borderRadius } from '@/theme';

export default function CouponDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, brandColors } = useAppTheme();
  const savedCoupons = useCouponStore((s) => s.savedCoupons);
  const removeCoupon = useCouponStore((s) => s.removeCoupon);

  const [snackMsg, setSnackMsg] = useState('');
  const [snackType, setSnackType] = useState<'success' | 'error'>('success');

  const coupon = useMemo(
    () => savedCoupons.find((c) => c.id === id),
    [savedCoupons, id],
  );

  // Build CouponData from saved coupon for SMS/email sending
  const couponData: CouponData | undefined = useMemo(() => {
    if (!coupon) return undefined;
    return {
      drugName: coupon.drugName,
      genericName: coupon.genericName,
      form: coupon.form,
      dosage: coupon.dosage,
      quantity: coupon.quantity,
      pharmacyPrice: {
        pharmacy: {
          name: coupon.pharmacyName,
          chain: coupon.pharmacyChain,
          address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            formattedAddress: coupon.pharmacyAddress,
          },
          phone: coupon.pharmacyPhone,
          latitude: 0,
          longitude: 0,
          distance: 0,
          hours: [],
          is24Hour: false,
          logoUrl: null,
        },
        discountPrice: coupon.discountPrice,
        retailPrice: coupon.retailPrice,
        savingsAmount: coupon.savingsAmount,
        savingsPercent: coupon.savingsPercent,
        bin: coupon.bin || COUPON_DEFAULTS.BIN,
        pcn: coupon.pcn || COUPON_DEFAULTS.PCN,
        group: coupon.group || COUPON_DEFAULTS.GROUP_ID,
        memberId: coupon.memberId || COUPON_DEFAULTS.MEMBER_ID,
        apiSource: coupon.apiSource || 'CPX',
      },
    } as CouponData;
  }, [coupon]);

  const handleToast = useCallback((message: string, type: 'success' | 'error') => {
    setSnackMsg(message);
    setSnackType(type);
  }, []);

  const handleDelete = useCallback(() => {
    if (!id) return;
    removeCoupon(id);
    router.back();
  }, [id, removeCoupon]);

  if (!coupon) {
    return (
      <ScreenWrapper>
        <EmptyState
          icon="ticket-percent-outline"
          title="Coupon not found"
          message="This coupon may have been deleted."
          actionLabel="View All Coupons"
          onAction={() => router.replace('/coupons')}
        />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper scroll padded={false}>
      <Stack.Screen options={{ title: `${coupon.drugName} Coupon` }} />

      <View style={styles.content}>
        <CouponCard coupon={coupon} />

        <CouponActions
          coupon={coupon}
          couponData={couponData}
          onDownload={async () => false}
          isDownloading={false}
          onToast={handleToast}
        />

        {/* Delete */}
        <Button
          mode="outlined"
          icon="delete"
          textColor={colors.error}
          onPress={handleDelete}
          style={[styles.deleteButton, { borderColor: colors.error }]}
        >
          Delete Coupon
        </Button>

        {/* Date */}
        <Text
          variant="bodySmall"
          style={{ color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing[1] }}
        >
          Saved {new Date(coupon.savedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
      </View>

      <Snackbar
        visible={!!snackMsg}
        onDismiss={() => setSnackMsg('')}
        duration={3000}
        style={{
          backgroundColor: snackType === 'success' ? brandColors.secondary : colors.error,
        }}
      >
        {snackMsg}
      </Snackbar>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing[2],
    paddingBottom: spacing[4],
  },
  deleteButton: {
    marginTop: spacing[3],
    borderRadius: borderRadius.md,
  },
});
