/**
 * EmptyState - Reusable empty/no-results component
 * Consistent pattern for search results, lists, etc.
 */

import { View, StyleSheet } from 'react-native';
import { Text, Button, Icon } from 'react-native-paper';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing } from '@/theme';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = 'magnify',
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.container}>
      <Icon source={icon} size={64} color={colors.outlineVariant} />
      <Text variant="titleMedium" style={[styles.title, { color: colors.onSurface }]}>
        {title}
      </Text>
      {message && (
        <Text variant="bodyMedium" style={[styles.message, { color: colors.onSurfaceVariant }]}>
          {message}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button mode="contained" onPress={onAction} style={styles.button}>
          {actionLabel}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[4],
    minHeight: 240,
  },
  title: {
    marginTop: spacing[2],
    fontWeight: '600',
    textAlign: 'center',
  },
  message: {
    marginTop: spacing[1],
    textAlign: 'center',
    maxWidth: 300,
  },
  button: {
    marginTop: spacing[3],
    borderRadius: 8,
  },
});
