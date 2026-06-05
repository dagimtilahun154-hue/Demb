import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';
import { useAppStore } from '@/store';

const learningItems = [
  { icon: 'phone-portrait-outline', title: 'Screen habits', detail: 'Long sessions, social time, and app switching.' },
  { icon: 'leaf-outline', title: 'Recovery habits', detail: 'Breaks, missions, and calming routines.' },
  { icon: 'walk-outline', title: 'Activity level', detail: 'Steps, movement, and sedentary windows.' },
  { icon: 'happy-outline', title: 'Mood patterns', detail: 'Energy, focus, and stress check-ins.' },
];

export default function ObservationModeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = Colors.light;
  const {
    observationStartedAt,
    observationComplete,
    screenUsageSnapshots,
    activitySnapshots,
    burnoutRisk,
    startObservation,
    completeObservation,
  } = useAppStore();

  React.useEffect(() => {
    if (!observationStartedAt) {
      startObservation();
    }
  }, [observationStartedAt, startObservation]);

  const handleGeneratePlan = () => {
    completeObservation();
    router.replace('/plan');
  };

  const latestScreen = screenUsageSnapshots[0];
  const latestActivity = activitySnapshots[0];
  const progress = observationComplete ? 1 : 0.48;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + Spacing.three }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.five }]}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.replace('/(tabs)')} style={styles.iconButton}>
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerLabel}>Observation Mode</Text>
          <View style={styles.iconButton} />
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons name="sparkles-outline" size={34} color={colors.primary} />
          </View>
          <Text style={styles.title}>Demb is learning your rhythm.</Text>
          <Text style={styles.subtitle}>
            We will use these wellness patterns to create your personal recovery plan.
          </Text>

          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Day 1 of 2</Text>
            <Text style={styles.progressPercent}>{Math.round(progress * 100)}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>What Demb is learning</Text>
        <View style={styles.learningList}>
          {learningItems.map(item => (
            <View key={item.title} style={styles.infoCard}>
              <View style={styles.infoIcon}>
                <Ionicons name={item.icon as any} size={20} color={colors.primary} />
              </View>
              <View style={styles.infoCopy}>
                <Text style={styles.infoTitle}>{item.title}</Text>
                <Text style={styles.infoDetail}>{item.detail}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Collected so far</Text>
        <View style={styles.metricsGrid}>
          <Metric label="Screen time" value={`${latestScreen?.screenTimeMinutes ?? 414}m`} />
          <Metric label="Social load" value={`${latestScreen?.highDopamineAppMinutes ?? 254}m`} />
          <Metric label="Steps" value={`${latestActivity?.stepCount ?? 2200}`} />
          <Metric label="Risk signal" value={`${burnoutRisk.burnoutRiskScore}%`} />
        </View>

        <Pressable style={styles.primaryButton} onPress={handleGeneratePlan}>
          <Text style={styles.primaryText}>Generate My Recovery Plan</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.secondaryText}>Continue Observing In Background</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLabel: {
    color: Colors.light.textMuted,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  heroCard: {
    borderRadius: Radius.xl,
    backgroundColor: Colors.light.surface,
    padding: Spacing.four,
    ...Shadows.card,
  },
  heroIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: Colors.light.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  title: {
    color: Colors.light.textPrimary,
    fontSize: 29,
    lineHeight: 35,
    fontWeight: '900',
    marginBottom: Spacing.two,
  },
  subtitle: {
    color: Colors.light.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    marginBottom: Spacing.four,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.one,
  },
  progressLabel: {
    color: Colors.light.textMuted,
    fontSize: 13,
    fontWeight: '800',
  },
  progressPercent: {
    color: Colors.light.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  progressTrack: {
    height: 9,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.surfaceContainer,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.full,
    backgroundColor: Colors.light.primary,
  },
  sectionTitle: {
    color: Colors.light.textPrimary,
    fontSize: 18,
    fontWeight: '900',
  },
  learningList: {
    gap: Spacing.two,
  },
  infoCard: {
    minHeight: 76,
    borderRadius: Radius.lg,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.outlineVariant + '30',
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
  },
  infoIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.light.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.three,
  },
  infoCopy: {
    flex: 1,
  },
  infoTitle: {
    color: Colors.light.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 3,
  },
  infoDetail: {
    color: Colors.light.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: Spacing.two,
  },
  metricCard: {
    width: '48%',
    minHeight: 94,
    borderRadius: Radius.lg,
    backgroundColor: Colors.light.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.light.outlineVariant + '22',
  },
  metricValue: {
    color: Colors.light.textPrimary,
    fontSize: 24,
    fontWeight: '900',
  },
  metricLabel: {
    color: Colors.light.textMuted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  primaryButton: {
    height: 58,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  primaryText: {
    color: Colors.light.onPrimary,
    fontSize: 15,
    fontWeight: '900',
  },
  secondaryButton: {
    height: 52,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.light.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    color: Colors.light.textSecondary,
    fontSize: 14,
    fontWeight: '800',
  },
});
