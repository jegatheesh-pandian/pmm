/**
 * Price Alerts Screen
 * Ported from Angular AlertsComponent (3,821 LOC)
 * Shows active price alerts, notifications tab, manage alerts
 */

import { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
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
import { useAppTheme } from '@/hooks/useAppTheme';
import { useUserProfile } from '@/hooks/useAccount';
import { formatPrice, formatDate } from '@/utils/formatting';
import { spacing, borderRadius, fontSize } from '@/theme';
import type { PriceAlert } from '@/types/user';

type TabValue = 'alerts' | 'notifications';

const ALERT_TYPE_LABELS: Record<string, string> = {
  any_drop: 'Any Price Drop',
  below_threshold: 'Below Target',
  percent_drop: 'Percent Drop',
};

export default function AlertsScreen() {
  const { colors, brandColors } = useAppTheme();
  const { data: profile, isLoading } = useUserProfile();

  const [activeTab, setActiveTab] = useState<TabValue>('alerts');

  const alerts = profile?.priceAlerts ?? [];
  const activeAlerts = alerts.filter((a) => a.isActive);
  const triggeredAlerts = alerts.filter((a) => a.lastTriggeredAt);

  const stats = useMemo(() => ({
    total: alerts.length,
    active: activeAlerts.length,
    triggered: triggeredAlerts.length,
  }), [alerts, activeAlerts, triggeredAlerts]);

  const renderAlert = useCallback(
    ({ item }: { item: PriceAlert }) => (
      <Surface style={[styles.alertCard, { backgroundColor: colors.surface }]} elevation={1}>
        <Pressable
          onPress={() => {
            const slug = item.drugName.toLowerCase().replace(/\s+/g, '-');
            router.push(`/drugs/${slug}`);
          }}
          accessibilityRole="button"
        >
          <View style={styles.alertHeader}>
            <View style={[styles.alertAvatar, { backgroundColor: brandColors.primaryLight }]}>
              <Text style={{ color: brandColors.primary, fontWeight: '700', fontSize: 11 }}>
                {item.drugName.slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={styles.alertInfo}>
              <Text variant="titleSmall" style={{ color: colors.onSurface }} numberOfLines={1}>
                {item.drugName}
              </Text>
              <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                {item.form} {item.dosage} | Qty: {item.quantity}
              </Text>
            </View>
            <View style={styles.alertStatus}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: item.isActive ? brandColors.secondary : colors.outlineVariant },
                ]}
              />
              <Text
                variant="labelSmall"
                style={{
                  color: item.isActive ? brandColors.secondary : colors.onSurfaceVariant,
                }}
              >
                {item.isActive ? 'Active' : 'Paused'}
              </Text>
            </View>
          </View>

          {/* Alert Config */}
          <View style={styles.alertTags}>
            <Chip
              compact
              icon="bell"
              textStyle={{ fontSize: 10, color: brandColors.primary }}
              style={{ backgroundColor: brandColors.primaryLight }}
            >
              {ALERT_TYPE_LABELS[item.alertType] ?? item.alertType}
            </Chip>
            {item.threshold != null && (
              <Chip compact textStyle={{ fontSize: 10 }}>
                Target: {formatPrice(item.threshold)}
              </Chip>
            )}
            {item.percentThreshold != null && (
              <Chip compact textStyle={{ fontSize: 10 }}>
                {item.percentThreshold}% drop
              </Chip>
            )}
          </View>

          {/* Channels */}
          <View style={styles.channelRow}>
            {item.deliveryChannels.map((ch) => (
              <View key={ch} style={[styles.channelBadge, { backgroundColor: colors.surfaceVariant }]}>
                <Icon
                  source={ch === 'email' ? 'email' : ch === 'sms' ? 'message-text' : 'bell'}
                  size={12}
                  color={colors.onSurfaceVariant}
                />
                <Text style={{ fontSize: 10, color: colors.onSurfaceVariant, marginLeft: 2 }}>
                  {ch.toUpperCase()}
                </Text>
              </View>
            ))}
          </View>

          {/* Last Triggered */}
          {item.lastTriggeredAt && (
            <Text variant="bodySmall" style={{ color: brandColors.secondary, marginTop: spacing[1] }}>
              Last triggered: {formatDate(item.lastTriggeredAt)}
            </Text>
          )}
        </Pressable>
      </Surface>
    ),
    [colors, brandColors],
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
      {/* Stats */}
      <View style={styles.statsRow}>
        <SummaryCard icon="bell-ring" iconColor="#F59E0B" label="Total" value={stats.total} />
        <SummaryCard icon="bell-check" iconColor={brandColors.secondary} label="Active" value={stats.active} />
        <SummaryCard icon="bell-alert" iconColor="#DC2626" label="Triggered" value={stats.triggered} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as TabValue)}
          buttons={[
            { value: 'alerts', label: 'My Alerts', icon: 'bell' },
            { value: 'notifications', label: 'Notifications', icon: 'bell-ring' },
          ]}
        />
      </View>

      {activeTab === 'alerts' ? (
        alerts.length === 0 ? (
          <EmptyState
            icon="bell-off"
            title="No price alerts"
            message="Save a medication and enable price alerts to get notified when prices drop."
            actionLabel="Search Drugs"
            onAction={() => router.push('/(tabs)/search')}
          />
        ) : (
          <FlatList
            data={alerts}
            keyExtractor={(item) => item.id}
            renderItem={renderAlert}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )
      ) : (
        /* Notifications tab - show triggered alerts */
        triggeredAlerts.length === 0 ? (
          <EmptyState
            icon="bell-sleep"
            title="No notifications yet"
            message="When your price alerts are triggered, notifications will appear here."
          />
        ) : (
          <FlatList
            data={triggeredAlerts}
            keyExtractor={(item) => item.id}
            renderItem={renderAlert}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )
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
  statsRow: {
    flexDirection: 'row',
    gap: spacing[1],
    padding: spacing[2],
  },
  tabContainer: {
    paddingHorizontal: spacing[2],
    marginBottom: spacing[1],
  },
  listContent: {
    paddingHorizontal: spacing[2],
    paddingBottom: spacing[4],
  },
  alertCard: {
    borderRadius: borderRadius.lg,
    padding: spacing[2],
    marginBottom: spacing[1],
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertAvatar: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[1],
  },
  alertInfo: {
    flex: 1,
    gap: 2,
  },
  alertStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  alertTags: {
    flexDirection: 'row',
    gap: spacing[1],
    marginTop: spacing[1],
    flexWrap: 'wrap',
  },
  channelRow: {
    flexDirection: 'row',
    gap: spacing[1],
    marginTop: spacing[1],
  },
  channelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
});
