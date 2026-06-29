/**
 * SummaryCard - Dashboard stat card
 * Shows icon, label, value, optional trend/subtitle
 */

import { View, StyleSheet, Pressable } from 'react-native';
import { Text, Surface, Icon } from 'react-native-paper';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing, borderRadius, fontSize } from '@/theme';

interface SummaryCardProps {
  icon: string;
  iconColor?: string;
  label: string;
  value: string | number;
  subtitle?: string;
  onPress?: () => void;
}

export function SummaryCard({
  icon,
  iconColor,
  label,
  value,
  subtitle,
  onPress,
}: SummaryCardProps) {
  const { colors, brandColors } = useAppTheme();
  const color = iconColor ?? brandColors.primary;

  const Wrapper = onPress ? Pressable : View;

  return (
    <Wrapper onPress={onPress} accessibilityRole={onPress ? 'button' : undefined}>
      <Surface style={[styles.card, { backgroundColor: colors.surface }]} elevation={1}>
        <View style={[styles.iconCircle, { backgroundColor: color + '15' }]}>
          <Icon source={icon} size={22} color={color} />
        </View>
        <Text variant="headlineSmall" style={[styles.value, { color: colors.onSurface }]}>
          {value}
        </Text>
        <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
          {label}
        </Text>
        {subtitle && (
          <Text variant="labelSmall" style={{ color, marginTop: 2 }}>
            {subtitle}
          </Text>
        )}
      </Surface>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    padding: spacing[2],
    borderRadius: borderRadius.lg,
    gap: 4,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  value: {
    fontWeight: '800',
  },
});
