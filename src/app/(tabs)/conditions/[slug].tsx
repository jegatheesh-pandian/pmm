/**
 * Condition Detail Screen - Matches PriceMyMeds.com web design
 * - Teal gradient hero with condition name, description, stats
 * - Drug cards grid (2 columns) with pagination
 * - "How to Save" 3-step section
 * - FAQs accordion
 * - References
 * - Related Conditions
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { View, StyleSheet, Pressable, Image, Linking } from 'react-native';
import {
  Text,
  Button,
  ActivityIndicator,
  Icon,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { ScreenWrapper } from '@/components/ui';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConditionDrugCard } from '@/components/cards/ConditionDrugCard';
import {
  useConditionDetail,
  useConditionDrugs,
  useConditionFaqs,
  useConditionBlog,
} from '@/hooks/useConditions';
import { getTopConditions } from '@/services/api/conditionApi';
import { spacing, borderRadius } from '@/theme';
import type { ConditionDrug, ConditionFaqItem, ConditionDisplay } from '@/types/condition';

const DRUGS_PAGE_SIZE = 20;

/** Parse HTML content into inline segments: plain text, links, and italic text */
type HtmlSegment = { type: 'text'; value: string } | { type: 'link'; value: string; url: string } | { type: 'italic'; value: string };

