/**
 * Condition icon mapping
 * Maps condition name keywords to Material Community Icons
 * Ported from Angular condition-list.component.ts getConditionIcon()
 */

const ICON_MAP: [string[], string][] = [
  [['heart', 'blood pressure', 'hypertension', 'cardiovascular', 'cardiac'], 'heart-pulse'],
  [['cholesterol', 'lipid'], 'chart-bar'],
  [['diabetes', 'blood sugar', 'insulin'], 'chart-line-variant'],
  [['depression', 'mood'], 'weather-sunny'],
  [['anxiety', 'panic', 'stress'], 'moon-waning-crescent'],
  [['bipolar', 'schizophrenia', 'mental'], 'head-cog'],
  [['adhd', 'attention'], 'lightning-bolt'],
  [['insomnia', 'sleep'], 'sleep'],
  [['infection', 'bacterial', 'viral'], 'shield-alert'],
  [['pain', 'arthritis', 'inflammation'], 'flash'],
  [['migraine', 'headache'], 'alert-circle'],
  [['asthma', 'copd', 'respiratory', 'lung', 'breathing'], 'weather-windy'],
  [['acid reflux', 'gerd', 'stomach', 'gastro', 'ibs', 'constipation'], 'stomach'],
  [['thyroid', 'hypothyroidism', 'hyperthyroidism'], 'sync'],
  [['skin', 'acne', 'eczema', 'psoriasis', 'dermatitis'], 'hand-wave'],
  [['allergy', 'allergies', 'hay fever'], 'flower'],
  [['eye', 'vision', 'glaucoma'], 'eye'],
  [['epilepsy', 'seizure'], 'brain'],
  [['parkinson', 'neurological'], 'brain'],
  [['osteoporosis', 'bone'], 'bone'],
  [['gout'], 'foot-print'],
  [['prostate', 'bph'], 'human-male'],
  [['menopause', 'hormonal', 'birth control'], 'gender-female'],
  [['cancer', 'tumor', 'oncology'], 'ribbon'],
];

/** Get icon name for a condition based on keyword matching */
export function getConditionIcon(conditionName: string): string {
  const lower = conditionName.toLowerCase();
  for (const [keywords, icon] of ICON_MAP) {
    if (keywords.some((k) => lower.includes(k))) {
      return icon;
    }
  }
  return 'heart-pulse';
}

/** Condition category colors for visual variety */
export const CONDITION_CATEGORY_COLORS: Record<string, string> = {
  'heart-pulse': '#DC2626',
  'chart-bar': '#7C3AED',
  'chart-line-variant': '#0891B2',
  'weather-sunny': '#F59E0B',
  'moon-waning-crescent': '#6366F1',
  'head-cog': '#8B5CF6',
  'lightning-bolt': '#F97316',
  'sleep': '#6366F1',
  'shield-alert': '#059669',
  'flash': '#EF4444',
  'alert-circle': '#DC2626',
  'weather-windy': '#0EA5E9',
  'stomach': '#84CC16',
  'sync': '#14B8A6',
  'hand-wave': '#EC4899',
  'flower': '#10B981',
  'eye': '#3B82F6',
  'brain': '#7C3AED',
  'bone': '#A3A3A3',
  'foot-print': '#F97316',
  'human-male': '#3B82F6',
  'gender-female': '#EC4899',
  'ribbon': '#7C3AED',
};

/** Get category color for condition icon */
export function getConditionColor(icon: string): string {
  return CONDITION_CATEGORY_COLORS[icon] ?? '#0D7377';
}
