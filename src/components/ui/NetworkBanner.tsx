/**
 * NetworkBanner - Offline indicator banner
 * Shows at the top of the screen when network is unavailable
 */

import { StyleSheet } from 'react-native';
import { Banner, Icon } from 'react-native-paper';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { spacing } from '@/theme';

export function NetworkBanner() {
  const { isConnected } = useNetworkStatus();

  return (
    <Banner
      visible={isConnected === false}
      icon={({ size }) => <Icon source="wifi-off" size={size} color="#FFFFFF" />}
      style={styles.banner}
      contentStyle={styles.content}
    >
      You are offline. Some features may be unavailable.
    </Banner>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#374151',
  },
  content: {
    paddingVertical: spacing[0.5],
  },
});