/** Parse HTML string into segments for rendering (handles <a>, <em> tags) */
function parseHtmlContent(html: string): HtmlSegment[] {
  const segments: HtmlSegment[] = [];
  // Tokenize: match <a> tags, <em> tags, or plain text between them
  const tokenRegex = /<a\s+[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>|<em>([\s\S]*?)<\/em>|([^<]+)/gi;
  let match;
  while ((match = tokenRegex.exec(html)) !== null) {
    if (match[1] !== undefined && match[2] !== undefined) {
      // <a> tag — strip any inner HTML
      const linkText = match[2].replace(/<[^>]+>/g, '').trim();
      if (linkText) segments.push({ type: 'link', value: linkText, url: match[1] });
    } else if (match[3] !== undefined) {
      // <em> tag
      const emText = match[3].replace(/<[^>]+>/g, '').trim();
      if (emText) segments.push({ type: 'italic', value: emText });
    } else if (match[4]) {
      // Plain text
      const plain = match[4].replace(/\s+/g, ' ');
      if (plain.trim()) segments.push({ type: 'text', value: plain });
    }
  }
  return segments;
}

function parseReferences(html: string): HtmlSegment[][] {
  // Split by <p>...</p> blocks
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  const blocks: string[] = [];
  let m;
  while ((m = pRegex.exec(html)) !== null) {
    blocks.push(m[1]);
  }
  if (blocks.length === 0) blocks.push(html);

  return blocks.map((block) => {
    const segments: HtmlSegment[] = [];
    // Tokenize: match <a> tags, <em> tags, or plain text between them
    const tokenRegex = /<a\s+[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>|<em>([\s\S]*?)<\/em>|([^<]+)/gi;
    let tk;
    while ((tk = tokenRegex.exec(block)) !== null) {
      if (tk[1] !== undefined && tk[2] !== undefined) {
        // <a> tag — strip any inner HTML like <em>
        const linkText = tk[2].replace(/<[^>]+>/g, '').trim();
        if (linkText) segments.push({ type: 'link', value: linkText, url: tk[1] });
      } else if (tk[3] !== undefined) {
        // <em> tag (not inside <a>)
        const emText = tk[3].replace(/<[^>]+>/g, '').trim();
        if (emText) segments.push({ type: 'italic', value: emText });
      } else if (tk[4]) {
        // Plain text
        const plain = tk[4].replace(/\s+/g, ' ');
        if (plain.trim()) segments.push({ type: 'text', value: plain });
      }
    }
    return segments;
  }).filter((segs) => segs.length > 0);
}

const HOW_TO_SAVE_STEPS = [
  {
    num: '1',
    title: 'Find Your Medication',
    desc: 'Search for your medication above or use our drug search.',
    icon: 'magnify',
  },
  {
    num: '2',
    title: 'Compare Pharmacy Prices',
    desc: 'See prices at pharmacies near you and find the lowest price available.',
    icon: 'store',
  },
  {
    num: '3',
    title: 'Get Your Free Coupon',
    desc: 'Download or print your coupon and show it at the pharmacy to save.',
    icon: 'ticket-percent',
  },
];

export default function ConditionDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const conditionName = useMemo(() => {
    if (!slug) return '';
    return slug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }, [slug]);

  // Data
  const { data: condition, isLoading: isLoadingDetail } = useConditionDetail(conditionName || undefined);
  const [drugsPage, setDrugsPage] = useState(0);
  const { data: drugsData, isLoading: isLoadingDrugs, isFetching: isFetchingDrugs } =
    useConditionDrugs(conditionName || undefined, drugsPage, DRUGS_PAGE_SIZE);
  const { data: faqsData } = useConditionFaqs(conditionName || undefined);
  const { data: blog } = useConditionBlog(slug || undefined);

  // Accumulate drugs
  const [allDrugs, setAllDrugs] = useState<ConditionDrug[]>([]);
  useEffect(() => {
    if (drugsData?.drugs) {
      if (drugsPage === 0) {
        setAllDrugs(drugsData.drugs);
      } else {
        setAllDrugs((prev) => [...prev, ...drugsData.drugs]);
      }
    }
  }, [drugsData, drugsPage]);

  // FAQs
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);
  const conditionFaqs: ConditionFaqItem[] = useMemo(() => {
    return faqsData?.faqs ?? condition?.faqs ?? [];
  }, [faqsData, condition]);

  // Related conditions
  const [relatedConditions, setRelatedConditions] = useState<ConditionDisplay[]>([]);
  useEffect(() => {
    getTopConditions()
      .then((all) => {
        const filtered = all
          .filter((c) => c.slug !== slug)
          .slice(0, 4);
        setRelatedConditions(filtered);
      })
      .catch(() => {});
  }, [slug]);

  const hasMoreDrugs = drugsData ? !drugsData.last : false;
  const handleLoadMoreDrugs = useCallback(() => {
    if (hasMoreDrugs && !isFetchingDrugs) {
      setDrugsPage((prev) => prev + 1);
    }
  }, [hasMoreDrugs, isFetchingDrugs]);

  if (!slug) {
    return (
      <ScreenWrapper>
        <EmptyState icon="alert-circle" title="Invalid condition" message="No condition specified." />
      </ScreenWrapper>
    );
  }

  if (isLoadingDetail && isLoadingDrugs) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color="#0D7377" />
        </View>
      </ScreenWrapper>
    );
  }

  const totalMeds = drugsData?.totalElements ?? allDrugs.length;

  return (
    <ScreenWrapper scroll padded={false}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <LinearGradient
        colors={['#094D50', '#0D7377', '#11999E']}
        style={styles.hero}
      >
        {/* Breadcrumb */}
        <Pressable
          onPress={() => router.back()}
          style={styles.breadcrumb}
        >
          <Icon source="arrow-left" size={18} color="rgba(255,255,255,0.7)" />
          <Text style={styles.breadcrumbText}>
            Health Conditions
          </Text>
          <Icon source="chevron-right" size={14} color="rgba(255,255,255,0.4)" />
          <Text style={[styles.breadcrumbText, { color: '#FFFFFF' }]}>
            {conditionName}
          </Text>
        </Pressable>

        {/* Condition Icon + Title */}
        <View style={styles.heroContent}>
          <View style={styles.heroTitleRow}>
            <View style={styles.heroIconCircle}>
              <Icon source="medical-bag" size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.heroTitle} numberOfLines={1}>
              {conditionName} Medications
            </Text>
          </View>
          {condition?.descriptions && (
            <Text style={styles.heroDesc} numberOfLines={4}>
              {condition.descriptions}
            </Text>
          )}

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalMeds}</Text>
              <Text style={styles.statLabel}>Medications</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>Up to 66%</Text>
              <Text style={styles.statLabel}>Average Savings</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* ── Medications Section ──────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{conditionName} Medications</Text>
        <Text style={styles.sectionSubtitle}>
          Compare prices and save on your {conditionName} prescription
        </Text>

        {isLoadingDrugs && drugsPage === 0 ? (
          <View style={styles.loadingSmall}>
            <ActivityIndicator size="small" color="#0D7377" />
          </View>
        ) : allDrugs.length === 0 ? (
          <EmptyState
            icon="pill"
            title="No medications found"
            message={`No medications found for ${conditionName}.`}
          />
        ) : (
          <>
            {/* 2-column grid */}
            <View style={styles.drugsGrid}>
              {allDrugs.map((drug) => (
                <View key={drug.conditionWithDrugId} style={styles.drugGridItem}>
                  <ConditionDrugCard drug={drug} />
                </View>
              ))}
            </View>

            {/* Load More */}
            {isFetchingDrugs && drugsPage > 0 && (
              <ActivityIndicator size="small" color="#0D7377" style={{ marginTop: spacing[2] }} />
            )}
            {hasMoreDrugs && !isFetchingDrugs && (
              <Pressable
                onPress={handleLoadMoreDrugs}
                style={styles.loadMoreBtn}
              >
                <Text style={styles.loadMoreText}>Load More Medications</Text>
                <Icon source="chevron-down" size={18} color="#0D7377" />
              </Pressable>
            )}
          </>
        )}
      </View>

      {/* ── How to Save ──────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { textAlign: 'center' }]}>
          How to Save on {conditionName} Medications
        </Text>
        <View style={styles.stepsRow}>
          {HOW_TO_SAVE_STEPS.map((step) => (
            <View key={step.num} style={styles.stepCard}>
              <View style={styles.stepCircle}>
                <Text style={styles.stepNum}>{step.num}</Text>
              </View>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDesc}>{step.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── FAQs ─────────────────────────────────────────────── */}
      {conditionFaqs.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          {conditionFaqs.map((faq, i) => (
            <Pressable
              key={i}
              onPress={() => setExpandedFaqIndex(expandedFaqIndex === i ? null : i)}
              style={[
                styles.faqCard,
                expandedFaqIndex === i && styles.faqCardExpanded,
              ]}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion} numberOfLines={expandedFaqIndex === i ? undefined : 2}>
                  {faq.questions}
                </Text>
                <View style={[
                  styles.faqToggle,
                  expandedFaqIndex === i && styles.faqToggleActive,
                ]}>
                  <Icon
                    source={expandedFaqIndex === i ? 'minus' : 'plus'}
                    size={16}
                    color={expandedFaqIndex === i ? '#FFFFFF' : '#0D7377'}
                  />
                </View>
              </View>
              {expandedFaqIndex === i && (
                <Text style={styles.faqAnswer}>
                  {parseHtmlContent(faq.answers).map((seg, j) => {
                    if (seg.type === 'link') {
                      return (
                        <Text
                          key={j}
                          style={styles.faqLink}
                          onPress={() => Linking.openURL(seg.url)}
                        >
                          {seg.value}
                        </Text>
                      );
                    }
                    if (seg.type === 'italic') {
                      return (
                        <Text key={j} style={{ fontStyle: 'italic' }}>
                          {seg.value}
                        </Text>
                      );
                    }
                    return <Text key={j}>{seg.value}</Text>;
                  })}
                </Text>
              )}
            </Pressable>
          ))}
        </View>
      )}

      {/* ── References ───────────────────────────────────────── */}
      {condition?.reference && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>References</Text>
          <View style={styles.refCard}>
            {parseReferences(condition.reference).map((segments, idx) => (
              <Text key={idx} style={[styles.refText, idx > 0 && { marginTop: 8 }]}>
                {segments.map((seg, j) => {
                  if (seg.type === 'link') {
                    return (
                      <Text
                        key={j}
                        style={styles.refLink}
                        onPress={() => Linking.openURL((seg as any).url)}
                      >
                        {seg.value}
                      </Text>
                    );
                  }
                  if (seg.type === 'italic') {
                    return (
                      <Text key={j} style={styles.refItalic}>
                        {seg.value}
                      </Text>
                    );
                  }
                  return <Text key={j}>{seg.value}</Text>;
                })}
              </Text>
            ))}
          </View>
        </View>
      )}

      {/* ── Related Conditions ───────────────────────────────── */}
      {relatedConditions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Related Health Conditions</Text>
          <View style={styles.relatedGrid}>
            {relatedConditions.map((cond) => (
              <Pressable
                key={cond.slug}
                style={({ pressed }) => [
                  styles.relatedCard,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() => router.push(`/conditions/${cond.slug}`)}
              >
                <View style={styles.relatedIconCircle}>
                  <Icon source="heart-pulse" size={20} color="#0D7377" />
                </View>
                <View style={styles.relatedInfo}>
                  <Text style={styles.relatedName} numberOfLines={1}>
                    {cond.conditionName}
                  </Text>
                </View>
                <Icon source="chevron-right" size={16} color="#9CA3AF" />
              </Pressable>
            ))}
          </View>
        </View>
      )}

      <View style={{ height: spacing[4] }} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[4],
  },
  loadingSmall: {
    padding: spacing[3],
    alignItems: 'center',
  },

  // Hero
  hero: {
    paddingTop: spacing[2],
    paddingBottom: spacing[3],
    paddingHorizontal: spacing[3],
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing[2],
  },
  breadcrumbText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  heroContent: {},
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  heroIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  heroDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 21,
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 18,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 16,
  },

  // Sections
  section: {
    paddingHorizontal: spacing[2],
    marginTop: spacing[3],
    marginHorizontal: spacing[1],
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: spacing[2],
  },

  // Drugs Grid
  drugsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  drugGridItem: {
    width: '48%',
    flexGrow: 1,
  },

  // Load More
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#0D7377',
    borderRadius: 24,
    paddingVertical: 10,
    marginTop: spacing[2],
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D7377',
  },

  // How to Save
  stepsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: spacing[1.5],
  },
  stepCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0D7377',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  stepNum: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1A2E',
    textAlign: 'center',
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 15,
  },

  // FAQs
  faqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
  },
  faqCardExpanded: {
    borderColor: '#E6F7F4',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
    marginRight: 10,
  },
  faqToggle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E6F7F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  faqToggleActive: {
    backgroundColor: '#0D7377',
  },
  faqAnswer: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 21,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  faqLink: {
    color: '#0D7377',
    textDecorationLine: 'underline',
  },

  // References
  refCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#0D7377',
  },
  refText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 19,
  },
  refLink: {
    color: '#0D7377',
    fontStyle: 'italic',
  },
  refItalic: {
    fontStyle: 'italic',
  },

  // Related Conditions
  relatedGrid: {
    gap: 8,
    marginTop: spacing[1],
  },
  relatedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  relatedIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E6F7F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  relatedInfo: {
    flex: 1,
    marginLeft: 12,
  },
  relatedName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
  },
});
