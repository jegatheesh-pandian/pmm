/**
 * Conditions API service
 * Ported from Angular ConditionsApiService + ConditionBlogApiService
 * Handles condition listing, detail, drugs, FAQs, and blog content
 */

import apiClient from './apiClient';
import { ENDPOINTS } from '@/constants/api';
import type { ApiResponse } from '@/types/api';
import type {
  Condition,
  ConditionDisplay,
  ConditionDrug,
  ConditionBlog,
  ConditionFaqItem,
} from '@/types/condition';

// ── Backend Response Types ──────────────────────────────────────────

interface BackendConditionListResponse {
  names?: string[];
  conditions?: BackendConditionItem[];
  content?: BackendConditionItem[];
  totalElements?: number;
  last?: boolean;
}

interface BackendConditionItem {
  conditionId?: number;
  conditionName?: string;
  name?: string;
  slug?: string;
  description?: string;
  descriptions?: string;
  image?: string;
  conditionImage?: string;
  drugCount?: number;
}

interface BackendConditionDrugsResponse {
  drugs?: ConditionDrug[];
  content?: ConditionDrug[];
  totalElements?: number;
  last?: boolean;
}

interface BackendFaqsResponse {
  faqs?: ConditionFaqItem[];
  content?: ConditionFaqItem[];
  totalElements?: number;
}

interface BackendBlogExistsResponse {
  exists: boolean;
}

// ── Transform Functions ─────────────────────────────────────────────

function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function slugToName(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function transformConditionItem(item: BackendConditionItem | string): ConditionDisplay {
  if (typeof item === 'string') {
    return {
      conditionId: 0,
      conditionName: item,
      slug: nameToSlug(item),
      description: null,
      image: null,
    };
  }
  return {
    conditionId: item.conditionId ?? 0,
    conditionName: item.conditionName || item.name || '',
    slug: item.slug || nameToSlug(item.conditionName || item.name || ''),
    description: item.description || item.descriptions || null,
    image: item.image || item.conditionImage || null,
  };
}

// ── API Functions ───────────────────────────────────────────────────

/** Get top/featured conditions */
export async function getTopConditions(): Promise<ConditionDisplay[]> {
  const { data: resp } = await apiClient.get<ApiResponse<BackendConditionItem[]> | BackendConditionListResponse | BackendConditionItem[]>(
    ENDPOINTS.CONDITIONS_TOP,
  );

  // Unwrap { success, data } wrapper if present
  const payload = (resp as any)?.data ?? resp;

  if (Array.isArray(payload)) {
    return payload.map(transformConditionItem);
  }
  const items = (payload as BackendConditionListResponse).conditions || (payload as BackendConditionListResponse).content || [];
  return items.map(transformConditionItem);
}

/** Get conditions by letter (paginated) */
export async function getConditionsByLetter(
  letter: string,
  page: number = 0,
  size: number = 20,
): Promise<{ conditions: ConditionDisplay[]; totalElements: number; last: boolean }> {
  const res = await apiClient.get<any>(
    `${ENDPOINTS.CONDITIONS_ALPHABET}/${letter}`,
    { params: { page, size } },
  );

  // Unwrap {success, data} wrapper if present, otherwise use raw response
  const data = res.data?.data ?? res.data;

  // Backend may return names as string[] or condition objects
  if (data.names) {
    return {
      conditions: data.names.map(transformConditionItem),
      totalElements: data.totalElements ?? data.names.length,
      last: data.last ?? true,
    };
  }

  const items = data.conditions || data.content || [];
  return {
    conditions: items.map(transformConditionItem),
    totalElements: data.totalElements ?? items.length,
    last: data.last ?? true,
  };
}

/** Get condition detail by name/slug */
export async function getConditionDetail(conditionName: string): Promise<Condition> {
  const res = await apiClient.get<any>(
    `${ENDPOINTS.CONDITIONS_DETAIL}/${conditionName}`,
  );
  // Unwrap {success, data} wrapper if present
  return res.data?.data ?? res.data;
}

/** Get drugs for a condition (paginated) */
export async function getConditionDrugs(
  conditionName: string,
  page: number = 0,
  size: number = 20,
): Promise<{ drugs: ConditionDrug[]; totalElements: number; last: boolean }> {
  const res = await apiClient.get<any>(
    `${ENDPOINTS.CONDITIONS_DRUGS}/${conditionName}/drugs`,
    { params: { page, size } },
  );

  // Unwrap {success, data} wrapper if present
  const data = res.data?.data ?? res.data;

  const drugs = data.drugs || data.content || [];
  return {
    drugs,
    totalElements: data.totalElements ?? drugs.length,
    last: data.last ?? true,
  };
}

/** Get FAQs for a condition */
export async function getConditionFaqs(
  conditionName: string,
  page: number = 0,
  size: number = 10,
): Promise<{ faqs: ConditionFaqItem[]; totalElements: number }> {
  const res = await apiClient.get<any>(
    `${ENDPOINTS.CONDITIONS_FAQS}/${conditionName}/faqs`,
    { params: { page, size } },
  );

  // Unwrap {success, data} wrapper if present
  const data = res.data?.data ?? res.data;

  const faqs = data.faqs || data.content || [];
  return {
    faqs,
    totalElements: data.totalElements ?? faqs.length,
  };
}

/** Get blog content for a condition */
export async function getConditionBlog(conditionSlug: string): Promise<ConditionBlog | null> {
  try {
    const res = await apiClient.get<any>(
      `${ENDPOINTS.CONDITIONS_BLOG}/${conditionSlug}/blog`,
    );
    return res.data?.data ?? res.data;
  } catch {
    return null;
  }
}

/** Check if blog exists for a condition */
export async function checkBlogExists(conditionSlug: string): Promise<boolean> {
  try {
    const { data } = await apiClient.get<BackendBlogExistsResponse>(
      `${ENDPOINTS.CONDITIONS_BLOG_EXISTS}/${conditionSlug}`,
    );
    return data.exists;
  } catch {
    return false;
  }
}

/** Search conditions by query (client-side filtering of top conditions) */
export async function searchConditions(query: string): Promise<ConditionDisplay[]> {
  const all = await getTopConditions();
  const q = query.toLowerCase().trim();
  if (q.length < 2) return all;
  return all.filter((c) => c.conditionName.toLowerCase().includes(q));
}

export const conditionApi = {
  getTopConditions,
  getConditionsByLetter,
  getConditionDetail,
  getConditionDrugs,
  getConditionFaqs,
  getConditionBlog,
  checkBlogExists,
  searchConditions,
};
