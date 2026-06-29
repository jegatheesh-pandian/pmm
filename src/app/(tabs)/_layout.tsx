/**
 * Tab Layout - Bottom tab navigation
 * 4 tabs: Home, Search, Conditions, Account
 * Theme-aware colors, proper icons via MaterialCommunityIcons
 */

import { Tabs } from 'expo-router';
import { Icon } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function TabLayout() {
  const { colors, brandColors } = useAppTheme();
  const insets = useSafeAreaInsets();

  // Reserve the device's bottom safe-area inset (Android nav bar / iOS home
  // indicator) so the tab bar sits above the system navigation and its tap
  // targets don't overlap the OS back/home/recents controls.
  const TAB_BAR_CONTENT_HEIGHT = 60;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.outlineVariant,
          borderTopWidth: 1,
          height: TAB_BAR_CONTENT_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom + 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Icon source="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => (
            <Icon source="magnify" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="conditions"
        options={{
          title: 'Conditions',
          tabBarIcon: ({ color, size }) => (
            <Icon source="heart-pulse" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, size }) => (
            <Icon source="account-circle" size={size} color={color} />
          ),
        }}
      />
      {/* Hidden from tab bar — nested inside tabs to keep tab bar visible */}
      <Tabs.Screen name="drugs" options={{ href: null }} />
      <Tabs.Screen name="pharmacies" options={{ href: null }} />
      <Tabs.Screen name="coupons" options={{ href: null }} />
    </Tabs>
  );
}
