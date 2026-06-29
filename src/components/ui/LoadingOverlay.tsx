/**
 * LoadingOverlay - Semi-transparent overlay with spinner
 * Used for blocking operations (form submissions, etc.)
 */

import { View, StyleSheet, Modal } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing } from '@/theme';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export function LoadingOverlay({ visible, message }: LoadingOverlayProps) {
  const { colors } = useAppTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          {message && (
            <Text variant="bodyMedium" style={[styles.text, { color: colors.onSurface }]}>
              {message}
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  card: {
    padding: spacing[4],
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 160,
  },
  text: {
    marginTop: spacing[2],
  },
});
