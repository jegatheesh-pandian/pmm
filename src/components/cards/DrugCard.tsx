/**
 * DrugCard - Drug search result card
 * Shows drug name, type badge, class, and navigation to pricing page
 */

import { Pressable, View, StyleSheet } from 'react-native';
import { Text, Surface, Chip } from 'react-native-paper';
import { router } from 'expo-router';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing, borderRadius, fontSize } from '@/theme';
import type { DrugSuggestion } from '@/types/drug';

interface DrugCardProps {
  drug: DrugSuggestion;
  onPress?: () => void;
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function DrugCard({ drug, onPress }: DrugCardProps) {
  const { colors, brandColors } = useAppTheme();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/drugs/${drug.slug}`);
    }
  };

  return (
    <Pressable onPress={handlePress} accessibilityRole="button" accessibilityLabel={drug.name}>
      <Surface style={[styles.card, { backgroundColor: colors.surface }]} elevation={1}>
        <View style={[styles.avatar, { backgroundColor: brandColors.primaryLight }]}>
          <Text style={[styles.initials, { color: brandColors.primary }]}>
            {getInitials(drug.name)}
          </Text>
        </View>
        <View style={styles.info}>
          <Text variant="titleSmall" style={{ color: colors.onSurface }} numberOfLines={1}>
            {drug.name}
          </Text>
          {drug.genericName && drug.genericName !== drug.name && (
            <Text
              variant="bodySmall"
              style={{ color: colors.onSurfaceVariant }}
              numberOfLines={1}
            >
              {drug.genericName}
            </Text>
          )}
        </View>
        <Chip
          compact
          textStyle={styles.chipText}
          style={[
            styles.chip,
            {
              backgroundColor:
                drug.type === 'generic' ? brandColors.secondaryLight : brandColors.accentLight,
            },
          ]}
        >
          {drug.type === 'generic' ? 'Generic' : 'Brand'}
        </Chip>
      </Surface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[1.5],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[1],
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[1.5],
  },
  initials: {
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    marginRight: spacing[1],
  },
  chip: {
    height: 24,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
