/**
 * ConditionCard - Reusable condition card for listing screens
 * Shows icon, condition name, description, navigates to detail
 */

import { View, StyleSheet, Pressable } from 'react-native';
import { Text, Surface, Icon } from 'react-native-paper';
import { router } from 'expo-router';
import { useAppTheme } from '@/hooks/useAppTheme';
import { getConditionIcon, getConditionColor } from '@/constants/conditions';
import { spacing, borderRadius, fontSize } from '@/theme';
import type { ConditionDisplay } from '@/types/condition';

interface ConditionCardProps {
  condition: ConditionDisplay;
  /** Compact mode for grid layout */
  compact?: boolean;
}

export function ConditionCard({ condition, compact }: ConditionCardProps) {
  const { colors } = useAppTheme();
  const icon = getConditionIcon(condition.conditionName);
  const iconColor = getConditionColor(icon);

  const handlePress = () => {
    router.push(`/conditions/${condition.slug}`);
  };

  if (compact) {
    return (
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={condition.conditionName}
        style={[styles.compactCard, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}
      >
        <View style={[styles.compactIcon, { backgroundColor: iconColor + '15' }]}>
          <Icon source={icon} size={20} color={iconColor} />
        </View>
        <Text
          variant="bodySmall"
          style={{ color: colors.onSurface, textAlign: 'center' }}
          numberOfLines={2}
        >
          {condition.conditionName}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={handlePress} accessibilityRole="button" accessibilityLabel={condition.conditionName}>
      <Surface style={[styles.card, { backgroundColor: colors.surface }]} elevation={1}>
        <View style={styles.row}>
          <View style={[styles.iconCircle, { backgroundColor: iconColor + '15' }]}>
            <Icon source={icon} size={24} color={iconColor} />
          </View>
          <View style={styles.info}>
            <Text variant="titleSmall" style={{ color: colors.onSurface }} numberOfLines={1}>
              {condition.conditionName}
            </Text>
            {condition.description && (
              <Text
                variant="bodySmall"
                style={{ color: colors.onSurfaceVariant }}
                numberOfLines={2}
              >
                {condition.description}
              </Text>
            )}
          </View>
          <Icon source="chevron-right" size={20} color={colors.onSurfaceVariant} />
        </View>
      </Surface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing[2],
    marginBottom: spacing[1],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[1.5],
  },
  info: {
    flex: 1,
    marginRight: spacing[1],
    gap: 2,
  },
  compactCard: {
    width: '30%',
    alignItems: 'center',
    padding: spacing[1.5],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing[1],
  },
  compactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
