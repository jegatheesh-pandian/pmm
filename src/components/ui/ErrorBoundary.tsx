/**
 * ErrorBoundary - Catches unhandled JS errors
 * Shows fallback UI with retry option
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Surface } from 'react-native-paper';
import { colors, spacing, borderRadius, fontSize } from '@/theme';
import { logger } from '@/services/loggingService';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('ErrorBoundary', 'Unhandled error caught', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <View style={styles.container}>
          <Surface style={styles.card} elevation={2}>
            <Text style={styles.icon}>!</Text>
            <Text variant="headlineSmall" style={styles.title}>
              Something Went Wrong
            </Text>
            <Text variant="bodyMedium" style={styles.message}>
              An unexpected error occurred. Please try again.
            </Text>
            {__DEV__ && this.state.error && (
              <View style={styles.debugBox}>
                <Text style={styles.debugText} numberOfLines={5}>
                  {this.state.error.message}
                </Text>
              </View>
            )}
            <Button
              mode="contained"
              onPress={this.handleRetry}
              style={styles.button}
              contentStyle={styles.buttonContent}
            >
              Try Again
            </Button>
          </Surface>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[3],
    backgroundColor: colors.background,
  },
  card: {
    padding: spacing[4],
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  icon: {
    fontSize: 48,
    color: colors.error,
    fontWeight: '700',
    marginBottom: spacing[2],
  },
  title: {
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: spacing[1],
    textAlign: 'center',
  },
  message: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  debugBox: {
    backgroundColor: colors.neutral100,
    padding: spacing[1.5],
    borderRadius: borderRadius.md,
    width: '100%',
    marginBottom: spacing[2],
  },
  debugText: {
    fontSize: fontSize.xs,
    color: colors.error,
    fontFamily: 'monospace',
  },
  button: {
    borderRadius: 8,
    width: '100%',
  },
  buttonContent: {
    paddingVertical: spacing[1],
  },
});
