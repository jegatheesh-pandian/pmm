/**
 * useRefreshOnFocus - Refetch data when screen comes into focus
 * Works with React Query's refetch or any callback
 */

import { useRef, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';

export function useRefreshOnFocus(refetch: () => void) {
  const isFirstMount = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (isFirstMount.current) {
        isFirstMount.current = false;
        return;
      }
      refetch();
    }, [refetch]),
  );
}
