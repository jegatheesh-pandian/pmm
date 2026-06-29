/**
 * DrugAlternativeCard - Similar medication card
 * Layout: pill icon top-left, Generic/Brand badge top-right,
 * drug name (ellipsis), View Prices button
 */

import { View, StyleSheet } from 'react-native';
import { Text, Surface, Button, Icon } from 'react-native-paper';
import { router } from 'expo-router';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing, borderRadius } from '@/theme';
import type { DrugAlternative } from '@/types/drug';

interface DrugAlternativeCardProps {
  alternative: DrugAlternative;
}

export function DrugAlternativeCard({ alternative }: DrugAlternativeCardProps) {
  const { colors, brandColors } = useAppTheme();
  const isGeneric = alternative.brandGeneric === 'Generic';

  return (
    <Surface style={[styles.card, { backgroundColor: colors.surface }]} elevation={1}>
      {/* Top row: icon left, badge right */}
      <View style={styles.topRow}>
        <View style={[styles.iconContainer, { backgroundColor: brandColors.primaryLight }]}>
          <Icon source="pill" size={18} color={brandColors.primary} />
        </View>
        <View
          style={[
            styles.badge,
            { backgroundColor: isGeneric ? brandColors.secondary : brandColors.accent },
          ]}
        >
          <Text style={styles.badgeText}>{alternative.brandGeneric}</Text>
        </View>
      </View>

      {/* Drug Name */}
      <Text
        variant="bodyMedium"
        style={{ color: colors.onSurface, fontWeight: '600' }}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {alternative.drugName}
      </Text>

      {/* View Prices Button */}
      <Button
        mode="contained"
        onPress={() => router.push(`/drugs/${alternative.seoUrlName}`)}
        style={[styles.viewButton, { backgroundColor: brandColors.primary }]}
        labelStyle={styles.viewButtonLabel}
        contentStyle={styles.viewButtonContent}
        icon="arrow-right"
      >
        View Prices
      </Button>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing[1.5],
    borderRadius: borderRadius.lg,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[1],
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  viewButton: {
    marginTop: spacing[1],
    borderRadius: borderRadius.md,
  },
  viewButtonContent: {
    paddingVertical: 0,
    flexDirection: 'row-reverse',
  },
  viewButtonLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
