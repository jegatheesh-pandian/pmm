/**
 * RecentActivityCard - Shows a recent coupon/activity entry
 */

import { View, StyleSheet, Pressable } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { router } from 'expo-router';
import { useAppTheme } from '@/hooks/useAppTheme';
import { formatPrice, formatDate } from '@/utils/formatting';
import { spacing, borderRadius, fontSize } from '@/theme';
import type { CouponHistoryEntry } from '@/types/user';

interface RecentActivityCardProps {
  entry: CouponHistoryEntry;
}

const DELIVERY_ICONS: Record<string, string> = {
  view: 'eye-outline',
  print: 'printer',
  email: 'email-outline',
  sms: 'message-text-outline',
};

export function RecentActivityCard({ entry }: RecentActivityCardProps) {
  const { colors, brandColors } = useAppTheme();

  const slug = entry.drugName.toLowerCase().replace(/\s+/g, '-');
  const handlePress = () => {
    router.push(`/drugs/${slug}`);
  };

  return (
    <Pressable onPress={handlePress} style={styles.card} accessibilityRole="button">
      <View style={styles.row}>
        <View style={[styles.iconBg, { backgroundColor: brandColors.primaryLight }]}>
          <Icon
            source={DELIVERY_ICONS[entry.deliveryMethod] ?? 'ticket-percent'}
            size={18}
            color={brandColors.primary}
          />
        </View>
        <View style={styles.info}>
          <Text variant="bodyMedium" style={{ color: colors.onSurface, fontWeight: '600' }} numberOfLines={1}>
            {entry.drugName}
          </Text>
          <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
            {entry.pharmacyName} - {formatDate(entry.generatedAt)}
          </Text>
        </View>
        <View style={styles.priceCol}>
          <Text style={[styles.price, { color: brandColors.secondary }]}>
            {formatPrice(entry.discountPrice)}
          </Text>
          {entry.savingsAmount > 0 && (
            <Text style={[styles.savings, { color: brandColors.secondary }]}>
              -{formatPrice(entry.savingsAmount)}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: spacing[1],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[1.5],
  },
  info: {
    flex: 1,
    gap: 2,
  },
  priceCol: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  savings: {
    fontSize: 10,
    fontWeight: '600',
  },
});
