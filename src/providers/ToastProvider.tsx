/**
 * ToastProvider - Global snackbar/toast notification system
 * Provides showToast() via context, renders Snackbar at root level
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { StyleSheet } from 'react-native';
import { Snackbar } from 'react-native-paper';
import { useAppTheme } from '@/hooks/useAppTheme';

type ToastType = 'info' | 'success' | 'error' | 'warning';

interface ToastConfig {
  message: string;
  type?: ToastType;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastContextValue {
  showToast: (config: ToastConfig) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

const TYPE_COLORS: Record<ToastType, string> = {
  info: '#3B82F6',
  success: '#2E8540',
  error: '#DC2626',
  warning: '#F59E0B',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const { colors } = useAppTheme();
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<ToastConfig>({
    message: '',
    type: 'info',
    duration: 3000,
  });

  const showToast = useCallback((newConfig: ToastConfig) => {
    setConfig({
      duration: 3000,
      type: 'info',
      ...newConfig,
    });
    setVisible(true);
  }, []);

  const handleDismiss = useCallback(() => {
    setVisible(false);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Snackbar
        visible={visible}
        onDismiss={handleDismiss}
        duration={config.duration}
        action={
          config.actionLabel
            ? { label: config.actionLabel, onPress: config.onAction ?? handleDismiss }
            : { label: 'OK', onPress: handleDismiss }
        }
        style={[styles.snackbar, { backgroundColor: TYPE_COLORS[config.type ?? 'info'] }]}
        wrapperStyle={styles.wrapper}
      >
        {config.message}
      </Snackbar>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  snackbar: {
    borderRadius: 8,
  },
  wrapper: {
    bottom: 80,
  },
});
