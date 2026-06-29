/**
 * Conditions Tab - Browse Health Conditions
 * Matches PriceMyMeds.com Health Conditions page:
 * - Hero section with teal gradient, title, subtitle, featured condition images
 * - Search bar for conditions
 * - A-Z letter pills (horizontal scroll)
 * - Condition cards with heart icon, name, savings badge, description
 * - Load More button for letter browsing
 * - Popular Medications chip section
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  ScrollView,
  Image,
  Keyboard,
  TextInput as RNTextInput,
  Dimensions,
} from 'react-native';
import { Text, Button, ActivityIndicator, Icon, Surface } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/ui';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useTopConditions, useConditionsByLetter } from '@/hooks/useConditions';
import { usePopularDrugs } from '@/hooks/useDrugSearch';
import { useDebounce } from '@/hooks/useDebounce';
import { spacing, borderRadius, fontSize } from '@/theme';
import type { ConditionDisplay } from '@/types/condition';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const PAGE_SIZE = 12;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FEATURED_CARD_WIDTH = (SCREEN_WIDTH - spacing[3] * 2 - spacing[1] * 3) / 4;

const FEATURED_CONDITIONS = [
  { name: 'Bacterial Infection', slug: 'bacterial-infection', image: require('@/assets/images/conditions/bacterial-infection.png') },
  { name: 'Sinus Infection', slug: 'sinus-infection', image: require('@/assets/images/conditions/sinus-infection.png') },
  { name: 'Upper Respiratory...', slug: 'upper-respiratory-infection', image: require('@/assets/images/conditions/upper-respiratory.png') },
  { name: 'Urinary Tract Infec...', slug: 'urinary-tract-infection', image: require('@/assets/images/conditions/urinary-tract-infection.png') },
];

export default function ConditionsScreen() {
  const { colors, brandColors } = useAppTheme();
  const searchInputRef = useRef<RNTextInput>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);
  const isSearching = debouncedQuery.length >= 2;

  // Letter browsing state
  const [selectedLetter, setSelectedLetter] = useState('A');
  const [page, setPage] = useState(0);
  const [allConditions, setAllConditions] = useState<ConditionDisplay[]>([]);

  // API hooks
  const { data: topConditions, isLoading: isLoadingTop } = useTopConditions();
  const { data: letterData, isLoading: isLoadingLetter, isFetching } = useConditionsByLetter(
    selectedLetter,
    page,
    PAGE_SIZE,
  );
  const { data: popularDrugs } = usePopularDrugs();

  // Filter top conditions by search
  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    const q = debouncedQuery.toLowerCase();
    return (topConditions ?? []).filter((c) =>
      c.conditionName.toLowerCase().includes(q),
    );
  }, [topConditions, debouncedQuery, isSearching]);

  // Accumulate paginated letter results
  useEffect(() => {
    if (letterData?.conditions) {
      if (page === 0) {
        setAllConditions(letterData.conditions);
      } else {
        setAllConditions((prev) => {
          const existing = new Set(prev.map((c) => c.conditionName));
          const newItems = letterData.conditions.filter((c) => !existing.has(c.conditionName));
          return [...prev, ...newItems];
        });
      }
    }
  }, [letterData, page]);

  const handleLetterSelect = useCallback((letter: string) => {
    setSelectedLetter(letter);
    setPage(0);
    setAllConditions([]);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (letterData && !letterData.last && !isFetching) {
      setPage((prev) => prev + 1);
    }
  }, [letterData, isFetching]);

  const handleConditionPress = useCallback((slug: string) => {
    Keyboard.dismiss();
    router.push(`/conditions/${slug}`);
  }, []);

  const handleDrugPress = useCallback((slug: string) => {
    router.push(`/drugs/${slug}`);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    Keyboard.dismiss();
  }, []);

  const hasMore = letterData ? !letterData.last : false;
  const displayData = isSearching ? searchResults : allConditions;
  const isLoadingData = isSearching ? isLoadingTop : (isLoadingLetter && page === 0);

  const renderConditionItem = ({ item }: { item: ConditionDisplay }) => (
    <Pressable
      onPress={() => handleConditionPress(item.slug)}
      style={[styles.conditionCard, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}
    >
      <View style={[styles.conditionIcon, { backgroundColor: brandColors.primaryLight }]}>
        <Icon source="heart-pulse" size={20} color={brandColors.primary} />
      </View>
      <View style={styles.conditionInfo}>
        <View style={styles.conditionNameRow}>
          <Text variant="bodyLarge" style={{ color: colors.onSurface, fontWeight: '600', flex: 1 }} numberOfLines={1}>
            {item.conditionName}
          </Text>
          <View style={[styles.savingsBadge, { backgroundColor: brandColors.secondaryLight }]}>
            <Text style={[styles.savingsBadgeText, { color: brandColors.secondary }]}>
              Save up to 80%
            </Text>
          </View>
        </View>
        <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }} numberOfLines={1}>
          Find savings on medications for {item.conditionName}
        </Text>
      </View>
    </Pressable>
  );

  const renderHeader = () => (
    <View>
      {/* A-Z Letter Pills */}
      <View style={styles.letterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.letterPillsRow}
        >
          {ALPHABET.map((letter) => (
            <Pressable
              key={letter}
              onPress={() => {
                handleLetterSelect(letter);
                handleClearSearch();
              }}
              style={[
                styles.letterPill,
                {
                  backgroundColor:
                    !isSearching && letter === selectedLetter ? brandColors.primary : colors.surface,
                  borderColor:
                    !isSearching && letter === selectedLetter ? brandColors.primary : colors.outlineVariant,
                },
              ]}
            >
              <Text
                style={[
                  styles.letterPillText,
                  {
                    color: !isSearching && letter === selectedLetter ? '#FFFFFF' : colors.onSurfaceVariant,
                  },
                ]}
              >
                {letter}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Results Header */}
      <View style={styles.resultsHeader}>
        {isSearching ? (
          <>
            <View style={styles.resultsHeaderLeft}>
              <Text variant="titleSmall" style={{ color: colors.onSurface, fontWeight: '700' }}>
                Search Results
              </Text>
              <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, marginLeft: 6 }}>
                ({searchResults.length} conditions)
              </Text>
            </View>
            <Button mode="outlined" compact onPress={handleClearSearch} labelStyle={styles.clearLabel}>
              Clear Search
            </Button>
          </>
        ) : (
          <>
            <Text variant="titleSmall" style={{ color: brandColors.primary, fontWeight: '700' }}>
              Conditions starting with "{selectedLetter}"
            </Text>
            {letterData && (
              <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                {allConditions.length} of {letterData.totalElements} conditions
              </Text>
            )}
          </>
        )}
      </View>

      {/* Loading state */}
      {isLoadingData && (
        <View style={styles.loadingSmall}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </View>
  );

  const renderFooter = () => {
    if (isSearching) return null;
    if (isFetching && page > 0) {
      return (
        <ActivityIndicator
          size="small"
          color={colors.primary}
          style={styles.loadMoreSpinner}
        />
      );
    }
    if (hasMore) {
      return (
        <Button
          mode="outlined"
          onPress={handleLoadMore}
          icon="chevron-down"
          style={styles.loadMoreButton}
          contentStyle={{ flexDirection: 'row-reverse' }}
        >
          Load More Conditions
        </Button>
      );
    }

    // Popular Medications section after conditions list
    if (!isSearching && popularDrugs && popularDrugs.length > 0) {
      return (
        <View style={styles.popularSection}>
          <Text variant="titleMedium" style={{ color: colors.onSurface, fontWeight: '700' }}>
            Popular Medications
          </Text>
          <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, marginTop: 2 }}>
            Most searched medications across all conditions
          </Text>
          <View style={styles.popularChips}>
            {popularDrugs.slice(0, 10).map((drug) => (
              <Pressable
                key={drug.slug}
                onPress={() => handleDrugPress(drug.slug)}
                style={[styles.popularChip, { borderColor: brandColors.primary }]}
              >
                <Text style={[styles.popularChipText, { color: brandColors.primary }]}>
                  {drug.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      );
    }
    return null;
  };

  return (
    <ScreenWrapper scroll={false} padded={false}>
      {/* Hero Section */}
      <LinearGradient
        colors={['#0D7377', '#095456']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Text style={styles.heroTitle}>Browse Health Conditions</Text>
        <Text style={styles.heroSubtitle}>
          Find prescription savings for your health conditions. Save up to 80% on your medications.
        </Text>

        {/* Featured Condition Images */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featuredRow}
        >
          {FEATURED_CONDITIONS.map((fc) => (
            <Pressable
              key={fc.slug}
              onPress={() => handleConditionPress(fc.slug)}
              style={styles.featuredCard}
            >
              <Image source={fc.image} style={styles.featuredImage} resizeMode="cover" />
              <Text style={styles.featuredLabel} numberOfLines={2}>{fc.name}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Search Bar */}
        <View style={styles.heroSearchWrapper}>
          <Icon source="magnify" size={22} color={colors.onSurfaceVariant} />
          <RNTextInput
            ref={searchInputRef}
            placeholder="Search conditions..."
            placeholderTextColor={colors.onSurfaceVariant}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.heroSearchInput, { color: colors.onSurface }]}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={handleClearSearch} hitSlop={8}>
              <Icon source="close-circle" size={20} color={colors.onSurfaceVariant} />
            </Pressable>
          )}
        </View>
      </LinearGradient>

      <FlatList
        data={displayData}
        keyExtractor={(item, index) => `${item.conditionName}-${index}`}
        renderItem={renderConditionItem}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          !isLoadingData ? (
            <EmptyState
              icon="hospital-box"
              title="No conditions found"
              message={
                isSearching
                  ? `No health conditions matching "${searchQuery}".`
                  : `No conditions starting with "${selectedLetter}" were found.`
              }
            />
          ) : null
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        removeClippedSubviews={false}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: spacing[4],
  },

  // Hero Section
  hero: {
    paddingHorizontal: spacing[3],
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: spacing[1],
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing[2],
    paddingHorizontal: spacing[2],
  },

  // Featured Conditions
  featuredRow: {
    gap: spacing[1],
    marginBottom: spacing[2],
  },
  featuredCard: {
    width: FEATURED_CARD_WIDTH,
    alignItems: 'center',
  },
  featuredImage: {
    width: FEATURED_CARD_WIDTH,
    height: FEATURED_CARD_WIDTH,
    borderRadius: borderRadius.lg,
  },
  featuredLabel: {
    fontSize: 11,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '600',
  },

  // Search Bar
  heroSearchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    width: '100%',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    gap: spacing[1],
  },
  heroSearchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: spacing[0.5],
  },

  // Letter Pills
  letterSection: {
    paddingVertical: spacing[1.5],
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  letterPillsRow: {
    paddingHorizontal: spacing[2],
    gap: 6,
  },
  letterPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  letterPillText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
  },

  // Results Header
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1.5],
  },
  resultsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearLabel: {
    fontSize: 12,
  },

  // Condition Card
  conditionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing[2],
    marginBottom: spacing[1],
    padding: spacing[1.5],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  conditionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[1.5],
  },
  conditionInfo: {
    flex: 1,
    gap: 3,
  },
  conditionNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  savingsBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  savingsBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },

  // Popular Medications
  popularSection: {
    paddingHorizontal: spacing[2],
    paddingTop: spacing[3],
    paddingBottom: spacing[2],
  },
  popularChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[1],
    marginTop: spacing[1.5],
  },
  popularChip: {
    paddingHorizontal: spacing[1.5],
    paddingVertical: spacing[0.5],
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  popularChipText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },

  // Loading / Load More
  loadingSmall: {
    padding: spacing[3],
    alignItems: 'center',
  },
  loadMoreSpinner: {
    padding: spacing[2],
  },
  loadMoreButton: {
    marginHorizontal: spacing[4],
    marginVertical: spacing[2],
    borderRadius: borderRadius.md,
  },
});
