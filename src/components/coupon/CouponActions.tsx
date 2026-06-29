/**
 * CouponActions - Get Your Coupon delivery section
 * - Download (saves coupon image to phone gallery)
 * - Email (email input + consent + Send to Email)
 * - Text (phone input + SMS consent + Send Text Message)
 */

import { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Text,
  Button,
  TextInput,
  Checkbox,
  HelperText,
  SegmentedButtons,
  Icon,
} from 'react-native-paper';
import { useAppTheme } from '@/hooks/useAppTheme';
import { couponApi, buildSendRequest } from '@/services/api/couponApi';
import type { CouponData } from '@/services/api/couponApi';
import type { SavedCoupon } from '@/store/couponStore';
import { spacing, borderRadius } from '@/theme';

type DeliveryTab = 'download' | 'email' | 'sms';
type DeliveryState = 'idle' | 'sending' | 'success' | 'error';

interface CouponActionsProps {
  coupon: SavedCoupon;
  couponData?: CouponData;
  onDownload: () => Promise<boolean>;
  isDownloading: boolean;
  onToast?: (message: string, type: 'success' | 'error') => void;
}

export function CouponActions({ coupon, couponData, onDownload, isDownloading, onToast }: CouponActionsProps) {
  const { colors, brandColors } = useAppTheme();

  const [activeTab, setActiveTab] = useState<DeliveryTab>('download');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [smsConsent, setSmsConsent] = useState(false);
  const [deliveryState, setDeliveryState] = useState<DeliveryState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownloadPress = useCallback(async () => {
    setDownloadSuccess(false);
    const success = await onDownload();
    if (success) {
      setDownloadSuccess(true);
    }
  }, [onDownload]);

  const handleSendEmail = useCallback(async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setDeliveryState('sending');
    setErrorMsg('');

    try {
      if (couponData) {
        const request = buildSendRequest(couponData, { email });
        await couponApi.sendCouponEmail(request);
      }

      couponApi.captureCouponLead({
        email,
        couponDrugName: coupon.drugName,
        deliveryMethod: 'email',
        marketingEmailConsent: marketingConsent,
      });

      setDeliveryState('success');
      onToast?.(`Coupon sent to ${email}`, 'success');
    } catch {
      setDeliveryState('error');
      setErrorMsg('Failed to send email. Please try again.');
    }
  }, [email, couponData, coupon.drugName, marketingConsent, onToast]);

  const handleSendSms = useCallback(async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      setErrorMsg('Please enter a valid 10-digit phone number.');
      return;
    }

    setDeliveryState('sending');
    setErrorMsg('');

    try {
      if (couponData) {
        const request = buildSendRequest(couponData, { mobile: digits });
        await couponApi.sendCouponSms(request);
      }

      couponApi.captureCouponLead({
        phone: digits,
        couponDrugName: coupon.drugName,
        deliveryMethod: 'text',
        smsConsent,
      });

      setDeliveryState('success');
      onToast?.('Coupon sent via text message', 'success');
    } catch {
      setDeliveryState('error');
      setErrorMsg('Failed to send SMS. Please try again.');
    }
  }, [phone, couponData, coupon.drugName, smsConsent, onToast]);

  const resetDelivery = useCallback(() => {
    setDeliveryState('idle');
    setErrorMsg('');
    setDownloadSuccess(false);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
      <Text variant="titleMedium" style={{ color: colors.onSurface, fontWeight: '700', textAlign: 'center' }}>
        Get Your Coupon
      </Text>

      {/* Tab Selector */}
      <SegmentedButtons
        value={activeTab}
        onValueChange={(v) => {
          setActiveTab(v as DeliveryTab);
          resetDelivery();
        }}
        buttons={[
          { value: 'download', label: 'Download', icon: 'download' },
          { value: 'email', label: 'Email', icon: 'email-outline' },
          { value: 'sms', label: 'Text', icon: 'cellphone-text' },
        ]}
        style={styles.tabs}
      />

      {/* Download Tab */}
      {activeTab === 'download' && (
        <View style={styles.tabContent}>
          {downloadSuccess ? (
            <View style={styles.successContainer}>
              <Icon source="check-circle" size={48} color={brandColors.secondary} />
              <Text variant="titleSmall" style={{ color: colors.onSurface, marginTop: spacing[1] }}>
                Coupon Saved!
              </Text>
              <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                Check your gallery or downloads
              </Text>
              <Button mode="text" onPress={resetDelivery} style={{ marginTop: spacing[1] }}>
                Download again
              </Button>
            </View>
          ) : (
            <>
              <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant, textAlign: 'center' }}>
                Save or share the coupon as an image.
              </Text>
              <Button
                mode="contained"
                icon="download"
                onPress={handleDownloadPress}
                loading={isDownloading}
                disabled={isDownloading}
                style={[styles.actionButton, { backgroundColor: brandColors.primary }]}
              >
                Download Coupon
              </Button>
            </>
          )}
        </View>
      )}

      {/* Email Tab */}
      {activeTab === 'email' && (
        <View style={styles.tabContent}>
          {deliveryState === 'success' ? (
            <View style={styles.successContainer}>
              <Icon source="check-circle" size={48} color={brandColors.secondary} />
              <Text variant="titleSmall" style={{ color: colors.onSurface, marginTop: spacing[1] }}>
                Coupon Sent!
              </Text>
              <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                Check your inbox at {email}
              </Text>
              <Button mode="text" onPress={resetDelivery} style={{ marginTop: spacing[1] }}>
                Send to another email
              </Button>
            </View>
          ) : (
            <>
              <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant, textAlign: 'center' }}>
                Receive your coupon via email for easy access on your phone.
              </Text>
              <Text variant="labelMedium" style={{ color: colors.onSurface, fontWeight: '600' }}>
                Email Address
              </Text>
              <TextInput
                mode="outlined"
                placeholder="your@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                dense
                left={<TextInput.Icon icon="email-outline" />}
                disabled={deliveryState === 'sending'}
              />
              <View style={styles.checkboxRow}>
                <Checkbox.Android
                  status={marketingConsent ? 'checked' : 'unchecked'}
                  onPress={() => setMarketingConsent(!marketingConsent)}
                  color={brandColors.primary}
                />
                <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, flex: 1 }}>
                  I agree to receive medication savings updates and promotional emails. I can unsubscribe anytime.
                </Text>
              </View>
              {errorMsg && (
                <HelperText type="error" visible>{errorMsg}</HelperText>
              )}
              <Button
                mode="contained"
                icon="send"
                onPress={handleSendEmail}
                loading={deliveryState === 'sending'}
                disabled={deliveryState === 'sending' || !email.trim()}
                style={[styles.actionButton, { backgroundColor: brandColors.primary }]}
                textColor="white"
              >
                Send to Email
              </Button>
              <Text variant="labelSmall" style={{ color: colors.onSurfaceVariant, textAlign: 'center' }}>
                By receiving this coupon, you agree to our Terms of Service and Privacy Policy.
              </Text>
            </>
          )}
        </View>
      )}

      {/* SMS Tab */}
      {activeTab === 'sms' && (
        <View style={styles.tabContent}>
          {deliveryState === 'success' ? (
            <View style={styles.successContainer}>
              <Icon source="check-circle" size={48} color={brandColors.secondary} />
              <Text variant="titleSmall" style={{ color: colors.onSurface, marginTop: spacing[1] }}>
                Text Sent!
              </Text>
              <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                Check your messages
              </Text>
              <Button mode="text" onPress={resetDelivery} style={{ marginTop: spacing[1] }}>
                Send to another number
              </Button>
            </View>
          ) : (
            <>
              <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant, textAlign: 'center' }}>
                Get a text message with your coupon details for quick reference.
              </Text>
              <Text variant="labelMedium" style={{ color: colors.onSurface, fontWeight: '600' }}>
                Phone Number
              </Text>
              <TextInput
                mode="outlined"
                placeholder="(555) 123-4567"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoComplete="tel"
                dense
                left={<TextInput.Icon icon="cellphone" />}
                disabled={deliveryState === 'sending'}
              />
              <View style={styles.checkboxRow}>
                <Checkbox.Android
                  status={smsConsent ? 'checked' : 'unchecked'}
                  onPress={() => setSmsConsent(!smsConsent)}
                  color={brandColors.primary}
                />
                <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, flex: 1 }}>
                  I agree to receive SMS messages regarding coupon delivery and promotional offers. Message & data rates may apply.
                </Text>
              </View>
              {errorMsg && (
                <HelperText type="error" visible>{errorMsg}</HelperText>
              )}
              <Button
                mode="contained"
                icon="send"
                onPress={handleSendSms}
                loading={deliveryState === 'sending'}
                disabled={deliveryState === 'sending' || !phone.trim()}
                style={[styles.actionButton, { backgroundColor: brandColors.primary }]}
                textColor="white"
              >
                Send Text Message
              </Button>
              <Text variant="labelSmall" style={{ color: colors.onSurfaceVariant, textAlign: 'center' }}>
                By receiving this coupon, you agree to our Terms of Service and Privacy Policy.
              </Text>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing[2],
    padding: spacing[2],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  tabs: {
    marginTop: spacing[1.5],
    marginBottom: spacing[2],
  },
  tabContent: {
    gap: spacing[1.5],
  },
  actionButton: {
    borderRadius: borderRadius.md,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: spacing[3],
  },
});
