/**
 * Pharmacy Search Screen - Find a Pharmacy
 * Ported from Angular PharmacyPartnersComponent
 * Features: Location picker, search with filters, sort, pharmacy cards list
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { View, StyleSheet, FlatList, Pressable } from 'react-native';
import {
  Text,
  Button,
  Chip,
  ActivityIndicator,
  Searchbar,
  IconButton,
  Badge,
} from 'react-native-paper';
import { ScreenWrapper } from '@/components/ui';
import { EmptyState } from '@/components/ui/EmptyState';
import { PharmacyCard } from '@/components/cards/PharmacyCard';
import { LocationPicker } from '@/components/pharmacy/LocationPicker';
import { PharmacyFilters } from '@/components/pharmacy/PharmacyFilters';
import { useAppTheme } from '@/hooks/useAppTheme';
import { usePharmacySearchQuery } from '@/hooks/usePharmacySearch';
import { useLocation } from '@/hooks/useLocation';
import { usePharmacyStore } from '@/store/pharmacyStore';
import { spacing, borderRadius, fontSize } from '@/theme';
import type { PharmacyPriceSortOption, PharmacyPriceFilters, PharmacyWithDistance } from '@/types/pharmacy';

const SORT_OPTIONS: { value: PharmacyPriceSortOption; label: string; icon: string }[] = [
  { value: 'distance-asc', label: 'Nearest', icon: 'map-marker-distance' },
  { value: 'name-asc', label: 'Name', icon: 'sort-alphabetical-ascending' },
  { value: 'price-asc', label: 'Price', icon: 'sort-ascending' },
];

const PAGE_SIZE = 20;

export default function PharmacySearchScreen() {
  const { colors, brandColors } = useAppTheme();
  const { zipCode, latitude, longitude } = useLocation();

  // Store
  const sortOption = usePharmacyStore((s) => s.sortOption);
  const filters = usePharmacyStore((s) => s.filters);
  const setSortOption = usePharmacyStore((s) => s.setSortOption);
  const setFilters = usePharmacyStore((s) => s.setFilters);

  // Local state
  const [nameFilter, setNameFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);

  // Reset page when location or filters change
  useEffect(() => {
    setPage(0);
  }, [zipCode, filters]);

  // Build search params
  const searchParams = useMemo(() => {
    if (!zipCode) return null;
    return {
      zipCode,
      latitude,
      longitude,
      radius: filters.maxDistance ?? 25,
      page,
      size: PAGE_SIZE,
      chain: filters.chains?.length === 1 ? filters.chains[0] : undefined,
      is24Hours: filters.features?.is24Hours,
      hasDriveThrough: filters.features?.hasDriveThrough,
    };
  }, [zipCode, latitude, longitude, filters, page]);

  const { data, isLoading, isFetching, refetch } = usePharmacySearchQuery(searchParams);

  // Client-side sort and filter
  const sortedPharmacies = useMemo(() => {
    let list = data?.pharmacies ?? [];

    // Client-side chain filter for multi-chain selection
    if (filters.chains && filters.chains.length > 1) {
      list = list.filter((p) => filters.chains!.includes(p.chain));
    }

    // Feature filters (backup client-side filtering)
    if (filters.features?.is24Hours) {
      list = list.filter((p) => p.is24Hours);
    }
    if (filters.features?.hasDriveThrough) {
      list = list.filter((p) => p.hasDriveThrough);
    }
    if (filters.features?.hasHomeDelivery) {
      list = list.filter((p) => p.hasHomeDelivery);
    }

    // Name filter
    if (nameFilter.trim()) {
      const q = nameFilter.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.address.city.toLowerCase().includes(q),
      );
    }

    // Sort
    const sorted = [...list];
    switch (sortOption) {
      case 'distance-asc':
        sorted.sort((a, b) => a.distance - b.distance);
        break;
      case 'name-asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'price-asc':
        // Price sort is a placeholder — pharmacies don't have prices in search
        sorted.sort((a, b) => a.distance - b.distance);
        break;
      default:
        sorted.sort((a, b) => a.distance - b.distance);
    }

    return sorted;
  }, [data?.pharmacies, filters, nameFilter, sortOption]);

  const handleApplyFilters = useCallback(
    (newFilters: PharmacyPriceFilters) => {
      setFilters(newFilters);
    },
    [setFilters],
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.maxDistance && filters.maxDistance !== 25) count++;
    if (filters.chains?.length) count += filters.chains.length;
    if (filters.features?.is24Hours) count++;
    if (filters.features?.hasDriveThrough) count++;
    if (filters.features?.hasHomeDelivery) count++;
    return count;
  }, [filters]);

  const renderItem = useCallback(
    ({ item }: { item: PharmacyWithDistance }) => <PharmacyCard pharmacy={item} />,
    [],
  );

  return (
    <ScreenWrapper scroll={false} padded={false}>
      {/* Location Picker */}
      <View style={styles.locationSection}>
        <LocationPicker compact />
      </View>

      {/* Search + Filter Row */}
      <View style={styles.controlsRow}>
        <Searchbar
          value={nameFilter}
          onChangeText={setNameFilter}
          placeholder="Filter by name or city..."
          style={[styles.searchbar, { backgroundColor: colors.surfaceVariant }]}
          inputStyle={styles.searchInput}
          icon="magnify"
          elevation={0}
        />
        <View style={styles.filterButtonWrapper}>
          <IconButton
            icon="filter-variant"
            mode="contained"
            onPress={() => setShowFilters(true)}
            iconColor={activeFilterCount > 0 ? brandColors.primary : colors.onSurfaceVariant}
            containerColor={activeFilterCount > 0 ? brandColors.primaryLight : colors.surfaceVariant}
            size={20}
          />
          {activeFilterCount > 0 && (
            <Badge size={16} style={styles.filterBadge}>
              {activeFilterCount}
            </Badge>
          )}
        </View>
      </View>

      {/* Sort Chips */}
      <View style={styles.sortRow}>
        {SORT_OPTIONS.map((opt) => (
          <Chip
            key={opt.value}
            selected={sortOption === opt.value}
            onPress={() => setSortOption(opt.value)}
            icon={opt.icon}
            style={
              sortOption === opt.value
                ? { backgroundColor: brandColors.primaryLight }
                : undefined
            }
            textStyle={{
              color: sortOption === opt.value ? brandColors.primary : colors.onSurface,
              fontSize: fontSize.xs,
            }}
            showSelectedCheck={false}
            compact
          >
            {opt.label}
          </Chip>
        ))}
        {data?.total != null && (
          <Text variant="bodySmall" style={[styles.resultCount, { color: colors.onSurfaceVariant }]}>
            {data.total} pharmacies
          </Text>
        )}
      </View>

      {/* Results */}
      {isLoading && page === 0 ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant, marginTop: spacing[1] }}>
            Finding pharmacies near {zipCode}...
          </Text>
        </View>
      ) : sortedPharmacies.length === 0 ? (
        <EmptyState
          icon="map-marker-off"
          title="No pharmacies found"
          message={
            activeFilterCount > 0
              ? 'Try adjusting your filters or increasing the search radius.'
              : `No pharmacies found near ${zipCode}. Try a different location.`
          }
          actionLabel={activeFilterCount > 0 ? 'Clear Filters' : undefined}
          onAction={
            activeFilterCount > 0
              ? () => {
                  usePharmacyStore.getState().resetFilters();
                }
              : undefined
          }
        />
      ) : (
        <FlatList
          data={sortedPharmacies}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={isFetching && page === 0}
          onRefresh={() => refetch()}
          ListFooterComponent={
            isFetching && page > 0 ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={styles.loadMoreSpinner}
              />
            ) : null
          }
        />
      )}

      {/* Filter Modal */}
      <PharmacyFilters
        visible={showFilters}
        onDismiss={() => setShowFilters(false)}
        onApply={handleApplyFilters}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  locationSection: {
    paddingHorizontal: spacing[2],
    paddingTop: spacing[1],
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    gap: spacing[1],
  },
  searchbar: {
    flex: 1,
    borderRadius: borderRadius.md,
    height: 40,
  },
  searchInput: {
    fontSize: fontSize.sm,
    minHeight: 40,
  },
  filterButtonWrapper: {
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#DC2626',
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    paddingBottom: spacing[1],
    gap: spacing[1],
  },
  resultCount: {
    marginLeft: 'auto',
  },
  listContent: {
    paddingHorizontal: spacing[2],
    paddingBottom: spacing[4],
  },
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[4],
  },
  loadMoreSpinner: {
    padding: spacing[2],
  },
});
