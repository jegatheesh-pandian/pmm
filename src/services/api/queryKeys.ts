/**
 * React Query key factory
 * Centralized query key management for cache invalidation and consistency
 */

export const queryKeys = {
  // Drugs
  drugs: {
    all: ['drugs'] as const,
    search: (query: string) => ['drugs', 'search', query] as const,
    popular: () => ['drugs', 'popular'] as const,
    config: (drugName: string) => ['drugs', 'config', drugName] as const,
    prices: (drugName: string, params: Record<string, unknown>) =>
      ['drugs', 'prices', drugName, params] as const,
    description: (ndc: string) => ['drugs', 'description', ndc] as const,
    alternatives: (drugName: string) => ['drugs', 'alternatives', drugName] as const,
    seo: (slug: string) => ['drugs', 'seo', slug] as const,
    byLetter: (letter: string) => ['drugs', 'byLetter', letter] as const,
  },

  // Pharmacies
  pharmacies: {
    all: ['pharmacies'] as const,
    search: (params: Record<string, unknown>) => ['pharmacies', 'search', params] as const,
    nearby: (zip: string, radius?: number) => ['pharmacies', 'nearby', zip, radius] as const,
    detail: (id: string) => ['pharmacies', 'detail', id] as const,
  },

  // Conditions
  conditions: {
    all: ['conditions'] as const,
    top: () => ['conditions', 'top'] as const,
    byLetter: (letter: string) => ['conditions', 'byLetter', letter] as const,
    detail: (name: string) => ['conditions', 'detail', name] as const,
    drugs: (name: string) => ['conditions', 'drugs', name] as const,
    faqs: (name: string) => ['conditions', 'faqs', name] as const,
    blog: (slug: string) => ['conditions', 'blog', slug] as const,
  },

  // Medications (authenticated)
  medications: {
    all: ['medications'] as const,
    check: (medispanId: number) => ['medications', 'check', medispanId] as const,
  },

  // User
  user: {
    profile: () => ['user', 'profile'] as const,
  },
} as const;
