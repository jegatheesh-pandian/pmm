/**
 * Home Screen
 * Matches PriceMyMeds.com website layout:
 * Hero + Search, Popular Meds, Value Props, How It Works,
 * Benefits, Pharmacy Logos, Testimonials, Stats
 */

import { useCallback, useState } from 'react';
import { View, StyleSheet, Pressable, Dimensions, ActivityIndicator, Image } from 'react-native';
import { Text, Surface, Icon, Button, TextInput, HelperText } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '@/components/ui';
import { SearchBar } from '@/components/drug/SearchBar';
import { useAppTheme } from '@/hooks/useAppTheme';
import { usePopularDrugs } from '@/hooks/useDrugSearch';
import { useTopConditions } from '@/hooks/useConditions';
import { couponApi } from '@/services/api/couponApi';
import { spacing, borderRadius } from '@/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Popular Medications ────────────────────────────────────────
const POPULAR_MEDS = [
  { name: 'Amoxicillin', form: 'Capsule', dosage: '500mg', slug: 'amoxicillin', icon: 'pill' },
  { name: 'Sertraline HCl', form: 'Tablet', dosage: '50mg', slug: 'sertraline-hcl', icon: 'pill' },
  { name: 'Tamsulosin HCl', form: 'Capsule', dosage: '0.4mg', slug: 'tamsulosin-hcl', icon: 'pill' },
  { name: 'Penicillin G Potas...', form: 'For Solution', dosage: '500ML', slug: 'penicillin-g-potassium', icon: 'pill' },
  { name: 'Amoxapine', form: 'Tablet', dosage: '50mg', slug: 'amoxapine', icon: 'pill' },
  { name: 'Levothyroxine Sod...', form: 'Tablet', dosage: '0.4mg', slug: 'levothyroxine-sodium', icon: 'pill' },
];

// ── How It Works Steps ─────────────────────────────────────────
const STEPS = [
  { icon: 'magnify', title: 'Search Your Drug', desc: 'Enter your medication name and we\'ll find the best prices near you.', color: '#0D7377' },
  { icon: 'compare-horizontal', title: 'Compare Prices', desc: 'See prices at pharmacies nearby and choose the best deal for you.', color: '#2E8540' },
  { icon: 'ticket-percent', title: 'Get Your Coupon', desc: 'Show your free coupon at the pharmacy and save instantly.', color: '#B45309' },
];

// ── Value Props ────────────────────────────────────────────────
const VALUE_PROPS = [
  { icon: 'tag-multiple', title: 'Save Up to 80%', desc: 'Our coupons often beat insurance copays. Compare prices and save big.', color: '#0D7377' },
  { icon: 'currency-usd-off', title: '100% Free Forever', desc: 'No membership fees, no hidden costs. Just show your coupon at the pharmacy.', color: '#2E8540' },
  { icon: 'store-plus', title: '70,000+ Pharmacies', desc: 'Accepted at major chains including CVS, Walgreens, Walmart, Kroger, and more.', color: '#7C3AED' },
  { icon: 'flash', title: 'Instant Coupons', desc: 'Get your discount coupon in seconds. Print, email, or show it on your phone.', color: '#B45309' },
  { icon: 'shield-lock', title: 'Privacy Protected', desc: 'We never sell your personal health information. Your data stays private.', color: '#DC2626' },
];

// ── Pharmacy Chains ────────────────────────────────────────────
const PHARMACY_CHAINS = [
  { name: 'CVS', logo: require('@/assets/images/pharmacy/CVS.png') },
  { name: 'Walgreens', logo: require('@/assets/images/pharmacy/WALGREENS.png') },
  { name: 'Walmart', logo: require('@/assets/images/pharmacy/WALMART.png') },
  { name: 'Costco', logo: require('@/assets/images/pharmacy/COSTCO.png') },
  { name: 'Kroger', logo: require('@/assets/images/pharmacy/KROGER.png') },
  { name: 'Target', logo: require('@/assets/images/pharmacy/TARGET.png') },
  { name: 'Publix', logo: require('@/assets/images/pharmacy/PUBLIX.png') },
  { name: 'Albertsons', logo: require('@/assets/images/pharmacy/ALBERTSONS.png') },
  { name: 'Safeway', logo: require('@/assets/images/pharmacy/SAFEWAY.png') },
  { name: 'H-E-B', logo: require('@/assets/images/pharmacy/HEB.png') },
];

