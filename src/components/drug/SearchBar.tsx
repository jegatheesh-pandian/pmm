/**
 * SearchBar - Drug search with autocomplete dropdown
 * Ported from Angular hero-section search with keyboard nav, debounce
 */

import { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Keyboard } from 'react-native';
import { Searchbar, Text, ActivityIndicator, Divider, Icon } from 'react-native-paper';
import { router } from 'expo-router';
import { useDrugSearch } from '@/hooks/useDrugSearch';
import { useDrugStore } from '@/store/drugStore';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing, borderRadius, fontSize } from '@/theme';
import type { DrugSuggestion } from '@/types/drug';

interface SearchBarProps {
  placeholder?: string;
  autoFocus?: boolean;
}

export function SearchBar({
  placeholder = 'Search for a medication...',
  autoFocus = false,
}: SearchBarProps) {
  const { colors, brandColors } = useAppTheme();
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const addToHistory = useDrugStore((s) => s.addToHistory);

  const { data: suggestions, isLoading } = useDrugSearch(query, showDropdown);

  const handleChangeText = useCallback((text: string) => {
    setQuery(text);
    setShowDropdown(text.trim().length >= 2);
  }, []);

  const handleSelect = useCallback(
    (drug: DrugSuggestion) => {
      setQuery('');
      setShowDropdown(false);
      Keyboard.dismiss();
      addToHistory(drug.slug, drug.name);
      router.push(`/drugs/${drug.slug}`);
    },
    [addToHistory],
  );

  const handleSubmit = useCallback(() => {
    if (query.trim().length < 2) return;
    setShowDropdown(false);
    Keyboard.dismiss();
    // Navigate to search tab with query — handled by search screen
  }, [query]);

  const handleClear = useCallback(() => {
    setQuery('');
    setShowDropdown(false);
  }, []);

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder={placeholder}
        value={query}
        onChangeText={handleChangeText}
        onSubmitEditing={handleSubmit}
        onFocus={() => query.length >= 2 && setShowDropdown(true)}
        onClearIconPress={handleClear}
        autoFocus={autoFocus}
        multiline={false}
        numberOfLines={1}
        style={[styles.searchbar, { backgroundColor: colors.surface }]}
        inputStyle={styles.input}
        iconColor={colors.primary}
        placeholderTextColor={colors.onSurfaceVariant}
        accessibilityLabel="Search medications"
      />

      {/* Autocomplete Dropdown */}
      {showDropdown && (
        <View style={[styles.dropdown, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
          {isLoading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, marginLeft: spacing[1] }}>
                Searching...
              </Text>
            </View>
          )}

          {!isLoading && suggestions && suggestions.length === 0 && query.length >= 2 && (
            <View style={styles.emptyRow}>
              <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                No medications found for "{query}"
              </Text>
            </View>
          )}

          {!isLoading && suggestions && suggestions.length > 0 && (
            <ScrollView style={styles.list} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
              {suggestions.map((item, index) => (
                <View key={item.slug}>
                  {index > 0 && <Divider />}
                  <Pressable
                    onPress={() => handleSelect(item)}
                    style={({ pressed }) => [
                      styles.suggestionRow,
                      pressed && { backgroundColor: colors.surfaceVariant },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`${item.name}${item.genericName !== item.name ? `, generic: ${item.genericName}` : ''}`}
                  >
                    <Icon source="pill" size={18} color={colors.primary} />
                    <View style={styles.suggestionText}>
                      <Text variant="bodyMedium" style={{ color: colors.onSurface }} numberOfLines={1}>
                        {item.name}
                      </Text>
                      {item.genericName && item.genericName !== item.name && (
                        <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }} numberOfLines={1}>
                          {item.genericName}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 10,
  },
  searchbar: {
    borderRadius: borderRadius.lg,
    elevation: 2,
  },
  input: {
    fontSize: fontSize.base,
  },
  dropdown: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    maxHeight: 300,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  list: {
    maxHeight: 280,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1.5],
    gap: spacing[1.5],
  },
  suggestionText: {
    flex: 1,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[2],
  },
  emptyRow: {
    padding: spacing[2],
    alignItems: 'center',
  },
});
