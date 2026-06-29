/**
 * Search Tab - Find Your Medication
 * Matches PriceMyMeds.com Find Drug page:
 * - Hero section with teal gradient, title, subtitle, search bar
 * - Browse A-Z letter pills (horizontal scroll)
 * - Search results OR letter browsing results as drug cards
 * - Load More button for letter browsing
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  ScrollView,
  Keyboard,
  TextInput as RNTextInput,
} from 'react-native';
import { Text, Button, ActivityIndicator, Icon, IconButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/ui';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useDrugSearch, usePopularDrugs, useDrugsByLetter } from '@/hooks/useDrugSearch';
import { useDrugStore } from '@/store/drugStore';
import { spacing, borderRadius, fontSize } from '@/theme';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const PAGE_SIZE = 12;

export default function SearchScreen() {
  const { colors, brandColors } = useAppTheme();
  const searchInputRef = useRef<RNTextInput>(null);

  // Store
  const addToHistory = useDrugStore((s) => s.addToHistory);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const isSearching = searchQuery.trim().length >= 2;

  // Letter browsing state
  const [selectedLetter, setSelectedLetter] = useState('A');
  const [page, setPage] = useState(0);
  const [allDrugs, setAllDrugs] = useState<any[]>([]);

  // API hooks
  const { data: searchResults, isLoading: isSearchLoading } = useDrugSearch(searchQuery, isSearching);
  const { data: letterData, isLoading: isLoadingLetter, isFetching } = useDrugsByLetter(
    selectedLetter,
    page,
    PAGE_SIZE,
  );

  // Accumulate drugs when letter data arrives
  useEffect(() => {
    if (letterData?.content) {
      if (page === 0) {
        setAllDrugs(letterData.content);
      } else {
        setAllDrugs((prev) => {
          const existingSlugs = new Set(prev.map((d: any) => d.slug));
          const newItems = letterData.content.filter((d: any) => !existingSlugs.has(d.slug));
          return [...prev, ...newItems];
        });
      }
    }
  }, [letterData, page]);

  const handleLetterSelect = useCallback((letter: string) => {
    setSelectedLetter(letter);
    setPage(0);
    setAllDrugs([]);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (letterData && allDrugs.length < letterData.totalElements && !isFetching) {
      setPage((prev) => prev + 1);
    }
  }, [letterData, allDrugs.length, isFetching]);

  const handleDrugPress = useCallback((item: any) => {
    addToHistory(item.slug, item.name);
    Keyboard.dismiss();
    router.push(`/drugs/${item.slug}`);
  }, [addToHistory]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    Keyboard.dismiss();
  }, []);

  const hasMore = letterData ? allDrugs.length < letterData.totalElements : false;

  const getDrugInitials = (name: string) => name.slice(0, 2).toUpperCase();

  // Data to display: search results or letter drugs
  const displayData = isSearching ? (searchResults ?? []) : allDrugs;
  const isLoadingData = isSearching ? isSearchLoading : (isLoadingLetter && page === 0);

  const renderDrugItem = ({ item }: { item: any }) => (
    <Pressable
      onPress={() => handleDrugPress(item)}
      style={[styles.drugCard, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}
    >
      <View style={[styles.drugAvatar, { backgroundColor: brandColors.primaryLight }]}>
        <Text style={[styles.drugInitials, { color: brandColors.primary }]}>
          {getDrugInitials(item.name)}
        </Text>
      </View>
      <View style={styles.drugInfo}>
        <Text variant="bodyLarge" style={{ color: colors.onSurface, fontWeight: '600' }} numberOfLines={1}>
          {item.name}
        </Text>
        <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
          Medication
        </Text>
      </View>
      <View style={styles.drugActions}>
        <View style={[styles.typeBadge, {
          backgroundColor: item.type === 'generic' ? brandColors.secondaryLight : brandColors.accentLight,
        }]}>
          <Text style={[styles.typeBadgeText, {
            color: item.type === 'generic' ? brandColors.secondary : brandColors.accent,
          }]}>
            {item.type === 'generic' ? 'Generic' : 'Brand'}
          </Text>
        </View>
        <Icon source="chevron-right" size={18} color={colors.onSurfaceVariant} />
      </View>
    </Pressable>
  );

  const renderHeader = () => (
    <View>
      {/* Browse A-Z Letter Pills */}
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
                ({searchResults?.length ?? 0} medications)
              </Text>
            </View>
            <Button mode="outlined" compact onPress={handleClearSearch} labelStyle={styles.clearLabel}>
              Clear Search
            </Button>
          </>
        ) : (
          <>
            <Text variant="titleSmall" style={{ color: brandColors.primary, fontWeight: '700' }}>
              Drugs starting with "{selectedLetter}"
            </Text>
            {letterData && (
              <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                {allDrugs.length} of {letterData.totalElements} medications
              </Text>
            )}
          </>
        )}
      </View>

      {/* Loading state for first page */}
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
          Load More Drugs
        </Button>
      );
    }
    return null;
  };

  return (
    <ScreenWrapper scroll={false} padded={false}>
      {/* Hero Section - outside FlatList so keyboard stays open */}
      <LinearGradient
        colors={['#0D7377', '#095456']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Text style={styles.heroTitle}>Find Your Medication</Text>
        <Text style={styles.heroSubtitle}>
          Search for prescription medications by brand or generic name. Compare prices and save up to 80%.
        </Text>

        <View style={styles.heroSearchWrapper}>
          <Icon source="magnify" size={22} color={colors.onSurfaceVariant} />
          <RNTextInput
            ref={searchInputRef}
            placeholder="Search for a medication..."
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
        keyExtractor={(item, index) => `${item.slug}-${index}`}
        renderItem={renderDrugItem}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          !isLoadingData ? (
            <EmptyState
              icon="pill"
              title="No drugs found"
              message={
                isSearching
                  ? `No medications found for "${searchQuery}".`
                  : `No medications starting with "${selectedLetter}" were found.`
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

  // Drug Card
  drugCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing[2],
    marginBottom: spacing[1],
    padding: spacing[1.5],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  drugAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[1.5],
  },
  drugInitials: {
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  drugInfo: {
    flex: 1,
    gap: 2,
  },
  drugActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
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
