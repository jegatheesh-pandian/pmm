/**
 * Conditions React Query hooks
 * Provides condition listing, detail, drugs, FAQs, and blog content
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/services/api/queryKeys';
import {
  getTopConditions,
  getConditionsByLetter,
  getConditionDetail,
  getConditionDrugs,
  getConditionFaqs,
  getConditionBlog,
} from '@/services/api/conditionApi';

/** Get top/featured conditions */
export function useTopConditions() {
  return useQuery({
    queryKey: queryKeys.conditions.top(),
    queryFn: getTopConditions,
    staleTime: 5 * 60 * 1000,
  });
}

/** Get conditions by letter (paginated) */
export function useConditionsByLetter(letter: string, page: number = 0, size: number = 20) {
  return useQuery({
    queryKey: [...queryKeys.conditions.byLetter(letter), page, size],
    queryFn: () => getConditionsByLetter(letter, page, size),
    enabled: !!letter,
    staleTime: 5 * 60 * 1000,
  });
}

/** Get condition detail */
export function useConditionDetail(conditionName: string | undefined) {
  return useQuery({
    queryKey: queryKeys.conditions.detail(conditionName ?? ''),
    queryFn: () => getConditionDetail(conditionName!),
    enabled: !!conditionName,
    staleTime: 10 * 60 * 1000,
  });
}

/** Get drugs for a condition (paginated) */
export function useConditionDrugs(
  conditionName: string | undefined,
  page: number = 0,
  size: number = 20,
) {
  return useQuery({
    queryKey: [...queryKeys.conditions.drugs(conditionName ?? ''), page, size],
    queryFn: () => getConditionDrugs(conditionName!, page, size),
    enabled: !!conditionName,
    staleTime: 5 * 60 * 1000,
  });
}

/** Get FAQs for a condition */
export function useConditionFaqs(conditionName: string | undefined) {
  return useQuery({
    queryKey: queryKeys.conditions.faqs(conditionName ?? ''),
    queryFn: () => getConditionFaqs(conditionName!),
    enabled: !!conditionName,
    staleTime: 10 * 60 * 1000,
  });
}

/** Get blog content for a condition */
export function useConditionBlog(conditionSlug: string | undefined) {
  return useQuery({
    queryKey: queryKeys.conditions.blog(conditionSlug ?? ''),
    queryFn: () => getConditionBlog(conditionSlug!),
    enabled: !!conditionSlug,
    staleTime: 10 * 60 * 1000,
  });
}
