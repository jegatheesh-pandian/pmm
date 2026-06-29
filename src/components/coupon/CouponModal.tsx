/**
 * CouponModal - Full-screen modal for viewing/sharing a coupon
 * Shows CouponCard + CouponActions (download/email/SMS/share)
 * Triggered from drug pricing screen when user taps "Get Free Coupon"
 */

import { useRef, useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Portal, Modal, IconButton } from 'react-native-paper';
import ViewShot from 'react-native-view-shot';
import { File, Paths } from 'expo-file-system/next';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { useAppTheme } from '@/hooks/useAppTheme';
import { CouponCard } from './CouponCard';
import { CouponActions } from './CouponActions';
import type { SavedCoupon } from '@/store/couponStore';
import type { CouponData } from '@/services/api/couponApi';
import { COUPON_DEFAULTS } from '@/constants/pharmacy';
import { spacing, borderRadius } from '@/theme';

interface CouponModalProps {
  visible: boolean;
  onDismiss: () => void;
  couponData?: CouponData;
  onToast?: (message: string, type: 'success' | 'error') => void;
}

/** Convert CouponData to SavedCoupon format */
function toSavedCoupon(data: CouponData): SavedCoupon {
  const pp = data.pharmacyPrice;
  return {
    id: '',
    drugName: data.drugName,
    genericName: data.genericName,
    form: data.form,
    dosage: data.dosage,
    quantity: data.quantity,
    pharmacyName: pp.pharmacy.name,
    pharmacyChain: pp.pharmacy.chain,
    pharmacyAddress: [
      pp.pharmacy.address.street,
      pp.pharmacy.address.city,
      pp.pharmacy.address.state,
      pp.pharmacy.address.zipCode,
    ]
      .filter(Boolean)
      .join(', '),
    pharmacyPhone: pp.pharmacy.phone,
    discountPrice: pp.discountPrice,
    retailPrice: pp.retailPrice,
    savingsAmount: pp.savingsAmount,
    savingsPercent: pp.savingsPercent,
    bin: pp.bin || COUPON_DEFAULTS.BIN,
    pcn: pp.pcn || COUPON_DEFAULTS.PCN,
    group: pp.group || COUPON_DEFAULTS.GROUP_ID,
    memberId: pp.memberId || COUPON_DEFAULTS.MEMBER_ID,
    apiSource: pp.apiSource,
    savedAt: Date.now(),
  };
}

export function CouponModal({ visible, onDismiss, couponData, onToast }: CouponModalProps) {
  const { colors } = useAppTheme();
  const viewShotRef = useRef<ViewShot>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const savedCoupon = couponData ? toSavedCoupon(couponData) : null;

  const handleDownload = useCallback(async (): Promise<boolean> => {
    if (!viewShotRef.current?.capture) {
      console.log('[CouponModal] ViewShot ref not ready');
      onToast?.('Unable to capture coupon image', 'error');
      return false;
    }

    setIsDownloading(true);
    try {
      // Capture the coupon card as an image
      const tmpUri = await viewShotRef.current.capture();
      console.log('[CouponModal] Captured image URI:', tmpUri);

      // Copy to a named file
      const srcFile = new File(tmpUri);
      const destFile = new File(Paths.cache, `PriceMyMeds_Coupon_${Date.now()}.png`);
      srcFile.copy(destFile);
      const destUri = destFile.uri;

      // Try direct gallery save first (works in dev builds), fallback to share sheet (Expo Go)
      try {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === 'granted') {
          await MediaLibrary.saveToLibraryAsync(destUri);
          onToast?.('Coupon saved to gallery!', 'success');
          return true;
        }
      } catch {
        // MediaLibrary not available (Expo Go) — fall through to share
      }

      // Fallback: open share sheet
      await Sharing.shareAsync(destUri, {
        mimeType: 'image/png',
        dialogTitle: 'Save your coupon',
      });
      onToast?.('Coupon ready to save!', 'success');
      return true;
    } catch (err) {
      console.log('[CouponModal] Download error:', err);
      onToast?.('Failed to save coupon image', 'error');
      return false;
    } finally {
      setIsDownloading(false);
    }
  }, [onToast]);

  if (!savedCoupon) return null;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[styles.modal, { backgroundColor: colors.background }]}
      >
        <View style={styles.header}>
          <Text variant="titleMedium" style={{ color: colors.onSurface, fontWeight: '700' }}>
            Your Coupon
          </Text>
          <IconButton icon="close" size={20} onPress={onDismiss} />
        </View>

        <ScrollView
          style={styles.scrollBody}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ViewShot
            ref={viewShotRef}
            options={{ format: 'png', quality: 1 }}
            style={{ backgroundColor: colors.background }}
          >
            <CouponCard coupon={savedCoupon} />
          </ViewShot>

          {/* Delivery Actions */}
          <CouponActions
            coupon={savedCoupon}
            couponData={couponData}
            onDownload={handleDownload}
            isDownloading={isDownloading}
            onToast={onToast}
          />
        </ScrollView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: spacing[2],
    borderRadius: borderRadius.lg,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: spacing[2],
    paddingRight: spacing[1],
    paddingTop: spacing[1],
  },
  scrollBody: {
    flexGrow: 0,
  },
  scrollContent: {
    padding: spacing[2],
    paddingBottom: spacing[4],
  },
});
