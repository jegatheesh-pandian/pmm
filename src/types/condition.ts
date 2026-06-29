/**
 * Health condition types
 */

export interface Condition {
  conditionId: number;
  conditionName: string;
  titleTag: string;
  altTag: string;
  metaDescriptions: string | null;
  subHeadings: string | null;
  headings: string | null;
  descriptions: string | null;
  reference: string | null;
  urls: string | null;
  conditionImage: string | null;
  faqs: ConditionFaqItem[];
}

export interface ConditionFaqItem {
  questions: string;
  answers: string;
}

export interface ConditionDisplay {
  conditionId: number;
  conditionName: string;
  slug: string;
  description: string | null;
  image: string | null;
}

export interface ConditionDrug {
  conditionWithDrugId: number;
  conditionName: string;
  seoName: string;
  seoUrlName: string;
  drugName: string;
  descriptions: string | null;
  ndc: string;
  form: string;
  imageName: string | null;
}

export interface ConditionBlog {
  conditionBlogId: number;
  blogId: string;
  conditionId: number;
  conditionName: string;
  conditionSlug: string;
  headings: string | null;
  keyHighlights: string | null;
  coreMedicalExplanation: string | null;
  conditionKnowledge: string | null;
  knowledgeSections: string[];
  medications: BlogMedicationItem[];
  costSavingSec: string | null;
  bottomLine: string | null;
  blogImage: string | null;
  faqs: BlogFaqItem[];
  createdDate: string;
  updatedDate: string;
  metaTitle: string | null;
  metaDescription: string | null;
}

export interface BlogMedicationItem {
  name: string;
  commonUses?: string;
  onsetTime?: string;
  priceRange?: string;
}

export interface BlogFaqItem {
  question: string;
  answer: string;
  references?: string[];
}
