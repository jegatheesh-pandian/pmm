/**
 * useDrugSearch - Debounced drug search with React Query
 * Ported from Angular hero-section debounced search (300ms, 2+ chars)
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/services/api/queryKeys';
import { drugApi } from '@/services/api/drugApi';
import { useDebounce } from './useDebounce';

export function useDrugSearch(query: string, enabled: boolean = true) {
  const debouncedQuery = useDebounce(query.trim(), 300);
  const shouldSearch = debouncedQuery.length >= 2 && enabled;

  return useQuery({
    queryKey: queryKeys.drugs.search(debouncedQuery),
    queryFn: () => drugApi.searchDrugs(debouncedQuery, 10),
    enabled: shouldSearch,
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });
}

export function usePopularDrugs() {
  return useQuery({
    queryKey: queryKeys.drugs.popular(),
    queryFn: () => drugApi.getPopularDrugs(),
    staleTime: 5 * 60_000,
  });
}

export function useDrugsByLetter(letter: string, page: number = 0, size: number = 20) {
  return useQuery({
    queryKey: queryKeys.drugs.byLetter(`${letter}-${page}`),
    queryFn: () => drugApi.getDrugsByLetter(letter, page, size),
    staleTime: 5 * 60_000,
    placeholderData: (prev) => prev,
  });
}