// ── Testimonials ───────────────────────────────────────────────
const TESTIMONIALS = [
  { name: 'Sarah M.', savings: '$345', rating: 5, drug: 'Atorvastatin 40mg', text: 'I couldn\'t believe it when my Lipitor went from $360 to just $15! This service has been a lifesaver for our family\'s budget.' },
  { name: 'Michael R.', savings: '$891', rating: 5, drug: 'Lisinopril 20mg', text: 'As a senior without insurance, I was paying a fortune for my blood pressure medication. Now I pay less than a copay would be!' },
  { name: 'Jennifer L.', savings: '$142', rating: 5, drug: 'Metformin 1000mg', text: 'The process is so simple...just search, compare, and show the coupon at the pharmacy. I recommend it to everyone I know.' },
];

// ── Stats ──────────────────────────────────────────────────────
const STATS = [
  { value: '4.8', label: 'Average Rating', icon: 'star' },
  { value: '10M+', label: 'Customers Helped', icon: 'account-group' },
  { value: '$2B+', label: 'Total Savings', icon: 'piggy-bank' },
];

export default function HomeScreen() {
  const { colors, brandColors } = useAppTheme();
  const router = useRouter();
  const { data: popularDrugs, isLoading: drugsLoading } = usePopularDrugs();
  const { data: topConditions, isLoading: conditionsLoading } = useTopConditions();

  // Use API data, fall back to hardcoded only if API fails
  const meds = (popularDrugs && popularDrugs.length > 0)
    ? popularDrugs.slice(0, 6).map((d) => ({
        name: d.name,
        form: d.defaultForm ?? d.forms?.[0] ?? 'Tablet',
        dosage: d.defaultDosage ?? d.dosages?.[0] ?? '',
        slug: d.slug,
        icon: 'pill' as const,
      }))
    : POPULAR_MEDS;

  const conditions = topConditions?.slice(0, 8) ?? [];

  const handleBrowseMeds = useCallback(() => {
    router.push('/(tabs)/search');
  }, [router]);

  const handleBrowseConditions = useCallback(() => {
    router.push('/(tabs)/conditions');
  }, [router]);

  // Newsletter subscription
  const [subscribeEmail, setSubscribeEmail] = useState('');
  const [subscribeState, setSubscribeState] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [subscribeError, setSubscribeError] = useState('');

  const handleSubscribe = useCallback(async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(subscribeEmail)) {
      setSubscribeError('Please enter a valid email address');
      return;
    }
    setSubscribeState('sending');
    setSubscribeError('');
    try {
      await couponApi.captureCouponLead({
        email: subscribeEmail,
        couponDrugName: 'newsletter',
        deliveryMethod: 'email',
        marketingEmailConsent: true,
      });
      setSubscribeState('success');
    } catch {
      setSubscribeState('error');
      setSubscribeError('Failed to subscribe. Please try again.');
    }
  }, [subscribeEmail]);

  return (
    <ScreenWrapper scroll padded={false}>
      {/* ── Hero Section ──────────────────────────────────────── */}
      <View style={[styles.hero, { backgroundColor: brandColors.primaryLight }]}>
        <View style={styles.trustBadge}>
          <Icon source="shield-check" size={14} color={brandColors.primary} />
          <Text variant="labelSmall" style={{ color: brandColors.primary, marginLeft: 4 }}>
            Trusted by 10+ million Americans
          </Text>
        </View>

        <Text variant="headlineMedium" style={[styles.heroTitle, { color: colors.onSurface }]}>
          Save Up to{' '}
          <Text style={{ color: brandColors.primary, fontWeight: '800' }}>80%</Text>
          {' '}on Prescriptions
        </Text>

        <Text variant="bodyMedium" style={[styles.heroSubtitle, { color: colors.onSurfaceVariant }]}>
          Compare prices at pharmacies near you and get free discount coupons. No hidden fees.
        </Text>

        <View style={styles.searchContainer}>
          <SearchBar placeholder="Enter drug name e.g. Lisinopril, Metformin..." />
        </View>

        <View style={styles.privacyRow}>
          <Icon source="lock" size={12} color={colors.onSurfaceVariant} />
          <Text variant="labelSmall" style={{ color: colors.onSurfaceVariant, marginLeft: 4 }}>
            We never sell your health data. Your privacy is protected.
          </Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <View style={styles.quickStat}>
            <Text variant="titleMedium" style={{ color: brandColors.primary, fontWeight: '700' }}>$1,230+</Text>
            <Text variant="labelSmall" style={{ color: colors.onSurfaceVariant }}>Average yearly savings</Text>
          </View>
          <View style={styles.quickStat}>
            <Text variant="titleMedium" style={{ color: brandColors.primary, fontWeight: '700' }}>70,000+</Text>
            <Text variant="labelSmall" style={{ color: colors.onSurfaceVariant }}>Pharmacies nationwide</Text>
          </View>
          <View style={styles.quickStat}>
            <Text variant="titleMedium" style={{ color: brandColors.primary, fontWeight: '700' }}>Free</Text>
            <Text variant="labelSmall" style={{ color: colors.onSurfaceVariant }}>Always, no catches</Text>
          </View>
        </View>
      </View>

      {/* ── Popular Medications ────────────────────────────────── */}
      <View style={styles.section}>
        <Text variant="titleLarge" style={[styles.sectionTitle, { color: colors.onSurface }]}>
          Popular Medications
        </Text>
        <Text variant="bodySmall" style={[styles.sectionSubtitle, { color: colors.onSurfaceVariant }]}>
          Find the best prices on commonly prescribed medications
        </Text>

        {drugsLoading && (
          <View style={styles.loadingSection}>
            <ActivityIndicator size="small" color={brandColors.primary} />
            <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, marginLeft: 8 }}>Loading medications...</Text>
          </View>
        )}
        <View style={styles.medsGrid}>
          {meds.map((med, i) => (
            <Pressable
              key={med.slug ?? i}
              onPress={() => router.push(`/drugs/${med.slug}`)}
              style={({ pressed }) => [
                styles.medCard,
                { backgroundColor: colors.surface, borderColor: pressed ? brandColors.primary : colors.outlineVariant },
              ]}
            >
              <View style={[styles.medIcon, { backgroundColor: brandColors.primaryLight }]}>
                <Icon source="pill" size={18} color={brandColors.primary} />
              </View>
              <View style={styles.medInfo}>
                <Text variant="bodyMedium" style={{ color: colors.onSurface, fontWeight: '600' }} numberOfLines={1}>
                  {med.name}
                </Text>
                <Text variant="labelSmall" style={{ color: colors.onSurfaceVariant }}>
                  {med.form} · {med.dosage}
                </Text>
              </View>
              <Icon source="chevron-right" size={18} color={colors.onSurfaceVariant} />
            </Pressable>
          ))}
        </View>

        <Button
          mode="text"
          icon="arrow-right"
          onPress={handleBrowseMeds}
          contentStyle={{ flexDirection: 'row-reverse' }}
          style={styles.browseButton}
        >
          Browse all medications
        </Button>
      </View>

      {/* ── Top Conditions ──────────────────────────────────────── */}
      {conditions.length > 0 && (
        <View style={styles.section}>
          <Text variant="titleLarge" style={[styles.sectionTitle, { color: colors.onSurface }]}>
            Browse by Health Condition
          </Text>
          <Text variant="bodySmall" style={[styles.sectionSubtitle, { color: colors.onSurfaceVariant }]}>
            Find medications for common health conditions
          </Text>

          <View style={styles.conditionsGrid}>
            {conditions.map((cond) => (
              <Pressable
                key={cond.conditionId || cond.slug}
                onPress={() => router.push(`/conditions/${cond.slug}`)}
                style={({ pressed }) => [
                  styles.conditionCard,
                  { backgroundColor: pressed ? brandColors.primaryLight : colors.surface, borderColor: colors.outlineVariant },
                ]}
              >
                <View style={[styles.conditionIcon, { backgroundColor: brandColors.primaryLight }]}>
                  <Icon source="medical-bag" size={20} color={brandColors.primary} />
                </View>
                <Text variant="bodySmall" style={{ color: colors.onSurface, fontWeight: '600', textAlign: 'center' }} numberOfLines={2}>
                  {cond.conditionName}
                </Text>
              </Pressable>
            ))}
          </View>

          <Button
            mode="text"
            icon="arrow-right"
            onPress={handleBrowseConditions}
            contentStyle={{ flexDirection: 'row-reverse' }}
            style={styles.browseButton}
          >
            Browse all conditions
          </Button>
        </View>
      )}
      {conditionsLoading && (
        <View style={styles.loadingSection}>
          <ActivityIndicator size="small" color={brandColors.primary} />
          <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, marginLeft: 8 }}>Loading conditions...</Text>
        </View>
      )}

      {/* ── Best Price Banner ─────────────────────────────────── */}
      <Surface style={[styles.banner, { backgroundColor: brandColors.primary }]} elevation={2}>
        <Icon source="check-decagram" size={28} color="#FFFFFF" />
        <Text variant="titleMedium" style={styles.bannerTitle}>Best Price Available</Text>
        <Text variant="bodySmall" style={styles.bannerText}>
          One search. All the top savings networks. We compare prices automatically so you always get the lowest price available.
        </Text>
        <View style={styles.bannerChips}>
          {['One search, multiple savings networks', 'No switching between apps', 'Lowest price available'].map((t, i) => (
            <View key={i} style={styles.bannerChip}>
              <Icon source="check" size={14} color="#FFFFFF" />
              <Text variant="labelSmall" style={{ color: '#FFFFFF', marginLeft: 4 }}>{t}</Text>
            </View>
          ))}
        </View>
      </Surface>

      {/* ── How It Works ──────────────────────────────────────── */}
      <View style={styles.section}>
        <Text variant="titleLarge" style={[styles.sectionTitle, { color: colors.onSurface }]}>
          How It Works
        </Text>
        <Text variant="bodySmall" style={[styles.sectionSubtitle, { color: colors.onSurfaceVariant }]}>
          Start saving on your prescriptions in three simple steps
        </Text>

        {STEPS.map((step, i) => (
          <View key={i} style={styles.stepRow}>
            <View style={[styles.stepNumber, { backgroundColor: step.color }]}>
              <Text variant="titleMedium" style={{ color: '#FFFFFF', fontWeight: '700' }}>{i + 1}</Text>
            </View>
            <View style={styles.stepContent}>
              <Text variant="titleSmall" style={{ color: colors.onSurface, fontWeight: '700' }}>
                {step.title}
              </Text>
              <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, marginTop: 2 }}>
                {step.desc}
              </Text>
            </View>
          </View>
        ))}

        <Button
          mode="contained"
          icon="magnify"
          onPress={handleBrowseMeds}
          style={styles.ctaButton}
          contentStyle={styles.ctaContent}
        >
          Search for your medication now
        </Button>
      </View>

      {/* ── Value Props ───────────────────────────────────────── */}
      <View style={[styles.section, { backgroundColor: brandColors.primaryLight }]}>
        <View style={[styles.whyChooseBadge, { backgroundColor: brandColors.primaryLight, borderColor: brandColors.primary }]}>
          <Text variant="labelSmall" style={{ color: brandColors.primary, fontWeight: '700' }}>
            Why Choose Us
          </Text>
        </View>
        <Text variant="titleLarge" style={[styles.sectionTitle, { color: colors.onSurface }]}>
          The Smartest Way to Save on Prescriptions
        </Text>
        <Text variant="bodySmall" style={[styles.sectionSubtitle, { color: colors.onSurfaceVariant }]}>
          Join millions of Americans who save money on their medications
        </Text>

        <View style={styles.propsGrid}>
          {VALUE_PROPS.map((prop, i) => (
            <Surface key={i} style={[styles.propCard, { backgroundColor: colors.surface }]} elevation={1}>
              <View style={styles.propHeader}>
                <View style={[styles.propIcon, { backgroundColor: prop.color + '15' }]}>
                  <Icon source={prop.icon} size={22} color={prop.color} />
                </View>
                <Text variant="titleSmall" style={{ color: colors.onSurface, fontWeight: '700', flex: 1 }}>
                  {prop.title}
                </Text>
              </View>
              <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, marginTop: spacing[1] }}>
                {prop.desc}
              </Text>
            </Surface>
          ))}
        </View>
      </View>

      {/* ── Pharmacy Chains ───────────────────────────────────── */}
      <View style={styles.section}>
        <Text variant="titleLarge" style={[styles.sectionTitle, { color: colors.onSurface }]}>
          Accepted at 70,000+ Pharmacies
        </Text>
        <Text variant="bodySmall" style={[styles.sectionSubtitle, { color: colors.onSurfaceVariant }]}>
          Your PriceMyMeds coupon works at all major pharmacy chains
        </Text>

        <View style={styles.pharmacyGrid}>
          {PHARMACY_CHAINS.map((chain) => (
            <View key={chain.name} style={styles.pharmacyItem}>
              <View style={styles.pharmacyLogoWrap}>
                <Image source={chain.logo} style={styles.pharmacyLogo} resizeMode="contain" />
              </View>
              <Text variant="labelSmall" style={{ color: colors.onSurfaceVariant, marginTop: 4, textAlign: 'center' }}>
                {chain.name}
              </Text>
            </View>
          ))}
        </View>

        <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing[1] }}>
          Plus thousands of independent pharmacies across the country
        </Text>
      </View>

      {/* ── Testimonials ──────────────────────────────────────── */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <View style={[styles.testimonialsLabel, { backgroundColor: brandColors.secondary }]}>
          <Text variant="labelSmall" style={{ color: '#FFFFFF', fontWeight: '700' }}>
            Customer Stories
          </Text>
        </View>
        <Text variant="titleLarge" style={[styles.sectionTitle, { color: colors.onSurface }]}>
          Real People, Real Savings
        </Text>
        <Text variant="bodySmall" style={[styles.sectionSubtitle, { color: colors.onSurfaceVariant }]}>
          Hear from customers who have saved money on their prescriptions
        </Text>

        {TESTIMONIALS.map((t, i) => (
          <Surface key={i} style={[styles.testimonialCard, { backgroundColor: colors.background }]} elevation={1}>
            <View style={styles.testimonialHeader}>
              <Text variant="titleSmall" style={{ color: colors.onSurface, fontWeight: '700' }}>
                {t.name}
              </Text>
              <View style={[styles.savingsBadge, { backgroundColor: brandColors.secondaryLight }]}>
                <Text variant="labelSmall" style={{ color: brandColors.secondary, fontWeight: '700' }}>
                  Saved {t.savings}
                </Text>
              </View>
            </View>
            <View style={styles.starsRow}>
              {Array.from({ length: t.rating }).map((_, j) => (
                <Icon key={j} source="star" size={16} color="#F59E0B" />
              ))}
            </View>
            <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, marginTop: spacing[1] }}>
              "{t.text}"
            </Text>
            <View style={[styles.drugTag, { backgroundColor: brandColors.primaryLight }]}>
              <Icon source="pill" size={12} color={brandColors.primary} />
              <Text variant="labelSmall" style={{ color: brandColors.primary, marginLeft: 4 }}>
                {t.drug}
              </Text>
            </View>
          </Surface>
        ))}
      </View>

      {/* ── Stats ─────────────────────────────────────────────── */}
      <View style={[styles.statsSection, { backgroundColor: brandColors.primary }]}>
        {STATS.map((stat, i) => (
          <View key={i} style={styles.statItem}>
            <Icon source={stat.icon} size={24} color="#FFFFFF" />
            <Text variant="headlineSmall" style={styles.statValue}>{stat.value}</Text>
            <Text variant="labelSmall" style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* ── Savings Tips ────────────────────────────────────────── */}
      <View style={[styles.ctaFooter, { backgroundColor: brandColors.primaryLight }]}>
        <Text variant="titleMedium" style={{ color: colors.onSurface, fontWeight: '700' }}>
          Get Prescription Savings Tips
        </Text>
        <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 4 }}>
          Join thousands of smart shoppers. Get weekly tips on saving up to 80% on your medications, price drop alerts, and exclusive offers delivered to your inbox.
        </Text>

        {subscribeState === 'success' ? (
          <View style={styles.subscribeSuccess}>
            <Icon source="check-circle" size={32} color={brandColors.secondary} />
            <Text variant="titleSmall" style={{ color: brandColors.secondary, marginTop: spacing[1] }}>
              You're subscribed!
            </Text>
            <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
              Check your inbox for savings tips.
            </Text>
          </View>
        ) : (
          <View style={styles.subscribeWrapper}>
            <View style={styles.subscribeInputRow}>
              <TextInput
                mode="flat"
                placeholder="Enter your email address"
                value={subscribeEmail}
                onChangeText={(t) => { setSubscribeEmail(t); setSubscribeError(''); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                dense
                style={styles.subscribeInput}
                underlineStyle={{ display: 'none' }}
                disabled={subscribeState === 'sending'}
              />
              <Button
                mode="contained"
                onPress={handleSubscribe}
                loading={subscribeState === 'sending'}
                disabled={subscribeState === 'sending' || !subscribeEmail.trim()}
                style={[styles.subscribeButton, { backgroundColor: brandColors.primary }]}
                labelStyle={styles.subscribeButtonLabel}
                contentStyle={{ flexDirection: 'row-reverse' }}
                icon="arrow-right"
              >
                Subscribe
              </Button>
            </View>
            {subscribeError !== '' && (
              <HelperText type="error" visible style={{ textAlign: 'center' }}>{subscribeError}</HelperText>
            )}
          </View>
        )}

        <View style={styles.tipsBadges}>
          <View style={styles.tipsBadge}>
            <Icon source="lock" size={14} color={colors.onSurfaceVariant} />
            <Text variant="labelSmall" style={{ color: colors.onSurfaceVariant, marginLeft: 4 }}>No spam, ever</Text>
          </View>
          <View style={styles.tipsBadge}>
            <Icon source="close-circle-outline" size={14} color={colors.onSurfaceVariant} />
            <Text variant="labelSmall" style={{ color: colors.onSurfaceVariant, marginLeft: 4 }}>Unsubscribe anytime</Text>
          </View>
          <View style={styles.tipsBadge}>
            <Icon source="account-group" size={14} color={colors.onSurfaceVariant} />
            <Text variant="labelSmall" style={{ color: colors.onSurfaceVariant, marginLeft: 4 }}>Join 50,000+ subscribers</Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomPadding} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  // Hero
  hero: {
    paddingHorizontal: spacing[2],
    paddingTop: spacing[3],
    paddingBottom: spacing[3],
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(13,115,119,0.1)',
    paddingHorizontal: spacing[1.5],
    paddingVertical: spacing[0.5],
    borderRadius: borderRadius.full,
    marginBottom: spacing[2],
  },
  heroTitle: {
    textAlign: 'center',
    fontWeight: '700',
    lineHeight: 34,
  },
  heroSubtitle: {
    textAlign: 'center',
    marginTop: spacing[1],
    marginBottom: spacing[2],
  },
  searchContainer: {
    marginBottom: spacing[1.5],
    zIndex: 10,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickStat: {
    alignItems: 'center',
  },

  // Sections
  section: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[3],
  },
  sectionTitle: {
    fontWeight: '700',
    textAlign: 'center',
  },
  sectionSubtitle: {
    textAlign: 'center',
    marginTop: spacing[0.5],
    marginBottom: spacing[2],
  },

  // Popular Meds
  medsGrid: {
    gap: spacing[1],
  },
  medCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[1.5],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  medIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medInfo: {
    flex: 1,
    marginLeft: spacing[1],
  },
  browseButton: {
    marginTop: spacing[1],
  },
  loadingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[2],
  },

  // Conditions
  conditionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[1],
    justifyContent: 'center',
  },
  conditionCard: {
    width: (SCREEN_WIDTH - spacing[2] * 2 - spacing[1] * 3) / 4,
    alignItems: 'center',
    paddingVertical: spacing[1.5],
    paddingHorizontal: spacing[0.5],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  conditionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[0.5],
  },

  // Banner
  banner: {
    marginHorizontal: spacing[2],
    marginVertical: spacing[1],
    padding: spacing[2],
    borderRadius: borderRadius.xl,
    alignItems: 'center',
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginTop: spacing[1],
  },
  bannerText: {
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginTop: spacing[0.5],
  },
  bannerChips: {
    marginTop: spacing[1.5],
    gap: 6,
  },
  bannerChip: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Steps
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepContent: {
    flex: 1,
    marginLeft: spacing[1.5],
  },

  // Value Props
  whyChooseBadge: {
    alignSelf: 'center',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    marginBottom: spacing[1],
  },
  propsGrid: {
    gap: spacing[1],
  },
  propCard: {
    padding: spacing[2],
    borderRadius: borderRadius.lg,
  },
  propHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
  },
  propIcon: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Pharmacy
  pharmacyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing[2],
  },
  pharmacyItem: {
    alignItems: 'center',
    width: 70,
  },
  pharmacyLogoWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    overflow: 'hidden',
  },
  pharmacyLogo: {
    width: 44,
    height: 44,
  },

  // Testimonials
  testimonialsLabel: {
    alignSelf: 'center',
    paddingHorizontal: spacing[1.5],
    paddingVertical: spacing[0.5],
    borderRadius: borderRadius.full,
    marginBottom: spacing[1],
  },
  testimonialCard: {
    padding: spacing[2],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[1],
  },
  testimonialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  savingsBadge: {
    paddingHorizontal: spacing[1],
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  starsRow: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 2,
  },
  drugTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[1],
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    marginTop: spacing[1],
  },

  // Stats
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginTop: 4,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },

  // CTA
  ctaButton: {
    marginTop: spacing[2],
    borderRadius: borderRadius.md,
  },
  ctaContent: {
    paddingVertical: 4,
  },
  ctaFooter: {
    padding: spacing[3],
    alignItems: 'center',
  },
  subscribeWrapper: {
    width: '100%',
    marginTop: spacing[2],
  },
  subscribeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingLeft: spacing[2],
    paddingRight: 4,
    paddingVertical: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  subscribeInput: {
    flex: 1,
    backgroundColor: 'transparent',
    fontSize: 14,
    height: 40,
  },
  subscribeButton: {
    borderRadius: 22,
    marginLeft: spacing[1],
  },
  subscribeButtonLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  subscribeSuccess: {
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  tipsBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing[2],
    marginTop: spacing[2],
  },
  tipsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomPadding: {
    height: spacing[4],
  },
});
