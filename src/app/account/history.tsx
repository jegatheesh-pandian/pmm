/**
 * Savings History Screen
 * Ported from Angular HistoryComponent
 * Shows: savings stats, coupon history, top savings insights
 */

import { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, FlatList, Pressable } from 'react-native';
import {
  Text,
  Surface,
  Button,
  Icon,
  Chip,
  ActivityIndicator,
  SegmentedButtons,
  Divider,
} from 'react-native-paper';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/ui';
import { EmptyState } from '@/components/ui/EmptyState';
import { SummaryCard } from '@/components/account/SummaryCard';
import { RecentActivityCard } from '@/components/account/RecentActivityCard';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useUserProfile } from '@/hooks/useAccount';
import { useCouponStore } from '@/store/couponStore';
import { formatPrice, formatDate } from '@/utils/formatting';
import { spacing, borderRadius, fontSize } from '@/theme';
import type { CouponHistoryEntry } from '@/types/user';

type TabValue = 'all' | 'top';

export default function HistoryScreen() {
  const { colors, brandColors } = useAppTheme();
  const { data: profile, isLoading } = useUserProfile();
  const savedCoupons = useCouponStore((s) => s.savedCoupons);

  const [activeTab, setActiveTab] = useState<TabValue>('all');

  const history = profile?.couponHistory ?? [];

  // Stats
  const stats = useMemo(() => {
    const totalSavings = profile?.totalSavings ?? history.reduce((sum, e) => sum + e.savingsAmount, 0);
    const couponsUsed = history.length || savedCoupons.length;
    const avgSaving = couponsUsed > 0 ? totalSavings / couponsUsed : 0;

    // This month
    const now = new Date();
    const thisMonth = history.filter((e) => {
      const d = new Date(e.generatedAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const monthSavings = thisMonth.reduce((sum, e) => sum + e.savingsAmount, 0);

    return { totalSavings, couponsUsed, avgSaving, monthSavings, thisMonthCount: thisMonth.length };
  }, [profile, history, savedCoupons]);

  // Top savings insights
  const insights = useMemo(() => {
    if (history.length === 0) return null;

    const biggest = [...history].sort((a, b) => b.savingsAmount - a.savingsAmount)[0];
    const bestPercent = [...history].sort((a, b) => b.savingsPercent - a.savingsPercent)[0];

    // Most used medication
    const drugCounts: Record<string, number> = {};
    history.forEach((e) => {
      drugCounts[e.drugName] = (drugCounts[e.drugName] ?? 0) + 1;
    });
    const mostUsedDrug = Object.entries(drugCounts).sort((a, b) => b[1] - a[1])[0];

    // Favorite pharmacy
    const pharmCounts: Record<string, number> = {};
    history.forEach((e) => {
      pharmCounts[e.pharmacyName] = (pharmCounts[e.pharmacyName] ?? 0) + 1;
    });
    const favPharmacy = Object.entries(pharmCounts).sort((a, b) => b[1] - a[1])[0];

    return { biggest, bestPercent, mostUsedDrug, favPharmacy };
  }, [history]);

  const renderHistoryItem = useCallback(
    ({ item }: { item: CouponHistoryEntry }) => (
      <View>
        <RecentActivityCard entry={item} />
        <Divider />
      </View>
    ),
    [],
  );

  if (isLoading) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper scroll={false} padded={false}>
      {/* Hero Stats */}
      <Surface style={[styles.heroCard, { backgroundColor: brandColors.secondaryLight }]} elevation={0}>
        <Icon source="piggy-bank" size={28} color={brandColors.secondary} />
        <Text style={[styles.heroValue, { color: brandColors.secondary }]}>
          {formatPrice(stats.totalSavings)}
        </Text>
        <Text variant="bodySmall" style={{ color: brandColors.secondary }}>
          Total Lifetime Savings
        </Text>
      </Surface>

      <View style={styles.statsRow}>
        <SummaryCard
          icon="ticket-percent"
          iconColor="#7C3AED"
          label="Coupons"
          value={stats.couponsUsed}
        />
        <SummaryCard
          icon="chart-line"
          iconColor={brandColors.primary}
          label="Avg Saving"
          value={formatPrice(stats.avgSaving)}
        />
        <SummaryCard
          icon="calendar-month"
          iconColor="#F59E0B"
          label="This Month"
          value={formatPrice(stats.monthSavings)}
          subtitle={`${stats.thisMonthCount} coupons`}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as TabValue)}
          buttons={[
            { value: 'all', label: 'All Coupons', icon: 'format-list-bulleted' },
            { value: 'top', label: 'Top Savings', icon: 'trophy' },
          ]}
        />
      </View>

      {activeTab === 'all' ? (
        history.length === 0 ? (
          <EmptyState
            icon="history"
            title="No history yet"
            message="Your coupon history will appear here as you use coupons at pharmacies."
            actionLabel="Search Drugs"
            onAction={() => router.push('/(tabs)/search')}
          />
        ) : (
          <FlatList
            data={history}
            keyExtractor={(item) => item.id}
            renderItem={renderHistoryItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )
      ) : (
        /* Top Savings Insights */
        <View style={styles.insightsContent}>
          {insights ? (
            <>
              {insights.biggest && (
                <Surface style={[styles.insightCard, { backgroundColor: colors.surface }]} elevation={1}>
                  <Icon source="trophy" size={24} color="#F59E0B" />
                  <View style={styles.insightInfo}>
                    <Text variant="labelMedium" style={{ color: colors.onSurfaceVariant }}>
                      Biggest Saving
                    </Text>
                    <Text variant="titleSmall" style={{ color: colors.onSurface, fontWeight: '700' }}>
                      {formatPrice(insights.biggest.savingsAmount)} on {insights.biggest.drugName}
                    </Text>
                    <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                      at {insights.biggest.pharmacyName}
                    </Text>
                  </View>
                </Surface>
              )}

              {insights.bestPercent && (
                <Surface style={[styles.insightCard, { backgroundColor: colors.surface }]} elevation={1}>
                  <Icon source="percent" size={24} color={brandColors.secondary} />
                  <View style={styles.insightInfo}>
                    <Text variant="labelMedium" style={{ color: colors.onSurfaceVariant }}>
                      Best Percentage
                    </Text>
                    <Text variant="titleSmall" style={{ color: colors.onSurface, fontWeight: '700' }}>
                      {Math.round(insights.bestPercent.savingsPercent)}% off {insights.bestPercent.drugName}
                    </Text>
                  </View>
                </Surface>
              )}

              {insights.mostUsedDrug && (
                <Surface style={[styles.insightCard, { backgroundColor: colors.surface }]} elevation={1}>
                  <Icon source="pill" size={24} color={brandColors.primary} />
                  <View style={styles.insightInfo}>
                    <Text variant="labelMedium" style={{ color: colors.onSurfaceVariant }}>
                      Most Used Medication
                    </Text>
                    <Text variant="titleSmall" style={{ color: colors.onSurface, fontWeight: '700' }}>
                      {insights.mostUsedDrug[0]} ({insights.mostUsedDrug[1]} times)
                    </Text>
                  </View>
                </Surface>
              )}

              {insights.favPharmacy && (
                <Surface style={[styles.insightCard, { backgroundColor: colors.surface }]} elevation={1}>
                  <Icon source="store" size={24} color="#7C3AED" />
                  <View style={styles.insightInfo}>
                    <Text variant="labelMedium" style={{ color: colors.onSurfaceVariant }}>
                      Favorite Pharmacy
                    </Text>
                    <Text variant="titleSmall" style={{ color: colors.onSurface, fontWeight: '700' }}>
                      {insights.favPharmacy[0]} ({insights.favPharmacy[1]} visits)
                    </Text>
                  </View>
                </Surface>
              )}
            </>
          ) : (
            <EmptyState
              icon="trophy-outline"
              title="No insights yet"
              message="Use more coupons to see your top savings insights."
            />
          )}
        </View>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroCard: {
    margin: spacing[2],
    borderRadius: borderRadius.lg,
    padding: spacing[2],
    alignItems: 'center',
    gap: 4,
  },
  heroValue: {
    fontSize: 32,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing[1],
    paddingHorizontal: spacing[2],
  },
  tabContainer: {
    paddingHorizontal: spacing[2],
    marginTop: spacing[2],
    marginBottom: spacing[1],
  },
  listContent: {
    paddingHorizontal: spacing[2],
    paddingBottom: spacing[4],
  },
  insightsContent: {
    paddingHorizontal: spacing[2],
    paddingBottom: spacing[4],
    gap: spacing[1],
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    padding: spacing[2],
    gap: spacing[2],
  },
  insightInfo: {
    flex: 1,
    gap: 2,
  },
});
